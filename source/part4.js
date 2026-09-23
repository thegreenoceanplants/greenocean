<script>
/* ================= STOREFRONT ================= */
const NAV_MAIN=[['Home','#/','home'],['Plants','#/shop','plants'],['Planters','#/shop?cat=c4','planters'],
  ['Plant Care','#/blog','care'],['FAQ','#/page/faq','faq'],['Contact','#/page/contact','contact']];
function navOn(key){
  const h=location.hash||'#/';
  if(key==='home')return h==='#/'||h==='#'||h==='';
  if(key==='planters')return h.startsWith('#/shop')&&/cat=c4/.test(h);
  if(key==='plants')return (h.startsWith('#/shop')&&!/cat=c4/.test(h))||h.startsWith('#/product');
  if(key==='care')return h.startsWith('#/blog');
  if(key==='faq')return h.startsWith('#/page/faq');
  if(key==='contact')return h.startsWith('#/page/contact');
  return false;
}
function header(active){
  const s=DB.settings;
  const k=DB.coupons.find(x=>x.active&&x.type==='percent');
  const items=`<span>${ic('truck',14)} Free Pan-India Delivery on Orders Above ${money(s.freeShipAbove)}</span>
    <span>${ic('shield',14)} 7-Day Healthy Plant Guarantee</span>
    ${k?`<span>${ic('tag',14)} Use code <b>${esc(k.code)}</b> for ${k.value}% off</span>`:''}
    <span>${ic('leaf',14)} Plants Make Better Days</span>`;
  const dur=window.innerWidth<=760?24:32, delay=-((Date.now()/1000)%dur);
  return `<div class="strip" role="region" aria-label="Offers">
    <div class="strip-track" style="animation-delay:${delay.toFixed(2)}s">
      <div class="strip-set">${items}</div><div class="strip-set" aria-hidden="true">${items}</div></div></div>
  <header class="hdr"><div class="wrap hdr-in">
    <button class="icon-btn burger" data-act="menu" aria-label="Open menu">${ic('menu',22)}</button>
    <a class="logo" href="#/"><img src="${src('img:logo')}" alt="${esc(s.store)}" style="height:34px;width:auto;display:block"></a>
    <nav class="nav" aria-label="Main">${NAV_MAIN.map(n=>`<a href="${n[1]}" class="${navOn(n[2])?'on':''}" ${navOn(n[2])?'aria-current="page"':''}>${n[0]}</a>`).join('')}</nav>
    <form class="search" data-act="search"><span>${ic('search',16)}</span>
      <input name="q" placeholder="Search for plants, planters and more..." aria-label="Search products"></form>
    <div class="icons">
      <button class="icon-btn msearch" data-act="menu" aria-label="Search">${ic('search',20)}</button>
      ${DB.session?`<a class="usermenu" href="#/account">${ic('user',17)}<span>${esc((DB.session.name||'').split(' ')[0])}</span></a>`:
        `<a class="icon-btn" href="#/login" aria-label="Sign in">${ic('user',20)}</a>`}
      <a class="icon-btn" href="#/wishlist" aria-label="Wishlist">${ic('heart',20)}${DB.wish.length?`<span class="dot">${DB.wish.length}</span>`:''}</a>
      <button class="icon-btn" data-act="cart" aria-label="Basket">${ic('cart',20)}${cartCount()?`<span class="dot">${cartCount()}</span>`:''}</button>
    </div></div></header>`;
}
function footer(){
  const s=DB.settings;
  return `<footer class="ft"><div class="wrap">
   <div class="ft-in">
    <div><div class="logo"><img src="${src('img:logo')}" alt="${esc(s.store)}" style="height:30px;width:auto;display:block"></div>
      <p style="font-size:12.5px;opacity:.8;max-width:30ch;margin:8px 0 0">${esc(s.tag)}. Grown at our nursery in ${esc(s.address)}.</p>
      <div class="soc">
        ${s.instagram?`<a href="${esc(s.instagram)}" target="_blank" rel="noopener" aria-label="Green Ocean on Instagram">${ic('instagram',16)}</a>`:''}
        ${s.facebook?`<a href="${esc(s.facebook)}" target="_blank" rel="noopener" aria-label="Green Ocean on Facebook">${ic('facebook',16)}</a>`:''}
        ${s.youtube?`<a href="${esc(s.youtube)}" target="_blank" rel="noopener" aria-label="Green Ocean on YouTube">${ic('youtube',16)}</a>`:''}
      </div></div>
    <div><h4>Shop</h4>${DB.categories.map(c=>`<a href="#/shop?cat=${c.id}">${esc(c.name)}</a>`).join('')}</div>
    <div><h4>Company</h4><a href="#/page/story">Our Story</a><a href="#/blog">Plant Care Blog</a><a href="#/page/contact">Contact</a><a href="#/page/faq">FAQ</a><a href="#/page/privacy">Privacy Policy</a><a href="#/page/terms">Terms & Conditions</a></div>
    <div><h4>Support</h4><a href="#/orders">Track Order</a><a href="#/sitemap">Site Map</a><a href="#/page/shipping">Shipping Policy</a><a href="#/page/returns">Returns & Refunds</a><a href="#/page/contact">Help Centre</a></div>
    <div><h4>Talk to us</h4><a href="mailto:${esc(s.email)}">${esc(s.email)}</a>
      <a href="tel:${esc(s.phone.replace(/[^0-9+]/g,''))}">${esc(s.phone)}</a>
      <a href="https://wa.me/${esc(s.phone.replace(/[^0-9]/g,''))}" target="_blank" rel="noopener">WhatsApp us</a>
      <div style="margin-top:10px"><a class="admin-link" href="#/admin">${ic('gear',16)} Admin Panel</a></div></div>
   </div>
   <div class="ft-bot"><span>© 2026 ${esc(s.store)}. All rights reserved.</span>
     <span><a href="#/page/privacy" style="display:inline">Privacy Policy</a> · <a href="#/page/terms" style="display:inline">Terms & Conditions</a> · <a href="#/page/shipping" style="display:inline">Shipping Policy</a> · <a href="#/sitemap" style="display:inline">Site Map</a></span></div>
  </div></footer>`;
}
function card(p){
  const w=DB.wish.includes(p.id), d=discount(p);
  return `<article class="card"><a class="ph" href="#/product/${p.id}">
    ${p.badge?`<span class="tag ${/OFF|%/.test(p.badge)?'off':''}">${esc(p.badge)}</span>`:''}
    ${p.stock<1?'<span class="tag out" style="left:auto;right:8px;top:auto;bottom:8px">Out of stock</span>':''}
    ${pic(p)}</a>
    <button class="wish ${w?'on':''}" data-wish="${p.id}" aria-label="Save ${esc(p.name)}">${ic('heart',16)}</button>
    <div class="bd">
      <h3><a href="#/product/${p.id}">${esc(p.name)}</a></h3>
      <span class="sub">${esc(p.sub||'')}</span>
      <div class="price"><b>${money(p.price)}</b>${p.mrp>p.price?`<s>${money(p.mrp)}</s>`:''}</div>
      ${p.reviews>0?`<div class="stars">${stars(p.rating)} <span>${p.rating} (${p.reviews>999?(p.reviews/1000).toFixed(1)+'K':p.reviews})</span></div>`:
        `<div class="stars"><span>New · no reviews yet</span></div>`}
      ${p.stock<1?`<button class="btn btn-line btn-sq btn-sm btn-block" disabled>Out of stock</button>`:
        `<button class="btn btn-primary btn-sq btn-sm btn-block" data-add="${p.id}">Add to Basket</button>`}
    </div></article>`;
}
const TRUST=[['heart','Healthy Plants','7-Day Guarantee'],['truck','Pan-India Delivery','Safe & Secure'],
  ['home','Direct from Nursery','Balihari, Dhanbad'],['users','Trusted by','10,000+ Plant Lovers']];

