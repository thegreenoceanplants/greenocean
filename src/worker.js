/**
 * Green Ocean — Cloudflare Worker
 * Serves the website from /public and a small API under /api/*.
 *
 * Bindings (see wrangler.jsonc):
 *   DATA   KV namespace   — store data, orders, messages, subscribers, reviews
 *   MAIL   send_email     — emails the shop owner (Cloudflare Email Routing)
 *   ASSETS static assets  — the website files
 * Secrets (Cloudflare → Worker → Settings → Variables and Secrets):
 *   ADMIN_PASSWORD         required to change anything from the admin panel
 *   BREVO_API_KEY          optional — sends thank-you emails to customers
 * Variables:
 *   OWNER_EMAIL            where order / contact emails go (must be verified in Email Routing)
 *   FROM_EMAIL             sender address on your domain, e.g. website@greenocean.co.in
 *   STORE_NAME, SUPPORT_EMAIL
 */
import { EmailMessage } from "cloudflare:email";

const MAX_STORE_BYTES = 20 * 1024 * 1024;
const MAX_MEDIA_JSON_BYTES = 9 * 1024 * 1024;
const MAX_MEDIA_BYTES = 6 * 1024 * 1024;
// Same public Supabase project details used by the storefront. No service-role key is required.
// The Worker verifies a customer's access token against Supabase before marking an account Registered.
const SUPABASE_URL = "https://kkuxyrwklyszargqfgzw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdXh5cndrbHlzemFyZ3FmZ3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNjg5MDMsImV4cCI6MjEwNTY0NDkwM30.mgUkIgAU51nTgua8TxDmJ8gOwXOQQ4acDLpv1diQGYY";
const RULES = {
  name: (v) => /^[A-Za-z][A-Za-z .']{1,39}$/.test(String(v || "").trim()),
  email: (v) => /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(String(v || "").trim()),
  phone: (v) => /^[6-9][0-9]{9}$/.test(String(v || "").replace(/[^0-9]/g, "")),
  pin: (v) => /^[1-9][0-9]{5}$/.test(String(v || "").trim()),
  text: (v, min = 3, max = 4000) => { const s = String(v || "").trim(); return s.length >= min && s.length <= max; },
};

const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra } });
const bad = (msg, status = 400) => json({ ok: false, error: msg }, status);

function safeEqual(a, b) {
  a = String(a || ""); b = String(b || "");
  if (!a || !b || a.length !== b.length) return false;
  let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const isAdmin = (req, env) => !!env.ADMIN_PASSWORD && safeEqual(req.headers.get("x-admin-key"), env.ADMIN_PASSWORD);
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
const todayIST = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

async function supabaseUserFromRequest(req) {
  const auth = String(req.headers.get("authorization") || "");
  const m = auth.match(/^Bearer\s+(.+)$/i); if (!m) return null;
  try {
    const r = await fetch(SUPABASE_URL + "/auth/v1/user", { headers: { apikey: SUPABASE_ANON_KEY, authorization: "Bearer " + m[1] } });
    if (!r.ok) return null;
    const u = await r.json(); const email = String(u && u.email || "").trim().toLowerCase();
    if (!u || !u.id || !RULES.email(email)) return null;
    const meta = u.user_metadata || {};
    return { id: String(u.id), email, name: String(meta.name || meta.full_name || email.split("@")[0]).slice(0, 80), phone: String(meta.phone || u.phone || "").replace(/[^0-9]/g, "").slice(-10), provider: String((u.app_metadata && u.app_metadata.provider) || "email") };
  } catch (e) { return null; }
}
async function rememberRegisteredAccount(env, user) {
  if (!user || !RULES.email(user.email)) return null;
  const key = "account:" + user.email; const now = new Date().toISOString();
  const old = (await env.DATA.get(key, "json")) || {};
  const account = { ...old, id: user.id, email: user.email, name: user.name || old.name || "", phone: user.phone || old.phone || "", provider: user.provider || old.provider || "email", registered: true, firstSeenAt: old.firstSeenAt || now, lastSeenAt: now };
  await env.DATA.put(key, JSON.stringify(account)); return account;
}

async function readJSON(req, limit = 200000) {
  const text = await req.text();
  if (text.length > limit) throw new Error("too big");
  return JSON.parse(text || "{}");
}
async function getStore(env) { return (await env.DATA.get("store", "json")) || null; }

async function saveStore(env, store, origin = "") {
  if (!store || !Array.isArray(store.products)) return null;
  store.updatedAt = new Date().toISOString();
  await env.DATA.put("store", JSON.stringify(store));
  await env.DATA.put("ver", store.updatedAt);
  if (origin && typeof caches !== "undefined") {
    try { await caches.default.delete(new Request(origin + "/api/version")); } catch (e) {}
  }
  return store.updatedAt;
}
async function logInventory(env, { productId, productName, before, after, reason, ref = "", actor = "system" }) {
  const at = new Date().toISOString();
  const entry = { id: crypto.randomUUID(), productId, productName, before: Number(before || 0), after: Number(after || 0),
    delta: Number(after || 0) - Number(before || 0), reason: String(reason || "Stock update").slice(0, 140), ref: String(ref || "").slice(0, 80), actor, at, date: todayIST() };
  await env.DATA.put(`invlog:${at}:${entry.id}`, JSON.stringify(entry));
  return entry;
}
async function findOrder(env, id) {
  const idx = await env.DATA.get("orderid:" + id);
  if (idx) { const order = await env.DATA.get(idx, "json"); if (order) return { key: idx, order }; }
  const l = await env.DATA.list({ prefix: "order:", limit: 1000 });
  for (const k of l.keys) {
    if (k.name.endsWith(":" + id)) { const order = await env.DATA.get(k.name, "json"); if (order) return { key: k.name, order }; }
  }
  return null;
}

const firstOrderOnly = (c) => !!(c && (c.firstOrderOnly || String(c.code || "").toUpperCase() === "FREESHIP"));
async function hasPriorOrder(env, email) {
  email = String(email || "").trim().toLowerCase();
  if (!email) return false;
  const marker = "ordered:" + email;
  if (await env.DATA.get(marker)) return true;
  let cursor;
  do {
    const l = await env.DATA.list({ prefix: "order:", limit: 1000, ...(cursor ? { cursor } : {}) });
    for (const k of l.keys) {
      const order = await env.DATA.get(k.name, "json");
      if (order && String(order.email || "").trim().toLowerCase() === email) {
        await env.DATA.put(marker, "1");
        return true;
      }
    }
    if (l.list_complete) break;
    cursor = l.cursor;
  } while (cursor);
  return false;
}
function pushOrderEvent(order, status, note = "") {
  order.events = Array.isArray(order.events) ? order.events : [];
  order.events.push({ status, note: String(note || "").slice(0, 180), at: new Date().toISOString() });
  if (order.events.length > 40) order.events = order.events.slice(-40);
}
function orderItemsAmount(order, reqItems) {
  const wanted = Array.isArray(reqItems) ? reqItems : [];
  let total = 0;
  const items = [];
  for (const w of wanted) {
    const oi = (order.items || []).find((i) => String(i.id) === String(w.id));
    if (!oi) continue;
    const qty = Math.max(1, Math.min(Number(oi.qty || 1), parseInt(w.qty, 10) || 1));
    items.push({ id: oi.id, name: oi.name, qty, price: Number(oi.price || 0) });
    total += Number(oi.price || 0) * qty;
  }
  return { items, total };
}

/* ---------- managed admin media ---------- */
function mediaPathId(v) {
  try { const u = new URL(String(v || ""), "https://local.invalid"); const m = u.pathname.match(/^\/media\/([A-Za-z0-9-]+)$/); return m ? m[1] : ""; } catch { return ""; }
}
function collectManagedMedia(value, out = new Set()) {
  if (typeof value === "string") { const id = mediaPathId(value); if (id) out.add(id); return out; }
  if (Array.isArray(value)) { for (const x of value) collectManagedMedia(x, out); return out; }
  if (value && typeof value === "object") for (const x of Object.values(value)) collectManagedMedia(x, out);
  return out;
}
function decodeDataUrl(dataUrl) {
  const m = String(dataUrl || "").match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)$/i);
  if (!m) throw new Error("Unsupported image format");
  const bin = atob(m[2].replace(/\s+/g, ""));
  if (bin.length > MAX_MEDIA_BYTES) throw new Error("Image is too large");
  const bytes = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { bytes, type: m[1].toLowerCase() };
}
async function serveManagedMedia(env, id) {
  const key = "media:" + id;
  const got = await env.DATA.getWithMetadata(key, "arrayBuffer");
  if (!got || !got.value) return new Response("Not found", { status: 404 });
  const type = (got.metadata && got.metadata.contentType) || "application/octet-stream";
  return new Response(got.value, { headers: { "content-type": type, "cache-control": "public, max-age=31536000, immutable", "x-content-type-options": "nosniff" } });
}
async function deleteUnreferencedOldMedia(env, oldStore, newStore) {
  const oldRefs = collectManagedMedia(oldStore), newRefs = collectManagedMedia(newStore);
  const jobs = []; for (const id of oldRefs) if (!newRefs.has(id)) jobs.push(env.DATA.delete("media:" + id));
  if (jobs.length) await Promise.all(jobs);
}

