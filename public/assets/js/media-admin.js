/* ================= LIVE SERVER (Cloudflare Worker) ================= */
const PUB_KEYS=['products','categories','banners','coupons','blogs','pages'];
const API={on:false,key:null,storeMissing:false,lastPub:'',timer:null,status:'local',err:'',inboxAt:0,ordersAt:0,syncingOrders:false,pendingReviews:[],messages:[],returns:[],inventoryLogs:[],health:null,applying:false,
  async call(path,opt={}){
    const o={method:opt.method||'GET',headers:{'content-type':'application/json'},cache:'no-store'};
    if(opt.admin&&API.key)o.headers['x-admin-key']=API.key;
    if(opt.authToken)o.headers.authorization='Bearer '+opt.authToken;
    if(opt.body!==undefined)o.body=JSON.stringify(opt.body);
    const ctrl=new AbortController(), t=setTimeout(()=>ctrl.abort(),opt.timeout||15000); o.signal=ctrl.signal;
    try{
      const r=await fetch(path,o); let j={};
      try{ j=await r.json(); }catch(e){ j={error:'The server gave an unexpected reply.'}; }
      j.status=r.status; j.ok=r.ok&&j.ok!==false; if(!j.ok&&!j.error)j.error='Request failed ('+r.status+')';
      return j;
    }catch(e){ return {ok:false,offline:true,error:'Could not reach our server. Please check your internet and try again.'}; }
    finally{ clearTimeout(t); }
  },
  async init(){
    if(!/^https?:$/.test(location.protocol))return;
    const s=await API.call('/api/store',{timeout:8000});          // one request: data + server status
    if(!s.ok)return;                                               // no server → site keeps working as before
    API.on=true; API.health={mail:s.mail,admin:s.admin};
    try{ API.key=sessionStorage.getItem('go_admin_key'); }catch(e){}
    const wasAdmin=DB.admin; if(DB.admin&&!API.key){ DB.admin=false; save(); }
    let changed=wasAdmin!==DB.admin;
    if(s.store&&Array.isArray(s.store.products)){
      if(s.v!==DB.storeVer){ applyStore(s.store); DB.storeVer=s.v; save(); changed=true; }
    } else API.storeMissing=true;
    API.lastPub=API.storeMissing?'':pubString();
    API.status=API.storeMissing?'unpublished':'live';
    if(changed||appPath().startsWith('/admin')||/contact/.test(appPath()))softRepaint(true);
    API.watch();
    // API and Supabase initialise in parallel. Once the Worker is online, sync any already-active session too.
    try{if(typeof sb!=='undefined'&&sb&&typeof SB!=='undefined'){const x=await sb.auth.getSession();const sess=x&&x.data&&x.data.session;if(sess)SB.syncAccount(sess);}}catch(e){}
  },
  /* keep every open page in step with the admin panel, without a refresh */
  watch(){
    const tick=async()=>{
      if(document.visibilityState!=='visible'||DB.admin)return;
      if(API.checking){ API.recheck=true; return; }
      API.checking=true; API.recheck=false;
      try{
        const r=await API.call('/api/version',{timeout:6000});
        if(r.ok&&r.v&&r.v!==DB.storeVer){
          const s=await API.call('/api/store');
          if(s.ok&&s.store&&Array.isArray(s.store.products)){ applyStore(s.store); DB.storeVer=s.v; save(); softRepaint(); }
        }
      } finally { API.checking=false; if(API.recheck){ API.recheck=false; setTimeout(tick,300); } }
    };
    setInterval(tick,15000);
    document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible')tick(); });
    window.addEventListener('focus',tick);
  }
};

/* ---------- managed website media ----------
   Admin uploads are stored by the Worker in KV and referenced by /media/<id>.
   When the published store stops referencing an older managed image, the Worker deletes it. */
function isManagedMediaUrl(u){
  try{const x=new URL(String(u||''),location.origin);return /^\/media\/[A-Za-z0-9-]+$/.test(x.pathname);}catch(e){return false;}
}
async function uploadManagedMedia(dataUrl){
  if(!dataUrl)return '';
  if(!API.on||!DB.admin||!API.key)return dataUrl; // local preview fallback
  const r=await API.call('/api/admin/media',{method:'POST',admin:true,body:{dataUrl},timeout:60000});
  if(!r.ok)throw new Error(r.error||'Image upload failed');
  return r.url||'';
}
async function storeImageValue(dataUrl,currentUrl){
  if(!dataUrl)return currentUrl||'';
  return uploadManagedMedia(dataUrl);
}