function viewHome(){
  const s=DB.settings, live=DB.products.filter(p=>p.active);
  const best=live.slice(0,5), hero=DB.banners.find(b=>b.active)||DB.banners[0];
  const spaces=[['Living Room','sp_living'],['Bedroom','sp_bedroom'],['Workspace','sp_workspace'],['Balcony','sp_balcony'],['Outdoor Garden','sp_outdoor']];
  const revs=DB.reviews.filter(r=>r.status==='Published').slice(0,3);
  return header('home')+`
  <section class="hero"><div class="wrap hero-in">
    <div><p class="eyebrow">${esc(hero.sub||s.heroKicker)}</p>
      <h1>${esc(hero.title||s.heroTitle)}</h1>
      <p>${esc(s.heroSub)}</p>
      <div class="hero-cta"><a class="btn btn-primary btn-lg" href="${esc(hero.link||'#/shop')}">${esc(hero.cta||'Shop Plants')} ${ic('arrow',16)}</a>
        <a class="btn btn-ghost btn-lg" href="#/shop?cat=c6">Explore Collection</a></div></div>
    <div class="hero-art">${pic({img:hero.img||'img:hero',art:hero.art||'bush',name:hero.title||'Plants at home'})}</div>
  </div></section>

  <div class="trust"><div class="wrap trust-in">${TRUST.map(t=>`<div class="trust-i"><span class="cc">${ic(t[0],17)}</span>
    <span><b>${t[1]}</b><small>${t[2]}</small></span></div>`).join('')}</div></div>

  <section class="sec"><div class="wrap">
    <div class="sec-head"><h2>Shop by Category</h2><a class="link-more" href="#/shop">View all ${ic('arrow',14)}</a></div>
    <div class="cats">${DB.categories.map(c=>`<a class="cat" href="#/shop?cat=${c.id}"><span class="ring">${pic(c)}</span><b>${esc(c.name)}</b></a>`).join('')}</div>
  </div></section>

  <section class="sec" style="padding-top:6px"><div class="wrap">
    <div class="sec-head"><h2>Bestselling Plants</h2><a class="link-more" href="#/shop">View all ${ic('arrow',14)}</a></div>
    <div class="grid">${best.map(card).join('')}</div>
  </div></section>

  <section class="sec" style="padding-top:6px"><div class="wrap"><div class="promos">
    <a class="promo-img" href="#/shop?cat=c4" aria-label="Explore planters">${pic({img:'img:ban_planters',art:'planter',name:'Beautiful planters for modern homes'})}</a>
    <a class="promo-img" href="#/shop?cat=c6" aria-label="Shop combos">${pic({img:'img:ban_combos',art:'combo',name:'Plant combos'})}</a>
  </div></div></section>

  <section class="sec" style="padding-top:6px"><div class="wrap"><div class="band">
    <div><h2 style="font-family:var(--serif);font-size:26px;margin:0 0 4px;font-weight:600">Self-Watering Planters</h2>
      <p style="margin:0;color:var(--muted);font-size:14px">Plants that take care of themselves.</p>
      <div class="feats">
        <div class="feat"><span class="cc">${ic('shield',18)}</span><b>Smart Design</b></div>
        <div class="feat"><span class="cc">${ic('drop',18)}</span><b>Less Watering</b><small>Once in 10 days</small></div>
        <div class="feat"><span class="cc">${ic('heart',18)}</span><b>Healthier Plants</b></div>
        <div class="feat"><span class="cc">${ic('clock',18)}</span><b>Busy Lifestyles</b></div></div>
      <a class="btn btn-primary btn-sq" style="margin-top:16px" href="#/shop?cat=c4">Explore Planters ${ic('arrow',14)}</a></div>
    <div style="border-radius:var(--r);overflow:hidden;background:var(--green-50)">${pic({img:'img:selfwater_plant',art:'planter',name:'Self-watering planter'})}</div>
  </div></div></section>

  <section class="sec" style="padding-top:6px"><div class="wrap">
    <div class="sec-head"><div><h2>Plants for Every Space</h2><p>From cosy corners to big balconies.</p></div></div>
    <div class="spaces">${spaces.map(sp=>`<a class="space" href="#/shop"><img src="${src('img:'+sp[1])}" alt="${sp[0]}" loading="lazy"><b>${sp[0]}</b></a>`).join('')}</div>
  </div></section>

  <section class="sec" style="padding-top:6px"><div class="wrap">
    <div class="sec-head"><h2>Why Choose ${esc(s.store)}?</h2></div>
    <div class="trust-in" style="padding:0">${[['heart','Healthy Plants','7-Day Guarantee'],['home','Nursery Fresh','Directly from our farm'],
      ['truck','Pan-India Delivery','Safe & Secure'],['users','Trusted by','10,000+ Plant Lovers']].map(t=>`<div class="trust-i">
      <span class="cc">${ic(t[0],17)}</span><span><b>${t[1]}</b><small>${t[2]}</small></span></div>`).join('')}</div>
  </div></section>

  ${revs.length?`<section class="sec" style="padding-top:6px"><div class="wrap">
    <div class="sec-head"><h2>What Our Customers Say</h2><a class="link-more" href="#/blog">Plant care blog ${ic('arrow',14)}</a></div>
    <div class="tcards">${revs.map(r=>`<div class="tcard"><div class="stars">${stars(r.rating)}</div>
      <p style="margin-top:8px">“${esc(r.text)}”</p>
      <div class="who">${r.av?`<img class="av" style="object-fit:cover" src="${src(r.av)}" alt="">`:`<span class="av">${esc(r.name[0])}</span>`}
      <span><b style="font-size:13px">${esc(r.name)}</b><br><small style="color:var(--muted);font-size:11.5px">${esc(r.product)}</small></span></div></div>`).join('')}</div>
  </div></section>`:''}

  <section class="sec" style="padding-top:6px"><div class="wrap"><div class="news">
    <div><h3>Join Our Green Community</h3><p>Get plant care tips, new arrivals and exclusive offers.</p>
      <form data-act="subscribe" novalidate style="align-items:flex-start"><span class="field" style="flex:1;margin:0"><input class="inp" style="border-radius:var(--r-pill)" name="email" data-v="email" data-label="Email" placeholder="Enter your email address"></span>
      <button class="btn btn-ghost" style="background:#fff;border-color:#fff">Subscribe</button></form></div>
    <div style="text-align:center"><span class="script" style="color:#fff;font-size:30px;display:inline-block">Plants<br>People<br>A Better Tomorrow ♥</span></div>
  </div></div></section>`+footer();
}