/* strip anything private before the store is published */
function publicStore(s) {
  if (!s || typeof s !== "object") return {};
  const out = {};
  for (const k of ["products", "categories", "banners", "coupons", "blogs", "pages", "reviews"]) if (Array.isArray(s[k])) out[k] = s[k];
  if (s.settings && typeof s.settings === "object") {
    const { adminPass, adminEmail, ...rest } = s.settings;
    out.settings = rest;
  }
  if (out.reviews) out.reviews = out.reviews.filter((r) => r && r.status === "Published");
  out.updatedAt = new Date().toISOString();
  return out;
}

/* very small per-IP limiter: max `n` hits per `sec` window */
async function limited(env, req, bucket, n, sec) {
  const ip = req.headers.get("cf-connecting-ip") || "local";
  const key = `rl:${bucket}:${ip}`;
  const cur = parseInt((await env.DATA.get(key)) || "0", 10);
  if (cur >= n) return true;
  await env.DATA.put(key, String(cur + 1), { expirationTtl: Math.max(60, sec) });
  return false;
}

/* ---------- email ---------- */
function b64utf8(s) { const bytes = new TextEncoder().encode(s); let bin = ""; bytes.forEach((b) => (bin += String.fromCharCode(b))); return btoa(bin); }
function mime({ from, fromName, to, replyTo, subject, html, text }) {
  const boundary = "go_" + crypto.randomUUID().replace(/-/g, "");
  const head = [
    `From: =?UTF-8?B?${b64utf8(fromName || "Green Ocean Website")}?= <${from}>`,
    `To: <${to}>`,
    replyTo ? `Reply-To: <${replyTo}>` : null,
    `Subject: =?UTF-8?B?${b64utf8(subject)}?=`,
    `Message-ID: <${crypto.randomUUID()}@${from.split("@")[1]}>`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].filter(Boolean).join("\r\n");
  const part = (type, body) => `--${boundary}\r\nContent-Type: ${type}; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64utf8(body).replace(/.{1,76}/g, "$&\r\n")}`;
  return `${head}\r\n\r\n${part("text/plain", text)}\r\n${part("text/html", html)}\r\n--${boundary}--\r\n`;
}
async function mailOwner(env, { subject, html, text, replyTo }) {
  if (!env.MAIL || !env.OWNER_EMAIL || !env.FROM_EMAIL) return { sent: false, reason: "mail not configured" };
  try {
    const raw = mime({ from: env.FROM_EMAIL, fromName: `${env.STORE_NAME || "Green Ocean"} Website`, to: env.OWNER_EMAIL, replyTo, subject, html, text });
    await env.MAIL.send(new EmailMessage(env.FROM_EMAIL, env.OWNER_EMAIL, raw));
    return { sent: true };
  } catch (e) { return { sent: false, reason: String(e && e.message || e) }; }
}
async function mailCustomer(env, { to, name, subject, html }) {
  if (!env.BREVO_API_KEY) return { sent: false, reason: "no BREVO_API_KEY" };
  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ sender: { name: env.STORE_NAME || "Green Ocean", email: env.SUPPORT_EMAIL || env.FROM_EMAIL },
        to: [{ email: to, name }], replyTo: { email: env.SUPPORT_EMAIL || env.FROM_EMAIL }, subject, htmlContent: html }),
    });
    return { sent: r.ok };
  } catch (e) { return { sent: false }; }
}
function shell(title, inner, env) {
  return `<!doctype html><html><body style="margin:0;background:#F3F6F2;font-family:Arial,Helvetica,sans-serif;color:#16221C">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
   <div style="background:#0C3A28;color:#fff;border-radius:14px 14px 0 0;padding:18px 22px;font-size:20px;font-weight:bold">🌿 ${esc(env.STORE_NAME || "Green Ocean")}</div>
   <div style="background:#fff;border-radius:0 0 14px 14px;padding:22px;border:1px solid #E2E7E3;border-top:0">
    <h2 style="margin:0 0 12px;font-size:19px;color:#0C3A28">${esc(title)}</h2>${inner}</div>
   <p style="text-align:center;font-size:12px;color:#6B7A72;margin:14px 0 0">${esc(env.STORE_NAME || "Green Ocean")} · Balihari, Dhanbad, Jharkhand 828116 · ${esc(env.SUPPORT_EMAIL || "")}</p>
  </div></body></html>`;
}
const row = (k, v) => `<tr><td style="padding:6px 0;color:#6B7A72;width:130px;vertical-align:top">${esc(k)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`;

async function mailOrderUpdate(env, order, title, message) {
  if (!order || !RULES.email(order.email)) return { sent: false };
  const track = order.trackingUrl ? `<p style="margin:14px 0"><a href="${esc(order.trackingUrl)}" style="display:inline-block;background:#0F4632;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px">Track shipment</a></p>` : "";
  const ship = order.awb || order.courier ? `<table style="width:100%;font-size:14px">${order.courier ? row("Courier", order.courier) : ""}${order.awb ? row("AWB / Tracking", order.awb) : ""}</table>` : "";
  return mailCustomer(env, { to: order.email, name: order.name, subject: `${title} — ${order.id}`,
    html: shell(title, `<p style="font-size:15px;line-height:1.65">${esc(message)}</p>${ship}${track}<p style="font-size:13px;color:#6B7A72">Order ${esc(order.id)} · ${inr(order.total)}</p>`, env) });
}

