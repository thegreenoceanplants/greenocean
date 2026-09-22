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

async function readJSON(req, limit = 200000) {
  const text = await req.text();
  if (text.length > limit) throw new Error("too big");
  return JSON.parse(text || "{}");
}
async function getStore(env) { return (await env.DATA.get("store", "json")) || null; }

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

/* ---------- API ---------- */
async function api(req, env, url) {
  const p = url.pathname.replace(/\/+$/, "");
  const m = req.method;
  if (!env.DATA) return bad("Storage is not connected yet (KV binding DATA missing).", 503);

  if (p === "/api/health") return json({ ok: true, kv: true, mail: !!(env.MAIL && env.OWNER_EMAIL && env.FROM_EMAIL), admin: !!env.ADMIN_PASSWORD, customerMail: !!env.BREVO_API_KEY });

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
    await env.DATA.put("store", JSON.stringify(pub));
    await env.DATA.put("ver", pub.updatedAt);
    if (typeof caches !== "undefined") { try { await caches.default.delete(new Request(url.origin + "/api/version")); } catch (e) {} }
    return json({ ok: true, updatedAt: pub.updatedAt });
  }
  if (p === "/api/admin/check" && m === "POST") {
    if (!env.ADMIN_PASSWORD) return bad("ADMIN_PASSWORD secret is not set in Cloudflare yet.", 503);
    return isAdmin(req, env) ? json({ ok: true }) : bad("Wrong admin password.", 401);
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
      if (!(price > 0)) return bad("A product in your basket has no price.");
      items.push({ id: String(it.id), name: pr ? pr.name : String(it.name || "").slice(0, 80), price, qty, art: pr ? pr.art : it.art || "", img: pr && pr.img && pr.img.startsWith("img:") ? pr.img : "" });
    }
    const s = store.settings || {};
    const sub = items.reduce((x, i) => x + i.price * i.qty, 0);
    let off = 0, ship = sub >= (s.freeShipAbove ?? 499) ? 0 : (s.shipFee ?? 59), coupon = "";
    if (d.coupon) {
      const c = (store.coupons || []).find((k) => k.active && k.code === String(d.coupon).toUpperCase());
      if (c && sub >= (c.min || 0)) { coupon = c.code; if (c.type === "percent") off = Math.round((sub * c.value) / 100); if (c.type === "ship") ship = 0; }
    }
    const id = "GO" + todayIST().slice(2).replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);
    const order = { id, name: String(d.name).trim(), phone: String(d.phone).replace(/[^0-9]/g, ""), email: String(d.email).trim().toLowerCase(),
      address: `${String(d.address).trim()}, ${String(d.city).trim()} ${String(d.pin).trim()}`, items, subtotal: sub, discount: off, delivery: ship,
      total: sub - off + ship, coupon, pay: ["UPI", "Card", "COD"].includes(d.pay) ? d.pay : "COD", note: String(d.note || "").slice(0, 200),
      via: d.via === "WhatsApp" ? "WhatsApp" : "Website", status: "Processing", date: todayIST(), createdAt: new Date().toISOString() };
    await env.DATA.put("order:" + order.createdAt + ":" + id, JSON.stringify(order));
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
      html: shell(`Thank you, ${first}! 🌿`, `<p style="font-size:15px;line-height:1.6">We have received your order and our nursery team is already picking the healthiest plants for you. We will call or WhatsApp you on <b>${esc(order.phone)}</b> to confirm payment and delivery.</p>${table}<p style="font-size:14px;color:#6B7A72;margin-top:14px">Delivering to: ${esc(order.address)}</p><p style="font-size:14px;line-height:1.6">Questions? Just reply to this email.<br>— Team Green Ocean</p>`, env) });
    return json({ ok: true, id, total: order.total, subtotal: sub, discount: off, delivery: ship, coupon, ownerMailed: ownerMail.sent, customerMailed: custMail.sent });
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
    const owner = await mailOwner(env, { subject: `✉️ Website message from ${msg.name}`, replyTo: msg.email,
      text: `${msg.name} (${msg.email}, ${msg.phone}) wrote:\n\n${msg.msg}`,
      html: shell(`New message from ${msg.name}`, `<table style="width:100%;font-size:14px">${row("Name", msg.name)}${row("Email", msg.email)}${row("Mobile", msg.phone)}</table><div style="background:#F1F7F3;border-radius:10px;padding:14px;margin-top:12px;font-size:15px;line-height:1.6;white-space:pre-wrap">${esc(msg.msg)}</div><p style="font-size:13px;color:#6B7A72">Press Reply to answer ${esc(msg.name)} directly.</p>`, env) });
    const first = msg.name.split(" ")[0];
    const cust = await mailCustomer(env, { to: msg.email, name: msg.name, subject: `Thank you for writing to Green Ocean, ${first} 🌿`,
      html: shell(`Hi ${first}, we got your message 🌿`, `<p style="font-size:15px;line-height:1.6">Thank you for reaching out. A real person from our nursery will read it and reply within one working day.</p><div style="background:#F1F7F3;border-radius:10px;padding:14px;font-size:14px;color:#445;white-space:pre-wrap">${esc(msg.msg)}</div><p style="font-size:14px;line-height:1.6;margin-top:14px">Warm regards,<br>Team Green Ocean</p>`, env) });
    return json({ ok: true, ownerMailed: owner.sent, customerMailed: cust.sent });
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
    const rv = { id: "r" + Date.now().toString(36), product: String(d.product), name: String(d.name).trim(), rating, text: String(d.text).trim(), date: todayIST(), status: "Pending" };
    await env.DATA.put("rev:" + rv.id, JSON.stringify(rv));
    return json({ ok: true });
  }

  /* ---------- admin inbox ---------- */
  if (p.startsWith("/api/admin/")) {
    if (!isAdmin(req, env)) return bad("Wrong admin password.", 401);
    if (p === "/api/admin/inbox" && m === "GET") {
      const grab = async (prefix, limit) => {
        const l = await env.DATA.list({ prefix, limit: 1000 });
        const keys = l.keys.map((k) => k.name).sort().reverse().slice(0, limit);
        return (await Promise.all(keys.map((k) => env.DATA.get(k, "json")))).filter(Boolean).map((v, i) => ({ ...v, _key: keys[i] }));
      };
      const [orders, messages, subscribers, reviews] = await Promise.all([grab("order:", 300), grab("msg:", 200), grab("sub:", 1000), grab("rev:", 200)]);
      return json({ ok: true, orders, messages, subscribers, reviews });
    }
    const km = p.match(/^\/api\/admin\/item\/(.+)$/);
    if (km) {
      const key = decodeURIComponent(km[1]);
      if (!/^(order|msg|sub|rev):/.test(key)) return bad("Unknown item.");
      if (m === "DELETE") { await env.DATA.delete(key); return json({ ok: true }); }
      if (m === "PATCH") {
        const cur = await env.DATA.get(key, "json"); if (!cur) return bad("Not found.", 404);
        const d = await readJSON(req);
        if (key.startsWith("order:") && ["Processing", "Shipped", "Delivered", "Cancelled"].includes(d.status)) cur.status = d.status;
        if (key.startsWith("msg:") && typeof d.read === "boolean") cur.read = d.read;
        await env.DATA.put(key, JSON.stringify(cur)); return json({ ok: true, item: cur });
      }
    }
  }
  return bad("Not found.", 404);
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    if (url.pathname.startsWith("/api/")) {
      try { return await api(req, env, url); }
      catch (e) { return bad("Something went wrong on our side. Please try again.", 500); }
    }
    return env.ASSETS.fetch(req);
  },
};