/* ---------- Shop ---------- */
function viewShop(q){
  const params=new URLSearchParams(q||'');
  const catId=params.get('cat')||'', term=(params.get('q')||'').toLowerCase(), sort=params.get('sort')||'pop', max=+(params.get('max')||0);
  let list=DB.products.filter(p=>p.active);
  if(catId)list=list.filter(p=>p.cat===catId);
  if(term)list=list.filter(p=>(p.name+' '+p.sub+' '+p.desc).toLowerCase().includes(term));
  if(max)list=list.filter(p=>p.price<=max);
  if(sort==='low')list=[...list].sort((a,b)=>a.price-b.price);
  if(sort==='high')list=[...list].sort((a,b)=>b.price-a.price);
  if(sort==='rating')list=[...list].sort((a,b)=>b.rating-a.rating);
  const c=cat(catId);
  return header(catId==='c4'?'planters':'shop')+`<div class="wrap sec">
    ${backBar('Back to home','#/')}
    <div class="sec-head"><div><h2>${c?esc(c.name):(term?`Results for “${esc(term)}”`:'All Plants & Planters')}</h2>
      <p>${list.length} item${list.length===1?'':'s'}${c?' · '+esc(c.desc):''}</p></div></div>
    <div class="shop">
      <aside class="panel filters">
        <div class="fgroup"><b>Category</b>
          <label><input type="radio" name="cat" value="" ${!catId?'checked':''}> All categories</label>
          ${DB.categories.map(x=>`<label><input type="radio" name="cat" value="${x.id}" ${catId===x.id?'checked':''}> ${esc(x.name)}</label>`).join('')}</div>
        <div class="fgroup"><b>Budget</b>
          ${[['',"Any price"],['299','Under ₹299'],['499','Under ₹499'],['999','Under ₹999']].map(o=>
            `<label><input type="radio" name="max" value="${o[0]}" ${String(max||'')===o[0]?'checked':''}> ${o[1]}</label>`).join('')}</div>
        <div class="fgroup" style="border:0"><b>Sort by</b>
          ${[['pop','Most popular'],['low','Price: low to high'],['high','Price: high to low'],['rating','Top rated']].map(o=>
            `<label><input type="radio" name="sort" value="${o[0]}" ${sort===o[0]?'checked':''}> ${o[1]}</label>`).join('')}</div>
        <button class="btn btn-primary btn-sq btn-block btn-sm" data-act="applyFilter" style="margin-top:12px">Apply filters</button>
        <button class="btn btn-line btn-sq btn-block btn-sm" data-act="clearFilter" style="margin-top:8px">Clear all</button>
      </aside>
      <div>${list.length?`<div class="grid grid-4">${list.map(card).join('')}</div>`:
        `<div class="empty panel">${ic('search',28)}<h3>Nothing matched that</h3><p>Try a different word or clear the filters.</p>
         <button class="btn btn-primary btn-sq" data-act="clearFilter">Clear filters</button></div>`}</div>
    </div></div>`+footer();
}