/* ---------- API ---------- */
async function api(req, env, url, ctx) {
  const p = url.pathname.replace(/\/+$/, "");
  const m = req.method;
  if (!env.DATA) return bad("Storage is not connected yet (KV binding DATA missing).", 503);

  if (p === "/api/health") return json({ ok: true, kv: true, mail: !!(env.MAIL && env.OWNER_EMAIL && env.FROM_EMAIL), admin: !!env.ADMIN_PASSWORD, customerMail: !!env.BREVO_API_KEY });

  /* admin-managed image upload. Files live in KV; store data only keeps /media/<id> URLs. */
  if (p === "/api/admin/media" && m === "POST") {
    if (!isAdmin(req, env)) return bad("Wrong admin password.", 401);
    let d; try { d = await readJSON(req, MAX_MEDIA_JSON_BYTES); } catch { return bad("Image upload is too large or broken."); }
    let decoded; try { decoded = decodeDataUrl(d.dataUrl); } catch (e) { return bad(String(e && e.message || "Invalid image")); }
    const id = crypto.randomUUID();
    await env.DATA.put("media:" + id, decoded.bytes.buffer, { metadata: { contentType: decoded.type, createdAt: new Date().toISOString() } });
    return json({ ok: true, url: "/media/" + id });
  }
  if (p.startsWith("/api/admin/media/") && m === "DELETE") {
    if (!isAdmin(req, env)) return bad("Wrong admin password.", 401);
    const id = p.slice("/api/admin/media/".length); if (!/^[A-Za-z0-9-]+$/.test(id)) return bad("Invalid media id.");
    await env.DATA.delete("media:" + id); return json({ ok: true });
  }

  /* public store */
  if (p === "/api/store" && m === "GET") {
    const s = await getStore(env);
    return json({ ok: true, store: s, v: s ? s.updatedAt : null, mail: !!(env.MAIL && env.OWNER_EMAIL && env.FROM_EMAIL), admin: !!env.ADMIN_PASSWORD }, 200, { "cache-control": "no-cache" });
  }
  /* tiny "has anything changed?" check that visitors poll; cached 10s at the edge */
  if (p === "/api/version" && m === "GET") {
    const cache = typeof caches !== "undefined" ? caches.default : null;
    const ck = new Request(url.origin + "/api/version");
    if (cache) { const hit = await cache.match(ck); if (hit) return json(await hit.json()); }
    const v = (await env.DATA.get("ver")) || null;
    // edge keeps it 10s (saves KV reads); browsers must always ask again
    if (cache) await cache.put(ck, json({ ok: true, v }, 200, { "cache-control": "public, max-age=10" }));
    return json({ ok: true, v });
  }
  if (p === "/api/store" && m === "PUT") {
    if (!isAdmin(req, env)) return bad("Wrong admin password.", 401);
    let body; try { body = await readJSON(req, MAX_STORE_BYTES); } catch { return bad("Store data is too large or broken."); }
    const pub = publicStore(body);
    if (!Array.isArray(pub.products)) return bad("Store data is missing products.");
    const oldStore = await getStore(env);
    await env.DATA.put("store", JSON.stringify(pub));
    await env.DATA.put("ver", pub.updatedAt);
    try { await deleteUnreferencedOldMedia(env, oldStore, pub); } catch (e) {}
    if (typeof caches !== "undefined") { try { await caches.default.delete(new Request(url.origin + "/api/version")); } catch (e) {} }
    return json({ ok: true, updatedAt: pub.updatedAt });
  }
  if (p === "/api/admin/check" && m === "POST") {
    if (!env.ADMIN_PASSWORD) return bad("ADMIN_PASSWORD secret is not set in Cloudflare yet.", 503);
    return isAdmin(req, env) ? json({ ok: true }) : bad("Wrong admin password.", 401);
  }

  /* coupon validation — used by checkout before the customer proceeds to payment */
  if (p === "/api/coupons/validate" && m === "POST") {
    let d; try { d = await readJSON(req); } catch { return bad("Could not read the coupon request."); }
    const store = (await getStore(env)) || {};
    const code = String(d.code || "").trim().toUpperCase();
    const coupon = (store.coupons || []).find((c) => c && String(c.code || "").toUpperCase() === code);
    if (!code) return bad("Please enter a coupon code.");
    if (!coupon) return bad(`“${code}” is not a valid coupon code.`);
    if (!coupon.active) return bad(`“${code}” is not active right now.`);
    const sub = Math.max(0, Number(d.subtotal || 0));
    if (sub < Number(coupon.min || 0)) return bad(`“${code}” works on orders of ${inr(coupon.min || 0)} or more.`);
    if (firstOrderOnly(coupon)) {
      const email = String(d.email || "").trim().toLowerCase();
      if (!RULES.email(email)) return bad("Enter your delivery email before applying this first-order coupon.");
      if (await hasPriorOrder(env, email)) return bad(`“${code}” is a one-time first-order offer and cannot be used again.`);
    }
    return json({ ok: true, code: coupon.code, firstOrderOnly: firstOrderOnly(coupon) });
  }

  /* verified customer account sync — no Supabase schema/table changes required */
  if (p === "/api/account/sync" && m === "POST") {
    if (await limited(env, req, "account-sync", 30, 600)) return bad("Too many account sync requests. Please try again shortly.", 429);
    const user = await supabaseUserFromRequest(req);
    if (!user) return bad("Your sign-in session could not be verified. Please sign in again.", 401);
    const account = await rememberRegisteredAccount(env, user);
    return json({ ok: true, account });
  }

  /* orders */
  if (p === "/api/orders" && m === "POST") {
    if (await limited(env, req, "order", 10, 600)) return bad("Too many orders from this connection. Please try again in a few minutes.", 429);
    let d; try { d = await readJSON(req); } catch { return bad("Could not read the order."); }
    if (d.website) return json({ ok: true, id: "0" }); // honeypot
    const errs = [];
    if (!RULES.name(d.name)) errs.push("name"); if (!RULES.phone(d.phone)) errs.push("phone"); if (!RULES.email(d.email)) errs.push("email");
    if (!RULES.text(d.address, 10, 300)) errs.push("address"); if (!RULES.pin(d.pin)) errs.push("pin"); if (!RULES.text(d.city, 2, 60)) errs.push("city");
    if (!Array.isArray(d.items) || !d.items.length || d.items.length > 50) errs.push("items");
    if (errs.length) return bad("Please check: " + errs.join(", "));
    const store = (await getStore(env)) || {};
    const prods = new Map((store.products || []).map((x) => [x.id, x]));
    const items = [];
    for (const it of d.items) {
      const qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1));
      const pr = prods.get(it.id);
      // price always comes from the published store, never from the browser
      const price = pr ? Number(pr.price) : Number(it.price);
      if (!pr && !store.products) { /* store not published yet — accept browser price */ }
      else if (!pr) return bad(`“${String(it.name || it.id).slice(0, 40)}” is no longer available.`);
      if (pr && pr.active === false) return bad(`“${String(pr.name || it.id).slice(0, 40)}” is currently unavailable.`);
      if (!(price > 0)) return bad("A product in your basket has no price.");
      if (pr && Number(pr.stock || 0) < qty) return bad(`Only ${Math.max(0, Number(pr.stock || 0))} of “${String(pr.name || it.id).slice(0, 40)}” is left in stock.`);
      items.push({ id: String(it.id), name: pr ? pr.name : String(it.name || "").slice(0, 80), price, qty, art: pr ? pr.art : it.art || "", img: pr && pr.img && pr.img.startsWith("img:") ? pr.img : "" });
    }
    const s = store.settings || {};
    const sub = items.reduce((x, i) => x + i.price * i.qty, 0);
    let off = 0, ship = sub >= (s.freeShipAbove ?? 499) ? 0 : (s.shipFee ?? 59), coupon = "";
    if (d.coupon) {
      const code = String(d.coupon).trim().toUpperCase();
      const c = (store.coupons || []).find((k) => k && String(k.code || "").toUpperCase() === code);
      if (!c) return bad(`“${code}” is not a valid coupon code.`);
      if (!c.active) return bad(`“${code}” is not active right now.`);
      if (sub < Number(c.min || 0)) return bad(`“${code}” works on orders of ${inr(c.min || 0)} or more.`);
      if (firstOrderOnly(c) && await hasPriorOrder(env, String(d.email).trim().toLowerCase())) return bad(`“${code}” is a one-time first-order offer and cannot be used again.`);
      coupon = String(c.code || code).toUpperCase();
      if (c.type === "percent") off = Math.round((sub * Number(c.value || 0)) / 100);
      if (c.type === "ship") ship = 0;
    }
    const id = "GO" + todayIST().slice(2).replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);
    const createdAt = new Date().toISOString();
    const verifiedUser = await supabaseUserFromRequest(req);
    const orderEmail = String(d.email).trim().toLowerCase();
    const accountRegistered = !!(verifiedUser && verifiedUser.email === orderEmail);
    if (accountRegistered) await rememberRegisteredAccount(env, verifiedUser);
    const order = { id, name: String(d.name).trim(), phone: String(d.phone).replace(/[^0-9]/g, ""), email: orderEmail,
      address: `${String(d.address).trim()}, ${String(d.city).trim()} ${String(d.pin).trim()}`, items, subtotal: sub, discount: off, delivery: ship,
      total: sub - off + ship, coupon, pay: ["UPI", "Card", "COD"].includes(d.pay) ? d.pay : "COD", note: String(d.note || "").slice(0, 200),
      via: d.via === "WhatsApp" ? "WhatsApp" : "Website", status: "Processing", fulfillmentStatus: "Unfulfilled", courier: "", awb: "", trackingUrl: "", adminNote: "",
      accountRegistered, accountId: accountRegistered ? verifiedUser.id : "",
      stockRestored: false, refundStatus: "", returnStatus: "", date: todayIST(), createdAt, events: [{ status: "Processing", note: "Order received", at: createdAt }] };
    const orderKey = "order:" + order.createdAt + ":" + id;
    await env.DATA.put(orderKey, JSON.stringify(order));
    await env.DATA.put("orderid:" + id, orderKey);
    await env.DATA.put("ordered:" + order.email, "1");
    // Inventory is reserved immediately when the order is accepted.
    if (Array.isArray(store.products)) {
      const logs = [];
      for (const it of items) {
        const pr = store.products.find((x) => x.id === it.id); if (!pr) continue;
        const before = Number(pr.stock || 0), after = Math.max(0, before - it.qty); pr.stock = after;
        logs.push({ productId: pr.id, productName: pr.name, before, after, reason: "Website order", ref: id, actor: "system" });
      }
      await saveStore(env, store, url.origin);
      await Promise.all(logs.map((x) => logInventory(env, x)));
    }
    const lines = items.map((i) => `<tr><td style="padding:6px 0">${esc(i.name)} × ${i.qty}</td><td style="padding:6px 0;text-align:right">${inr(i.price * i.qty)}</td></tr>`).join("");
    const table = `<table style="width:100%;border-collapse:collapse;font-size:14px">${lines}
      <tr><td style="padding:6px 0;color:#6B7A72">Delivery</td><td style="text-align:right">${ship ? inr(ship) : "Free"}</td></tr>
      ${off ? `<tr><td style="padding:6px 0;color:#6B7A72">Discount (${esc(coupon)})</td><td style="text-align:right">− ${inr(off)}</td></tr>` : ""}
      <tr><td style="padding:10px 0;font-weight:bold;border-top:1px solid #E2E7E3">Total</td><td style="text-align:right;font-weight:bold;border-top:1px solid #E2E7E3">${inr(order.total)}</td></tr></table>`;
    const ownerMail = await mailOwner(env, {
      subject: `🛒 New order ${id} — ${order.name} — ${inr(order.total)}`, replyTo: order.email,
      text: `New order ${id}\n${order.name}, ${order.phone}, ${order.email}\n${order.address}\n\n${items.map((i) => `${i.name} x ${i.qty} = ${inr(i.price * i.qty)}`).join("\n")}\nTotal ${inr(order.total)} (${order.pay})`,
      html: shell(`New order ${id}`, `<table style="width:100%;font-size:14px">${row("Customer", order.name)}${row("Mobile", order.phone)}${row("Email", order.email)}${row("Address", order.address)}${row("Payment", order.pay)}${row("Came via", order.via)}${order.note ? row("Gift note", order.note) : ""}</table><hr style="border:0;border-top:1px solid #E2E7E3;margin:14px 0">${table}`, env),
    });
    const first = order.name.split(" ")[0];
    const custMail = await mailCustomer(env, { to: order.email, name: order.name, subject: `Thank you, ${first}! Your Green Ocean order ${id} is received 🌿`,
      html: shell(`Thank you, ${first}! 🌿`, `<p style="font-size:15px;line-height:1.6">We have received your order and our nursery team is already picking the healthiest plants for you. Your payment method is <b>${esc(order.pay)}</b>. We will contact you on <b>${esc(order.phone)}</b> only if we need to confirm a delivery detail.</p>${table}<p style="font-size:14px;color:#6B7A72;margin-top:14px">Delivering to: ${esc(order.address)}</p><p style="font-size:14px;line-height:1.6">Questions? Just reply to this email.<br>— Team Green Ocean</p>`, env) });
    return json({ ok: true, id, total: order.total, subtotal: sub, discount: off, delivery: ship, coupon, ownerMailed: ownerMail.sent, customerMailed: custMail.sent });
  }



  /* signed-in browser order refresh */
  if (p === "/api/orders/status" && m === "POST") {
    let d; try { d = await readJSON(req); } catch { return bad("Could not read that request."); }
    const email = String(d.email || "").trim().toLowerCase(), ids = Array.isArray(d.ids) ? d.ids.slice(0, 30).map(String) : [];
    if (!RULES.email(email) || !ids.length) return bad("Account email and order numbers are required.");
    const out = [];
    for (const id of ids) {
      const found = await findOrder(env, id); if (!found) continue;
      if (String(found.order.email || "").toLowerCase() !== email) continue;
      out.push({ ...found.order, _key: undefined });
    }
    return json({ ok: true, orders: out });
  }

  /* customer order cancellation — only before shipment */
  if (p === "/api/orders/cancel" && m === "POST") {
    if (await limited(env, req, "cancel", 8, 600)) return bad("Too many requests. Please try again in a few minutes.", 429);
    let d; try { d = await readJSON(req); } catch { return bad("Could not read that request."); }
    const id = String(d.id || "").trim(), email = String(d.email || "").trim().toLowerCase();
    if (!id || !RULES.email(email)) return bad("Order number and account email are required.");
    const found = await findOrder(env, id); if (!found) return bad("Order not found.", 404);
    const order = found.order;
    if (String(order.email || "").toLowerCase() !== email) return bad("This order does not match that account.", 403);
    if (!["Processing", "Packed"].includes(order.status)) return bad("This order can no longer be cancelled online. Please contact support.");
    const store = await getStore(env);
    if (store && Array.isArray(store.products) && !order.stockRestored) {
      const logs = [];
      for (const it of order.items || []) {
        const pr = store.products.find((x) => x.id === it.id); if (!pr) continue;
        const before = Number(pr.stock || 0), after = before + Number(it.qty || 0); pr.stock = after;
        logs.push({ productId: pr.id, productName: pr.name, before, after, reason: "Customer cancellation", ref: order.id, actor: "customer" });
      }
      await saveStore(env, store, url.origin); await Promise.all(logs.map((x) => logInventory(env, x))); order.stockRestored = true;
    }
    order.status = "Cancelled"; order.cancelledAt = new Date().toISOString(); pushOrderEvent(order, "Cancelled", "Cancelled by customer");
    await env.DATA.put(found.key, JSON.stringify(order));
    await mailOrderUpdate(env, order, "Order cancelled", "Your order has been cancelled. Any reserved stock has been released.");
    return json({ ok: true, order });
  }

  /* customer return / refund request */
  if (p === "/api/returns" && m === "POST") {
    if (await limited(env, req, "return", 6, 900)) return bad("Too many return requests. Please try again later.", 429);
    let d; try { d = await readJSON(req, 400000); } catch { return bad("Could not read the return request."); }
    const orderId = String(d.orderId || "").trim(), email = String(d.email || "").trim().toLowerCase();
    if (!orderId || !RULES.email(email) || !RULES.text(d.reason, 2, 100) || !RULES.text(d.details, 8, 1600)) return bad("Please complete the return request.");
    const found = await findOrder(env, orderId); if (!found) return bad("Order not found.", 404);
    const order = found.order;
    if (String(order.email || "").toLowerCase() !== email) return bad("This order does not match that account.", 403);
    if (order.status !== "Delivered") return bad("A return can be requested after the order is delivered.");
    const delivered = new Date(order.deliveredAt || order.createdAt || order.date); const age = (Date.now() - delivered.getTime()) / 86400000;
    if (Number.isFinite(age) && age > 7.99) return bad("The 7-day return request window for this order has ended.");
    const selected = orderItemsAmount(order, d.items);
    if (!selected.items.length) return bad("Select at least one item from the order.");
    const existingList = await env.DATA.list({ prefix: "return:", limit: 1000 });
    for (const k of existingList.keys) { const r = await env.DATA.get(k.name, "json"); if (r && r.orderId === orderId && !["Rejected", "Closed"].includes(r.status)) return bad("A return request for this order is already open."); }
    const at = new Date().toISOString(), id = "RET" + todayIST().replace(/-/g, "").slice(2) + "-" + Math.floor(1000 + Math.random() * 9000);
    const rr = { id, orderId, orderKey: found.key, name: order.name, email: order.email, phone: order.phone, items: selected.items,
      amount: selected.total, reason: String(d.reason).trim().slice(0, 100), details: String(d.details).trim().slice(0, 1600),
      preferred: ["Refund", "Replacement"].includes(d.preferred) ? d.preferred : "Refund", status: "Requested", resolution: "", adminNote: "",
      replacementStockCommitted: false, createdAt: at, updatedAt: at, date: todayIST(), events: [{ status: "Requested", at, note: "Customer submitted request" }] };
    const key = `return:${at}:${id}`; await env.DATA.put(key, JSON.stringify(rr));
    order.returnStatus = "Requested"; await env.DATA.put(found.key, JSON.stringify(order));
    await mailOwner(env, { subject: `↩️ Return request ${id} — order ${orderId}`, replyTo: order.email,
      text: `${rr.name} requested a ${rr.preferred.toLowerCase()} for ${orderId}.\nReason: ${rr.reason}\n${rr.details}`,
      html: shell(`Return request ${id}`, `<table style="width:100%;font-size:14px">${row("Order", orderId)}${row("Customer", rr.name)}${row("Preferred", rr.preferred)}${row("Reason", rr.reason)}${row("Requested value", inr(rr.amount))}</table><p style="white-space:pre-wrap;line-height:1.6">${esc(rr.details)}</p>`, env) });
    await mailCustomer(env, { to: rr.email, name: rr.name, subject: `We received your return request ${id}`,
      html: shell(`Return request received`, `<p style="font-size:15px;line-height:1.65">We received your request for order <b>${esc(orderId)}</b>. Our team will review it and update you by email.</p><p style="font-size:13px;color:#6B7A72">Request ${esc(id)} · ${esc(rr.preferred)} · ${inr(rr.amount)}</p>`, env) });
    return json({ ok: true, id, status: rr.status, amount: rr.amount });
  }

  /* contact */
  if (p === "/api/contact" && m === "POST") {
    if (await limited(env, req, "contact", 5, 600)) return bad("You have sent several messages already. Please wait a few minutes.", 429);
    let d; try { d = await readJSON(req); } catch { return bad("Could not read the message."); }
    if (d.website) return json({ ok: true }); // honeypot
    if (!RULES.name(d.name) || !RULES.email(d.email) || !RULES.phone(d.phone) || !RULES.text(d.msg, 10, 3000)) return bad("Please fill every field correctly.");
    const msg = { id: crypto.randomUUID(), name: String(d.name).trim(), email: String(d.email).trim().toLowerCase(), phone: String(d.phone).replace(/[^0-9]/g, ""),
      msg: String(d.msg).trim(), date: todayIST(), createdAt: new Date().toISOString(), read: false };
    await env.DATA.put("msg:" + msg.createdAt + ":" + msg.id, JSON.stringify(msg));
    const first = msg.name.split(" ")[0];
    ctx.waitUntil(Promise.all([
      mailOwner(env, { subject: `✉️ Website message from ${msg.name}`, replyTo: msg.email,
        text: `${msg.name} (${msg.email}, ${msg.phone}) wrote:\n\n${msg.msg}`,
        html: shell(`New message from ${msg.name}`, `<table style="width:100%;font-size:14px">${row("Name", msg.name)}${row("Email", msg.email)}${row("Mobile", msg.phone)}</table><div style="background:#F1F7F3;border-radius:10px;padding:14px;margin-top:12px;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(msg.msg)}</div><p style="font-size:13px;color:#6B7A72">Press Reply to answer ${esc(msg.name)} directly.</p>`, env) }),
      mailCustomer(env, { to: msg.email, name: msg.name, subject: `Thank you for writing to Green Ocean, ${first} 🌿`,
        html: shell(`Hi ${first}, we got your message 🌿`, `<p style="font-size:15px;line-height:1.6">Thank you for reaching out. A real person from our nursery will read it and reply within one working day.</p><div style="background:#F1F7F3;border-radius:10px;padding:14px;font-size:14px;color:#445;white-space:pre-wrap">${esc(msg.msg)}</div><p style="font-size:14px;line-height:1.6;margin-top:14px">Warm regards,<br>Team Green Ocean</p>`, env) }),
    ]).catch(()=>{}));
    return json({ ok: true });
  }

  /* newsletter */
  if (p === "/api/subscribe" && m === "POST") {
    if (await limited(env, req, "sub", 5, 600)) return bad("Please try again in a few minutes.", 429);
    let d; try { d = await readJSON(req); } catch { return bad("Could not read that."); }
    if (!RULES.email(d.email)) return bad("Please enter a valid email.");
    const email = String(d.email).trim().toLowerCase();
    const key = "sub:" + email;
    if (await env.DATA.get(key)) return json({ ok: true, already: true });
    await env.DATA.put(key, JSON.stringify({ id: key, email, date: todayIST() }));
    return json({ ok: true });
  }

  /* reviews from customers wait for approval */
  if (p === "/api/reviews" && m === "POST") {
    if (await limited(env, req, "rev", 5, 600)) return bad("Please try again in a few minutes.", 429);
    let d; try { d = await readJSON(req); } catch { return bad("Could not read the review."); }
    const rating = parseInt(d.rating, 10);
    if (!RULES.name(d.name) || !RULES.text(d.text, 3, 1000) || !(rating >= 1 && rating <= 5) || !RULES.text(d.product, 2, 80)) return bad("Please fill the review correctly.");
    const photo = String(d.photo || "");
    if (photo && (!/^data:image\/jpeg;base64,/i.test(photo) || photo.length > 160000)) return bad("That review photo is too large or is not a supported image.");
    const rv = { id: "r" + Date.now().toString(36), product: String(d.product), name: String(d.name).trim(), rating, text: String(d.text).trim(), ...(photo ? { photo } : {}), date: todayIST(), status: "Pending" };
    await env.DATA.put("rev:" + rv.id, JSON.stringify(rv));
    return json({ ok: true });
  }

  /* ---------- admin commerce ---------- */
  if (p.startsWith("/api/admin/")) {
    if (!isAdmin(req, env)) return bad("Wrong admin password.", 401);
    const grab = async (prefix, limit) => {
      const l = await env.DATA.list({ prefix, limit: 1000 });
      const keys = l.keys.map((k) => k.name).sort().reverse().slice(0, limit);
      const vals = await Promise.all(keys.map((k) => env.DATA.get(k, "json")));
      return vals.map((v, i) => v ? ({ ...v, _key: keys[i] }) : null).filter(Boolean);
    };
    if (p === "/api/admin/inbox" && m === "GET") {
      const [orders, messages, subscribers, reviews, returns, inventoryLogs] = await Promise.all([
        grab("order:", 400), grab("msg:", 200), grab("sub:", 1000), grab("rev:", 200), grab("return:", 250), grab("invlog:", 300)
      ]);
      return json({ ok: true, orders, messages, subscribers, reviews, returns, inventoryLogs });
    }
    if (p === "/api/admin/customers" && m === "GET") {
      const accounts = await grab("account:", 2000);
      const clean = accounts.map(({ _key, ...a }) => a).filter(a => a && a.registered && RULES.email(a.email));
      return json({ ok: true, emails: clean.map(a => String(a.email).toLowerCase()), accounts: clean });
    }
    const sm = p.match(/^\/api\/admin\/stock\/(.+)$/);
    if (sm && m === "PATCH") {
      const productId = decodeURIComponent(sm[1]); const d = await readJSON(req);
      const store = await getStore(env); if (!store || !Array.isArray(store.products)) return bad("Store data is not published yet.", 409);
      const pr = store.products.find((x) => String(x.id) === productId); if (!pr) return bad("Product not found.", 404);
      const next = Math.max(0, Math.floor(Number(d.stock))); if (!Number.isFinite(next)) return bad("Enter a valid stock quantity.");
      const before = Number(pr.stock || 0); pr.stock = next;
      const ver = await saveStore(env, store, url.origin);
      await logInventory(env, { productId: pr.id, productName: pr.name, before, after: next, reason: String(d.reason || "Manual stock adjustment"), ref: String(d.ref || ""), actor: "admin" });
      return json({ ok: true, product: { id: pr.id, stock: next }, updatedAt: ver });
    }
    const rm = p.match(/^\/api\/admin\/return\/(.+)$/);
    if (rm && m === "PATCH") {
      const key = decodeURIComponent(rm[1]); if (!key.startsWith("return:")) return bad("Unknown return request.");
      const rr = await env.DATA.get(key, "json"); if (!rr) return bad("Return request not found.", 404);
      const d = await readJSON(req); const allowed = ["Requested", "Under review", "Approved", "Replacement approved", "Refund approved", "Rejected", "Closed"];
      if (d.status && !allowed.includes(d.status)) return bad("Unknown return status.");
      const prev = rr.status; if (d.status) rr.status = d.status;
      if (typeof d.adminNote === "string") rr.adminNote = d.adminNote.slice(0, 800);
      if (typeof d.resolution === "string") rr.resolution = d.resolution.slice(0, 200);
      rr.updatedAt = new Date().toISOString(); rr.events = Array.isArray(rr.events) ? rr.events : [];
      if (rr.status !== prev) rr.events.push({ status: rr.status, at: rr.updatedAt, note: rr.adminNote || "Admin updated request" });
      const found = await findOrder(env, rr.orderId); const order = found && found.order;
      if (rr.status === "Replacement approved" && !rr.replacementStockCommitted) {
        const store = await getStore(env); if (!store || !Array.isArray(store.products)) return bad("Store inventory is unavailable.", 409);
        for (const it of rr.items || []) { const pr = store.products.find((x) => x.id === it.id); if (!pr || Number(pr.stock || 0) < Number(it.qty || 0)) return bad(`Not enough stock for replacement: ${it.name}`); }
        const logs=[];
        for (const it of rr.items || []) { const pr = store.products.find((x) => x.id === it.id); const before=Number(pr.stock||0), after=before-Number(it.qty||0); pr.stock=after; logs.push({productId:pr.id,productName:pr.name,before,after,reason:"Replacement approved",ref:rr.id,actor:"admin"}); }
        await saveStore(env, store, url.origin); await Promise.all(logs.map((x)=>logInventory(env,x))); rr.replacementStockCommitted=true;
      }
      if (order && found) {
        order.returnStatus = rr.status;
        if (rr.status === "Refund approved") { order.refundStatus = "Approved"; order.refundAmount = Number(rr.amount || 0); }
        await env.DATA.put(found.key, JSON.stringify(order));
      }
      await env.DATA.put(key, JSON.stringify(rr));
      if (rr.status !== prev && RULES.email(rr.email)) {
        const msg = rr.status === "Refund approved" ? `Your refund request for order ${rr.orderId} has been approved. Our team will process ${inr(rr.amount)} using the applicable refund method.` :
          rr.status === "Replacement approved" ? `A replacement for your approved items from order ${rr.orderId} has been approved. We will prepare fresh replacement stock.` :
          rr.status === "Rejected" ? `We reviewed your request for order ${rr.orderId}. It could not be approved. ${rr.adminNote || "Please contact support if you need more help."}` :
          `Your return request for order ${rr.orderId} is now: ${rr.status}.`;
        await mailCustomer(env,{to:rr.email,name:rr.name,subject:`Return ${rr.id}: ${rr.status}`,html:shell(`Return request update`, `<p style="font-size:15px;line-height:1.65">${esc(msg)}</p>${rr.adminNote?`<p style="font-size:13px;color:#6B7A72">Note: ${esc(rr.adminNote)}</p>`:""}`, env)});
      }
      return json({ ok: true, item: rr });
    }
    const km = p.match(/^\/api\/admin\/item\/(.+)$/);
    if (km) {
      const key = decodeURIComponent(km[1]);
      if (!/^(order|msg|sub|rev):/.test(key)) return bad("Unknown item.");
      if (m === "DELETE") { await env.DATA.delete(key); return json({ ok: true }); }
      if (m === "PATCH") {
        const cur = await env.DATA.get(key, "json"); if (!cur) return bad("Not found.", 404);
        const d = await readJSON(req);
        if (key.startsWith("order:")) {
          const allowed = ["Processing", "Packed", "Shipped", "Out for delivery", "Delivered", "Cancelled"];
          const prev = cur.status;
          if (d.status && !allowed.includes(d.status)) return bad("Unknown order status.");
          if (typeof d.courier === "string") cur.courier = d.courier.slice(0, 80);
          if (typeof d.awb === "string") cur.awb = d.awb.slice(0, 100);
          if (typeof d.trackingUrl === "string") cur.trackingUrl = /^https?:\/\//i.test(d.trackingUrl) ? d.trackingUrl.slice(0, 500) : "";
          if (typeof d.adminNote === "string") cur.adminNote = d.adminNote.slice(0, 800);
          if (d.status && d.status !== prev) {
            if (d.status === "Cancelled" && ["Shipped","Out for delivery","Delivered"].includes(prev)) return bad("A shipped or delivered order cannot be cancelled here. Use Returns & Refunds instead.");
            if (d.status === "Cancelled" && !cur.stockRestored && Array.isArray(cur.items)) {
              const store = await getStore(env); if (store && Array.isArray(store.products)) {
                const logs=[];
                for (const it of cur.items) { const pr=store.products.find((x)=>x.id===it.id); if(!pr)continue; const before=Number(pr.stock||0),after=before+Number(it.qty||0);pr.stock=after;logs.push({productId:pr.id,productName:pr.name,before,after,reason:"Admin cancellation",ref:cur.id,actor:"admin"}); }
                await saveStore(env,store,url.origin);await Promise.all(logs.map((x)=>logInventory(env,x)));cur.stockRestored=true;
              }
            }
            if (prev === "Cancelled" && d.status !== "Cancelled" && cur.stockRestored && Array.isArray(cur.items)) {
              const store=await getStore(env); if(!store||!Array.isArray(store.products))return bad("Inventory unavailable.",409);
              for(const it of cur.items){const pr=store.products.find((x)=>x.id===it.id);if(!pr||Number(pr.stock||0)<Number(it.qty||0))return bad(`Not enough stock to reopen order ${cur.id}.`);}
              const logs=[];for(const it of cur.items){const pr=store.products.find((x)=>x.id===it.id);const before=Number(pr.stock||0),after=before-Number(it.qty||0);pr.stock=after;logs.push({productId:pr.id,productName:pr.name,before,after,reason:"Order reopened",ref:cur.id,actor:"admin"});}
              await saveStore(env,store,url.origin);await Promise.all(logs.map((x)=>logInventory(env,x)));cur.stockRestored=false;
            }
            cur.status=d.status; const at=new Date().toISOString(); pushOrderEvent(cur,d.status,cur.adminNote||"");
            if(d.status==="Packed")cur.packedAt=at;if(d.status==="Shipped")cur.shippedAt=at;if(d.status==="Out for delivery")cur.outForDeliveryAt=at;if(d.status==="Delivered")cur.deliveredAt=at;if(d.status==="Cancelled")cur.cancelledAt=at;
            const messages={Packed:"Your order has been packed by our nursery team and is being prepared for dispatch.",Shipped:"Your Green Ocean order has been shipped.","Out for delivery":"Your order is out for delivery today.",Delivered:"Your order has been marked delivered. We hope your plants arrived healthy and happy.",Cancelled:"Your order has been cancelled and reserved stock has been released."};
            if(messages[d.status]) await mailOrderUpdate(env,cur,`Order ${d.status}`,messages[d.status]);
          }
        }
        if (key.startsWith("msg:") && typeof d.read === "boolean") cur.read = d.read;
        await env.DATA.put(key, JSON.stringify(cur)); return json({ ok: true, item: cur });
      }
    }
  }
  return bad("Not found.", 404);
}


