/* ================= ADMIN ================= */
const NAV=[['dashboard','Dashboard','home'],['products','Products','box'],['categories','Categories','grid'],['orders','Orders','bag'],['returns','Returns & Refunds','back'],
 ['customers','Customers','users'],['messages','Messages','mail'],['inventory','Inventory','stack'],['banners','Banners & Sliders','image'],['offers','Offers & Coupons','tag'],
 ['blog','Blog / Content','doc'],['reviews','Reviews','star'],['pages','Pages','pages'],['newsletter','Newsletter','mail'],
 ['settings','Website Settings','globe'],['appearance','Appearance','brush'],['media','Media & Image Sizes','image'],['reports','Reports','chart'],['account','Settings','gear']];

function adminLogin(){
  return `<div style="min-height:100vh;display:grid;place-items:center;padding:20px;background:linear-gradient(140deg,#0C3A28,#15563D)">
   <form class="panel" id="admForm" novalidate style="width:100%;max-width:380px;padding:24px">
     <div class="logo" style="justify-content:center;margin-bottom:8px"><img src="${src('img:logo')}" alt="${esc(DB.settings.store)}" style="height:82px;width:auto;display:block;object-fit:contain"></div>
     <p style="text-align:center;color:var(--muted);font-size:13px;margin:0 0 18px">Admin panel · sign in to manage the store</p>
     <div class="field"><label for="adm_user">Username</label><div class="ifield"><span class="ico">${ic('user',18)}</span>
       <input class="inp" id="adm_user" name="user" data-v="any" data-label="Username" placeholder="admin" autocomplete="username" autocapitalize="none" spellcheck="false"></div></div>
     <div class="field"><label for="adm_pass">Password</label><div class="ifield"><span class="ico">${ic('lock',18)}</span>
       <input class="inp has-eye" id="adm_pass" type="password" name="pass" data-v="any" data-label="Password" placeholder="Enter password" autocomplete="current-password">
       <button type="button" class="eye" data-act="eye" aria-label="Show password">${ic('eye',18)}</button></div></div>
     <button class="btn btn-primary btn-sq btn-block btn-lg" type="submit">Sign in</button>
     <p style="text-align:center;margin:10px 0 0"><a href="#/" style="font-size:13px;color:var(--green-700);font-weight:600">${ic('back',14)} Back to website</a></p>
   </form></div>`;
}
function adminNavBadge(key){
  if(key==='orders'){const n=DB.orders.filter(o=>o.status==='Processing').length;return n?`<span class="admin-nav-badge warn">${n}</span>`:'';}
  if(key==='returns'){const n=(API.returns||[]).filter(r=>['Requested','Under review'].includes(r.status)).length;return n?`<span class="admin-nav-badge alert">${n}</span>`:'';}
  if(key==='messages'){const n=(API.messages||[]).filter(m=>!m.read).length;return n?`<span class="admin-nav-badge alert">${n}</span>`:'';}
  if(key==='inventory'){const n=DB.products.filter(p=>p.active&&p.stock<6).length;return n?`<span class="admin-nav-badge warn">${n}</span>`:'';}
  if(key==='reviews'){const n=(API.pendingReviews||[]).length;return n?`<span class="admin-nav-badge">${n}</span>`:'';}
  return '';
}
function adminNavItem(key,page){
  const n=NAV.find(x=>x[0]===key); if(!n)return '';
  return `<a href="#/admin/${n[0]}" class="${page===n[0]?'on':''}"><span class="admin-nav-icon">${ic(n[2],16)}</span><span>${n[1]}</span>${adminNavBadge(key)}</a>`;
}
function adminShell(page,body,title,sub,actions){
  const groups=[
    ['Overview',['dashboard','reports']],
    ['Commerce',['orders','returns','products','categories','inventory','customers']],
    ['Customer & growth',['messages','offers','newsletter','reviews']],
    ['Storefront',['banners','media','pages','blog','appearance']],
    ['System',['settings','account']]
  ];
  const nav=groups.map(g=>`<div class="admin-nav-group">${g[0]}</div>${g[1].map(k=>adminNavItem(k,page)).join('')}`).join('');
  const initials=(DB.settings.store||'Green Ocean').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase();
  return `<div class="adm"><aside class="side" id="side">
    <div class="side-top"><div class="admin-brand-logo"><img src="${src('img:logo')}" alt="${esc(DB.settings.store)}"></div><div class="admin-brand-copy"><b>${esc(DB.settings.store)}</b><span>Commerce admin</span></div></div>
    <div class="admin-store-state">${ic('globe',13)}<span>greenocean.co.in</span><i>${API.on?'LIVE':'PREVIEW'}</i></div>
    <nav>${nav}</nav>
    <div class="side-bot"><a class="admin-side-action" href="#/">${ic('back',16)} View storefront</a><button class="admin-side-action danger" data-act="admLogout">${ic('lock',16)} Sign out</button></div>
  </aside><button class="adm-shade" type="button" data-act="admMenu" aria-label="Close admin menu"></button><div class="adm-main">
   <div class="abar"><button class="icon-btn burger" data-act="admMenu" aria-label="Menu">${ic('menu',21)}</button>
     <form class="search admin-search" data-act="admSearch"><span>${ic('search',15)}</span><input name="q" placeholder="Search products, orders, customers..." aria-label="Search admin"></form>
     <div class="admin-top-status">${pubBadgeHTML()}</div>
     <button class="icon-btn" data-act="notif" aria-label="Notifications">${ic('bell',19)}${(()=>{const n=DB.orders.filter(o=>['Processing','Packed'].includes(o.status)).length+(API.messages||[]).filter(m=>!m.read).length+(API.returns||[]).filter(r=>['Requested','Under review'].includes(r.status)).length;return n?`<span class="dot">${n}</span>`:'';})()}</button>
     <div class="admin-profile"><span class="av">${esc(initials)}</span><span class="admin-profile-meta"><b>Admin</b><small>${esc(DB.settings.adminEmail)}</small></span></div>
     <button class="btn btn-line btn-sq btn-sm adm-out" data-act="admLogout" aria-label="Sign out">Sign out</button></div>
   <div class="acontent">${page!=='dashboard'?backBar('Back to dashboard','#/admin/dashboard'):''}
     ${page==='dashboard'?'':`<div class="ahead"><div><h1>${esc(title)}</h1><p>${esc(sub||'')}</p></div><div style="display:flex;gap:8px;flex-wrap:wrap">${actions||''}</div></div>`}${body}</div>
  </div></div>`;
}
let DASH_RANGE=30;
function dayKey(d){ return d.toISOString().slice(0,10); }
function dashStats(R){
  const now=new Date(), start=new Date(now), prevStart=new Date(now);
  start.setDate(now.getDate()-R+1); prevStart.setDate(now.getDate()-2*R+1);
  const live=DB.orders.filter(o=>o.status!=='Cancelled');
  const inR=o=>o.date>=dayKey(start), inPrev=o=>o.date>=dayKey(prevStart)&&o.date<dayKey(start);
  const cur=DB.orders.filter(inR), prev=DB.orders.filter(inPrev);
  const buckets=R>90?12:Math.min(R,15), step=R/buckets, series=[], labels=[];
  for(let i=0;i<buckets;i++){
    const a=new Date(start); a.setDate(start.getDate()+Math.round(i*step));
    const b=new Date(start); b.setDate(start.getDate()+Math.round((i+1)*step));
    series.push(live.filter(o=>o.date>=dayKey(a)&&o.date<dayKey(b)).reduce((x,o)=>x+o.total,0));
  }
  const fmt=d=>d.toLocaleDateString('en-IN',R>90?{month:'short'}:{day:'2-digit',month:'short'});
  for(let i=0;i<5;i++){const d=new Date(start); d.setDate(start.getDate()+Math.round(i*(R-1)/4)); labels.push(fmt(d));}
  return {orders:cur.length, prevOrders:prev.length,
    revenue:cur.filter(o=>o.status!=='Cancelled').reduce((x,o)=>x+o.total,0),
    prevRevenue:prev.filter(o=>o.status!=='Cancelled').reduce((x,o)=>x+o.total,0),
    newCustomers:DB.customers.filter(c=>c.joined>=dayKey(start)).length, series, labels};
}
function lineChart(vals,w,h){
  if(vals.length<2)vals=[vals[0]||0,vals[0]||0];
  const max=Math.max(1,...vals)*1.15, step=w/(vals.length-1);
  const pts=vals.map((v,i)=>[i*step,h-(v/max)*h]);
  const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" style="display:block">
   <defs><linearGradient id="fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F7D5B" stop-opacity=".28"/><stop offset="1" stop-color="#2F7D5B" stop-opacity="0"/></linearGradient></defs>
   ${[0,1,2,3].map(i=>`<line x1="0" y1="${h*i/3}" x2="${w}" y2="${h*i/3}" stroke="#E2E7E3" stroke-width="1"/>`).join('')}
   <path d="${d} L ${w} ${h} L 0 ${h} Z" fill="url(#fill)"/>
   <path d="${d}" fill="none" stroke="#2F7D5B" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
   ${pts.filter((_,i)=>i%2===0).map(p=>`<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.6" fill="#15563D"/>`).join('')}</svg>`;
}
function admDashboard(){
  const R=DASH_RANGE, st=dashStats(R);
  const activeOrders=DB.orders.filter(o=>o.status!=='Cancelled'&&o.date>=dayKey(new Date(Date.now()-(R-1)*86400000)));
  const avgOrder=activeOrders.length?Math.round(st.revenue/activeOrders.length):0;
  const processing=DB.orders.filter(o=>['Processing','Packed'].includes(o.status)).length;
  const returnPending=(API.returns||[]).filter(r=>['Requested','Under review'].includes(r.status)).length;
  const lowStock=DB.products.filter(p=>p.active&&p.stock<6).sort((a,b)=>a.stock-b.stock);
  const unread=(API.messages||[]).filter(m=>!m.read).length;
  const pendingReviews=(API.pendingReviews||[]).length;
  const invUnits=DB.products.filter(p=>p.active).reduce((n,p)=>n+(+p.stock||0),0);
  const trend=(a,b)=>b>0?`${a>=b?'↑':'↓'} ${Math.abs(Math.round((a-b)/b*100))}% vs previous`:(a>0?'New this period':'No activity yet');
  const sold={};
  DB.orders.filter(o=>o.status!=='Cancelled').forEach(o=>(o.items||[]).forEach(i=>{const k=i.id||i.name; sold[k]||(sold[k]={id:i.id,name:i.name,qty:0,revenue:0});sold[k].qty+=(+i.qty||0);sold[k].revenue+=(+i.price||0)*(+i.qty||0);}));
  const topProducts=Object.values(sold).sort((a,b)=>b.qty-a.qty).slice(0,4);
  const recent=DB.orders.slice(0,6);
  const dateSelect=`<select class="inp" style="width:auto" data-range="1" aria-label="Date range">${[[7,'Last 7 Days'],[30,'Last 30 Days'],[90,'Last 90 Days'],[365,'Last 12 Months']].map(o=>`<option value="${o[0]}" ${DASH_RANGE===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>`;
  return adminShell('dashboard',`
   <div class="admin-dashboard-head"><div><h2>Store overview</h2><p>Orders, inventory and customer activity for Green Ocean — all in one focused view.</p></div><div class="admin-dashboard-actions">${dateSelect}<button class="btn btn-primary btn-sq" data-edit-product="new">${ic('plus',15)} Add product</button></div></div>
   ${API.on&&API.storeMissing?`<div class="panel" style="margin-bottom:14px;border-color:#E9D29F;background:#FFF9ED"><b>${ic('bell',14)} Publish your store data</b><p style="margin:5px 0 10px;font-size:11.8px;color:var(--adm-muted)">Your live website is connected, but the shared store data has not been published yet.</p><button class="btn btn-primary btn-sq btn-sm" data-act="publishNow">Publish website now</button></div>`:''}
   ${!API.on?`<div class="panel" style="margin-bottom:14px;background:#F4F7F5"><b>${ic('eye',14)} Preview mode</b><p style="margin:5px 0 0;font-size:11.8px;color:var(--adm-muted)">Changes in this copy stay in this browser. Use the live admin at greenocean.co.in to update the public store.</p></div>`:''}

   <div class="admin-metric-grid">
     <a class="admin-metric-card" href="#/admin/reports"><span class="admin-metric-ico sales">${ic('wallet',19)}</span><span><small class="admin-metric-label">Net sales</small><b class="admin-metric-value">${money(st.revenue)}</b><small class="admin-metric-meta ${st.revenue<st.prevRevenue?'down':''}">${trend(st.revenue,st.prevRevenue)}</small></span></a>
     <a class="admin-metric-card" href="#/admin/orders"><span class="admin-metric-ico orders">${ic('bag',19)}</span><span><small class="admin-metric-label">Orders</small><b class="admin-metric-value">${st.orders.toLocaleString('en-IN')}</b><small class="admin-metric-meta ${st.orders<st.prevOrders?'down':''}">${trend(st.orders,st.prevOrders)} · AOV ${money(avgOrder)}</small></span></a>
     <a class="admin-metric-card" href="#/admin/customers"><span class="admin-metric-ico customers">${ic('users',19)}</span><span><small class="admin-metric-label">Customers</small><b class="admin-metric-value">${DB.customers.length.toLocaleString('en-IN')}</b><small class="admin-metric-meta">${st.newCustomers} new in last ${R} days</small></span></a>
     <a class="admin-metric-card" href="#/admin/inventory"><span class="admin-metric-ico stock">${ic('stack',19)}</span><span><small class="admin-metric-label">Inventory health</small><b class="admin-metric-value">${invUnits.toLocaleString('en-IN')}</b><small class="admin-metric-meta ${lowStock.length?'down':''}">${lowStock.length?lowStock.length+' products need restock':'Stock levels look healthy'}</small></span></a>
   </div>

   <div class="admin-action-row">
     <button class="admin-action" data-link="#/admin/orders"><span class="ai">${ic('bag',17)}</span><span><b>Process orders</b><small>${processing?processing+' need fulfilment':'No pending orders'}</small></span></button>
     <button class="admin-action" data-edit-product="new"><span class="ai">${ic('plus',17)}</span><span><b>Add new product</b><small>Plant, planter or gardening item</small></span></button>
     <button class="admin-action" data-link="#/admin/offers?new=1"><span class="ai">${ic('tag',17)}</span><span><b>Create offer</b><small>Coupon or free-shipping promotion</small></span></button>
     <button class="admin-action" data-link="#/admin/banners"><span class="ai">${ic('image',17)}</span><span><b>Update storefront</b><small>Banner, campaign or seasonal event</small></span></button>
   </div>

   <div class="admin-grid-main">
     <section class="panel admin-sales-card"><div class="admin-sales-top"><div><div class="card-h" style="margin:0"><h3>Sales performance</h3></div><small style="color:var(--adm-muted);font-size:10.5px">Revenue trend for the selected period</small></div><div class="admin-sales-total"><b>${money(st.revenue)}</b><span>${activeOrders.length} non-cancelled orders · AOV ${money(avgOrder)}</span></div></div>${lineChart(st.series,760,210)}<div class="admin-chart-labels">${st.labels.map(l=>`<span>${l}</span>`).join('')}</div></section>
     <section class="panel"><div class="card-h"><div><h3>Needs attention</h3><small style="color:var(--adm-muted);font-size:10.5px">Priority work for today</small></div></div><div class="admin-attention-list">
       <a class="admin-attention-item" href="#/admin/orders"><span class="ico">${ic('bag',16)}</span><span><b>Orders to process</b><small>Confirm, pack or update status</small></span><span class="admin-attention-count ${processing?'warn':''}">${processing}</span></a>
       <a class="admin-attention-item" href="#/admin/inventory"><span class="ico">${ic('stack',16)}</span><span><b>Low-stock products</b><small>Restock before items sell out</small></span><span class="admin-attention-count ${lowStock.length?'warn':''}">${lowStock.length}</span></a>
       <a class="admin-attention-item" href="#/admin/messages"><span class="ico">${ic('mail',16)}</span><span><b>Unread customer messages</b><small>Reply to product and order questions</small></span><span class="admin-attention-count ${unread?'alert':''}">${unread}</span></a>
       <a class="admin-attention-item" href="#/admin/reviews"><span class="ico">${ic('star',16)}</span><span><b>Reviews awaiting approval</b><small>Publish useful customer feedback</small></span><span class="admin-attention-count">${pendingReviews}</span></a>
     </div></section>
   </div>

   <div class="admin-section-grid">
     <section class="panel admin-order-table"><div class="card-h"><div><h3>Recent orders</h3><small style="color:var(--adm-muted);font-size:10.5px">Latest customer purchases and status</small></div><a class="link-more" href="#/admin/orders">View all ${ic('arrow',12)}</a></div>${recent.length?`<div class="scroll-x"><table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th class="hide-mobile">Date</th><th>Total</th><th>Status</th></tr></thead><tbody>${recent.map(o=>`<tr><td class="order-id">#${esc(o.id)}</td><td class="admin-order-customer"><b>${esc(o.name)}</b><small>${esc(o.email||o.phone||'')}</small></td><td class="hide-mobile">${esc(o.date||'—')}</td><td><b>${money(o.total)}</b></td><td><span class="pill ${o.status==='Delivered'?'green':o.status==='Shipped'?'blue':o.status==='Cancelled'?'red':'amber'}">${esc(o.status)}</span></td></tr>`).join('')}</tbody></table></div>`:`<div class="admin-empty-mini">No orders yet. New orders will appear here.</div>`}</section>
     <section class="panel"><div class="card-h"><div><h3>Inventory watch</h3><small style="color:var(--adm-muted);font-size:10.5px">Products closest to selling out</small></div><a class="link-more" href="#/admin/inventory">Open inventory</a></div><div class="admin-low-stock">${lowStock.length?lowStock.slice(0,5).map(p=>`<div class="admin-stock-row">${pic(p,'thumb')}<span><b>${esc(p.name)}</b><small>${esc((cat(p.cat)||{}).name||'Product')}</small></span><span class="admin-stock-num">${p.stock} left</span></div>`).join(''):`<div class="admin-empty-mini">${ic('check',18)} All active products have healthy stock levels.</div>`}</div></section>
   </div>

   <section class="panel" style="margin-bottom:14px"><div class="card-h"><div><h3>Storefront & growth</h3><small style="color:var(--adm-muted);font-size:10.5px">Common tasks for your nursery and gardening store</small></div></div><div class="admin-storefront-grid">
     <button class="admin-storefront-card" data-link="#/admin/appearance"><span class="ico">${ic('home',17)}</span><b>Homepage</b><small>Hero content, featured sections and brand presentation.</small><span class="go">Edit storefront →</span></button>
     <button class="admin-storefront-card" data-link="#/admin/banners"><span class="ico">${ic('image',17)}</span><b>Banners & events</b><small>Seasonal campaigns, gifting, festival and event promotions.</small><span class="go">Manage banners →</span></button>
     <button class="admin-storefront-card" data-link="#/admin/offers"><span class="ico">${ic('tag',17)}</span><b>Offers & coupons</b><small>Create discounts without cluttering the shopping experience.</small><span class="go">Manage offers →</span></button>
     <button class="admin-storefront-card" data-link="#/admin/blog"><span class="ico">${ic('doc',17)}</span><b>Plant care content</b><small>Publish gardening guides that support discovery and trust.</small><span class="go">Manage blog →</span></button>
     <button class="admin-storefront-card" data-link="#/admin/media"><span class="ico">${ic('image',17)}</span><b>Media & image sizes</b><small>Replace shared website images and see the exact dimensions for every image type.</small><span class="go">Manage images →</span></button>
   </div></section>

   ${topProducts.length?`<section class="panel"><div class="card-h"><div><h3>Best-selling products</h3><small style="color:var(--adm-muted);font-size:10.5px">Based on non-cancelled order history</small></div><a class="link-more" href="#/admin/products">Manage products</a></div><div class="scroll-x"><table class="tbl"><thead><tr><th>Product</th><th>Units sold</th><th>Sales value</th></tr></thead><tbody>${topProducts.map(t=>{const p=t.id?prod(t.id):null;return `<tr><td><div style="display:flex;align-items:center;gap:9px">${p?pic(p,'thumb'):''}<b>${esc(t.name||'Product')}</b></div></td><td>${t.qty}</td><td><b>${money(t.revenue)}</b></td></tr>`;}).join('')}</tbody></table></div></section>`:''}
   `,'Dashboard','');
}




const MEDIA_SPECS=[
 {key:'logo',group:'Branding',label:'Main logo',w:948,h:472,fit:'contain',usage:'Header, footer, account header, admin panel and schema logo',format:'Transparent PNG recommended'},
 {key:'favicon',group:'Branding',label:'Favicon / app icon',w:512,h:512,fit:'contain',usage:'Browser tab and mobile shortcut icon',format:'Square PNG recommended'},
 {key:'hero',group:'Shared page imagery',label:'Main nursery / lifestyle image',w:1600,h:1000,fit:'cover',usage:'Plant Care featured image, Our Story, FAQ/policies and account background',format:'JPG/WebP'},
 {key:'community',group:'Shared page imagery',label:'Our Story hero background',w:1600,h:900,fit:'cover',usage:'Our Story page decorative hero background',format:'JPG/WebP'},
 {key:'content1',group:'Shared page imagery',label:'Our Story supporting image 1',w:1200,h:900,fit:'cover',usage:'Our Story image collage',format:'JPG/WebP'},
 {key:'content2',group:'Shared page imagery',label:'Contact hero background',w:1600,h:900,fit:'cover',usage:'Contact page decorative hero background',format:'JPG/WebP'},
 {key:'content3',group:'Shared page imagery',label:'Plant Care / blog background',w:1600,h:900,fit:'cover',usage:'Plant Care article hero decoration and Potting Soil product default',format:'JPG/WebP'},
 {key:'content4',group:'Shared page imagery',label:'Our Story supporting image 2',w:1200,h:900,fit:'cover',usage:'Our Story collage and Terracotta Pot default photo',format:'JPG/WebP'},
 {key:'ban_planters',group:'Homepage sections',label:'Planters promotional tile',w:1200,h:650,fit:'cover',usage:'Homepage split promotional section — planters',format:'JPG/WebP'},
 {key:'ban_combos',group:'Homepage sections',label:'Combos promotional tile',w:1200,h:650,fit:'cover',usage:'Homepage split promotional section — combos',format:'JPG/WebP'},
 {key:'selfwater_plant',group:'Homepage sections',label:'Self-watering planter feature',w:1200,h:1200,fit:'cover',usage:'Homepage feature band, account promo and default product/blog image',format:'JPG/WebP'},
 {key:'sp_living',group:'Homepage spaces',label:'Living Room',w:1200,h:960,fit:'cover',usage:'Plants for Every Space — Living Room',format:'JPG/WebP'},
 {key:'sp_bedroom',group:'Homepage spaces',label:'Bedroom',w:1200,h:960,fit:'cover',usage:'Plants for Every Space — Bedroom',format:'JPG/WebP'},
 {key:'sp_workspace',group:'Homepage spaces',label:'Workspace',w:1200,h:960,fit:'cover',usage:'Plants for Every Space — Workspace',format:'JPG/WebP'},
 {key:'sp_balcony',group:'Homepage spaces',label:'Balcony',w:1200,h:960,fit:'cover',usage:'Plants for Every Space — Balcony',format:'JPG/WebP'},
 {key:'sp_outdoor',group:'Homepage spaces',label:'Outdoor Garden',w:1200,h:960,fit:'cover',usage:'Plants for Every Space — Outdoor Garden',format:'JPG/WebP'},
 {key:'auth_leaf_a',group:'Login & signup',label:'Login decorative leaf',w:900,h:1200,fit:'cover',usage:'Login page left decorative image',format:'JPG/WebP'},
 {key:'auth_leaf_b',group:'Login & signup',label:'Signup decorative leaf',w:900,h:1200,fit:'cover',usage:'Signup page left decorative image',format:'JPG/WebP'},
 {key:'auth_pot',group:'Login & signup',label:'Login pot image',w:900,h:1200,fit:'cover',usage:'Login page right decorative image',format:'JPG/WebP'},
 {key:'auth_note',group:'Login & signup',label:'Signup note image',w:700,h:900,fit:'cover',usage:'Signup page top-right decorative image',format:'JPG/WebP'},
 {key:'cat_indoor',group:'Category defaults',label:'Indoor Plants default',w:1000,h:1000,fit:'cover',usage:'Default Indoor Plants category image',format:'JPG/WebP'},
 {key:'cat_flowering',group:'Category defaults',label:'Flowering Plants default',w:1000,h:1000,fit:'cover',usage:'Default Flowering Plants category / Hibiscus image',format:'JPG/WebP'},
 {key:'cat_succulents',group:'Category defaults',label:'Succulents default',w:1000,h:1000,fit:'cover',usage:'Default Succulents / Jade image and blog cover',format:'JPG/WebP'},
 {key:'cat_planters',group:'Category defaults',label:'Planters default',w:1000,h:1000,fit:'cover',usage:'Default Planters category image',format:'JPG/WebP'},
 {key:'cat_gardening',group:'Category defaults',label:'Gardening default',w:1000,h:1000,fit:'cover',usage:'Default Gardening / Areca Palm image',format:'JPG/WebP'},
 {key:'cat_combos',group:'Category defaults',label:'Combos default',w:1000,h:1000,fit:'cover',usage:'Default Combos category / Desk Buddy image',format:'JPG/WebP'},
 {key:'prod_snake',group:'Product defaults',label:'Snake Plant default',w:1200,h:1200,fit:'cover',usage:'Default Snake Plant product image',format:'JPG/WebP'},
 {key:'prod_money',group:'Product defaults',label:'Money Plant default',w:1200,h:1200,fit:'cover',usage:'Default Money Plant product image',format:'JPG/WebP'},
 {key:'prod_peace',group:'Product defaults',label:'Peace Lily default',w:1200,h:1200,fit:'cover',usage:'Default Peace Lily product image',format:'JPG/WebP'},
 {key:'prod_aloe',group:'Product defaults',label:'Aloe Vera default',w:1200,h:1200,fit:'cover',usage:'Default Aloe Vera product image',format:'JPG/WebP'},
 {key:'prod_zz',group:'Product defaults',label:'ZZ Plant default',w:1200,h:1200,fit:'cover',usage:'Default ZZ Plant and featured Plant Care article image',format:'JPG/WebP'},
 {key:'test1',group:'Review defaults',label:'Review avatar 1',w:600,h:600,fit:'cover',usage:'Homepage published review avatar',format:'JPG/WebP'},
 {key:'test2',group:'Review defaults',label:'Review avatar 2',w:600,h:600,fit:'cover',usage:'Homepage published review avatar',format:'JPG/WebP'},
 {key:'test3',group:'Review defaults',label:'Review avatar 3',w:600,h:600,fit:'cover',usage:'Homepage published review avatar',format:'JPG/WebP'}
];
function mediaSpec(key){return MEDIA_SPECS.find(x=>x.key===key)||null;}
function mediaOverrides(){DB.settings.media=DB.settings.media&&typeof DB.settings.media==='object'?DB.settings.media:{};return DB.settings.media;}
function mediaReset(key){const m=mediaOverrides();delete m[key];save();applyMediaAssets();paint();toast('Original website image restored — previous uploaded file will be removed after publish');}
function readManagedMedia(file,spec,done){
  if(!file||!/^image\//.test(file.type)){toast('Please choose an image file',true);return;}
  const fr=new FileReader();fr.onload=()=>{const img=new Image();img.onload=()=>{
    const tw=spec.w,th=spec.h,cv=document.createElement('canvas');cv.width=tw;cv.height=th;const cx=cv.getContext('2d');
    if(spec.fit==='contain'){cx.clearRect(0,0,tw,th);const sc=Math.min(tw/img.width,th/img.height),w=img.width*sc,h=img.height*sc;cx.drawImage(img,(tw-w)/2,(th-h)/2,w,h);done(cv.toDataURL('image/png'),img.width,img.height);return;}
    cx.fillStyle='#fff';cx.fillRect(0,0,tw,th);const sc=Math.max(tw/img.width,th/img.height),w=img.width*sc,h=img.height*sc;cx.drawImage(img,(tw-w)/2,(th-h)/2,w,h);done(cv.toDataURL('image/webp',0.88),img.width,img.height);
  };img.onerror=()=>toast('That image could not be read',true);img.src=fr.result;};fr.readAsDataURL(file);
}
function applyMediaAssets(){
  const get=k=>src('img:'+k),q=u=>'url("'+String(u||'').replace(/"/g,'%22')+'")';
  let st=document.getElementById('go-media-overrides');if(!st){st=document.createElement('style');st.id='go-media-overrides';document.head.appendChild(st);}
  st.textContent=`.account-welcome::after,.faq-hero::before,.policy-hero::after,.brand-hero::after,.admin-hero-preview-art{background-image:${q(get('hero'))}!important}.account-promo::after,.brand-hero.returns::after{background-image:${q(get('selfwater_plant'))}!important}.brand-hero.story::after{background-image:${q(get('community'))}!important}.brand-hero.contact::after{background-image:${q(get('content2'))}!important}.blog-hero::after,.blog-article-hero::after{background-image:${q(get('content3'))}!important}`;
  document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]').forEach(x=>x.href=get('favicon'));
  const og=document.querySelector('meta[property="og:image"]');if(og)og.setAttribute('content',absoluteAsset('img:hero'));
}
function mediaForm(key){
  const m=mediaSpec(key);if(!m)return;const custom=!!mediaOverrides()[key];
  openModal('Replace — '+m.label,`<div class="media-upload-preview ${m.fit==='contain'?'logo':''}"><div class="preview"><img src="${src('img:'+m.key)}" alt="${esc(m.label)}"></div><div><div class="media-spec-list"><span><b>Recommended size:</b> ${m.w} × ${m.h} px</span><span><b>Aspect:</b> ${m.w}:${m.h}</span><span><b>Used in:</b> ${esc(m.usage)}</span><span><b>File:</b> ${esc(m.format)}</span></div><div class="field" style="margin-top:12px"><label>Choose replacement image</label><input class="inp" id="mediaFile" type="file" accept="image/*"><small class="img-size-hint">For the cleanest result, upload exactly ${m.w} × ${m.h} px. If the ratio differs, the website will centre-crop the photo to this size automatically.</small></div></div></div>`,`${custom?`<button class="btn btn-danger btn-sq" id="mediaRestore">Restore original</button>`:''}<button class="btn btn-line btn-sq" data-close="1">Cancel</button><button class="btn btn-primary btn-sq" id="mediaSave" disabled>Save image</button>`);
  let ready=null,orig='';const fi=$('#mediaFile'),sv=$('#mediaSave');fi.onchange=e=>{const f=e.target.files[0];if(!f)return;readManagedMedia(f,m,(u,w,h)=>{ready=u;orig=w+' × '+h;sv.disabled=false;toast('Image ready — press Save image');});};
  sv.onclick=async()=>{if(!ready)return;const oldLabel=sv.textContent;sv.disabled=true;sv.textContent='Uploading…';try{const u=await storeImageValue(ready,mediaOverrides()[key]||'');mediaOverrides()[key]=u;save();applyMediaAssets();closeLayer();paint();toast(m.label+' updated — old uploaded file will be removed automatically');}catch(e){sv.disabled=false;sv.textContent=oldLabel;toast(e.message||'Image upload failed',true);}};
  const rr=$('#mediaRestore');if(rr)rr.onclick=()=>{closeLayer();mediaReset(key);};
}
function admMedia(){
  const groups=[...new Set(MEDIA_SPECS.map(x=>x.group))];
  const groupHtml=groups.map(g=>`<section class="media-group"><div class="media-group-head"><div><h3>${esc(g)}</h3><p>These are shared website images. Changing one updates every place that uses the same asset.</p></div></div><div class="media-grid">${MEDIA_SPECS.filter(x=>x.group===g).map(m=>`<article class="media-card ${m.fit==='contain'?'logo':''}"><div class="media-card-img"><img src="${src('img:'+m.key)}" alt="${esc(m.label)}" loading="lazy"></div><div class="media-card-body"><b>${esc(m.label)}</b><small>${esc(m.usage)}</small><span class="media-size">${ic('image',11)} ${m.w} × ${m.h} px</span><div class="media-actions"><button class="btn btn-line btn-sq" data-edit-media="${m.key}">${ic('edit',12)} Replace</button>${mediaOverrides()[m.key]?`<button class="btn btn-danger btn-sq" data-reset-media="${m.key}">Original</button>`:''}</div></div></article>`).join('')}</div></section>`).join('');
  const dyn=[
    ['products','Product photos','1200 × 1200 px','Square product cards + product detail page','box'],
    ['categories','Category photos','1000 × 1000 px','Homepage category circles + category browsing','grid'],
    ['blog','Blog cover photos','1200 × 800 px','Plant Care article cards and article covers','doc'],
    ['reviews','Customer review photos','900 × 900 px','Review gallery / customer photo evidence','star'],
    ['banners','Homepage slider images','979 × 322 px','Exact homepage slider artwork — keep this exact size','image']
  ];
  return adminShell('media',`<div class="media-guide-note"><b>Image size guide:</b> Replace images using the dimensions shown below. Keeping the same dimensions/aspect ratio prevents unwanted cropping, height changes and mobile layout shifts. Homepage slider artwork must stay exactly <b>979 × 322 px</b>.<br><b>Automatic replacement:</b> after a new admin-uploaded image is published, the previous admin-uploaded file is removed from server storage automatically.</div><section class="media-group"><div class="media-group-head"><div><h3>Images managed in their own sections</h3><p>These images belong to individual products/content, so edit them from the linked admin page.</p></div></div><div class="media-dynamic-grid">${dyn.map(x=>`<button class="media-dynamic-card" data-link="#/admin/${x[0]}"><span class="mi">${ic(x[4],16)}</span><b>${x[1]}</b><span class="size">${x[2]}</span><small>${x[3]}</small></button>`).join('')}</div></section>${groupHtml}`,'Media & Image Sizes','Change every shared website image from one place, with the correct replacement dimensions.');
}

/* ---------- admin: products ---------- */
function admProducts(q){
  const term=(new URLSearchParams(q||'')).get('q')||'';
  let list=DB.products;
  if(term)list=list.filter(p=>(p.name+p.sub).toLowerCase().includes(term.toLowerCase()));
  return adminShell('products',`<div class="panel"><div class="scroll-x"><table class="tbl">
   <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
   <tbody>${list.map(p=>`<tr><td>${pic(p,'thumb')}</td>
     <td><b>${esc(p.name)}</b><br><small style="color:var(--muted)">${esc(p.sub||'')}</small></td>
     <td>${esc((cat(p.cat)||{}).name||'—')}</td><td>${money(p.price)}${p.mrp>p.price?`<br><small style="color:var(--muted)"><s>${money(p.mrp)}</s></small>`:''}</td>
     <td>${p.stock<6?`<span class="pill red">${p.stock} left</span>`:p.stock}</td>
     <td><span class="pill ${p.active?'green':'grey'}">${p.active?'Active':'Hidden'}</span></td>
     <td style="white-space:nowrap"><button class="btn btn-sm btn-line btn-sq" data-edit-product="${p.id}">${ic('edit',14)} Edit</button>
       <button class="btn btn-sm btn-line btn-sq" data-toggle-product="${p.id}">${p.active?'Hide':'Show'}</button>
       <button class="btn btn-sm btn-danger btn-sq" data-del-product="${p.id}">${ic('trash',14)}</button></td></tr>`).join('')||
     `<tr><td colspan="7"><div class="empty">No products match that search.</div></td></tr>`}</tbody></table></div></div>`,
   'Products',`${DB.products.length} products · ${DB.products.filter(p=>p.stock<6).length} low on stock`,
   `<button class="btn btn-primary btn-sq" data-edit-product="new">${ic('plus',15)} Add New Product</button>`);
}
function productForm(id){
  const p=id==='new'?{id:'',name:'',sub:'',cat:DB.categories[0].id,price:'',mrp:'',stock:10,art:'bush',img:'',desc:'',active:true,rating:4.5,reviews:0,badge:'',care:{light:'Bright indirect',water:'Weekly',pet:'Keep away from pets'}}:prod(id);
  if(!p)return;
  openModal(id==='new'?'Add new product':'Edit product',`<form id="pForm" novalidate>
    <div class="field"><label>Product name</label><input class="inp" name="name" data-v="name" data-label="Product name" value="${esc(p.name)}"></div>
    <div class="row2"><div class="field"><label>Short line</label><input class="inp" name="sub" value="${esc(p.sub||'')}" placeholder="Air purifying"></div>
      <div class="field"><label>Category</label><select class="inp" name="cat">${DB.categories.map(c=>`<option value="${c.id}" ${p.cat===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></div></div>
    <div class="row2"><div class="field"><label>Selling price (₹)</label><input class="inp" type="number" name="price" data-v="price" data-label="Price" min="1" value="${p.price}"></div>
      <div class="field"><label>MRP (₹)</label><input class="inp" type="number" name="mrp" min="0" value="${p.mrp||''}"></div></div>
    <div class="row2"><div class="field"><label>Stock</label><input class="inp" type="number" name="stock" data-v="num" data-label="Stock" min="0" value="${p.stock}"></div>
      <div class="field"><label>Badge</label><input class="inp" name="badge" value="${esc(p.badge||'')}" placeholder="Bestseller / New"></div></div>
    <div class="field"><label>Description</label><textarea class="inp" name="desc" data-v="text" data-label="Description">${esc(p.desc||'')}</textarea></div>
    <div class="row2"><div class="field"><label>Light</label><input class="inp" name="light" value="${esc(p.care.light)}"></div>
      <div class="field"><label>Water</label><input class="inp" name="water" value="${esc(p.care.water)}"></div></div>
    <div class="field"><label>Pet note</label><input class="inp" name="pet" value="${esc(p.care.pet)}"></div>
    <div class="field"><label>Photo</label>
      <div style="display:flex;gap:10px;align-items:center">${pic(p,'thumb')}
        <input class="inp" type="file" accept="image/*" id="pFile"></div>
      <small class="img-size-hint">Recommended product photo: <b>1200 × 1200 px</b> (1:1 square). Upload your own photo, or leave it to keep the current one.</small></div>
    <label style="display:flex;gap:8px;align-items:center;font-size:13.5px"><input type="checkbox" name="active" ${p.active?'checked':''}> Show on website</label>
    <input type="hidden" name="id" value="${esc(p.id)}"></form>`,
    `<button class="btn btn-line btn-sq" data-close="1">Cancel</button><button class="btn btn-primary btn-sq" id="pSave">${id==='new'?'Add product':'Save changes'}</button>`);
  let newImg=null;
  $('#pFile').onchange=e=>{const f=e.target.files[0]; if(!f)return; readImage(f,u=>{newImg=u;toast('Photo ready — press save');});};
  $('#pSave').onclick=async()=>{
    const f=$('#pForm'); if(!validateForm(f))return;
    const btn=$('#pSave'),label=btn.textContent,d=Object.fromEntries(new FormData(f).entries());btn.disabled=true;btn.textContent=newImg?'Uploading…':'Saving…';
    try{const img=newImg?await storeImageValue(newImg,p.img||''):(p.img||'');
    const obj={id:d.id||uid('p'),name:d.name,sub:d.sub,cat:d.cat,price:+d.price,mrp:+d.mrp||+d.price,stock:+d.stock,
      badge:d.badge,desc:d.desc,active:!!d.active,art:p.art||'bush',img,
      rating:p.rating||4.5,reviews:p.reviews||0,care:{light:d.light,water:d.water,pet:d.pet}};
    if(d.id){Object.assign(prod(d.id),obj);} else DB.products.unshift(obj);
    save(); closeLayer(); paint(); toast(d.id?'Product updated':'Product added');}
    catch(e){btn.disabled=false;btn.textContent=label;toast(e.message||'Photo upload failed',true);}
  };
}
/* ---------- categories ---------- */
function admCategories(){
  return adminShell('categories',`<div class="mgrid">${DB.categories.map(c=>`<div class="mtile">
    <span class="ph" style="aspect-ratio:1">${pic(c)}</span><span class="bd"><b>${esc(c.name)}</b>
    <small>${DB.products.filter(p=>p.cat===c.id).length} products</small>
    <span style="display:flex;gap:6px;margin-top:8px"><button class="btn btn-sm btn-line btn-sq" data-edit-cat="${c.id}">Edit</button>
    <button class="btn btn-sm btn-danger btn-sq" data-del-cat="${c.id}">${ic('trash',13)}</button></span></span></div>`).join('')}</div>`,
   'Categories','Group your plants the way customers shop.',
   `<button class="btn btn-primary btn-sq" data-edit-cat="new">${ic('plus',15)} Add Category</button>`);
}
function catForm(id){
  const c=id==='new'?{id:'',name:'',slug:'',desc:'',art:'bush',img:''}:cat(id); if(!c)return;
  openModal(id==='new'?'Add category':'Edit category',`<form id="cForm" novalidate>
    <div class="field"><label>Name</label><input class="inp" name="name" data-v="name" data-label="Category name" value="${esc(c.name)}"></div>
    <div class="field"><label>Short description</label><input class="inp" name="desc" value="${esc(c.desc||'')}"></div>
    <div class="field"><label>Photo</label><div style="display:flex;gap:10px;align-items:center">${pic(c,'thumb')}
      <input class="inp" type="file" accept="image/*" id="cFile"></div><small class="img-size-hint">Recommended category image: <b>1000 × 1000 px</b> (1:1 square).</small></div>
    <input type="hidden" name="id" value="${esc(c.id)}"></form>`,
    `<button class="btn btn-line btn-sq" data-close="1">Cancel</button><button class="btn btn-primary btn-sq" id="cSave">Save</button>`);
  let ni=null; $('#cFile').onchange=e=>{const f=e.target.files[0];if(!f)return;readImage(f,u=>{ni=u;toast('Photo ready — press save');});};
  $('#cSave').onclick=async()=>{const f=$('#cForm'); if(!validateForm(f))return;
    const btn=$('#cSave'),label=btn.textContent,d=Object.fromEntries(new FormData(f).entries());btn.disabled=true;btn.textContent=ni?'Uploading…':'Saving…';
    try{const img=ni?await storeImageValue(ni,c.img||''):(c.img||'');
    const obj={id:d.id||uid('c'),name:d.name,desc:d.desc,slug:d.name.toLowerCase().replace(/\W+/g,'-'),art:c.art||'bush',img};
    if(d.id)Object.assign(cat(d.id),obj); else DB.categories.push(obj);
    save();closeLayer();paint();toast('Category saved');}
    catch(e){btn.disabled=false;btn.textContent=label;toast(e.message||'Photo upload failed',true);}};
}
/* ---------- orders ---------- */
function admOrders(q){
  const f=(new URLSearchParams(q||'')).get('status')||'All';
  const tabs=['All','Processing','Packed','Shipped','Out for delivery','Delivered','Cancelled'];
  const list=f==='All'?DB.orders:DB.orders.filter(o=>o.status===f);
  const count=st=>DB.orders.filter(o=>o.status===st).length;
  return adminShell('orders',`
   <div class="ops-stats"><div class="ops-stat warn"><span class="oi">${ic('clock',16)}</span><span><small>Processing</small><b>${count('Processing')}</b></span></div><div class="ops-stat"><span class="oi">${ic('box',16)}</span><span><small>Packed</small><b>${count('Packed')}</b></span></div><div class="ops-stat blue"><span class="oi">${ic('truck',16)}</span><span><small>In transit</small><b>${count('Shipped')+count('Out for delivery')}</b></span></div><div class="ops-stat"><span class="oi">${ic('check',16)}</span><span><small>Delivered</small><b>${count('Delivered')}</b></span></div><div class="ops-stat red"><span class="oi">${ic('x',16)}</span><span><small>Cancelled</small><b>${count('Cancelled')}</b></span></div></div>
   <div class="ops-filterbar"><div class="ops-tabs">${tabs.map(t=>`<button class="tab ${f===t?'on':''}" data-link="#/admin/orders?status=${encodeURIComponent(t)}">${t} (${t==='All'?DB.orders.length:count(t)})</button>`).join('')}</div></div>
   <div class="panel"><div class="scroll-x"><table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Delivery</th><th>Status</th><th>Actions</th></tr></thead><tbody>
    ${list.map(o=>`<tr><td><span class="order-id">#${esc(o.id)}</span><br><small style="color:var(--adm-muted)">${esc(o.date)} · ${esc(o.pay)}</small></td><td class="order-customer"><b>${esc(o.name)}</b><small>${esc(o.phone)} · ${esc(o.email)}</small></td><td>${(o.items||[]).reduce((n,i)=>n+(+i.qty||0),0)}</td><td><b>${money(o.total)}</b></td><td class="order-ship">${o.courier?`<b>${esc(o.courier)}</b><small>${esc(o.awb||'Tracking pending')}</small>`:'<span style="color:var(--adm-muted)">Not assigned</span>'}</td><td><span class="order-status ${orderStatusClass(o.status)}">${esc(o.status)}</span></td><td><div class="order-actions"><button class="btn btn-sm btn-line btn-sq" data-view-order="${o.id}">${ic('eye',13)} View</button><button class="btn btn-sm btn-primary btn-sq" data-fulfill-order="${o.id}">${ic('edit',13)} Update</button></div></td></tr>`).join('')||`<tr><td colspan="7"><div class="empty">No orders in this view.</div></td></tr>`}</tbody></table></div></div>`,
   'Orders',`${DB.orders.length} total orders · ${count('Processing')+count('Packed')} need fulfilment`,
   `<button class="btn btn-line btn-sq" data-act="exportOrders">${ic('doc',15)} Export CSV</button>`);
}
function orderView(id){
  const o=DB.orders.find(x=>x.id===id);if(!o)return;
  openModal('Order #'+o.id,`<div class="order-detail-head"><div><span class="order-status ${orderStatusClass(o.status)}">${esc(o.status)}</span><div class="order-detail-meta"><span>${esc(o.date)}</span><span>•</span><span>${esc(o.pay)}</span><span>•</span><span>${money(o.total)}</span></div></div>${o.returnStatus?`<span class="return-status ${orderStatusClass(o.returnStatus)}">Return: ${esc(o.returnStatus)}</span>`:''}</div>
    ${orderTimeline(o)}<div class="order-detail-grid"><div class="order-detail-box"><h4>Customer</h4><p><b>${esc(o.name)}</b><br>${esc(o.phone)}<br>${esc(o.email)}</p></div><div class="order-detail-box"><h4>Delivery address</h4><p>${esc(o.address)}</p></div><div class="order-detail-box"><h4>Shipment</h4><p>${o.courier?`<b>${esc(o.courier)}</b><br>`:''}${o.awb?`AWB: ${esc(o.awb)}<br>`:''}${o.trackingUrl?`<a class="auth-link" href="${esc(o.trackingUrl)}" target="_blank" rel="noopener">Open tracking ↗</a>`:'Tracking not added yet'}</p></div><div class="order-detail-box"><h4>Admin note</h4><p>${esc(o.adminNote||'No internal note.')}</p></div></div>
    ${(o.items||[]).map(i=>`<div class="crow">${pic(i,'thumb')}<div style="flex:1"><b style="font-size:12.5px">${esc(i.name)}</b><div style="font-size:11px;color:var(--muted)">${money(i.price)} × ${i.qty}</div></div><b>${money(i.price*i.qty)}</b></div>`).join('')}<div class="sumrow total"><span>Order total</span><span>${money(o.total)}</span></div>`,
    `${['Processing','Packed'].includes(o.status)?`<button class="btn btn-danger btn-sq" data-cancel-admin="${o.id}">Cancel</button>`:''}<button class="btn btn-line btn-sq" data-close="1">Close</button><button class="btn btn-primary btn-sq" data-fulfill-order="${o.id}">Update fulfilment</button>`);
}
function fulfillmentModal(id){
  const o=DB.orders.find(x=>x.id===id);if(!o)return;const opts=['Processing','Packed','Shipped','Out for delivery','Delivered','Cancelled'];
  openModal('Update fulfilment — '+o.id,`<form id="fulfillForm"><div class="fulfill-grid"><div class="field"><label>Order status</label><select class="inp" name="status">${opts.map(st=>`<option ${o.status===st?'selected':''}>${st}</option>`).join('')}</select></div><div class="field"><label>Courier</label><input class="inp" name="courier" value="${esc(o.courier||'')}" placeholder="Delhivery, Blue Dart, DTDC..."></div><div class="field"><label>AWB / tracking number</label><input class="inp" name="awb" value="${esc(o.awb||'')}" placeholder="Tracking number"></div><div class="field"><label>Tracking URL</label><input class="inp" type="url" name="trackingUrl" value="${esc(o.trackingUrl||'')}" placeholder="https://..."></div><div class="field full"><label>Internal admin note</label><textarea class="inp" name="adminNote" placeholder="Packing, customer call, courier or delivery note...">${esc(o.adminNote||'')}</textarea></div></div><p class="fulfill-note">Changing to Cancelled releases reserved stock. Shipped or delivered orders should use Returns & Refunds instead of cancellation.</p></form>`,`<button class="btn btn-line btn-sq" data-close="1">Cancel</button><button class="btn btn-primary btn-sq" id="fulfillSave">Save update</button>`);
  $('#fulfillSave').onclick=async()=>{const fd=Object.fromEntries(new FormData($('#fulfillForm')).entries()),btn=$('#fulfillSave'),label=btn.textContent;btn.disabled=true;btn.textContent='Saving…';const ok=await updateOrder(o,fd);btn.disabled=false;btn.textContent=label;if(ok){closeLayer();toast('Order '+o.id+' updated');}};
}
function admReturns(){
  const list=API.returns||[],c=st=>list.filter(r=>r.status===st).length,open=list.filter(r=>['Requested','Under review'].includes(r.status)).length,approved=list.filter(r=>['Approved','Refund approved','Replacement approved'].includes(r.status)).length,resolved=list.filter(r=>['Closed','Rejected'].includes(r.status)).length;
  return adminShell('returns',`<div class="return-stats"><div class="ops-stat warn"><span class="oi">${ic('clock',16)}</span><span><small>Needs review</small><b>${open}</b></span></div><div class="ops-stat blue"><span class="oi">${ic('eye',16)}</span><span><small>Under review</small><b>${c('Under review')}</b></span></div><div class="ops-stat"><span class="oi">${ic('check',16)}</span><span><small>Approved</small><b>${approved}</b></span></div><div class="ops-stat"><span class="oi">${ic('shield',16)}</span><span><small>Closed / rejected</small><b>${resolved}</b></span></div></div>
    <div class="return-card-list">${list.map(r=>`<article class="return-row"><div><b>${esc(r.id)}</b><small>Order ${esc(r.orderId)} · ${esc(r.name)}</small></div><div class="return-reason">${esc(r.reason)}</div><div><small>Preferred</small><b>${esc(r.preferred)}</b></div><div class="return-amount">${money(r.amount||0)}</div><div><span class="return-status ${orderStatusClass(r.status)}">${esc(r.status)}</span><div style="margin-top:7px"><button class="btn btn-sm btn-line btn-sq" data-view-return="${esc(r._key||r.id)}">Review</button></div></div></article>`).join('')||`<div class="panel empty">${ic('back',28)}<h3>No return requests</h3><p>Customer return and refund requests will appear here.</p></div>`}</div>`,
    'Returns & Refunds',`${list.length} requests · ${open} need attention`);
}
function returnView(key){
  const r=(API.returns||[]).find(x=>(x._key||x.id)===key);if(!r)return;
  openModal('Return '+r.id,`<div class="order-detail-head"><div><span class="return-status ${orderStatusClass(r.status)}">${esc(r.status)}</span><div class="order-detail-meta"><span>Order ${esc(r.orderId)}</span><span>•</span><span>${esc(r.date)}</span></div></div><b>${money(r.amount||0)}</b></div><div class="order-detail-grid"><div class="order-detail-box"><h4>Customer</h4><p><b>${esc(r.name)}</b><br>${esc(r.email)}<br>${esc(r.phone||'')}</p></div><div class="order-detail-box"><h4>Request</h4><p><b>${esc(r.preferred)}</b><br>${esc(r.reason)}</p></div></div><div class="order-detail-box"><h4>Customer details</h4><p>${esc(r.details||'')}</p></div><div class="return-items">${(r.items||[]).map(i=>`<div class="return-item"><span>${ic('box',15)}</span><span><b>${esc(i.name)}</b><small>Qty ${i.qty}</small></span><b>${money(i.price*i.qty)}</b></div>`).join('')}</div>${r.adminNote?`<div class="order-detail-box"><h4>Admin note</h4><p>${esc(r.adminNote)}</p></div>`:''}`,
    `<button class="btn btn-line btn-sq" data-close="1">Close</button>${['Requested'].includes(r.status)?`<button class="btn btn-line btn-sq" data-return-status="Under review" data-return-key="${esc(r._key)}">Start review</button>`:''}${!['Refund approved','Replacement approved','Rejected','Closed'].includes(r.status)?`<button class="btn btn-line btn-sq" data-return-status="Replacement approved" data-return-key="${esc(r._key)}">Approve replacement</button><button class="btn btn-primary btn-sq" data-return-status="Refund approved" data-return-key="${esc(r._key)}">Approve refund</button><button class="btn btn-danger btn-sq" data-return-status="Rejected" data-return-key="${esc(r._key)}">Reject</button>`:`<button class="btn btn-primary btn-sq" data-return-status="Closed" data-return-key="${esc(r._key)}">Close request</button>`}`);
}
async function updateReturn(key,status){
  const r=(API.returns||[]).find(x=>x._key===key);if(!r)return;let note='';if(['Rejected','Refund approved','Replacement approved'].includes(status)){note=prompt('Optional note for the customer / internal record:','')||'';}
  if(API.on){const res=await API.call('/api/admin/return/'+encodeURIComponent(key),{method:'PATCH',admin:true,body:{status,adminNote:note}});if(!res.ok){toast(res.error,true);return;}Object.assign(r,res.item||{status,adminNote:note});}
  else{r.status=status;r.adminNote=note;}closeLayer();paint();toast('Return request updated');if(API.on)loadInbox(true);
}
/* ---------- customers / inventory / newsletter / reviews ---------- */
function admCustomers(){
  const visible=DB.customers||[];
  const registered=visible.filter(c=>c.registered || (DB.registeredEmails||[]).includes((c.email||'').toLowerCase()) || (DB.users||[]).some(u=>(u.email||'').toLowerCase()===(c.email||'').toLowerCase())).length;
  const repeat=visible.filter(c=>(+c.orders||0)>1).length;
  const spend=visible.reduce((n,c)=>n+(+c.spent||0),0);
  return adminShell('customers',`
   <div class="customer-summary">
    <div class="admin-mini-stat"><span class="msi">${ic('users',16)}</span><span><small>Customers</small><b>${visible.length}</b></span></div>
    <div class="admin-mini-stat"><span class="msi">${ic('check',16)}</span><span><small>Registered</small><b>${registered}</b></span></div>
    <div class="admin-mini-stat"><span class="msi">${ic('wallet',16)}</span><span><small>Customer value</small><b>${money(spend)}</b></span></div>
   </div>
   <div class="panel"><div class="scroll-x"><table class="tbl">
   <thead><tr><th>Customer</th><th>Contact</th><th>City</th><th>Account</th><th>Orders</th><th>Spent</th><th>Joined</th><th>Actions</th></tr></thead>
   <tbody>${visible.map(c=>{const initials=(c.name||c.email||'C').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase(); const reg=!!c.registered || (DB.registeredEmails||[]).includes((c.email||'').toLowerCase()) || (DB.users||[]).some(u=>(u.email||'').toLowerCase()===(c.email||'').toLowerCase());return `<tr>
     <td><div class="customer-name"><span class="customer-avatar">${esc(initials)}</span><span><b>${esc(c.name||'Customer')}</b><small>${(+c.orders||0)>1?'Returning customer':'Customer'}</small></span></div></td>
     <td>${esc(c.email)}<br><small style="color:var(--muted)">${esc(c.phone||'')}</small></td><td>${esc(c.city)||'—'}</td>
     <td>${reg?'<span class="pill green">Registered</span>':'<span class="pill grey">Guest</span>'}</td><td>${c.orders||0}</td><td><b>${money(c.spent||0)}</b></td><td>${esc(c.joined||'—')}</td>
     <td><div class="customer-actions"><button class="btn btn-sm btn-line btn-sq" data-view-cust="${esc(c.id)}">View</button><button class="btn btn-sm btn-line customer-delete" data-del-cust="${esc(c.id)}" aria-label="Remove customer">${ic('trash',14)}</button></div></td></tr>`}).join('')||'<tr><td colspan="8"><div class="empty">No customers yet.</div></td></tr>'}</tbody></table></div>
   <p style="margin:12px 0 0;color:var(--adm-muted);font-size:10.5px">Removing a customer here removes them from this admin customer list. Their past orders and sign-in account are kept for record and security purposes.</p></div>`,
   'Customers',`${visible.length} customers · ${registered} registered · ${repeat} returning`);
}
function admInventory(){
  const prods=DB.products||[],active=prods.filter(p=>p.active!==false),low=active.filter(p=>+p.stock>0&&+p.stock<6),out=active.filter(p=>+p.stock<1),units=active.reduce((n,p)=>n+(+p.stock||0),0),logs=(API.inventoryLogs||[]).slice(0,12);
  return adminShell('inventory',`<div class="inventory-head"><span class="admin-sync-state ${API.on?'':'local'}">${API.on?'● Live inventory · automatic 15-second sync':'Preview inventory · local browser data'}</span><button class="btn btn-line btn-sq btn-sm" data-act="syncInventory">${ic('arrow',14)} Sync now</button></div>
    <div class="admin-mini-stats"><div class="admin-mini-stat"><span class="msi">${ic('stack',16)}</span><span><small>Available units</small><b>${units.toLocaleString('en-IN')}</b></span></div><div class="admin-mini-stat"><span class="msi">${ic('box',16)}</span><span><small>Active products</small><b>${active.length}</b></span></div><div class="admin-mini-stat"><span class="msi">${ic('bell',16)}</span><span><small>Low stock</small><b>${low.length}</b></span></div><div class="admin-mini-stat"><span class="msi">${ic('x',16)}</span><span><small>Out of stock</small><b>${out.length}</b></span></div></div>
    <div class="panel inventory-table"><div class="card-h"><h3>Live stock</h3><small style="color:var(--adm-muted)">Orders reserve stock automatically. Cancellation restores it automatically.</small></div><div class="scroll-x"><table class="tbl"><thead><tr><th>Product</th><th>Available</th><th>Status</th><th>Last action</th><th></th></tr></thead><tbody>${prods.map(p=>{const c=cat(p.cat)||{},st=+p.stock<1?['Out of stock','out']:+p.stock<6?['Low stock','low']:['In stock',''],lg=logs.find(l=>String(l.productId)===String(p.id));return `<tr><td><div class="inventory-product">${pic(p,'thumb')}<span><b>${esc(p.name)}</b><small>${esc(c.name||'Product')}</small></span></div></td><td><span class="stock-value">${(+p.stock||0).toLocaleString('en-IN')}</span></td><td><span class="stock-status ${st[1]}">${st[0]}</span></td><td>${lg?`<span style="font-size:11px">${esc(lg.reason)}</span><small style="display:block;color:var(--adm-muted)">${esc(lg.date||'')}</small>`:'<span style="color:var(--adm-muted)">—</span>'}</td><td><button class="btn btn-sm btn-line stock-adjust" data-adjust-stock="${p.id}">${ic('edit',13)} Adjust</button></td></tr>`}).join('')}</tbody></table></div></div>
    <div class="panel" style="margin-top:14px"><div class="card-h"><h3>Inventory activity</h3><span class="pill ${API.on?'green':'grey'}">${API.on?'Live log':'Preview'}</span></div>${logs.length?logs.map(l=>`<div class="inv-log"><span><b>${esc(l.date||'')}</b><small>${esc((l.at||'').slice(11,19))}</small></span><span><b>${esc(l.productName||l.productId)}</b><small>${esc(l.ref||'Manual adjustment')}</small></span><span class="delta ${+l.delta>=0?'pos':'neg'}">${+l.delta>=0?'+':''}${+l.delta||0}</span><span>${esc(l.reason||'Stock update')}<small>${esc(l.actor||'system')}</small></span></div>`).join(''):`<div class="empty">Inventory changes will appear here after the updated Worker is deployed.</div>`}</div>`,
    'Inventory','Automatic stock reservation, restock and adjustment history.');
}
function admNewsletter(){
  return adminShell('newsletter',`<div class="two">
   <div class="panel"><div class="card-h"><h3>Subscribers</h3><span class="pill green">${DB.subscribers.length}</span></div>
     <div class="scroll-x"><table class="tbl"><thead><tr><th>Email</th><th>Joined</th><th></th></tr></thead>
     <tbody>${DB.subscribers.map(s=>`<tr><td>${esc(s.email)}</td><td>${esc(s.date)}</td>
       <td><button class="btn btn-sm btn-danger btn-sq" data-del-sub="${s.id}">${ic('trash',13)}</button></td></tr>`).join('')||
       '<tr><td colspan="3"><div class="empty">No one has subscribed yet.</div></td></tr>'}</tbody></table></div>
     <button class="btn btn-line btn-sq btn-block" data-act="exportSubs" style="margin-top:10px">Export emails</button></div>
   <div class="panel"><div class="card-h"><h3>Write a campaign</h3></div>
     <form data-act="campaign"><div class="field"><label>Subject</label><input class="inp" name="subject" required placeholder="New arrivals this week"></div>
     <div class="field"><label>Message</label><textarea class="inp" name="body" required placeholder="Write something short and useful."></textarea></div>
     <button class="btn btn-primary btn-sq">Queue for sending</button></form>
     <p style="font-size:11.5px;color:var(--muted);margin-top:10px">Sending needs an email service connected. For now campaigns are saved as drafts.</p></div></div>`,
   'Newsletter','Your green community list.');
}
function admReviews(){
  return adminShell('reviews',`<div class="panel"><div class="scroll-x"><table class="tbl">
   <thead><tr><th>Customer</th><th>Product</th><th>Rating</th><th>Photo</th><th>Review</th><th>Status</th><th>Actions</th></tr></thead>
   <tbody>${[...(API.on?API.pendingReviews:[]),...DB.reviews].map(r=>`<tr><td><b>${esc(r.name)}</b><br><small style="color:var(--muted)">${esc(r.date)}</small></td>
     <td>${esc(r.product)}</td><td><span class="stars">${stars(r.rating)}</span></td>
     <td>${r.photo?`<img src="${esc(r.photo)}" alt="Review photo" class="thumb" loading="lazy" decoding="async">`:'—'}</td>
     <td style="max-width:280px">${esc(r.text)}</td>
     <td><span class="pill ${r.status==='Published'?'green':'amber'}">${esc(r.status)}</span></td>
     <td style="white-space:nowrap">${r.status==='Published'?`<button class="btn btn-sm btn-line btn-sq" data-hide-review="${r.id}">Unpublish</button>`:
       `<button class="btn btn-sm btn-soft btn-sq" data-pub-review="${r.id}">Publish</button>`}
       <button class="btn btn-sm btn-danger btn-sq" data-del-review="${r.id}">${ic('trash',13)}</button></td></tr>`).join('')}</tbody></table></div></div>`,
   'Reviews',`${(API.on?API.pendingReviews.length:0)+DB.reviews.filter(r=>r.status==='Pending').length} waiting for your approval.`);
}


/* ---------- banners / offers / blog / pages ---------- */
function admBanners(){
  const slides=homeHeroSlides();
  return adminShell('banners',`<div class="media-guide-note"><b>Homepage slider:</b> Upload any photo — it's auto-cropped to <b>979 × 322 px</b> so the homepage layout stays consistent.<br><b>Replace safely:</b> saving a new slide updates the live website, and the previous admin-uploaded slide file is removed from server storage after publish.</div><div class="mgrid" style="grid-template-columns:repeat(2,minmax(0,1fr))">${slides.map((b,i)=>`<div class="mtile"><span class="ph" style="aspect-ratio:979/322;background:#EEF4EF">${`<img src="${src(b.img)}" alt="${esc(b.alt||'Homepage slide')}" style="width:100%;height:100%;object-fit:cover">`}</span><span class="bd"><b>Slide ${i+1}</b><small>979 × 322 px · ${esc(b.link||'#/shop')}</small><span style="display:flex;gap:6px;margin-top:8px"><button class="btn btn-sm btn-line btn-sq" data-edit-banner="${b.id}">${ic('edit',13)} Replace image / link</button></span></span></div>`).join('')}</div>`,'Homepage Slider','These are the exact 4 homepage slides customers see. Replace each one without changing the slider layout.');
}
function readHomeSlide(file,done){
  if(!file||!/^image\//.test(file.type)){toast('Please choose an image file',true);return;}
  const fr=new FileReader();fr.onload=()=>{const img=new Image();img.onload=()=>{const cv=document.createElement('canvas');cv.width=979;cv.height=322;const cx=cv.getContext('2d');cx.fillStyle='#fff';cx.fillRect(0,0,979,322);const sc=Math.max(979/img.width,322/img.height),w=img.width*sc,h=img.height*sc;cx.drawImage(img,(979-w)/2,(322-h)/2,w,h);done(cv.toDataURL('image/webp',0.92));};img.onerror=()=>toast('That image could not be read',true);img.src=fr.result;};fr.readAsDataURL(file);
}
function bannerForm(id){
  const slides=homeHeroSlides(),b=slides.find(x=>x.id===id);if(!b)return;
  openModal('Edit homepage '+id.toUpperCase(),`<form id="bForm" novalidate><div class="field"><label>Current slide</label><div style="border:1px solid var(--line);border-radius:12px;overflow:hidden;background:#EEF4EF;aspect-ratio:979/322"><img src="${src(b.img)}" alt="${esc(b.alt||'Homepage slide')}" style="width:100%;height:100%;object-fit:cover"></div><small class="img-size-hint">Any photo works — it will be auto-cropped to <b>979 × 322 px</b>. For full control over the crop, upload an image already at that exact size.</small></div><div class="field"><label>Slide image</label><input class="inp" type="file" accept="image/*" id="bFile"></div><div class="field"><label>Click destination</label><input class="inp" name="link" value="${esc(b.link||'#/shop')}" placeholder="#/shop"></div><div class="field"><label>Image description (SEO / accessibility)</label><input class="inp" name="alt" value="${esc(b.alt||'')}"></div><input type="hidden" name="id" value="${esc(b.id)}"></form>`, `<button class="btn btn-line btn-sq" data-close="1">Cancel</button><button class="btn btn-primary btn-sq" id="bSave">Save slide</button>`);
  let ni=null;$('#bFile').onchange=e=>{const f=e.target.files[0];if(!f)return;readHomeSlide(f,u=>{ni=u;toast('979 × 322 slide ready — press save');});};
  $('#bSave').onclick=async()=>{const btn=$('#bSave'),label=btn.textContent,f=$('#bForm'),d=Object.fromEntries(new FormData(f).entries());const arr=DB.settings.homeSlides||SEED().settings.homeSlides.map(x=>({...x}));const i=arr.findIndex(x=>x.id===id);const cur=i>=0?arr[i]:{...b};btn.disabled=true;btn.textContent=ni?'Uploading…':'Saving…';try{const img=ni?await storeImageValue(ni,cur.img||b.img):cur.img||b.img;const obj={...cur,id,img,link:d.link||'#/shop',alt:d.alt||b.alt||''};if(i>=0)arr[i]=obj;else arr.push(obj);DB.settings.homeSlides=arr;save();closeLayer();paint();toast('Homepage slide saved — old uploaded file will be removed automatically');}catch(e){btn.disabled=false;btn.textContent=label;toast(e.message||'Slide upload failed',true);}};
}
function admOffers(){
  return adminShell('offers',`<div class="panel"><div class="scroll-x"><table class="tbl">
   <thead><tr><th>Code</th><th>Offer</th><th>Minimum</th><th>Eligibility</th><th>Homepage</th><th>Status</th><th>Actions</th></tr></thead>
   <tbody>${DB.coupons.map(k=>`<tr><td><b>${esc(k.code)}</b></td><td>${k.type==='percent'?k.value+'% off':'Free shipping'}</td>
     <td>${money(k.min)}</td><td>${couponFirstOrderOnly(k)?'<span class="pill blue">First order only</span>':'All eligible customers'}</td>
     <td>${k.homePromo&&k.active?'<span class="pill green">Shown</span>':'—'}</td>
     <td><span class="pill ${k.active?'green':'grey'}">${k.active?'Active':'Inactive'}</span></td>
     <td style="white-space:nowrap"><button class="btn btn-sm btn-line btn-sq" data-edit-coupon="${k.id}">Edit</button>
       <button class="btn btn-sm btn-line btn-sq" data-toggle-coupon="${k.id}">${k.active?'Turn off':'Turn on'}</button>
       <button class="btn btn-sm btn-danger btn-sq" data-del-coupon="${k.id}">${ic('trash',13)}</button></td></tr>`).join('')}</tbody></table></div></div>
   <div class="panel" style="margin-top:12px;background:#F7FAF8"><b style="font-size:13px">Homepage offer control</b><p style="font-size:12.5px;color:var(--muted);margin:5px 0 0">Edit a coupon and turn on <b>Show as homepage offer</b>. Only one coupon is shown at a time in the homepage offer bar and hero badge.</p></div>`,
   'Offers & Coupons','Coupons are manual at checkout. FREESHIP is automatically restricted to one first order per customer.',
   `<button class="btn btn-primary btn-sq" data-edit-coupon="new">${ic('plus',15)} Create New Coupon</button>`);
}
function couponForm(id){
  const k=id==='new'?{id:'',code:'',type:'percent',value:10,min:499,active:true,firstOrderOnly:false,homePromo:false}:DB.coupons.find(x=>x.id===id); if(!k)return;
  openModal(id==='new'?'Create coupon':'Edit coupon',`<form id="kForm" novalidate>
    <div class="field"><label>Code</label><input class="inp" name="code" data-v="code" data-label="Coupon code" style="text-transform:uppercase" value="${esc(k.code)}"></div>
    <div class="row2"><div class="field"><label>Type</label><select class="inp" name="type">
        <option value="percent" ${k.type==='percent'?'selected':''}>Percent off</option>
        <option value="ship" ${k.type==='ship'?'selected':''}>Free shipping</option></select></div>
      <div class="field"><label>Percent</label><input class="inp" type="number" name="value" data-v="num" data-label="Percent" min="0" max="90" value="${k.value}"></div></div>
    <div class="field"><label>Minimum order (₹)</label><input class="inp" type="number" name="min" data-v="num" data-label="Minimum order" min="0" value="${k.min}"></div>
    <div class="coupon-admin-options">
      <label><input type="checkbox" name="firstOrderOnly" ${couponFirstOrderOnly(k)?'checked':''}> <span><b>First order only</b><small>Customer can use this coupon only before their first order.</small></span></label>
      <label><input type="checkbox" name="homePromo" ${k.homePromo?'checked':''}> <span><b>Show as homepage offer</b><small>This becomes the coupon shown in the homepage offer bar and hero badge.</small></span></label>
      <label><input type="checkbox" name="active" ${k.active?'checked':''}> <span><b>Active</b><small>Customers can apply this code at checkout.</small></span></label>
    </div>
    ${String(k.code||'').toUpperCase()==='FREESHIP'?'<p class="auth-note" style="margin:12px 0 0">FREESHIP is permanently protected as a first-order-only coupon. Even if this box is changed in the browser, the Worker validates it again before accepting an order.</p>':''}
    <input type="hidden" name="id" value="${esc(k.id)}"></form>`,
    `<button class="btn btn-line btn-sq" data-close="1">Cancel</button><button class="btn btn-primary btn-sq" id="kSave">Save coupon</button>`);
  $('#kSave').onclick=()=>{const f=$('#kForm'); if(!validateForm(f))return;
    const d=Object.fromEntries(new FormData(f).entries()), code=d.code.toUpperCase();
    const obj={id:d.id||uid('k'),code,type:d.type,value:+d.value,min:+d.min,active:!!d.active,firstOrderOnly:(code==='FREESHIP')||!!d.firstOrderOnly,homePromo:!!d.homePromo};
    if(obj.homePromo)DB.coupons.forEach(x=>x.homePromo=false);
    if(d.id)Object.assign(DB.coupons.find(x=>x.id===d.id),obj); else DB.coupons.push(obj);
    save();closeLayer();paint();toast('Coupon saved');};
}
function admBlog(){
  return adminShell('blog',`<div class="mgrid" style="grid-template-columns:repeat(3,1fr)">${DB.blogs.map(b=>`<div class="mtile">
    <span class="ph">${pic(b)}</span><span class="bd"><b>${esc(b.title)}</b><small>${esc(b.date)} · ${b.active?'Published':'Draft'}</small>
    <small style="margin-top:4px">${esc(b.excerpt)}</small>
    <span style="display:flex;gap:6px;margin-top:8px"><button class="btn btn-sm btn-line btn-sq" data-edit-blog="${b.id}">Edit</button>
    <button class="btn btn-sm btn-danger btn-sq" data-del-blog="${b.id}">${ic('trash',13)}</button></span></span></div>`).join('')}</div>`,
   'Blog / Content','Plant care posts that bring people back.',
   `<button class="btn btn-primary btn-sq" data-edit-blog="new">${ic('plus',15)} Write New Post</button>`);
}
function blogForm(id){
  const b=id==='new'?{id:'',title:'',excerpt:'',body:'',date:today(),active:true,art:'bush',img:''}:DB.blogs.find(x=>x.id===id); if(!b)return;
  openModal(id==='new'?'New post':'Edit post',`<form id="gForm" novalidate>
    <div class="field"><label>Title</label><input class="inp" name="title" data-v="text" data-label="Title" value="${esc(b.title)}"></div>
    <div class="field"><label>One-line summary</label><input class="inp" name="excerpt" value="${esc(b.excerpt)}"></div>
    <div class="field"><label>Body</label><textarea class="inp" name="body" data-v="msg" data-label="Body" style="min-height:140px">${esc(b.body)}</textarea></div>
    <div class="field"><label>Cover photo</label><div style="display:flex;gap:10px;align-items:center">${pic(b,'thumb')}
      <input class="inp" type="file" accept="image/*" id="gFile"></div><small class="img-size-hint">Recommended blog cover: <b>1200 × 800 px</b> (3:2 landscape).</small></div>
    <label style="display:flex;gap:8px;align-items:center;font-size:13.5px"><input type="checkbox" name="active" ${b.active?'checked':''}> Published</label>
    <input type="hidden" name="id" value="${esc(b.id)}"></form>`,
    `<button class="btn btn-line btn-sq" data-close="1">Cancel</button><button class="btn btn-primary btn-sq" id="gSave">Save post</button>`);
  let ni=null; $('#gFile').onchange=e=>{const f=e.target.files[0];if(!f)return;readImage(f,u=>{ni=u;toast('Photo ready — press save');});};
  $('#gSave').onclick=async()=>{const f=$('#gForm'); if(!validateForm(f))return;
    const btn=$('#gSave'),label=btn.textContent,d=Object.fromEntries(new FormData(f).entries());btn.disabled=true;btn.textContent=ni?'Uploading…':'Saving…';
    try{const img=ni?await storeImageValue(ni,b.img||''):(b.img||'');
    const obj={id:d.id||uid('g'),title:d.title,excerpt:d.excerpt,body:d.body,active:!!d.active,date:b.date||today(),art:b.art||'bush',img};
    if(d.id)Object.assign(DB.blogs.find(x=>x.id===d.id),obj); else DB.blogs.unshift(obj);
    save();closeLayer();paint();toast('Post saved');}
    catch(e){btn.disabled=false;btn.textContent=label;toast(e.message||'Cover upload failed',true);}};
}
function admPages(){
  return adminShell('pages',`<div class="panel"><div class="scroll-x"><table class="tbl">
   <thead><tr><th>Page</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead>
   <tbody>${DB.pages.map(p=>`<tr><td><b>${esc(p.title)}</b></td><td><code style="font-size:12px">#/page/${esc(p.slug)}</code></td>
     <td><span class="pill ${p.active?'green':'grey'}">${p.active?'Live':'Hidden'}</span></td>
     <td style="white-space:nowrap"><button class="btn btn-sm btn-line btn-sq" data-edit-page="${p.id}">Edit</button>
       <button class="btn btn-sm btn-line btn-sq" data-link="#/page/${esc(p.slug)}">${ic('eye',13)} View</button>
       <button class="btn btn-sm btn-danger btn-sq" data-del-page="${p.id}">${ic('trash',13)}</button></td></tr>`).join('')}</tbody></table></div></div>`,
   'Pages','About, Our Story, Contact, FAQ and policies.',
   `<button class="btn btn-primary btn-sq" data-edit-page="new">${ic('plus',15)} Add Page</button>`);
}
function pageForm(id){
  const p=id==='new'?{id:'',title:'',slug:'',body:'',active:true}:DB.pages.find(x=>x.id===id); if(!p)return;
  openModal(id==='new'?'Add page':'Edit page',`<form id="pgForm" novalidate>
    <div class="field"><label>Title</label><input class="inp" name="title" data-v="text" data-label="Title" value="${esc(p.title)}"></div>
    <div class="field"><label>Address</label><input class="inp" name="slug" data-v="slug" data-label="Address" value="${esc(p.slug)}" placeholder="about"></div>
    <div class="field"><label>Content</label><textarea class="inp" name="body" data-v="msg" data-label="Content" style="min-height:180px">${esc(p.body)}</textarea></div>
    <label style="display:flex;gap:8px;align-items:center;font-size:13.5px"><input type="checkbox" name="active" ${p.active?'checked':''}> Live on website</label>
    <input type="hidden" name="id" value="${esc(p.id)}"></form>`,
    `<button class="btn btn-line btn-sq" data-close="1">Cancel</button><button class="btn btn-primary btn-sq" id="pgSave">Save page</button>`);
  $('#pgSave').onclick=()=>{const f=$('#pgForm'); if(!validateForm(f))return;
    const d=Object.fromEntries(new FormData(f).entries());
    const obj={id:d.id||uid('pg'),title:d.title,slug:(d.slug||d.title).toLowerCase().replace(/\W+/g,'-'),body:d.body,active:!!d.active};
    if(d.id)Object.assign(DB.pages.find(x=>x.id===d.id),obj); else DB.pages.push(obj);
    save();closeLayer();paint();toast('Page saved');};
}
/* ---------- settings / appearance / reports / account ---------- */
function admSettings(){
  const s=DB.settings;
  return adminShell('settings',`<form id="setForm" class="two" novalidate>
   <div class="panel"><div class="card-h"><h3>Site information</h3></div>
     <div class="field"><label>Store name</label><input class="inp" name="store" data-v="text" data-label="Store name" value="${esc(s.store)}"></div>
     <div class="field"><label>Tagline</label><input class="inp" name="tag" value="${esc(s.tag)}"></div>
     <div class="row2"><div class="field"><label>Email</label><input class="inp" name="email" data-v="email" data-label="Email" value="${esc(s.email)}"></div>
       <div class="field"><label>Phone</label><input class="inp" name="phone" data-v="any" data-label="Phone" value="${esc(s.phone)}"></div></div>
     <div class="field"><label>Address</label><input class="inp" name="address" value="${esc(s.address)}"></div>
     <div class="field"><label>GSTIN</label><input class="inp" name="gst" value="${esc(s.gst)}"></div>
     <div class="card-h" style="margin-top:16px"><h3>Social links</h3></div>
     <div class="field"><label>Instagram</label><input class="inp" name="instagram" data-v="url" data-label="Instagram link" value="${esc(s.instagram||'')}" placeholder="https://www.instagram.com/yourpage"></div>
     <div class="field"><label>Facebook</label><input class="inp" name="facebook" data-v="url" data-label="Facebook link" value="${esc(s.facebook||'')}" placeholder="https://www.facebook.com/yourpage"></div>
     <div class="field"><label>YouTube</label><input class="inp" name="youtube" data-v="url" data-label="YouTube link" value="${esc(s.youtube||'')}" placeholder="https://youtube.com/@yourchannel"></div>
     <small class="hint">Leave a box empty to hide that icon in the footer.</small></div>
   <div>
     <div class="panel" style="margin-bottom:14px"><div class="card-h"><h3>Payment & shipping</h3></div>
       <div class="row2"><div class="field"><label>Free delivery above (₹)</label><input class="inp" type="number" name="freeShipAbove" data-v="num" data-label="Free delivery limit" value="${s.freeShipAbove}"></div>
         <div class="field"><label>Delivery fee (₹)</label><input class="inp" type="number" name="shipFee" data-v="num" data-label="Delivery fee" value="${s.shipFee}"></div></div>
       <div class="field"><label>How customers place orders</label>
         <select class="inp" name="orderMode">
           <option value="whatsapp" ${s.orderMode!=='online'?'selected':''}>On WhatsApp (recommended until online payment is connected)</option>
           <option value="online" ${s.orderMode==='online'?'selected':''}>Directly on the website</option></select>
         <small class="hint">With WhatsApp, every order arrives on your number with full details.</small></div>
       <label style="display:flex;gap:8px;align-items:center;font-size:13.5px;padding:4px 0"><input type="checkbox" name="upiEnabled" ${s.upiEnabled?'checked':''}> Accept UPI</label>
       <label style="display:flex;gap:8px;align-items:center;font-size:13.5px;padding:4px 0"><input type="checkbox" name="cardEnabled" ${s.cardEnabled?'checked':''}> Accept cards</label>
       <label style="display:flex;gap:8px;align-items:center;font-size:13.5px;padding:4px 0"><input type="checkbox" name="codEnabled" ${s.codEnabled?'checked':''}> Cash on delivery</label></div>
     <div class="panel"><div class="card-h"><h3>SEO</h3></div>
       <div class="field"><label>Meta title</label><input class="inp" name="metaTitle" value="${esc(s.metaTitle)}"></div>
       <div class="field"><label>Meta description</label><textarea class="inp" name="metaDesc">${esc(s.metaDesc)}</textarea></div>
       <div class="field"><label>Your website address</label><input class="inp" name="domain" data-v="url" data-label="Website address" value="${esc(s.domain||'')}" placeholder="https://greenocean.in"></div>
       <button class="btn btn-line btn-sq" type="button" data-act="sitemap">${ic('doc',15)} Download sitemap.xml</button>
       <small class="hint">Put this file in your website folder and submit it in Google Search Console so your pages get found.</small></div>
     <button class="btn btn-primary btn-sq btn-block btn-lg" style="margin-top:14px">Save settings</button></div></form>`,
   'Website Settings','These details show across the website and on invoices.');
}
function admAppearance(){
  const s=DB.settings,first=homeHeroSlides()[0];
  return adminShell('appearance',`
   <div class="admin-preview-shell"><div class="admin-preview-head"><div><h3>Storefront preview</h3><p>This is the current first homepage slide. The slider artwork already contains its own text and button design.</p></div><a href="https://www.greenocean.co.in/" target="_blank" rel="noopener">Open live store ↗</a></div><div style="border-radius:14px;overflow:hidden;border:1px solid #E0E7E2;background:#EEF4EF;aspect-ratio:979/322"><img src="${src(first.img)}" alt="Homepage first slide" style="width:100%;height:100%;object-fit:cover"></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><a class="btn btn-primary btn-sq" href="#/admin/banners">${ic('image',15)} Edit 4 homepage slides</a><a class="btn btn-line btn-sq" href="#/admin/media">${ic('grid',15)} Media & image sizes</a></div></div>
   <div class="two">
   <div><div class="panel" style="margin-bottom:14px"><div class="card-h"><h3>Homepage slider artwork</h3></div><p style="font-size:13px;color:var(--muted);margin:0 0 10px">The homepage uses four complete banner images. Replace each banner in <b>Homepage Slider</b> using exactly <b>979 × 322 px</b>. Text shown inside those banners is part of the image itself.</p><a class="btn btn-line btn-sq" href="#/admin/banners">Open Homepage Slider</a></div><div class="panel"><div class="card-h"><h3>Website images</h3></div><p style="font-size:13px;color:var(--muted);margin:0 0 10px">Replace shared photos, logo, page backgrounds and see the exact recommended dimensions from one place.</p><a class="btn btn-line btn-sq" href="#/admin/media">${ic('image',15)} Open Media & Image Sizes</a></div></div>
   <div>
     <div class="panel" style="margin-bottom:14px"><div class="card-h"><h3>Brand colour</h3></div><div style="display:flex;gap:10px;flex-wrap:wrap">${['#0F4632','#14563C','#1D5E4A','#215C3C','#2F7D5B','#1B4332'].map(c=>`<button type="button" data-brand="${c}" style="width:40px;height:40px;border-radius:9px;background:${c};border:3px solid ${s.theme===c?'#111':'transparent'}" aria-label="Use ${c}"></button>`).join('')}</div><p style="font-size:12px;color:var(--muted);margin:10px 0 0">Changes the header, buttons and footer shade across the website.</p></div>
     <div class="panel"><div class="card-h"><h3>Danger zone</h3></div>${API.on?`<p style="font-size:13px;color:var(--muted);margin:0 0 10px">Throw away changes in this browser and load exactly what customers see on the live website.</p><button class="btn btn-danger btn-sq" type="button" data-act="reset">Reload live website data</button>`:`<p style="font-size:13px;color:var(--muted);margin:0 0 10px">Reset everything back to the demo content. Orders and products you added will be lost.</p><button class="btn btn-danger btn-sq" type="button" data-act="reset">Reset store to demo data</button>`}</div>
     <div class="panel" style="margin-top:14px;border-color:#CFE3D6;background:var(--green-50)"><div class="card-h"><h3>Ready to launch?</h3></div><p style="font-size:13px;color:var(--muted);margin:0 0 10px">Removes the sample orders, customers, accounts, reviews and subscribers, and resets every product's star rating to zero. Your products, photos, homepage slides, coupons, blog and pages stay.</p><p style="font-size:13px;color:var(--muted);margin:0 0 12px">Showing made-up reviews or ratings to real buyers is not allowed under Indian consumer rules, so do this before you start selling.</p><button class="btn btn-primary btn-sq" type="button" data-act="launch">${ic('check',15)} Remove sample data</button></div>
   </div></div>`,
   'Appearance','Brand styling, homepage slider access and media controls.');
}
function admReports(){
  const done=DB.orders.filter(o=>o.status!=='Cancelled');
  const rev=done.reduce((s,o)=>s+o.total,0);
  const byCat=DB.categories.map(c=>({name:c.name,n:DB.products.filter(p=>p.cat===c.id).length}));
  const top=[...DB.products].sort((a,b)=>b.reviews-a.reviews).slice(0,5);
  const maxN=Math.max(1,...byCat.map(c=>c.n));
  return adminShell('reports',`
   <div class="kpis">
     <div class="kpi"><span class="cc" style="background:#E8F1EA;color:#1F7A4D">${ic('chart',19)}</span><span><small>Revenue (this store)</small><b>${money(rev)}</b></span></div>
     <div class="kpi"><span class="cc" style="background:#E4F0FB;color:#2C6FB5">${ic('bag',19)}</span><span><small>Orders</small><b>${DB.orders.length}</b></span></div>
     <div class="kpi"><span class="cc" style="background:#FDF1DE;color:#C88A22">${ic('wallet',19)}</span><span><small>Average order</small><b>${money(done.length?Math.round(rev/done.length):0)}</b></span></div>
     <div class="kpi"><span class="cc" style="background:#F6E9F1;color:#A6457E">${ic('users',19)}</span><span><small>Customers</small><b>${DB.customers.length}</b></span></div></div>
   <div class="two" style="margin-top:16px">
     <div class="panel"><div class="card-h"><h3>Sales — last 12 months</h3></div>${(()=>{const y=dashStats(365);return lineChart(y.series,600,180)+`<div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted);margin-top:6px">${y.labels.map(l=>`<span>${l}</span>`).join('')}</div>`;})()}</div>
     <div class="panel"><div class="card-h"><h3>Products by category</h3></div>
       ${byCat.map(c=>`<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-size:13px">
         <span>${esc(c.name)}</span><b>${c.n}</b></div><div class="bar"><i style="width:${Math.round(c.n/maxN*100)}%"></i></div></div>`).join('')}</div></div>
   <div class="panel" style="margin-top:16px"><div class="card-h"><h3>Most reviewed products</h3></div>
     <div class="scroll-x"><table class="tbl"><thead><tr><th>Product</th><th>Price</th><th>Rating</th><th>Reviews</th><th>Stock</th></tr></thead>
     <tbody>${top.map(p=>`<tr><td style="display:flex;gap:8px;align-items:center">${pic(p,'thumb')} ${esc(p.name)}</td>
       <td>${money(p.price)}</td><td><span class="stars">${stars(p.rating)}</span></td><td>${p.reviews}</td><td>${p.stock}</td></tr>`).join('')}</tbody></table></div></div>`,
   'Reports','Numbers from the orders sitting in this store.',
   `<button class="btn btn-line btn-sq" data-act="exportOrders">${ic('doc',15)} Export orders CSV</button>`);
}
function admAccount(){
  const s=DB.settings;
  if(API.on)return adminShell('account',`<div class="panel" style="max-width:560px">
    <div class="card-h"><h3>Admin password</h3></div>
    <p style="font-size:13.5px;margin:0 0 10px">On the live website, the admin password is kept safely on the server — not in this page — so nobody can read it.</p>
    <p style="font-size:13.5px;margin:0 0 6px"><b>To change it:</b> Cloudflare → Workers & Pages → greenocean → Settings → Variables and Secrets → <b>ADMIN_PASSWORD</b> → Edit.</p>
    <p style="font-size:13px;color:var(--muted);margin:0">After changing it, sign in here again with the new password.</p></div>`,'Settings','Who can get into this panel.');
  return adminShell('account',`<form id="accForm" class="panel" style="max-width:520px" novalidate>
    <div class="card-h"><h3>Admin login</h3></div>
    <div class="field"><label>Admin email</label><input class="inp" name="adminEmail" data-v="email" data-label="Admin email" value="${esc(s.adminEmail)}"></div>
    <div class="field"><label>Password</label><input class="inp" name="adminPass" data-v="pass" data-label="Password" value="${esc(s.adminPass)}"></div>
    <p style="font-size:12px;color:var(--muted);margin:0 0 12px">Change these before you share the link with anyone.</p>
    <button class="btn btn-primary btn-sq">Save login</button></form>`,
   'Settings','Who can get into this panel.');
}