/* repaint in place: keep the scroll position, never interrupt someone typing or a popup */
let REPAINT_WAITING=false, FORM_DIRTY=false;
document.addEventListener('input',e=>{ 
  if(e.target&&e.target.closest&&e.target.closest('#root form'))FORM_DIRTY=true;
  if(e.target&&e.target.closest&&e.target.closest('#appForm')){
    const f=e.target.closest('#appForm'), k=document.getElementById('apKicker'), t=document.getElementById('apTitle'), p=document.getElementById('apSub');
    if(k)k.textContent=(f.querySelector('[name="heroKicker"]')||{}).value||'';
    if(t)t.textContent=(f.querySelector('[name="heroTitle"]')||{}).value||'';
    if(p)p.textContent=(f.querySelector('[name="heroSub"]')||{}).value||'';
  }
});
function softRepaint(force){
  if(FORM_DIRTY&&!force)return;          // someone is filling a form — new data shows on their next page
  const busy=document.querySelector('#layer .ov,#layer .drawer')||(document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&document.activeElement.closest('#root form'));
  if(busy&&!force){ if(!REPAINT_WAITING){ REPAINT_WAITING=true; const again=()=>{ REPAINT_WAITING=false; softRepaint(); };
      document.addEventListener('focusout',()=>setTimeout(again,300),{once:true}); } return; }
  const y=window.scrollY; paint(); window.scrollTo(0,y);
}
function publicSettings(){ const {adminPass,adminEmail,...rest}=DB.settings; return rest; }
function pubString(){
  const o={}; PUB_KEYS.forEach(k=>o[k]=DB[k]);
  o.reviews=(DB.reviews||[]).filter(r=>r.status==='Published').map(({_key,_pending,...r})=>r);
  o.settings=publicSettings(); return JSON.stringify(o);
}
function applyStore(st){
  API.applying=true;
  PUB_KEYS.forEach(k=>{ if(Array.isArray(st[k]))DB[k]=st[k]; });
  if(Array.isArray(DB.coupons))DB.coupons.forEach(k=>{k.code=String(k.code||'').toUpperCase();if(k.firstOrderOnly===undefined)k.firstOrderOnly=(k.code==='FREESHIP');if(k.code==='FREESHIP')k.firstOrderOnly=true;if(k.homePromo===undefined)k.homePromo=false;});
  if(Array.isArray(st.reviews))DB.reviews=st.reviews;
  if(st.settings){ const keep={adminPass:DB.settings.adminPass,adminEmail:DB.settings.adminEmail}; DB.settings=Object.assign({},DB.settings,st.settings,keep); }
  DB.cart=DB.cart.filter(l=>prod(l.id)&&prod(l.id).active!==false);
  save(); API.applying=false;
}
function schedulePublish(force){
  if(!API.on||!DB.admin||!API.key||API.applying)return;
  if(!force&&pubString()===API.lastPub)return;
  API.status='saving'; pubBadge();
  clearTimeout(API.timer);
  API.timer=setTimeout(async()=>{
    const cur=pubString();
    const r=await API.call('/api/store',{method:'PUT',admin:true,body:JSON.parse(cur),timeout:45000});
    if(r.ok){ API.lastPub=cur; API.status='live'; API.storeMissing=false; API.err=''; DB.storeVer=r.updatedAt; try{localStorage.setItem(KEY,JSON.stringify(DB));}catch(e){} }
    else{ API.status='error'; API.err=r.error||'Could not publish.';
      if(r.status===401){ toast('Admin password changed — please sign in again',true); adminSignOut(); return; } }
    pubBadge(); if(API.status==='error')toast('Not saved to the live website: '+API.err,true);
  },700);
}
function pubBadge(){
  const el=document.getElementById('pubBadge'); if(!el)return;
  el.outerHTML=pubBadgeHTML();
}
function pubBadgeHTML(){
  if(!API.on)return `<span id="pubBadge" class="pill grey" title="Changes stay in this browser only">● Preview mode</span>`;
  const m={live:['green','● Live — all saved'],saving:['amber','● Saving…'],error:['red','● Not saved — tap to retry'],unpublished:['amber','● Not published yet']}[API.status]||['grey','● '+API.status];
  return `<span id="pubBadge" class="pill ${m[0]}" ${API.status==='error'||API.status==='unpublished'?'data-act="publishNow" style="cursor:pointer"':''}>${m[1]}</span>`;
}
function adminSignOut(){ DB.admin=false; API.key=null; try{sessionStorage.removeItem('go_admin_key');}catch(e){} save(); go('#/'); }
function deriveCustomers(orders){
  const m=new Map();
  orders.forEach(o=>{ const k=(o.email||'').toLowerCase(); if(!k)return;
    const c=m.get(k)||{id:'c_'+k,name:o.name,email:k,phone:o.phone,city:(o.address||'').split(',').slice(-1)[0].replace(/[0-9]/g,'').trim(),orders:0,spent:0,joined:o.date,registered:false,accountId:''};
    c.orders++; if(o.status!=='Cancelled')c.spent+=o.total; if(o.date<c.joined)c.joined=o.date;
    if(o.accountRegistered||o.accountId){c.registered=true;c.accountId=o.accountId||c.accountId;}
    m.set(k,c); });
  const hidden=new Set((DB.hiddenCustomers||[]).map(x=>String(x).toLowerCase()));
  return [...m.values()].filter(c=>!hidden.has((c.email||'').toLowerCase())).sort((a,b)=>b.spent-a.spent);
}
async function loadInbox(force){
  if(!API.on||!API.key||!DB.admin)return;
  if(!force&&Date.now()-API.inboxAt<12000)return;
  API.inboxAt=Date.now();
  const r=await API.call('/api/admin/inbox',{admin:true});
  if(!r.ok){if(r.status===401){adminSignOut();toast('Please sign in to the admin panel again',true);}return;}
  DB.orders=(r.orders||[]).map(o=>({...o}));DB.subscribers=(r.subscribers||[]).map(s=>({id:s._key,email:s.email,date:s.date}));
  DB.customers=deriveCustomers(DB.orders);API.pendingReviews=(r.reviews||[]).map(x=>({...x,_pending:true}));API.messages=r.messages||[];API.returns=r.returns||[];API.inventoryLogs=r.inventoryLogs||[];
  try{const live=await API.call('/api/store',{timeout:8000});if(live.ok&&live.store&&Array.isArray(live.store.products)&&live.v!==DB.storeVer){applyStore(live.store);DB.storeVer=live.v;}}catch(e){}
  try{const r2=await API.call('/api/admin/customers',{admin:true});if(r2.ok){DB.registeredEmails=(r2.emails||[]).map(x=>String(x).toLowerCase());DB.registeredAccounts=r2.accounts||[];}}catch(e){}
  save();if(appPath().startsWith('/admin'))softRepaint();
}
async function updateOrder(o,patch){
  if(!o)return false;const prev={...o};Object.assign(o,patch);save();paint();
  if(API.on&&o._key){const r=await API.call('/api/admin/item/'+encodeURIComponent(o._key),{method:'PATCH',admin:true,body:patch});if(!r.ok){Object.keys(o).forEach(k=>delete o[k]);Object.assign(o,prev);save();paint();toast('Could not update the order: '+r.error,true);return false;}Object.assign(o,r.item||patch);save();paint();if(API.on)loadInbox(true);}
  return true;
}
async function setOrderStatus(o,status){return updateOrder(o,{status});}
async function deleteItem(key){ if(!API.on||!key)return true; const r=await API.call('/api/admin/item/'+encodeURIComponent(key),{method:'DELETE',admin:true}); if(!r.ok)toast(r.error,true); return r.ok; }
/* photos: shrink before saving so the website stays fast */
function readImage(file,done){
  if(!file||!/^image\//.test(file.type)){toast('Please choose a photo file',true);return;}
  const fr=new FileReader();
  fr.onload=()=>{ const img=new Image(); img.onload=()=>{
      const max=1000, sc=Math.min(1,max/Math.max(img.width,img.height));
      const cv=document.createElement('canvas'); cv.width=Math.round(img.width*sc); cv.height=Math.round(img.height*sc);
      const cx=cv.getContext('2d'); cx.fillStyle='#fff'; cx.fillRect(0,0,cv.width,cv.height); cx.drawImage(img,0,0,cv.width,cv.height);
      done(cv.toDataURL('image/jpeg',0.82)); };
    img.onerror=()=>toast('That photo could not be read',true); img.src=fr.result; };
  fr.readAsDataURL(file);
}
function readReviewImage(file,done){
  if(!file||!/^image\//.test(file.type)){toast('Please choose a photo file',true);return;}
  const fr=new FileReader();
  fr.onload=()=>{const img=new Image();img.onload=()=>{
    const max=680,sc=Math.min(1,max/Math.max(img.width,img.height));
    const cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(img.width*sc));cv.height=Math.max(1,Math.round(img.height*sc));
    const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(img,0,0,cv.width,cv.height);
    const out=cv.toDataURL('image/jpeg',0.70);if(out.length>155000){toast('Photo is still too large. Please choose a smaller image.',true);return;}done(out);
  };img.onerror=()=>toast('That photo could not be read',true);img.src=fr.result;};fr.readAsDataURL(file);
}
/* coupon messages shown under the box */
let CPN_MSG=null;
let CO_STEP=1, CO_COUPON='';
function couponFirstOrderOnly(c){return !!(c&&(c.firstOrderOnly||String(c.code||'').toUpperCase()==='FREESHIP'));}
function homePromoCoupon(){return (DB.coupons||[]).find(k=>k.active&&k.homePromo)||null;}
function freeShipPromoCoupon(){return (DB.coupons||[]).find(k=>k.active&&String(k.code||'').toUpperCase()==='FREESHIP')||null;}
function homeHeroSlides(){
  const defs=SEED().settings.homeSlides;
  const saved=(DB.settings&&Array.isArray(DB.settings.homeSlides))?DB.settings.homeSlides:[];
  return defs.map((d,i)=>Object.assign({},d,saved.find(x=>x&&x.id===d.id)||saved[i]||{}));
}
function initHomeHeroSlider(root=document){
  const wrap=root.querySelector('[data-home-slider]');
  if(window.__homeHeroTimer){clearInterval(window.__homeHeroTimer);window.__homeHeroTimer=null;}
  if(!wrap)return;
  const slides=[...wrap.querySelectorAll('.home-slide')];
  const dots=[...wrap.querySelectorAll('.home-dot')];
  let i=+wrap.dataset.index||0;
  const set=(next)=>{
    i=(next+slides.length)%slides.length;
    wrap.dataset.index=i;
    slides.forEach((el,idx)=>el.classList.toggle('is-active',idx===i));
    dots.forEach((el,idx)=>el.classList.toggle('is-active',idx===i));
  };
  wrap.__setHomeHero=set;
  set(i);
  window.__homeHeroTimer=setInterval(()=>set(i+1),5200);
  wrap.addEventListener('mouseenter',()=>{if(window.__homeHeroTimer){clearInterval(window.__homeHeroTimer);window.__homeHeroTimer=null;}});
  wrap.addEventListener('mouseleave',()=>{if(!window.__homeHeroTimer)window.__homeHeroTimer=setInterval(()=>set(i+1),5200);});
  let x0=null;
  wrap.addEventListener('touchstart',e=>{x0=e.touches&&e.touches[0]?e.touches[0].clientX:null;},{passive:true});
  wrap.addEventListener('touchend',e=>{if(x0==null)return;const x1=e.changedTouches&&e.changedTouches[0]?e.changedTouches[0].clientX:x0;const dx=x1-x0;x0=null;if(Math.abs(dx)>44)set(i+(dx<0?1:-1));},{passive:true});
}
function couponPromoText(k){
  if(!k)return '';
  const first=couponFirstOrderOnly(k)?' · first order only':'';
  const min=Number(k.min||0)>0?` · min ${money(k.min)}`:'';
  return k.type==='percent'?`Use ${k.code} · ${k.value}% off${first}${min}`:`Use ${k.code} · Free delivery${first}${min}`;
}
function priorOrderForEmail(email){
  email=String(email||'').trim().toLowerCase(); if(!email)return false;
  return (DB.orders||[]).some(o=>String(o.email||'').trim().toLowerCase()===email);
}
function couponCheck(code,email){
  code=(code||'').trim().toUpperCase(); const sub=cartSubtotal();
  if(!code)return {ok:false,text:'Please type a coupon code first.'};
  const any=DB.coupons.find(x=>String(x.code||'').toUpperCase()===code);
  if(!any)return {ok:false,text:`“${code}” is not a valid coupon code. Please check the spelling and try again.`};
  if(!any.active)return {ok:false,text:`“${code}” has expired and can no longer be used.`};
  if(couponFirstOrderOnly(any)&&priorOrderForEmail(email))return {ok:false,text:`“${code}” is a one-time first-order offer and has already been used for this customer.`};
  if(sub<any.min)return {ok:false,text:`“${code}” works on orders of ${money(any.min)} or more — add ${money(any.min-sub)} more to use it.`};
  const saving=any.type==='percent'?Math.round(sub*any.value/100):0;
  return {ok:true,code,coupon:any,text:any.type==='percent'?`“${code}” applied — you save ${money(saving)} on this order.`:`“${code}” applied — delivery is now free.`};
}
function clearCheckoutCoupon(updateUI=true){
  CO_COUPON=''; CPN_MSG=null; if(DB)DB.coupon='';
  if(updateUI)updateCheckoutSummary();
}
function checkoutAmounts(){
  const sub=cartSubtotal(), s=DB.settings;
  const c=CO_COUPON&&DB.coupons.find(k=>String(k.code||'').toUpperCase()===CO_COUPON&&k.active);
  let off=0, ship=sub>=s.freeShipAbove?0:s.shipFee;
  if(c){if(c.type==='percent')off=Math.round(sub*c.value/100);if(c.type==='ship')ship=0;}
  return {sub,c,off,ship,total:Math.max(0,sub-off+ship)};
}
function checkoutEmail(){
  const f=document.getElementById('coForm');
  return String((f&&f.elements&&f.elements.email&&f.elements.email.value)||(DB.session&&DB.session.email)||'').trim().toLowerCase();
}
function updateCheckoutSummary(){
  const a=checkoutAmounts();
  document.querySelectorAll('[data-co-subtotal]').forEach(x=>x.textContent=money(a.sub));
  document.querySelectorAll('[data-co-delivery]').forEach(x=>x.textContent=a.ship?money(a.ship):'Free');
  document.querySelectorAll('[data-co-total]').forEach(x=>x.textContent=money(a.total));
  const dr=document.getElementById('coDiscountRow'); if(dr){dr.style.display=a.off?'flex':'none';const v=dr.querySelector('b');if(v)v.textContent='− '+money(a.off);}
  const ar=document.getElementById('couponAppliedRow');
  if(ar)ar.innerHTML=a.c?`<span class="checkout-coupon-ok">${ic('check',13)} ${esc(a.c.code)} applied</span><button type="button" class="checkout-text-btn" data-act="removeCoupon">Remove</button>`:'';
  const msg=document.getElementById('cpnMsg');
  if(msg){msg.className='cpn-msg '+(CPN_MSG?(CPN_MSG.ok?'good':'bad'):'');msg.textContent=CPN_MSG?CPN_MSG.text:'';}
  const btn=document.getElementById('coPlaceOrder');
  if(btn){btn.innerHTML=DB.settings.orderMode==='whatsapp'?`${ic('phone',16)} Send order on WhatsApp · ${money(a.total)}`:`Place order · ${money(a.total)}`;}
}
function checkoutShowStep(step,backward=false){
  step=Math.max(1,Math.min(4,+step||1));
  if(backward&&step<CO_STEP)clearCheckoutCoupon(false);
  CO_STEP=step;
  document.querySelectorAll('[data-co-panel]').forEach(p=>p.classList.toggle('active',+p.dataset.coPanel===step));
  document.querySelectorAll('[data-co-step]').forEach(x=>{const n=+x.dataset.coStep;x.classList.toggle('active',n===step);x.classList.toggle('done',n<step);});
  updateCheckoutSummary();
  const top=document.querySelector('.checkout-flow'); if(top)top.scrollIntoView({behavior:'smooth',block:'start'});
}
function validateCheckoutAddress(){
  const box=document.querySelector('[data-co-panel="2"]'); if(!box)return true;
  let first=null,ok=true; box.querySelectorAll('[data-v]').forEach(i=>{if(!markField(i)){ok=false;if(!first)first=i;}});
  if(first)first.focus(); return ok;
}
async function applyCheckoutCoupon(){
  const inp=document.getElementById('cpn'); if(!inp)return;
  const code=(inp.value||'').trim().toUpperCase(), email=checkoutEmail();
  let res=couponCheck(code,email);
  CPN_MSG=res.ok?res:{...res,code};
  if(!res.ok){CO_COUPON='';updateCheckoutSummary();return;}
  const c=res.coupon;
  if(API.on&&couponFirstOrderOnly(c)){
    const b=document.querySelector('[data-act="applyCoupon"]'); if(b){b.disabled=true;b.textContent='Checking…';}
    const vr=await API.call('/api/coupons/validate',{method:'POST',body:{code,email,subtotal:cartSubtotal()}});
    if(b){b.disabled=false;b.textContent='Apply';}
    if(!vr.ok){CO_COUPON='';CPN_MSG={ok:false,code,text:vr.error||'This coupon cannot be used on this order.'};updateCheckoutSummary();return;}
  }
  CO_COUPON=res.code; CPN_MSG=res; updateCheckoutSummary();
}
function thankYouCard(name,email,kind){
  const first=esc(String(name||'').trim().split(' ')[0]||'friend');
  const body=kind==='contact'
    ?`Your message has reached our nursery. A real person from our team will read it and reply to <b>${esc(email)}</b> within one working day.`
    :`You are now part of the Green Ocean community. Plant care tips and new arrivals will reach <b>${esc(email)}</b>.`;
  return `<div class="thanks-card" role="status">
    <span class="thanks-leaf">🌿</span>
    <h3>Thank you, ${first}!</h3>
    <p>${body}</p>
    ${kind==='contact'?`<p class="thanks-small">Need a faster answer? Call or WhatsApp us on ${esc(DB.settings.phone)}.</p>
    <button class="btn btn-line btn-sq btn-sm" data-act="contactAgain">Send another message</button>`:''}</div>`;
}


function admMessages(){
  const list=API.on?API.messages:[];
  return adminShell('messages',`${!API.on?`<div class="panel empty">${ic('mail',28)}<h3>Messages arrive once the website is live</h3>
      <p>When the website runs on greenocean.co.in with the server connected, every contact-form message shows up here and in your Gmail.</p></div>`:
    list.length?list.map(m=>`<div class="panel" style="margin-bottom:10px;${m.read?'':'border-color:#9FCBB0;background:#F6FBF7'}">
      <div class="card-h"><div><b>${esc(m.name)}</b> ${m.read?'':'<span class="pill green">New</span>'}<br>
        <small style="color:var(--muted)">${esc(m.email)} · ${esc(m.phone)} · ${esc(m.date)}</small></div></div>
      <p style="margin:0 0 12px;white-space:pre-wrap">${esc(m.msg)}</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a class="btn btn-primary btn-sq btn-sm" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('Re: your message to Green Ocean')}">${ic('mail',14)} Reply by email</a>
        <a class="btn btn-line btn-sq btn-sm" target="_blank" rel="noopener" href="https://wa.me/91${esc(m.phone)}">${ic('phone',14)} WhatsApp</a>
        ${m.read?'':`<button class="btn btn-soft btn-sq btn-sm" data-msg-read="${esc(m._key)}">${ic('check',14)} Mark as read</button>`}
        <button class="btn btn-danger btn-sq btn-sm" data-msg-del="${esc(m._key)}">${ic('trash',13)}</button></div></div>`).join(''):
      `<div class="panel empty">${ic('mail',28)}<h3>No messages yet</h3><p>Messages from the Contact page will appear here.</p></div>`}`,
    'Messages',API.on?`${list.filter(m=>!m.read).length} unread · also sent to your email`:'Contact-form messages');
}