/* ---------- Product ---------- */
function viewProduct(id){
  const p=prod(id); if(!p)return header()+`<div class="wrap sec empty panel"><h3>That plant has moved</h3><p>It may have been removed.</p><a class="btn btn-primary btn-sq" href="#/shop">Back to shop</a></div>`+footer();
  const w=DB.wish.includes(p.id), related=DB.products.filter(x=>x.cat===p.cat&&x.id!==p.id&&x.active).slice(0,4);
  const revs=DB.reviews.filter(r=>r.product===p.name&&r.status==='Published');
  return header('shop')+`<div class="wrap sec">
   ${backBar('Back to shop','#/shop')}
   <div style="font-size:12.5px;color:var(--muted);margin-bottom:14px"><a href="#/">Home</a> › <a href="#/shop">Shop</a> › <a href="#/shop?cat=${p.cat}">${esc((cat(p.cat)||{}).name||'')}</a> › ${esc(p.name)}</div>
   <div class="pdp">
    <div class="big">${pic(p)}</div>
    <div>
      <div class="stars">${p.reviews>0?`${stars(p.rating)} <span>${p.rating} · ${p.reviews} review${p.reviews===1?'':'s'}</span>`:'<span>New · no reviews yet</span>'}</div>
      <h1>${esc(p.name)}</h1>
      <p style="color:var(--muted);margin:0 0 10px">${esc(p.sub||'')}</p>
      <div class="price" style="font-size:20px"><b style="font-size:26px">${money(p.price)}</b>${p.mrp>p.price?`<s>${money(p.mrp)}</s><span class="pill green">${discount(p)}% off</span>`:''}</div>
      <p style="font-size:11.5px;color:var(--muted);margin:4px 0 0">Inclusive of all taxes${p.price>=DB.settings.freeShipAbove?' · Free delivery':''}</p>
      <p style="margin:14px 0 0;max-width:52ch">${esc(p.desc)}</p>
      <div class="chips">
        <span class="chip">${ic('sun',14)} ${esc(p.care.light)}</span>
        <span class="chip">${ic('drop',14)} ${esc(p.care.water)}</span>
        <span class="chip">${ic('heart',14)} ${esc(p.care.pet)}</span></div>
      <p style="font-size:13px;color:${p.stock>0?'#1F7A4D':'var(--red)'};font-weight:600">${p.stock>0?`In stock · ${p.stock} left`:'Out of stock'}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:12px">
        <button class="btn btn-primary btn-lg" data-add="${p.id}" ${p.stock<1?'disabled':''}>${ic('cart',16)} Add to Basket</button>
        <button class="btn btn-ghost btn-lg" data-buy="${p.id}" ${p.stock<1?'disabled':''}>Buy now</button>
        <button class="btn btn-line btn-lg" data-wish="${p.id}">${ic('heart',16)} ${w?'Saved':'Save'}</button></div>
      <div class="panel" style="margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12.5px">
        <span>${ic('truck',15)} Delivered in 2–6 days</span><span>${ic('shield',15)} 7-day healthy plant guarantee</span>
        <span>${ic('home',15)} Nursery fresh, hardened 2 weeks</span><span>${ic('card',15)} UPI, cards and cash on delivery</span></div>
    </div></div>

   <div class="sec"><div class="sec-head"><h2>Customer reviews</h2>
     <button class="btn btn-line btn-sq btn-sm" data-act="writeReview" data-p="${esc(p.name)}">Write a review</button></div>
     ${revs.length?revs.map(r=>`<div class="panel" style="margin-bottom:10px"><div class="stars">${stars(r.rating)}</div>
       <p style="margin:6px 0">${esc(r.text)}</p><small style="color:var(--muted)">${esc(r.name)} · ${esc(r.date)}</small></div>`).join(''):
       `<div class="panel empty" style="padding:24px">${ic('star',26)}<h3>No reviews yet</h3><p>Be the first to tell others how it arrived.</p></div>`}</div>

   ${related.length?`<div class="sec" style="padding-top:0"><div class="sec-head"><h2>Goes well with</h2></div>
     <div class="grid grid-4">${related.map(card).join('')}</div></div>`:''}
  </div>`+footer();
}
</script>