/* ---------- Clean routes, crawlable metadata & structured data ---------- */
const xmlEsc = (v) => String(v == null ? "" : v).replace(/[<>&"']/g, (c) => ({"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&apos;"}[c]));
function siteBase(store, url) {
  const d = String(store?.settings?.domain || "").trim().replace(/\/+$/, "");
  if (/^https?:\/\//i.test(d)) return d;
  if (/(^|\.)greenocean\.co\.in$/i.test(url.hostname)) return "https://www.greenocean.co.in";
  return url.origin;
}
function cleanPathname(p) { p = String(p || "/").replace(/\/{2,}/g, "/"); return p !== "/" ? p.replace(/\/+$/, "") : p; }
function isAppRoute(path) {
  path = cleanPathname(path);
  return path === "/" || /^\/(shop|product(?:\/[^/]+)?|blog(?:\/[^/]+)?|page(?:\/[^/]+)?|cart|wishlist|checkout|thanks(?:\/[^/]+)?|orders|account|login|signup|sitemap|admin(?:\/[^/]+)?)$/.test(path);
}
function pageParts(store, url) {
  const path = cleanPathname(url.pathname), seg = path.split("/").filter(Boolean), base = siteBase(store, url);
  const builtinImages={"img:prod_snake":"/assets/img/prod_snake.jpg?v=1998f728","img:prod_money":"/assets/img/prod_money.jpg?v=30b0e63f","img:prod_peace":"/assets/img/prod_peace.jpg?v=ac88d711","img:prod_aloe":"/assets/img/prod_aloe.jpg?v=1446cc53","img:prod_zz":"/assets/img/prod_zz.jpg?v=7d864a9e","img:hero":"/assets/img/hero.jpg?v=5f203695"};
  let title = store?.settings?.metaTitle || "Green Ocean — Plants, Planters & Gifts";
  let desc = store?.settings?.metaDesc || "Healthy nursery-fresh plants, planters and gifts delivered across India.";
  let robots = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
  const schemas = [];
  const abs = (v) => { if (!v) return ""; const raw=builtinImages[String(v)]||String(v); if(/^data:/i.test(raw))return ""; try { return new URL(raw, base).href; } catch { return ""; } };
  const media=store?.settings?.media||{};
  const biz = {"@context":"https://schema.org","@type":"LocalBusiness","@id":base+"/#business",name:store?.settings?.store||"Green Ocean",url:base+"/",image:media.hero?base+media.hero:base+"/assets/img/hero.jpg",logo:media.logo?base+media.logo:base+"/assets/img/logo.png",telephone:store?.settings?.phone||"",email:store?.settings?.email||"",address:{"@type":"PostalAddress",streetAddress:"Balihari",addressLocality:"Dhanbad",addressRegion:"Jharkhand",postalCode:"828116",addressCountry:"IN"},priceRange:"₹₹"};
  const crumbs = (items) => ({"@context":"https://schema.org","@type":"BreadcrumbList",itemListElement:items.map((x,i)=>({"@type":"ListItem",position:i+1,name:x[0],item:base+x[1]}))});
  const privatePage = ["admin","account","orders","cart","checkout","thanks","login","signup","wishlist"].includes(seg[0]||"");
  if (privatePage) robots = "noindex,follow"; else schemas.push(biz);
  if (!seg.length) {
    title = "Green Ocean — Buy Indoor Plants, Planters & Plant Gifts Online";
    schemas.push(crumbs([["Home","/"]]));
  } else if (seg[0] === "product" && seg[1]) {
    const product = (store?.products||[]).find(x=>String(x.id)===seg[1]);
    if (product) {
      const category=(store?.categories||[]).find(c=>c.id===product.cat);
      title = `${product.name} | Buy Online at Green Ocean`; desc = product.desc || product.sub || desc;
      const revs=(store?.reviews||[]).filter(r=>r.status==="Published"&&r.product===product.name);
      const ps={"@context":"https://schema.org","@type":"Product","@id":base+path+"#product",name:product.name,description:product.desc||product.sub||"",image:[abs(product.img)||base+"/assets/img/hero.jpg"],sku:String(product.id),brand:{"@type":"Brand",name:"Green Ocean"},offers:{"@type":"Offer",url:base+path,priceCurrency:"INR",price:Number(product.price||0).toFixed(2),availability:Number(product.stock||0)>0?"https://schema.org/InStock":"https://schema.org/OutOfStock",itemCondition:"https://schema.org/NewCondition",seller:{"@id":base+"/#business"}}};
      if(revs.length){const avg=revs.reduce((a,r)=>a+Number(r.rating||0),0)/revs.length;ps.aggregateRating={"@type":"AggregateRating",ratingValue:avg.toFixed(1),reviewCount:revs.length};ps.review=revs.slice(0,8).map(r=>({"@type":"Review",author:{"@type":"Person",name:r.name},datePublished:r.date,reviewBody:r.text,reviewRating:{"@type":"Rating",ratingValue:Number(r.rating||0),bestRating:5,worstRating:1},...(r.photo?{image:r.photo}:{})}));}
      schemas.push(ps,crumbs([["Home","/"],["Shop","/shop"],[category?.name||"Category","/shop?cat="+encodeURIComponent(product.cat)],[product.name,path]]));
    }
  } else if (seg[0] === "shop") {
    const catId=url.searchParams.get("cat"),category=(store?.categories||[]).find(c=>c.id===catId),items=(store?.products||[]).filter(p=>p.active!==false&&(!category||p.cat===category.id));
    title=category?`${category.name} | Green Ocean Online Nursery`:"Shop Plants, Planters & Gardening | Green Ocean";desc=category?(category.desc||`Shop ${category.name} from Green Ocean.`):"Shop nursery-fresh plants, planters, gardening essentials and plant gifts from Green Ocean.";
    schemas.push({"@context":"https://schema.org","@type":"CollectionPage",name:category?.name||"Plants, Planters & Gardening",url:base+path+(url.search||""),mainEntity:{"@type":"ItemList",itemListElement:items.slice(0,24).map((p,i)=>({"@type":"ListItem",position:i+1,url:base+"/product/"+encodeURIComponent(p.id),name:p.name}))}},crumbs(category?[["Home","/"],["Shop","/shop"],[category.name,"/shop?cat="+encodeURIComponent(category.id)]]:[["Home","/"],["Shop","/shop"]]));
  } else if (seg[0] === "page" && seg[1]) {
    const pg=(store?.pages||[]).find(x=>x.slug===seg[1]); if(pg){title=`${pg.title} | Green Ocean`;desc=String(pg.body||"").replace(/\s+/g," ").slice(0,155)||desc;schemas.push(crumbs([["Home","/"],[pg.title,path]]));
      if(pg.slug==="faq"){const blocks=String(pg.body||"").split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean),qa=blocks.map(block=>{const m=block.match(/^(.+?)\s+[—–-]\s+([\s\S]+)$/);return m?{q:m[1].trim(),a:m[2].trim()}:null;}).filter(Boolean);if(qa.length)schemas.push({"@context":"https://schema.org","@type":"FAQPage",mainEntity:qa.map(x=>({"@type":"Question",name:x.q,acceptedAnswer:{"@type":"Answer",text:x.a}}))});}
    }
  } else if (seg[0] === "blog") {
    const post=seg[1]&&(store?.blogs||[]).find(x=>String(x.id)===seg[1]);title=post?`${post.title} | Green Ocean Plant Care`:"Green Ocean Plant Care — Guides & Tips";desc=post?String(post.excerpt||post.body||"").replace(/\s+/g," ").slice(0,155):"Practical plant care guides for watering, light, repotting and healthier indoor plants.";schemas.push(crumbs(post?[["Home","/"],["Plant Care","/blog"],[post.title,path]]:[["Home","/"],["Plant Care","/blog"]]));
  }
  let canonical = base + path;
  if (seg[0] === "shop") { const c=url.searchParams.get("cat"); if(c) canonical += "?cat="+encodeURIComponent(c); }
  return { title, desc, robots, canonical, schemas };
}
function replaceTag(html, re, replacement) { return re.test(html) ? html.replace(re, replacement) : html.replace("</head>", replacement+"\n</head>"); }
function injectSEO(html, parts) {
  html = replaceTag(html, /<title>[\s\S]*?<\/title>/i, `<title>${esc(parts.title)}</title>`);
  html = replaceTag(html, /<meta\s+name=["']description["'][^>]*>/i, `<meta name="description" content="${esc(parts.desc)}">`);
  html = replaceTag(html, /<meta\s+name=["']robots["'][^>]*>/i, `<meta name="robots" content="${esc(parts.robots)}">`);
  html = replaceTag(html, /<link\s+rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${esc(parts.canonical)}">`);
  html = replaceTag(html, /<meta\s+property=["']og:title["'][^>]*>/i, `<meta property="og:title" content="${esc(parts.title)}">`);
  html = replaceTag(html, /<meta\s+property=["']og:description["'][^>]*>/i, `<meta property="og:description" content="${esc(parts.desc)}">`);
  html = replaceTag(html, /<meta\s+property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${esc(parts.canonical)}">`);
  const jsonld=(parts.schemas||[]).filter(Boolean).map((x,i)=>`<script type="application/ld+json" data-ssr-schema="${i}">${JSON.stringify(x).replace(/</g,"\\u003c")}</script>`).join("\n");
  if(jsonld)html=html.replace("</head>",jsonld+"\n</head>");
  return html;
}
async function serveApp(req, env, url) {
  const store=(await getStore(env))||{};
  const indexURL=new URL("/index.html",url.origin);
  const ar=await env.ASSETS.fetch(new Request(indexURL,{method:"GET",headers:req.headers}));
  if(!ar.ok)return ar;
  const html=injectSEO(await ar.text(),pageParts(store,url));
  const h=new Headers(ar.headers);h.set("content-type","text/html; charset=UTF-8");h.set("cache-control","no-cache");
  return new Response(html,{status:200,headers:h});
}
async function serveSitemap(env,url){
  const store=(await getStore(env))||{},base=siteBase(store,url),paths=["/","/shop","/blog","/page/story","/page/contact","/page/faq","/page/shipping","/page/returns","/page/privacy","/page/terms"];
  for(const c of (store.categories||[]))paths.push("/shop?cat="+encodeURIComponent(c.id));
  for(const p of (store.products||[]).filter(x=>x.active!==false))paths.push("/product/"+encodeURIComponent(p.id));
  for(const b of (store.blogs||[]).filter(x=>x.active!==false))paths.push("/blog/"+encodeURIComponent(b.id));
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(paths)].map(p=>`  <url><loc>${xmlEsc(base+p)}</loc></url>`).join("\n")}\n</urlset>`;
  return new Response(xml,{headers:{"content-type":"application/xml; charset=UTF-8","cache-control":"public, max-age=3600"}});
}
async function serveRobots(env,url){const store=(await getStore(env))||{},base=siteBase(store,url);return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /checkout\nDisallow: /account\n\nUser-agent: OAI-SearchBot\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`,{headers:{"content-type":"text/plain; charset=UTF-8","cache-control":"public, max-age=3600"}});}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      try { return await api(req, env, url, ctx); }
      catch (e) { return bad("Something went wrong on our side. Please try again.", 500); }
    }
    if (req.method === "GET" && /^\/media\/[A-Za-z0-9-]+$/.test(url.pathname)) return serveManagedMedia(env, url.pathname.split("/").pop());
    if (req.method === "GET" && cleanPathname(url.pathname) === "/sitemap.xml") return serveSitemap(env, url);
    if (req.method === "GET" && cleanPathname(url.pathname) === "/robots.txt") return serveRobots(env, url);
    if (req.method === "GET" && isAppRoute(url.pathname)) {
      try { return await serveApp(req, env, url); }
      catch (e) { return bad("The website could not be loaded right now.", 500); }
    }
    const asset = await env.ASSETS.fetch(req);
    if (asset.ok && /\/assets\//.test(url.pathname)) {
      const h = new Headers(asset.headers); h.set("cache-control", url.searchParams.has("v") ? "public, max-age=31536000, immutable" : "public, max-age=86400");
      return new Response(asset.body, { status: asset.status, headers: h });
    }
    return asset;
  },
};
