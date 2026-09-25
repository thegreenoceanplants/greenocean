/* ---------- back bar ---------- */
function backBar(label,href){
  return `<div style="margin-bottom:14px"><button class="btn btn-line btn-sq btn-sm" data-act="back" data-href="${esc(href||'#/')}">
    ${ic('back',15)} ${esc(label||'Back')}</button></div>`;
}
/* ---------- sitemap ---------- */
function viewSitemap(){
  const s=DB.settings;
  const group=(title,links)=>`<div class="panel" style="margin-bottom:12px">
    <h3 style="font-family:var(--serif);font-size:17px;margin:0 0 8px;font-weight:600">${esc(title)}</h3>
    ${links.map(l=>`<a class="mline" href="${l[1]}">${esc(l[0])}</a>`).join('')}</div>`;
  return header()+`<div class="wrap sec">
    ${backBar('Back','#/')}
    <div class="sec-head"><div><h2>Site Map</h2><p>Every page on ${esc(s.store)}, in one place.</p></div></div>
    <div class="grid grid-3" style="align-items:start">
      <div>
        ${group('Shop',[['All plants & planters','#/shop']].concat(DB.categories.map(c=>[c.name,'#/shop?cat='+c.id])))}
        ${group('Plants',DB.products.filter(p=>p.active).slice(0,8).map(p=>[p.name,'#/product/'+p.id]).concat([['View all products','#/shop']]))}
      </div>
      <div>
        ${group('Your account',[['Sign in','#/login'],['Create an account','#/signup'],['Your account','#/account'],
          ['Your orders','#/orders'],['Wishlist','#/wishlist'],['Basket','#/cart'],['Checkout','#/checkout']])}
        ${group('Plant care blog',DB.blogs.filter(b=>b.active).map(b=>[b.title,'#/blog/'+b.id]).concat([['All articles','#/blog']]))}
      </div>
      <div>
        ${group('Company & policies',DB.pages.filter(p=>p.active).map(p=>[p.title,'#/page/'+p.slug]))}
        ${group('Follow us',[s.instagram?['Instagram',s.instagram]:null,s.facebook?['Facebook',s.facebook]:null,
          s.youtube?['YouTube',s.youtube]:null].filter(Boolean))}
        ${group('Store owner',[['Admin panel','#/admin']])}
      </div>
    </div></div>`+footer();
}
/* ---------- sitemap.xml for a real domain ---------- */
function sitemapXML(domain){
  const base=String(domain||'').trim().replace(/\/+$/,'');
  const paths=['/','/shop','/cart','/wishlist','/login','/signup','/orders','/account','/blog','/sitemap']
    .concat(DB.categories.map(c=>'/shop?cat='+c.id))
    .concat(DB.products.filter(p=>p.active).map(p=>'/product/'+p.id))
    .concat(DB.blogs.filter(b=>b.active).map(b=>'/blog/'+b.id))
    .concat(DB.pages.filter(p=>p.active).map(p=>'/page/'+p.slug));
  const d=today();
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map(u=>`  <url>
    <loc>${base}${u}</loc>
    <lastmod>${d}</lastmod>
    <changefreq>weekly</changefreq>
  </url>`).join('\n')}
</urlset>`;
}


/* ================= STOREFRONT ================= */
const NAV_MAIN=[['Home','#/','home'],['Plants','#/shop','plants'],['Planters','#/shop?cat=c4','planters'],
  ['Plant Care','#/blog','care'],['FAQ','#/page/faq','faq'],['Contact','#/page/contact','contact']];
function navOn(key){
  const h=appPath();
  if(key==='home')return h==='/'||h==='';
  if(key==='planters')return h.startsWith('/shop')&&/cat=c4/.test(h);
  if(key==='plants')return (h.startsWith('/shop')&&!/cat=c4/.test(h))||h.startsWith('/product');
  if(key==='care')return h.startsWith('/blog');
  if(key==='faq')return h.startsWith('/page/faq');
  if(key==='contact')return h.startsWith('/page/contact');
  return false;
}
function header(active){
  const s=DB.settings;
  const items=`<span>${ic('truck',14)} Free Pan-India Delivery on Orders Above ${money(s.freeShipAbove)}</span>
    <span>${ic('shield',14)} 7-Day Healthy Plant Guarantee</span>
    <span>${ic('tag',14)} <b>Use FREESHIP - Free shipping - First order only</b></span>
    <span>${ic('leaf',14)} Plants Make Better Days</span>`;
  const dur=window.innerWidth<=760?24:32, delay=-((Date.now()/1000)%dur);
  return `<div class="strip" role="region" aria-label="Offers">
    <div class="strip-track" style="animation-delay:${delay.toFixed(2)}s">
      <div class="strip-set">${items}</div><div class="strip-set" aria-hidden="true">${items}</div></div></div>
  <header class="hdr"><div class="wrap hdr-in">
    <button class="icon-btn burger" data-act="menu" aria-label="Open menu">${ic('menu',22)}</button>
    <a class="logo" href="#/"><img src="${src('img:logo')}" alt="${esc(s.store)}" style="height:48px;width:auto;display:block;object-fit:contain"></a>
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
    <div><div class="logo"><img src="${src('img:logo')}" alt="${esc(s.store)}" style="height:42px;width:auto;display:block;object-fit:contain"></div>
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
  ['home','Direct from Nursery','Balihari, Dhanbad'],['users','Customer Support','Order & Plant-Care Help']];

function viewHome(){
  const s=DB.settings, live=DB.products.filter(p=>p.active);
  const best=live.slice(0,5), promo=freeShipPromoCoupon()||homePromoCoupon(), slides=homeHeroSlides();
  const spaces=[['Living Room','sp_living'],['Bedroom','sp_bedroom'],['Workspace','sp_workspace'],['Balcony','sp_balcony'],['Outdoor Garden','sp_outdoor']];
  const revs=DB.reviews.filter(r=>r.status==='Published').slice(0,3);
  return header('home')+`
  <section class="hero"><div class="wrap home-slider" data-home-slider data-index="0">
    <div class="home-slider-stage">
      ${slides.map((sl,idx)=>`<article class="home-slide ${idx===0?'is-active':''}" data-act="heroNext" aria-label="Homepage slide ${idx+1}">
        <img class="home-slide-img" src="${src(sl.img)}" alt="${esc(sl.alt)}" ${idx===0?'loading="eager" fetchpriority="high"':'loading="lazy"'} decoding="async">
        <a class="home-slide-cta" href="${sl.link}" aria-label="Open this collection"></a>
      </article>`).join('')}
    </div>
    <div class="home-slider-nav"><div class="home-dots">${slides.map((_,idx)=>`<button class="home-dot ${idx===0?'is-active':''}" data-act="heroDot" data-i="${idx}" aria-label="Go to slide ${idx+1}"></button>`).join('')}</div></div>
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
  const catId=params.get('cat')||'', termRaw=params.get('q')||'', term=termRaw.toLowerCase(), sort=params.get('sort')||'pop', max=+(params.get('max')||0);
  let list=DB.products.filter(p=>p.active);
  if(catId)list=list.filter(p=>p.cat===catId);
  if(term)list=list.filter(p=>(p.name+' '+p.sub+' '+p.desc).toLowerCase().includes(term));
  if(max)list=list.filter(p=>p.price<=max);
  if(sort==='low')list=[...list].sort((a,b)=>a.price-b.price);
  if(sort==='high')list=[...list].sort((a,b)=>b.price-a.price);
  if(sort==='rating')list=[...list].sort((a,b)=>b.rating-a.rating);
  const c=cat(catId);
  const sortMap={pop:'Most popular',low:'Price: Low to High',high:'Price: High to Low',rating:'Top rated'};
  const activeCount=(catId?1:0)+(max?1:0)+(sort!=='pop'?1:0);
  const shopHref=(changes={})=>{
    const p=new URLSearchParams();
    const state={cat:catId,q:termRaw,max:max?String(max):'',sort:sort!=='pop'?sort:''};
    Object.assign(state,changes);
    Object.entries(state).forEach(([k,v])=>{if(v!==''&&v!=null)p.set(k,String(v));});
    const qs=p.toString(); return '#/shop'+(qs?'?'+qs:'');
  };
  const activeChips=[
    catId&&c?`<a class="shop-filter-chip" href="${shopHref({cat:''})}">${esc(c.name)} <span class="x">×</span></a>`:'',
    max?`<a class="shop-filter-chip" href="${shopHref({max:''})}">Under ${money(max)} <span class="x">×</span></a>`:'',
    sort!=='pop'?`<a class="shop-filter-chip" href="${shopHref({sort:''})}">${esc(sortMap[sort]||'Sorted')} <span class="x">×</span></a>`:''
  ].filter(Boolean).join('');
  return header(catId==='c4'?'planters':'shop')+`<div class="wrap sec">
    ${backBar('Back to home','#/')}
    <div class="sec-head"><div><h2>${c?esc(c.name):(term?`Results for “${esc(termRaw)}”`:'All Plants & Planters')}</h2>
      <p>${list.length} item${list.length===1?'':'s'}${c?' · '+esc(c.desc):''}</p></div></div>

    <div class="shop-mobile-tools" aria-label="Shop controls">
      <button type="button" class="shop-tool-btn" data-act="openShopFilter" data-panel="filter">
        <span aria-hidden="true">${ic('stack',18)}</span><span>Filter</span>${activeCount?`<span class="tool-badge">${activeCount}</span>`:''}
      </button>
      <button type="button" class="shop-tool-btn" data-act="openShopFilter" data-panel="sort">
        <span aria-hidden="true" style="font-size:18px;line-height:1">↕</span><span>Sort</span><span class="tool-sub">${esc(sortMap[sort]||'Most popular')}</span>
      </button>
    </div>
    ${activeChips?`<div class="shop-active-chips" aria-label="Applied filters">${activeChips}<button class="shop-filter-chip" data-act="clearFilter" type="button" style="background:#fff;color:#6C7972">Clear all</button></div>`:''}

    <div class="shop">
      <aside class="panel filters" id="shopFilters" data-term="${esc(termRaw)}" aria-label="Product filters">
        <div class="filter-sheet-head">
          <span class="filter-handle" aria-hidden="true"></span>
          <div class="filter-sheet-title"><b>Filter &amp; Sort</b><small>Find the right plants faster</small></div>
          <button type="button" class="filter-close" data-act="closeShopFilter" aria-label="Close filters">${ic('x',18)}</button>
        </div>
        <div class="filter-body">
          <div class="fgroup" data-filter-group="category">
            <div class="filter-group-title"><b>Category</b><span>${DB.categories.length} collections</span></div>
            <div class="filter-options">
              <label class="filter-option"><input type="radio" name="cat" value="" ${!catId?'checked':''}><span class="filter-radio"></span><span>All categories</span></label>
              ${DB.categories.map(x=>`<label class="filter-option"><input type="radio" name="cat" value="${x.id}" ${catId===x.id?'checked':''}><span class="filter-radio"></span><span>${esc(x.name)}</span></label>`).join('')}
            </div>
          </div>
          <div class="fgroup" data-filter-group="budget">
            <div class="filter-group-title"><b>Budget</b><span>Price range</span></div>
            <div class="filter-options">
              ${[['',"Any price"],['299','Under ₹299'],['499','Under ₹499'],['999','Under ₹999']].map(o=>
                `<label class="filter-option"><input type="radio" name="max" value="${o[0]}" ${String(max||'')===o[0]?'checked':''}><span class="filter-radio"></span><span>${o[1]}</span></label>`).join('')}
            </div>
          </div>
          <div class="fgroup" data-filter-group="sort">
            <div class="filter-group-title"><b>Sort by</b><span>Product order</span></div>
            <div class="filter-options">
              ${[['pop','Most popular'],['low','Price: low to high'],['high','Price: high to low'],['rating','Top rated']].map(o=>
                `<label class="filter-option"><input type="radio" name="sort" value="${o[0]}" ${sort===o[0]?'checked':''}><span class="filter-radio"></span><span>${o[1]}</span></label>`).join('')}
            </div>
          </div>
        </div>
        <div class="filter-sheet-actions">
          <button class="btn btn-line btn-sq btn-block" data-act="clearFilter" type="button">Reset</button>
          <button class="btn btn-primary btn-sq btn-block" data-act="applyFilter" type="button"><span id="shopApplyCount">Show ${list.length} product${list.length===1?'':'s'}</span></button>
        </div>
      </aside>
      <button type="button" class="shop-filter-shade" id="shopFilterShade" data-act="closeShopFilter" aria-label="Close filter panel"></button>
      <div class="shop-products">${list.length?`<div class="grid grid-4">${list.map(card).join('')}</div>`:
        `<div class="empty panel">${ic('search',28)}<h3>Nothing matched that</h3><p>Try a different word or clear the filters.</p>
         <button class="btn btn-primary btn-sq" data-act="clearFilter">Clear filters</button></div>`}</div>
    </div></div>`+footer();
}

function shopFilterPreviewCount(){
  const f=document.getElementById('shopFilters'), out=document.getElementById('shopApplyCount');
  if(!f||!out)return;
  const pick=n=>{const el=f.querySelector(`input[name="${n}"]:checked`);return el?el.value:'';};
  const catId=pick('cat'), max=+(pick('max')||0), term=(f.dataset.term||'').toLowerCase();
  let list=DB.products.filter(p=>p.active);
  if(catId)list=list.filter(p=>p.cat===catId);
  if(term)list=list.filter(p=>(p.name+' '+p.sub+' '+p.desc).toLowerCase().includes(term));
  if(max)list=list.filter(p=>p.price<=max);
  out.textContent='Show '+list.length+' product'+(list.length===1?'':'s');
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
    <div class="big">${pic(p,'pdp-main-img','eager')}</div>
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
      <div class="pdp-trust-grid" aria-label="Why shop with Green Ocean">
        <div class="pdp-trust-item"><span class="ti">${ic('shield',16)}</span><span><b>7-Day Healthy Plant Guarantee</b><small>Covered if your plant arrives unhealthy or damaged</small></span></div>
        <div class="pdp-trust-item"><span class="ti">${ic('truck',16)}</span><span><b>Plant-safe Pan-India Delivery</b><small>Typical delivery in 2–6 working days</small></span></div>
        <div class="pdp-trust-item"><span class="ti">${ic('home',16)}</span><span><b>Direct from our Nursery</b><small>Nursery-fresh plants from Balihari, Dhanbad</small></span></div>
        <div class="pdp-trust-item"><span class="ti">${ic('card',16)}</span><span><b>Secure checkout</b><small>UPI, cards and cash on delivery where enabled</small></span></div>
      </div>
    </div></div>

   <div class="sec"><div class="sec-head"><h2>Customer reviews</h2>
     <button class="btn btn-line btn-sq btn-sm" data-act="writeReview" data-p="${esc(p.name)}">Write a review</button></div>
     ${revs.length?`<div class="review-grid">${revs.map(r=>`<article class="review-card">
       <div class="review-card-head"><div class="review-buyer"><span class="review-avatar">${esc(String(r.name||'G').split(/\s+/).map(x=>x[0]||'').join('').slice(0,2).toUpperCase())}</span><span><b>${esc(r.name)}</b><small>Customer review · ${esc(r.date)}</small></span></div><div class="stars">${stars(r.rating)}</div></div>
       ${r.photo?`<img class="review-photo" src="${esc(r.photo)}" alt="Customer photo for ${esc(p.name)}" loading="lazy" decoding="async">`:''}
       <p class="review-copy">${esc(r.text)}</p></article>`).join('')}</div>`:
       `<div class="panel empty" style="padding:24px">${ic('star',26)}<h3>No reviews yet</h3><p>Be the first to tell others how it arrived.</p></div>`}</div>

   ${related.length?`<div class="sec" style="padding-top:0"><div class="sec-head"><h2>Goes well with</h2></div>
     <div class="grid grid-4">${related.map(card).join('')}</div></div>`:''}
  </div>`+footer();
}


/* ---------- Cart drawer ---------- */
function cartLines(){
  if(!DB.cart.length)return `<div class="empty">${ic('cart',30)}<h3>Your basket is empty</h3>
    <p>Pick a plant and it will show up here.</p><a class="btn btn-primary btn-sq" href="#/shop" data-close="1">Browse plants</a></div>`;
  return DB.cart.map(l=>{const p=prod(l.id); if(!p)return'';
    return `<div class="crow">${pic(p,'thumb')}
      <div style="flex:1;min-width:0"><a href="#/product/${p.id}" data-close="1"><b style="font-size:13.5px">${esc(p.name)}</b></a>
        <div style="font-size:12px;color:var(--muted)">${money(p.price)} each</div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:6px">
          <span class="qty"><button data-qty="${p.id}" data-d="-1" aria-label="Less">−</button><span>${l.qty}</span>
          <button data-qty="${p.id}" data-d="1" aria-label="More">+</button></span>
          <button class="btn btn-sm" style="color:var(--red);padding:4px 6px" data-rm="${p.id}">Remove</button></div></div>
      <b style="font-size:14px">${money(p.price*l.qty)}</b></div>`;}).join('');
}
function openCart(){
  const sub=cartSubtotal(), ship=sub>=DB.settings.freeShipAbove||sub===0?0:DB.settings.shipFee;
  openDrawer('Your Basket',cartLines(),DB.cart.length?`
    <div class="sumrow"><span>Subtotal</span><b>${money(sub)}</b></div>
    <div class="sumrow"><span>Delivery</span><b>${ship?money(ship):'Free'}</b></div>
    <div class="sumrow total"><span>Total</span><span>${money(sub+ship)}</span></div>
    <a class="btn btn-primary btn-sq btn-block" href="#/checkout" data-close="1" style="margin-top:10px">Checkout ${ic('arrow',15)}</a>
    <a class="btn btn-line btn-sq btn-block" href="#/cart" data-close="1" style="margin-top:8px">View full basket</a>`:'');
}
function viewCart(){
  const sub=cartSubtotal(), ship=sub>=DB.settings.freeShipAbove||sub===0?0:DB.settings.shipFee;
  return header()+`<div class="wrap sec">${backBar('Keep shopping','#/shop')}<div class="sec-head"><h2>Your Basket</h2><a class="link-more" href="#/shop">Keep shopping</a></div>
    <div class="shop" style="grid-template-columns:1fr 320px">
      <div class="panel">${cartLines()}</div>
      ${DB.cart.length?`<aside class="panel filters"><h3 style="font-family:var(--serif);margin:0 0 10px;font-size:18px">Order summary</h3>
        <div class="sumrow"><span>Subtotal</span><b>${money(sub)}</b></div>
        <div class="sumrow"><span>Delivery</span><b>${ship?money(ship):'Free'}</b></div>
        ${ship?`<p style="font-size:12px;color:var(--muted);margin:4px 0">Add ${money(DB.settings.freeShipAbove-sub)} more for free delivery.</p>`:''}
        <div class="sumrow total"><span>Total</span><span>${money(sub+ship)}</span></div>
        <a class="btn btn-primary btn-sq btn-block" href="#/checkout" style="margin-top:12px">Checkout ${ic('arrow',15)}</a></aside>`:'<div></div>'}
    </div></div>`+footer();
}
function viewWishlist(){
  const items=DB.wish.map(prod).filter(Boolean);
  return header()+`<div class="wrap sec">${backBar('Back to shop','#/shop')}<div class="sec-head"><h2>Wishlist</h2><p>${items.length} saved</p></div>
   ${items.length?`<div class="grid grid-4">${items.map(card).join('')}</div>`:
   `<div class="panel empty">${ic('heart',30)}<h3>Nothing saved yet</h3><p>Tap the heart on any plant to keep it here.</p>
    <a class="btn btn-primary btn-sq" href="#/shop">Find something green</a></div>`}</div>`+footer();
}

/* ---------- Checkout ---------- */
function viewCheckout(){
  if(!DB.session&&DB.cart.length){
    DB.afterLogin='checkout';
    return header()+`<div class="wrap sec"><div class="panel authbox" style="text-align:center">
      <span style="width:52px;height:52px;border-radius:50%;background:var(--green-100);color:var(--green-700);display:grid;place-items:center;margin:0 auto 12px">${ic('lock',24)}</span>
      <h2>Sign in to place your order</h2>
      <p style="color:var(--muted);font-size:13.5px">Your basket is saved. Sign in and you will land straight back here.</p>
      <a class="btn btn-primary btn-sq btn-block btn-lg" href="#/login" style="margin-top:12px">Sign in</a>
      <a class="btn btn-line btn-sq btn-block" href="#/signup" style="margin-top:8px">Create a new account</a>
      <a class="link-more" href="#/cart" style="display:inline-block;margin-top:14px">Back to basket</a></div></div>`+footer();
  }
  if(!DB.cart.length)return header()+`<div class="wrap sec panel empty">${ic('cart',30)}<h3>Your basket is empty</h3>
    <a class="btn btn-primary btn-sq" href="#/shop">Browse plants</a></div>`+footer();
  const u=DB.session||{}, a=checkoutAmounts(), s=DB.settings;
  const itemRows=DB.cart.map(l=>{const p=prod(l.id);return p?`<div class="checkout-item"><span class="checkout-item-img">${pic(p,'thumb')}</span><span class="checkout-item-copy"><b>${esc(p.name)}</b><small>${esc(p.sub||'Nursery fresh')}</small><span>Qty ${l.qty}</span></span><b>${money(p.price*l.qty)}</b></div>`:''}).join('');
  return header()+`<main class="checkout-page"><div class="wrap checkout-flow">
    <div class="checkout-topline"><a href="#/cart" class="checkout-back-link">${ic('back',15)} Back to basket</a><span>${ic('lock',13)} Secure checkout</span></div>
    <div class="checkout-progress" aria-label="Checkout progress">
      ${[['1','Basket','cart'],['2','Address','pin'],['3','Order summary','doc'],['4','Payment','wallet']].map((x,i)=>`<div class="checkout-step ${CO_STEP===i+1?'active':''} ${CO_STEP>i+1?'done':''}" data-co-step="${i+1}"><span class="checkout-step-dot">${CO_STEP>i+1?ic('check',13):x[0]}</span><span><b>${x[1]}</b><small>${i===0?'Review items':i===1?'Delivery details':i===2?'Coupon & total':'Choose payment'}</small></span></div>`).join('')}
    </div>

    <form id="coForm" class="checkout-shell" novalidate>
      <div id="coErr" class="checkout-form-error"></div>
      <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">

      <section class="checkout-panel ${CO_STEP===1?'active':''}" data-co-panel="1">
        <div class="checkout-panel-head"><span class="checkout-panel-icon">${ic('cart',20)}</span><div><p>Step 1 of 4</p><h1>Review your basket</h1><small>Make sure the plants and quantities are right before continuing.</small></div></div>
        <div class="checkout-grid">
          <div class="checkout-card checkout-basket-card">${cartLines()}</div>
          <aside class="checkout-card checkout-side-card">
            <h3>Basket total</h3>
            <div class="checkout-total-line"><span>Subtotal</span><b data-co-subtotal>${money(a.sub)}</b></div>
            <div class="checkout-total-line"><span>Delivery</span><b data-co-delivery>${a.ship?money(a.ship):'Free'}</b></div>
            <div class="checkout-total-line grand"><span>Estimated total</span><b data-co-total>${money(a.total)}</b></div>
            <button type="button" class="btn btn-primary btn-sq btn-block checkout-next" data-act="checkoutNext" data-step="2">Continue to address ${ic('arrow',15)}</button>
            <p class="checkout-microcopy">Coupon codes are entered later in Order Summary and are never auto-applied.</p>
          </aside>
        </div>
      </section>

      <section class="checkout-panel ${CO_STEP===2?'active':''}" data-co-panel="2">
        <div class="checkout-panel-head"><span class="checkout-panel-icon">${ic('pin',20)}</span><div><p>Step 2 of 4</p><h1>Delivery address</h1><small>Tell us where your plants should arrive.</small></div></div>
        <div class="checkout-card checkout-address-card">
          <div class="row2">${authField('Full name','name','text','name',u.name)}${authField('Mobile number','phone','tel','phone',u.phone,'')}</div>
          ${authField('Email','email','email','email',u.email,'')}
          <div class="field"><label>Full address</label><textarea class="inp" name="address" data-v="address" data-label="Address" placeholder="House number, street, area, landmark">${esc(u.address||'')}</textarea></div>
          <div class="row2">${authField('City','city','text','city',u.city)}${authField('Pincode','pin','tel','pin',u.pin,'')}</div>
          <div class="checkout-actions"><button type="button" class="btn btn-line btn-sq" data-act="checkoutBack" data-step="1">${ic('back',14)} Basket</button><button type="button" class="btn btn-primary btn-sq" data-act="checkoutNext" data-step="3">Continue to summary ${ic('arrow',14)}</button></div>
        </div>
      </section>

      <section class="checkout-panel ${CO_STEP===3?'active':''}" data-co-panel="3">
        <div class="checkout-panel-head"><span class="checkout-panel-icon">${ic('doc',20)}</span><div><p>Step 3 of 4</p><h1>Order summary</h1><small>Review your items, delivery charge and optionally apply one coupon.</small></div></div>
        <div class="checkout-grid checkout-summary-grid">
          <div class="checkout-card">
            <div class="checkout-card-title"><div><h3>Your order</h3><p>${cartCount()} item${cartCount()===1?'':'s'} in this basket</p></div><button type="button" class="checkout-text-btn" data-act="checkoutBack" data-step="1">Edit basket</button></div>
            <div class="checkout-items">${itemRows}</div>
            <div class="checkout-coupon-box">
              <div class="checkout-coupon-heading"><span>${ic('tag',17)}</span><div><b>Have a coupon?</b><small>Enter it manually for this checkout.</small></div></div>
              <div class="checkout-coupon-entry"><input class="inp" id="cpn" autocomplete="off" placeholder="Enter coupon code" style="text-transform:uppercase" aria-describedby="cpnMsg"><button type="button" class="btn btn-soft btn-sq" data-act="applyCoupon">Apply</button></div>
              <div id="cpnMsg" class="cpn-msg" role="status"></div><div id="couponAppliedRow" class="checkout-coupon-applied"></div>
              <p class="checkout-coupon-note">For security, coupons are not remembered. If you go back or leave checkout, enter the code again.</p>
            </div>
          </div>
          <aside class="checkout-card checkout-side-card">
            <h3>Price details</h3>
            <div class="checkout-total-line"><span>Subtotal</span><b data-co-subtotal>${money(a.sub)}</b></div>
            <div class="checkout-total-line" id="coDiscountRow" style="display:none"><span>Coupon discount</span><b class="checkout-saving">− ${money(a.off)}</b></div>
            <div class="checkout-total-line"><span>Delivery</span><b data-co-delivery>${a.ship?money(a.ship):'Free'}</b></div>
            <div class="checkout-total-line grand"><span>Order total</span><b data-co-total>${money(a.total)}</b></div>
            <button type="button" class="btn btn-primary btn-sq btn-block checkout-next" data-act="checkoutNext" data-step="4">Continue to payment ${ic('arrow',15)}</button>
          </aside>
        </div>
        <div class="checkout-actions"><button type="button" class="btn btn-line btn-sq" data-act="checkoutBack" data-step="2">${ic('back',14)} Address</button></div>
      </section>

      <section class="checkout-panel ${CO_STEP===4?'active':''}" data-co-panel="4">
        <div class="checkout-panel-head"><span class="checkout-panel-icon">${ic('wallet',20)}</span><div><p>Step 4 of 4</p><h1>Payment</h1><small>Choose your preferred payment method and place the order.</small></div></div>
        <div class="checkout-grid checkout-payment-grid">
          <div class="checkout-card checkout-payment-card">
            <h3>Choose payment method</h3>
            <div class="checkout-payments">
              ${s.upiEnabled?`<label class="checkout-payment-option"><input type="radio" name="pay" value="UPI" checked><span class="pay-icon">${ic('phone',19)}</span><span><b>UPI</b><small>Pay using any supported UPI app</small></span><span class="pay-radio"></span></label>`:''}
              ${s.cardEnabled?`<label class="checkout-payment-option"><input type="radio" name="pay" value="Card"><span class="pay-icon">${ic('card',19)}</span><span><b>Card</b><small>Credit or debit card</small></span><span class="pay-radio"></span></label>`:''}
              ${s.codEnabled?`<label class="checkout-payment-option"><input type="radio" name="pay" value="COD"><span class="pay-icon">${ic('wallet',19)}</span><span><b>Cash on delivery</b><small>Pay when your order arrives</small></span><span class="pay-radio"></span></label>`:''}
            </div>
            <div class="field checkout-gift"><label>Gift note <span>(optional)</span></label><input class="inp" name="note" placeholder="We will write it on the card"></div>
            <div class="checkout-security">${ic('shield',17)} <span>Your order details are protected. Green Ocean never stores card PINs, CVV or UPI PINs.</span></div>
          </div>
          <aside class="checkout-card checkout-side-card checkout-final-card">
            <div class="checkout-card-title"><div><h3>Final total</h3><p>Coupon must have been applied in the previous step.</p></div></div>
            <div class="checkout-total-line"><span>Subtotal</span><b data-co-subtotal>${money(a.sub)}</b></div>
            <div class="checkout-total-line"><span>Delivery</span><b data-co-delivery>${a.ship?money(a.ship):'Free'}</b></div>
            <div class="checkout-total-line grand"><span>To pay</span><b data-co-total>${money(a.total)}</b></div>
            <p class="checkout-terms">By placing this order you agree to our <a href="#/page/terms">Terms & Conditions</a> and <a href="#/page/privacy">Privacy Policy</a>.</p>
            <button class="btn btn-primary btn-lg btn-block" id="coPlaceOrder" type="submit">${s.orderMode==='whatsapp'?`${ic('phone',16)} Send order on WhatsApp · ${money(a.total)}`:`Place order · ${money(a.total)}`}</button>
            ${s.orderMode==='whatsapp'?`<p class="checkout-microcopy">WhatsApp opens with the order prepared for you. Press Send there to finish.</p>`:`<p class="checkout-microcopy">You can review the order once more in your confirmation page.</p>`}
          </aside>
        </div>
        <div class="checkout-actions"><button type="button" class="btn btn-line btn-sq" data-act="checkoutBack" data-step="3">${ic('back',14)} Order summary</button></div>
      </section>
    </form>
  </div></main>`+footer();
}
function waNumber(){ const n=(DB.settings.phone||'').replace(/[^0-9]/g,''); return n.length===10?'91'+n:n; }
function orderWhatsAppLink(o){
  const lines=[`New order from ${location.host||'greenocean.co.in'}`,`Order #${o.id}`,'',
    `Name: ${o.name}`,`Mobile: ${o.phone}`,`Email: ${o.email}`,`Address: ${o.address}`,'','Items:']
    .concat(o.items.map(i=>`• ${i.name} × ${i.qty} = ₹${(i.price*i.qty).toLocaleString('en-IN')}`))
    .concat(['',`Total to pay: ₹${Number(o.total).toLocaleString('en-IN')}`,`Payment preference: ${o.pay}`]);
  if(o.coupon)lines.push(`Coupon used: ${o.coupon}`);
  if(o.note)lines.push(`Gift note: ${o.note}`);
  return 'https://wa.me/'+waNumber()+'?text='+encodeURIComponent(lines.join('\n'));
}
function placeOrder(f,server){
  const d=Object.fromEntries(new FormData(f).entries());
  const sub=cartSubtotal(), s=DB.settings;
  const c=CO_COUPON&&DB.coupons.find(k=>String(k.code||'').toUpperCase()===CO_COUPON&&k.active);
  let off=0, ship=sub>=s.freeShipAbove?0:s.shipFee;
  if(c){ if(c.type==='percent')off=Math.round(sub*c.value/100); if(c.type==='ship')ship=0; }
  const items=DB.cart.map(l=>{const p=prod(l.id);return{id:p.id,name:p.name,price:p.price,qty:l.qty,art:p.art,img:p.img};});
  items.forEach(i=>{const p=prod(i.id); if(p)p.stock=Math.max(0,p.stock-i.qty);});
  const id=server&&server.id?server.id:String(DB.counter++);
  if(server&&server.total!=null){ off=server.discount||0; ship=server.delivery||0; }
  DB.orders.unshift({id,name:d.name,phone:d.phone,email:d.email,address:d.address+', '+d.city+' '+d.pin,
    mailed:!!(server&&server.customerMailed),
    items,total:server&&server.total!=null?server.total:sub-off+ship,pay:d.pay||'COD',status:'Processing',date:today(),note:d.note||'',coupon:c?c.code:'',
    via:DB.settings.orderMode==='whatsapp'?'WhatsApp':'Website'});
  let cust=DB.customers.find(x=>x.email===d.email);
  if(cust){cust.orders++;cust.spent+=sub-off+ship;}
  else DB.customers.unshift({id:uid('u'),name:d.name,email:d.email,phone:d.phone,city:d.city,orders:1,spent:sub-off+ship,joined:today()});
  if(DB.session&&DB.session.id){
    Object.assign(DB.session,{phone:d.phone,address:d.address,city:d.city,pin:d.pin});
    SB.updateProfile({phone:d.phone,address:d.address,city:d.city,pin:d.pin});
  } else DB.session={name:d.name,email:d.email,phone:d.phone,address:d.address,city:d.city,pin:d.pin};
  DB.cart=[]; DB.coupon=''; CO_COUPON=''; CPN_MSG=null; CO_STEP=1; save(); go('#/thanks/'+id); return id;
}
function viewThanks(id){
  const o=DB.orders.find(x=>x.id===id)||DB.orders[0];
  return header()+`<div class="wrap sec"><div class="panel" style="max-width:640px;margin:0 auto;text-align:center;padding:30px">
    <span style="width:60px;height:60px;border-radius:50%;background:var(--green-100);color:var(--green-700);display:grid;place-items:center;margin:0 auto 14px">${ic('check',28)}</span>
    ${o.via==='WhatsApp'?`<h2 style="font-family:var(--serif);margin:0 0 6px">Order ${esc(o.id)} sent on WhatsApp</h2>
    <p style="color:var(--muted);margin:0 0 14px">Please make sure you pressed <b>Send</b> in WhatsApp. We will reply there to confirm stock, payment and delivery date.</p>
    <a class="btn btn-primary btn-sq" href="${orderWhatsAppLink(o)}" target="_blank" rel="noopener" style="margin-bottom:18px">${ic('phone',15)} Open WhatsApp again</a>`:
    `<h2 style="font-family:var(--serif);margin:0 0 6px">Order ${esc(o.id)} is placed</h2>
    <p style="color:var(--muted);margin:0 0 18px">We will pack it fresh and dispatch within 24 hours.${o.mailed?` A confirmation email is on its way to ${esc(o.email)}.`:''}</p>`}
    <div style="text-align:left">${o.items.map(i=>`<div class="sumrow"><span>${esc(i.name)} × ${i.qty}</span><b>${money(i.price*i.qty)}</b></div>`).join('')}
      <div class="sumrow total"><span>Total (${esc(o.pay)})</span><span>${money(o.total)}</span></div>
      <p style="font-size:13px;color:var(--muted);margin-top:10px">${ic('pin',14)} ${esc(o.address)}</p></div>
    <div style="display:flex;gap:10px;justify-content:center;margin-top:18px;flex-wrap:wrap">
      <a class="btn btn-primary btn-sq" href="#/orders">Track this order</a>
      <a class="btn btn-line btn-sq" href="#/shop">Keep shopping</a></div></div></div>`+footer();
}
const ORDER_STAGES=['Processing','Packed','Shipped','Out for delivery','Delivered'];
const STEPS=ORDER_STAGES;
function orderStatusClass(status){return String(status||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function orderTimeline(o){
  if(o.status==='Cancelled')return `<div class="order-timeline"><span class="order-step done">Order received</span><span class="order-step cancelled">Cancelled</span></div>`;
  const at=Math.max(0,ORDER_STAGES.indexOf(o.status));
  return `<div class="order-timeline">${ORDER_STAGES.map((st,i)=>`<span class="order-step ${i<=at?'done':''}">${st}</span>`).join('')}</div>`;
}
async function syncMyOrders(force){
  if(!API.on||!DB.session||API.syncingOrders)return;
  if(!force&&Date.now()-API.ordersAt<10000)return;
  const ids=DB.orders.filter(o=>String(o.email||'').toLowerCase()===String(DB.session.email||'').toLowerCase()).map(o=>o.id).filter(Boolean);
  if(!ids.length)return;
  API.syncingOrders=true;API.ordersAt=Date.now();
  try{
    const r=await API.call('/api/orders/status',{method:'POST',body:{email:DB.session.email,ids}});
    if(r.ok&&Array.isArray(r.orders)){
      let changed=false;
      r.orders.forEach(ro=>{const i=DB.orders.findIndex(o=>o.id===ro.id);if(i>=0){const local=DB.orders[i];DB.orders[i]={...local,...ro};changed=true;}});
      if(changed){save();if(location.pathname.startsWith('/orders')||location.pathname.startsWith('/account'))softRepaint();}
    }
  }finally{API.syncingOrders=false;}
}
function requestReturn(id){
  const o=DB.orders.find(x=>x.id===id);if(!o)return;
  const items=(o.items||[]).map(i=>`<label class="return-item"><input type="checkbox" name="retItem" value="${esc(i.id)}" checked style="width:16px;height:16px"><span><b>${esc(i.name)}</b><small>Ordered qty ${i.qty} · ${money(i.price)} each</small></span><select class="inp" name="qty_${esc(i.id)}" style="width:74px;padding:6px">${Array.from({length:Math.max(1,+i.qty||1)},(_,n)=>`<option value="${n+1}">${n+1}</option>`).join('')}</select></label>`).join('');
  openModal('Return / refund — '+o.id,`<form id="retForm" novalidate><p class="fulfill-note">Green Ocean's 7-day healthy plant guarantee applies to eligible delivered orders. Select the affected item(s) and tell us what happened.</p><div class="return-items">${items}</div>
    <div class="row2"><div class="field"><label>Preferred solution</label><select class="inp" name="preferred"><option>Refund</option><option>Replacement</option></select></div><div class="field"><label>Reason</label><select class="inp" name="reason"><option>Plant arrived damaged or unhealthy</option><option>Wrong item received</option><option>Planter / product damaged</option><option>Missing item</option><option>Other issue</option></select></div></div>
    <div class="field"><label>What happened?</label><textarea class="inp" name="details" data-v="msg" data-label="Details" placeholder="Describe the issue, condition on arrival and anything our team should know."></textarea></div></form>`,
    `<button class="btn btn-line btn-sq" data-close="1">Cancel</button><button class="btn btn-primary btn-sq" id="retSubmit">Submit request</button>`);
  $('#retSubmit').onclick=async()=>{const f=$('#retForm');if(!validateForm(f))return;const fd=new FormData(f),selected=[];f.querySelectorAll('input[name="retItem"]:checked').forEach(ch=>selected.push({id:ch.value,qty:+(f.querySelector('[name="qty_'+CSS.escape(ch.value)+'"]')||{value:1}).value||1}));if(!selected.length){toast('Select at least one item',true);return;}
    const btn=$('#retSubmit'),label=btn.textContent;btn.disabled=true;btn.textContent='Submitting…';
    if(API.on){const r=await API.call('/api/returns',{method:'POST',body:{orderId:o.id,email:DB.session.email,preferred:fd.get('preferred'),reason:fd.get('reason'),details:fd.get('details'),items:selected}});btn.disabled=false;btn.textContent=label;if(!r.ok){toast(r.error,true);return;}o.returnStatus=r.status||'Requested';o.returnRequestId=r.id;save();closeLayer();paint();toast('Return request submitted');}
    else{o.returnStatus='Requested';o.returnRequestId='PREVIEW-'+Date.now();save();closeLayer();paint();toast('Preview return request saved locally');}
  };
}
function viewOrders(){
  if(!DB.session)return header()+`<div class="wrap sec">${backBar('Back','#/')}<div class="panel authbox" style="text-align:center"><h2>Sign in to see your orders</h2><p style="color:var(--muted);font-size:13.5px">Your orders are linked to your account.</p><a class="btn btn-primary btn-sq btn-block" href="#/login" style="margin-top:12px">Sign in</a><a class="btn btn-line btn-sq btn-block" href="#/signup" style="margin-top:8px">Create an account</a></div></div>`+footer();
  const mine=DB.orders.filter(o=>String(o.email||'').toLowerCase()===String(DB.session.email||'').toLowerCase());
  return header()+`<div class="wrap sec">${backBar('Back','#/account')}<div class="sec-head"><div><h2>Your Orders</h2><p>Track fulfilment, delivery and return requests.</p></div><a class="link-more" href="#/shop">Shop again</a></div>
   ${mine.length?mine.map(o=>`<article class="customer-order-card"><div class="customer-order-head"><div><h3>Order #${esc(o.id)}</h3><div class="customer-order-meta">${esc(o.date)} · ${esc(o.pay)} · ${o.items.reduce((n,i)=>n+(+i.qty||0),0)} item(s)</div></div><span class="order-status ${orderStatusClass(o.status)}">${esc(o.status)}</span></div>
      ${orderTimeline(o)}
      ${(o.courier||o.awb)?`<div class="customer-track"><span><b>${esc(o.courier||'Courier shipment')}</b><small>${o.awb?'Tracking / AWB: '+esc(o.awb):'Tracking details will update here.'}</small></span>${o.trackingUrl?`<a class="btn btn-line btn-sq btn-sm" href="${esc(o.trackingUrl)}" target="_blank" rel="noopener">Track shipment ${ic('arrow',12)}</a>`:''}</div>`:''}
      ${o.items.map(i=>`<div class="crow" style="padding:7px 0">${pic(i,'thumb')}<div style="flex:1"><b style="font-size:12.5px">${esc(i.name)}</b><div style="font-size:11px;color:var(--muted)">Qty ${i.qty}</div></div><b>${money(i.price*i.qty)}</b></div>`).join('')}
      ${o.returnStatus?`<div class="return-request-note"><b>Return status:</b> ${esc(o.returnStatus)}${o.returnRequestId?' · '+esc(o.returnRequestId):''}</div>`:''}
      <div style="display:flex;gap:8px;align-items:center;margin-top:12px;flex-wrap:wrap"><b style="margin-right:auto">${money(o.total)}</b>
        ${['Processing','Packed'].includes(o.status)?`<button class="btn btn-danger btn-sq btn-sm" data-cancel="${o.id}">Cancel order</button>`:''}
        ${o.status==='Delivered'&&!o.returnStatus?`<button class="btn btn-line btn-sq btn-sm" data-request-return="${o.id}">${ic('back',13)} Request return / refund</button>`:''}
        <button class="btn btn-line btn-sq btn-sm" data-reorder="${o.id}">Buy again</button></div></article>`).join(''):`<div class="panel empty">${ic('bag',30)}<h3>No orders yet</h3><p>Your orders will appear here after checkout.</p><a class="btn btn-primary btn-sq" href="#/shop">Start shopping</a></div>`}</div>`+footer();
}
function accountHeader(u){
  const initials=(u.name||u.email||'GO').trim().split(/\s+/).map(x=>x[0]||'').join('').slice(0,2).toUpperCase()||'GO';
  return `<header class="account-topbar">
    <a class="account-logo" href="#/" aria-label="Green Ocean home"><img src="${src('img:logo')}" alt="Green Ocean"></a>
    <form class="account-search" data-act="search"><span class="sico">${ic('search',20)}</span><input name="q" placeholder="Search plants, pots, seeds, accessories..." aria-label="Search products"><button aria-label="Search">${ic('search',22)}</button></form>
    <div class="account-actions">
      <a class="account-headicon" href="#/wishlist" aria-label="Wishlist">${ic('heart',27)}</a>
      <button class="account-headicon" type="button" data-act="cart" aria-label="Cart">${ic('cart',28)}${cartCount()?`<span class="dot">${cartCount()}</span>`:''}</button>
      <button class="account-user" type="button" data-act="accountMenu" aria-label="Account menu"><span class="account-avatar">${esc(initials)}</span><span>${esc(u.name||u.email.split('@')[0])}</span><span class="account-user-chev">${ic('arrow',14)}</span></button>
    </div>
  </header>`;
}
function viewAccount(){
  const u=currentUser();
  if(!u)return header()+`<div class="wrap sec"><div class="panel authbox" style="text-align:center">
    <h2>You are signed out</h2><p style="color:var(--muted);font-size:13.5px">Sign in to see your orders and saved address.</p>
    <a class="btn btn-primary btn-sq btn-block" href="#/login" style="margin-top:12px">Sign in</a>
    <a class="btn btn-line btn-sq btn-block" href="#/signup" style="margin-top:8px">Create an account</a></div></div>`+footer();
  const mine=DB.orders.filter(o=>String(o.email||'').toLowerCase()===String(u.email||'').toLowerCase());
  const latest=mine[0]||null;
  const first=(u.name||u.email.split('@')[0]).trim();
  const shortName=first.split(/\s+/)[0]||first;
  const initials=first.split(/\s+/).map(x=>x[0]||'').join('').slice(0,2).toUpperCase()||'GO';
  const ph=String(u.phone||'').replace(/[^0-9]/g,'').replace(/^91(?=[6-9][0-9]{9}$)/,'');
  const complete=[u.name,u.phone,u.address,u.city,u.pin].filter(x=>String(x||'').trim()).length;
  const score=Math.round((complete/5)*100);
  const latestItems=latest&&Array.isArray(latest.items)?latest.items:[];
  return accountHeader(u)+`<main class="account-page"><div class="account-shell">
    <aside class="account-nav" aria-label="Account navigation">
      <div class="account-nav-user"><span class="account-nav-avatar">${esc(initials)}</span><span><b>${esc(first)}</b><small>${esc(u.email)}</small></span></div>
      <div class="account-nav-label">My account</div>
      <a class="account-nav-link on" href="#/account"><span class="ni">${ic('home',16)}</span><span>Overview</span></a>
      <a class="account-nav-link" href="#/orders"><span class="ni">${ic('bag',16)}</span><span>Orders</span><span class="count">${mine.length}</span></a>
      <a class="account-nav-link" href="#/wishlist"><span class="ni">${ic('heart',16)}</span><span>Wishlist</span><span class="count">${DB.wish.length}</span></a>
      <a class="account-nav-link" href="#/blog"><span class="ni">${ic('leaf',16)}</span><span>Plant care</span></a>
      <a class="account-nav-link" href="#/page/contact"><span class="ni">${ic('mail',16)}</span><span>Help & support</span></a>
      <button class="account-nav-signout" type="button" data-act="logout"><span class="ni">${ic('back',16)}</span><span>Sign out</span></button>
    </aside>

    <section class="account-main">
      <section class="account-welcome">
        <div class="account-welcome-inner">
          <span class="account-eyebrow">${ic('leaf',13)} Green Ocean account</span>
          <h1>Good to see you, ${esc(shortName)}.</h1>
          <p>Track orders, update delivery details, manage your wishlist and keep your account secure from one simple dashboard.</p>
          <div class="account-welcome-actions"><a class="btn btn-light" href="#/shop">Continue shopping ${ic('arrow',13)}</a><a class="btn btn-glass" href="#/orders">View my orders</a></div>
        </div>
      </section>

      <section class="account-stats" aria-label="Account summary">
        <a class="account-stat" href="#/orders"><span class="account-stat-icon">${ic('bag',18)}</span><span><small>Total orders</small><b>${mine.length}</b><span class="mini">View order history</span></span></a>
        <a class="account-stat" href="#/wishlist"><span class="account-stat-icon">${ic('heart',18)}</span><span><small>Saved items</small><b>${DB.wish.length}</b><span class="mini">Your plant wishlist</span></span></a>
        <div class="account-stat"><span class="account-progress" style="--score:${score}"><span>${score}%</span></span><span><small>Profile setup</small><b>${score===100?'Complete':'Almost there'}</b><span class="mini">${score===100?'Delivery-ready profile':'Add missing details below'}</span></span></div>
        <a class="account-stat" href="#/page/contact"><span class="account-stat-icon">${ic('shield',18)}</span><span><small>Customer support</small><b>Need help?</b><span class="mini">Contact Green Ocean</span></span></a>
      </section>

      <div class="account-content-grid">
        <section class="account-card account-profile">
          <div class="account-card-head"><span class="acct-ico">${ic('user',19)}</span><div><h2>Profile & delivery details</h2><p>These details help us make checkout and delivery faster.</p></div><span class="head-meta">${score}% complete</span></div>
          <form id="acForm" novalidate>
            <div class="row2">
              <div class="field"><label>Full name</label><div class="ifield"><span class="ico">${ic('user',17)}</span><input class="inp" id="accountName" name="name" type="text" data-v="name" data-label="Full name" value="${esc(u.name||'')}" placeholder="Enter your full name"></div></div>
              <div class="field"><label><span class="account-label-ico">${ic('mail',14)}</span>Email address</label><div class="account-email-wrap"><span class="mailico">${ic('mail',16)}</span><input class="inp" type="email" value="${esc(u.email)}" disabled aria-label="Account email address"><span class="account-verified">${ic('check',12)} Verified</span></div></div>
            </div>
            <div class="field"><label><span class="account-label-ico">${ic('phone',14)}</span>Mobile number</label><div class="account-phone-wrap"><span class="account-phone-prefix"><b>+91</b></span><input class="inp" name="phone" type="tel" data-v="phone" data-label="Mobile number" inputmode="numeric" value="${esc(ph)}" placeholder="Enter 10-digit mobile number"></div></div>
            <div class="field"><label><span class="account-label-ico">${ic('pin',14)}</span>Delivery address</label><textarea class="inp" name="address" data-v="address" data-label="Address" placeholder="House number, street, area, landmark">${esc(u.address||'')}</textarea></div>
            <div class="row2">
              <div class="field"><label><span class="account-label-ico">${ic('home',14)}</span>City</label><div class="ifield"><span class="ico">${ic('home',16)}</span><input class="inp" name="city" type="text" data-v="city" data-label="City" value="${esc(u.city||'')}" placeholder="Enter your city"></div></div>
              <div class="field"><label><span class="account-label-ico">${ic('pin',14)}</span>Pincode</label><div class="ifield"><span class="ico">${ic('pin',16)}</span><input class="inp" name="pin" type="tel" data-v="pin" data-label="Pincode" inputmode="numeric" value="${esc(u.pin||'')}" placeholder="Enter 6-digit pincode"></div></div>
            </div>
            <div class="account-form-actions"><button class="btn btn-primary account-save" type="submit">${ic('check',15)} Save profile</button><div class="account-safe">${ic('shield',15)}<span>Your account data is used for your Green Ocean orders and support.</span></div></div>
          </form>
        </section>

        <aside class="account-side-stack">
          <section class="account-card account-security">
            <div class="account-card-head"><span class="acct-ico">${ic('lock',18)}</span><div><h3>${IS_RECOVERY?'Set a new password':'Password & security'}</h3><p>${IS_RECOVERY?'Finish account recovery with a new password.':'Use a strong password you do not reuse elsewhere.'}</p></div></div>
            <form id="pwForm" novalidate>
              ${IS_RECOVERY?'':authField('Current password','oldpass','password','any','')}
              ${authField('New password','pass','password','pass','')}
              ${authField('Confirm new password','pass2','password','any','')}
              <button class="btn btn-soft btn-sq" type="submit">${ic('lock',14)} ${IS_RECOVERY?'Set new password':'Update password'}</button>
            </form>
            <div class="account-security-note">${ic('shield',15)}<span>${IS_RECOVERY?'Choose a strong new password to finish recovering your account.':'For password reset or sign-in issues, use “Forgot password?” on the sign-in page.'}</span></div>
          </section>
          <section class="account-card account-help"><span class="helpico">${ic('phone',19)}</span><div><b>Need help with an order?</b><p>Questions about delivery, plants, returns or your account? Our support page has the quickest options.</p><div class="account-help-actions"><a class="btn btn-primary btn-sq" href="#/page/contact">Contact support</a><a class="btn btn-line btn-sq" href="#/page/faq">View FAQs</a></div></div></section>
        </aside>
      </div>

      <div class="account-lower-grid">
        <section class="account-card account-recent">
          <div class="account-card-head"><span class="acct-ico">${ic('box',18)}</span><div><h3>Recent order</h3><p>Your latest Green Ocean purchase at a glance.</p></div>${mine.length?`<a class="head-meta" href="#/orders">View all</a>`:''}</div>
          <div class="account-recent-body">
            ${latest?`<div class="account-order"><div class="account-order-top"><span class="account-order-id"><b>Order #${esc(latest.id)}</b><small>${esc(latest.date||'')}</small></span><span class="account-order-status">${esc(latest.status||'Processing')}</span></div><div class="account-order-items">${latestItems.slice(0,3).map(i=>`<span>${esc(i.name)} × ${i.qty}</span>`).join('')}${latestItems.length>3?`<span>+${latestItems.length-3} more</span>`:''}</div><div class="account-order-bottom"><b>${money(latest.total)}</b><a class="btn btn-line btn-sq btn-sm" href="#/orders">Order details</a><button class="btn btn-soft btn-sq btn-sm" data-reorder="${esc(latest.id)}">Buy again</button></div></div>`:`<div class="account-empty-order"><span class="emptyico">${ic('bag',20)}</span><b>No orders yet</b><p>When you place your first order, its status and details will appear here.</p><a class="btn btn-primary btn-sq btn-sm" href="#/shop">Explore plants</a></div>`}
          </div>
        </section>

        <section class="account-card account-shortcuts">
          <div class="account-card-head"><span class="acct-ico">${ic('grid',18)}</span><div><h3>Quick actions</h3><p>Go straight to common account tasks.</p></div></div>
          <div class="account-shortcut-grid">
            <a class="account-shortcut" href="#/orders"><span class="si">${ic('bag',16)}</span><b>My orders</b><small>Track status or buy again</small><span class="arr">Open →</span></a>
            <a class="account-shortcut" href="#/wishlist"><span class="si">${ic('heart',16)}</span><b>Wishlist</b><small>Saved plants & products</small><span class="arr">Open →</span></a>
            <a class="account-shortcut" href="#/blog"><span class="si">${ic('leaf',16)}</span><b>Plant care</b><small>Guides from Green Ocean</small><span class="arr">Read →</span></a>
            <a class="account-shortcut" href="#/page/returns"><span class="si">${ic('back',16)}</span><b>Returns</b><small>Guarantee & refund help</small><span class="arr">View →</span></a>
          </div>
        </section>
      </div>

      <section class="account-promo"><b>Keep your plants thriving.</b><p>Explore simple care guides for watering, light, repotting and everyday plant health.</p><a class="btn btn-primary btn-sq" href="#/blog">Explore Plant Care Blog</a></section>
    </section>
  </div></main>`;
}

function viewFaq(p){
  const blocks=String(p.body||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  const qa=blocks.map(block=>{
    const m=block.match(/^(.+?)\s+[—–-]\s+([\s\S]+)$/);
    return m?{q:m[1].trim(),a:m[2].trim()}:{q:block,a:''};
  });
  const s=DB.settings;
  return header('faq')+`<main class="faq-page"><div class="wrap sec">
    ${backBar('Back to home','#/')}
    <section class="faq-hero">
      <div class="faq-hero-inner">
        <span class="faq-kicker">${ic('leaf',14)} Green Ocean Help Centre</span>
        <h1>How can we help?</h1>
        <p>Quick answers about plants, delivery, pots, gifting and your Green Ocean order — all in one place.</p>
        <div class="faq-hero-actions">
          <a class="faq-light-btn" href="#/page/contact">${ic('mail',16)} Contact Support</a>
          <a class="faq-ghost-btn" href="#/orders">${ic('box',16)} Track an Order</a>
        </div>
      </div>
    </section>

    <div class="faq-layout">
      <aside class="faq-side">
        <div class="faq-side-card">
          <span class="faq-side-icon">${ic('doc',21)}</span>
          <h3>Popular help</h3>
          <p>Useful pages for the questions customers ask most often.</p>
          <a class="faq-side-link" href="#/page/shipping"><span>Shipping Policy</span><span>›</span></a>
          <a class="faq-side-link" href="#/page/returns"><span>Returns &amp; Refunds</span><span>›</span></a>
          <a class="faq-side-link" href="#/blog"><span>Plant Care Guides</span><span>›</span></a>
        </div>
        <div class="faq-side-card">
          <span class="faq-side-icon">${ic('phone',21)}</span>
          <h3>Still need help?</h3>
          <p>Our team can help with orders, delivery and product questions.</p>
          <a class="btn btn-primary btn-sq btn-block" href="#/page/contact">Contact us</a>
          <a class="btn btn-line btn-sq btn-block" style="margin-top:8px" href="mailto:${esc(s.email)}">${ic('mail',15)} Email support</a>
        </div>
      </aside>

      <section class="faq-main">
        <div class="faq-title-row"><div><h2>Frequently Asked Questions</h2><p>${qa.length} quick answer${qa.length===1?'':'s'} from Green Ocean.</p></div></div>
        <div class="faq-list">
          ${qa.map((x,i)=>`<details class="faq-item" ${i===0?'open':''}>
            <summary><span class="faq-qicon">${ic(i%2?'leaf':'doc',18)}</span><span>${esc(x.q)}</span><span class="faq-plus" aria-hidden="true"></span></summary>
            <div class="faq-answer"><p>${esc(x.a||'Please contact our support team for more information.')}</p></div>
          </details>`).join('')}
        </div>
        <div class="faq-bottom"><div><h3>Didn't find your answer?</h3><p>Send us a message and we'll help you with your question.</p></div><a class="btn btn-primary btn-sq" href="#/page/contact">${ic('mail',16)} Contact Support</a></div>
      </section>
    </div>
  </div></main>`+footer();
}

function policySections(body){
  const lines=String(body||'').split('\n').map(x=>x.trim()).filter(Boolean);
  const intro=[]; const sections=[]; let cur=null;
  lines.forEach(line=>{
    if(line.startsWith('## ')){ cur={title:line.slice(3).trim(),paras:[]}; sections.push(cur); }
    else if(cur)cur.paras.push(line); else intro.push(line);
  });
  return {intro,sections};
}
function shippingDefaultSections(){
  return [
    {title:'Where we deliver',paras:['Green Ocean ships nursery-fresh plants, planters and plant gifts to serviceable pincodes across India. Delivery availability can vary by pincode, plant type, parcel size and courier coverage.']},
    {title:'Order processing & nursery dispatch',paras:['Live plants need careful preparation before travel. We inspect, hydrate and secure eligible plants before packing. Orders are normally dispatched Monday to Thursday so living plants are less likely to remain inside a courier facility over a weekend.']},
    {title:'Estimated delivery time',paras:['Most orders are expected to arrive within 2–6 working days after dispatch. Remote areas, public holidays, severe weather, courier disruptions or temporary service restrictions can take longer. Delivery estimates are not a guaranteed arrival date.']},
    {title:'Shipping charges',paras:[`Orders of ${money(DB.settings.freeShipAbove)} or more qualify for free standard delivery. For orders below that value, the current standard delivery charge is ${money(DB.settings.shipFee)} unless an offer or coupon changes it. The final delivery charge is shown before order confirmation.`]},
    {title:'Plant-safe packaging',paras:['Plants are living products, so we use protective nursery packaging designed to reduce soil movement, leaf damage and moisture loss during transit. Natural variation in leaf position or minor cosmetic marks can occur after shipping and do not necessarily mean a plant is unhealthy.']},
    {title:'Tracking your order',paras:['When tracking information is available, use Your Orders to review the latest order status. Courier tracking may take some time to update after a parcel is handed over for delivery.']},
    {title:'Address & delivery attempts',paras:['Please enter a complete delivery address, correct pincode and reachable mobile number. A wrong or incomplete address can delay delivery or cause a parcel to be returned. Courier partners may contact you when they need directions or another delivery attempt.']},
    {title:'Damaged or unhealthy delivery',paras:['If your plant or product reaches you damaged or unhealthy, contact Green Ocean as soon as possible and follow our Returns & Refunds policy. Photos of the plant, product and outer packaging may help us review transit damage quickly.']},
    {title:'Need shipping help?',paras:[`For delivery questions, contact ${DB.settings.email} or use the Contact page with your order details. We can help with order status, delivery issues and plant-shipping questions.`]}
  ];
}
function viewPolicyPage(slug,p){
  const cfg={
    shipping:{icon:'truck',kicker:'Delivery & Nursery Dispatch',title:'Shipping Policy',
      sub:'How Green Ocean packs and delivers live plants, planters and gifts from our nursery to customers across India.',
      chips:[['truck','Pan-India delivery'],['leaf','Plant-safe packing'],['box','Order tracking']],
      note:'Shopping for live plants online is different from shipping ordinary products. Our process is designed around careful nursery handling, protective packing and practical delivery windows.'},
    privacy:{icon:'shield',kicker:'Your Data & Privacy',title:'Privacy Policy',
      sub:'How Green Ocean handles account, order, delivery and support information when you shop from our online plant nursery.',
      chips:[['shield','Data protection'],['lock','Secure accounts'],['mail','Support privacy']],
      note:'This page explains the information used to run your Green Ocean account, process plant and planter orders, provide delivery support and operate the website.'},
    terms:{icon:'doc',kicker:'Shopping Terms',title:'Terms & Conditions',
      sub:'The rules that apply when you use Green Ocean, create an account or buy live plants, planters and gifts online.',
      chips:[['check','Clear shopping terms'],['bag','Order rules'],['leaf','Living products']],
      note:'Plants are living products and naturally vary in size, shape and appearance. These terms explain how orders, delivery, cancellations, returns and website use are handled.'}
  }[slug];
  let parsed=policySections(p.body);
  let intro=[...parsed.intro], sections=[...parsed.sections];
  if(slug==='shipping' && !sections.length){ sections=shippingDefaultSections(); }
  const updated=intro.length&&/^Last updated:/i.test(intro[0])?intro.shift():'';
  const icons=['leaf','truck','shield','box','check','mail','home','doc'];
  const related=[
    ['shipping','Shipping Policy','truck'],['returns','Returns & Refunds','back'],['privacy','Privacy Policy','shield'],['terms','Terms & Conditions','doc']
  ].filter(x=>x[0]!==slug);
  return header(slug)+`<main class="policy-page"><div class="policy-wrap">
    ${backBar('Back to home','#/')}
    <section class="policy-hero">
      <span class="policy-kicker">${ic(cfg.icon,14)} ${cfg.kicker}</span>
      <h1>${cfg.title}</h1>
      <p>${cfg.sub}</p>
      <div class="policy-meta">${cfg.chips.map(x=>`<span>${ic(x[0],14)} ${x[1]}</span>`).join('')}${updated?`<span>${ic('doc',14)} ${esc(updated)}</span>`:''}</div>
    </section>
    <div class="policy-grid">
      <section class="policy-content">
        <div class="policy-highlight"><span class="policy-section-icon">${ic(cfg.icon,19)}</span><div><b>Green Ocean policy overview</b><p>${cfg.note}</p></div></div>
        ${intro.length?`<div class="policy-intro">${intro.map(t=>`<p>${esc(t)}</p>`).join('')}</div>`:''}
        ${sections.map((sec,i)=>`<article class="policy-section"><div class="policy-section-head"><span class="policy-section-icon">${ic(icons[i%icons.length],18)}</span><h2>${esc(sec.title)}</h2></div>${sec.paras.map(t=>`<p>${esc(t)}</p>`).join('')}</article>`).join('')}
        <div class="policy-highlight"><span class="policy-section-icon">${ic('mail',18)}</span><div><b>Questions about this policy?</b><p>Contact Green Ocean at ${esc(DB.settings.email)} or use our Help Centre. For order-related questions, include your order details so we can assist faster.</p><div class="policy-related">${related.map(x=>`<a href="#/page/${x[0]}">${ic(x[2],14)} ${x[1]}</a>`).join('')}</div></div></div>
      </section>
      <aside class="policy-side">
        <div class="policy-side-card"><h3>Customer information</h3><p>Quick access to the pages customers commonly need before and after buying.</p>
          ${related.map(x=>`<a class="policy-side-link" href="#/page/${x[0]}"><span class="pi">${ic(x[2],15)}</span><span>${x[1]}</span><span class="arr">›</span></a>`).join('')}
          <a class="policy-side-link" href="#/page/faq"><span class="pi">${ic('doc',15)}</span><span>FAQ & Help</span><span class="arr">›</span></a>
        </div>
        <div class="policy-side-card policy-search-copy"><h3>Green Ocean online nursery</h3><p>Nursery-fresh indoor plants, flowering plants, planters, gardening essentials and plant gifts for online shopping across India.</p><div class="policy-keywords"><span>online plant nursery</span><span>buy plants online</span><span>indoor plants</span><span>planters</span><span>plant gifts</span><span>nursery delivery</span></div></div>
        <div class="policy-side-card"><div class="policy-contact"><span class="pi">${ic('mail',18)}</span><div><b>Need help?</b><p>Questions about an order, delivery or policy?</p><a class="btn btn-primary btn-sq btn-block btn-sm" href="#/page/contact">Contact Green Ocean</a></div></div></div>
      </aside>
    </div>
  </div></main>`+footer();
}


/* ================= STORY / RETURNS / CONTACT PAGES ================= */
function setGreenOceanPageSEO(slug){
  const map={
    story:{title:'About Green Ocean | Online Plant Nursery in Dhanbad, India',desc:'Meet Green Ocean, a plant nursery in Balihari, Dhanbad offering indoor plants, flowering plants, planters, gardening essentials and plant gifts for online shoppers across India.'},
    returns:{title:'Returns & Refunds | Green Ocean Plant Nursery',desc:'Read Green Ocean returns, refunds and 7-day healthy plant guarantee guidance for plants, planters and nursery orders delivered across India.'},
    contact:{title:'Contact Green Ocean | Online Plant Nursery Support',desc:'Contact Green Ocean for plant orders, delivery help, nursery questions, indoor plants, planters, plant gifts and online plant shopping support in India.'}
  };
  const x=map[slug]; if(!x)return;
  document.title=x.title;
  const md=document.querySelector('meta[name="description"]'); if(md)md.setAttribute('content',x.desc);
  const ot=document.querySelector('meta[property="og:title"]'); if(ot)ot.setAttribute('content',x.title);
  const od=document.querySelector('meta[property="og:description"]'); if(od)od.setAttribute('content',x.desc);
  let robots=document.querySelector('meta[name="robots"]');
  if(!robots){robots=document.createElement('meta');robots.name='robots';document.head.appendChild(robots);}
  robots.content='index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
}
function ensureGreenOceanSchema(){
  let el=document.getElementById('go-org-schema'); if(el)return;
  el=document.createElement('script'); el.id='go-org-schema'; el.type='application/ld+json';
  const s=DB.settings||{};
  const same=[s.instagram,s.facebook,s.youtube].filter(Boolean);
  el.textContent=JSON.stringify({
    '@context':'https://schema.org','@type':'OnlineStore',name:s.store||'Green Ocean',url:'https://greenocean.co.in/',
    logo:absoluteAsset('img:logo'),description:'Green Ocean is an online plant nursery in Balihari, Dhanbad, Jharkhand offering indoor plants, flowering plants, planters, gardening essentials and plant gifts.',
    email:s.email||'support@greenocean.co.in',telephone:s.phone||'+91 97189 85034',areaServed:{'@type':'Country',name:'India'},
    address:{'@type':'PostalAddress',streetAddress:'Balihari',addressLocality:'Dhanbad',addressRegion:'Jharkhand',postalCode:'828116',addressCountry:'IN'},sameAs:same
  });
  document.head.appendChild(el);
}
function brandSideNav(active){
  const links=[['story','Our Story','leaf'],['shop','Shop Plants','bag'],['shipping','Shipping Policy','truck'],['returns','Returns & Refunds','back'],['faq','FAQ & Help','doc'],['contact','Contact','mail']];
  return `<div class="brand-side-card"><h3>Explore Green Ocean</h3><p>Helpful pages for shopping, delivery and plant care.</p>
    ${links.map(x=>x[0]==='shop'?`<a class="brand-side-link" href="#/shop"><span class="bi">${ic(x[2],15)}</span><span>${x[1]}</span><span class="arr">›</span></a>`:
      `<a class="brand-side-link" href="#/page/${x[0]}"${x[0]===active?' aria-current="page"':''}><span class="bi">${ic(x[2],15)}</span><span>${x[1]}</span><span class="arr">›</span></a>`).join('')}</div>`;
}
function seoDiscoveryCard(){return `<div class="brand-side-card brand-seo-card"><h3>Green Ocean online nursery</h3><p>Shop nursery-fresh plants and useful gardening products with clear support before and after your order.</p><div class="brand-tags"><span>online plant nursery India</span><span>buy indoor plants online</span><span>plant nursery Dhanbad</span><span>planters online</span><span>plant gifts India</span><span>nursery delivery</span></div></div>`;}
function viewStoryPage(p){
  setGreenOceanPageSEO('story'); ensureGreenOceanSchema();
  const paras=(p.body||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  const cats=DB.categories.filter(c=>c && c.name).slice(0,3);
  const catImgs=['cat_indoor','cat_flowering','cat_planters'];
  return header('story')+`<main class="story-premium"><div class="story-shell">
    <section class="story-hero-v2">
      <div class="story-hero-copy">
        <span class="story-kicker">${ic('leaf',13)} Our Story · Green Ocean</span>
        <h1>Growing plants. Building greener everyday spaces.</h1>
        <p>Green Ocean is a nursery-led plant store from Balihari, Dhanbad, Jharkhand — bringing healthy plants, useful planters and practical plant-care guidance into one simple online experience.</p>
        <div class="story-hero-actions"><a class="btn btn-primary" href="#/shop">Explore plants ${ic('arrow',13)}</a><a class="btn btn-line" href="#/blog">Read plant-care guides</a></div>
        <div class="story-hero-facts"><span>${ic('home',13)} Balihari, Dhanbad</span><span>${ic('leaf',13)} Nursery-led plant store</span><span>${ic('truck',13)} Pan-India shopping support</span></div>
      </div>
      <div class="story-hero-media"><img src="${src('img:hero')}" alt="Green Ocean nursery plants in Dhanbad"><div class="story-hero-note"><span class="ico">${ic('leaf',19)}</span><span><b>Plants make better days.</b><small>From selecting a plant to caring for it after delivery, we want the journey to feel simple and useful.</small></span></div></div>
    </section>

    <section class="story-trust-v2" aria-label="Green Ocean highlights">
      <div class="story-trust-item"><span class="ti">${ic('leaf',17)}</span><span><b>Nursery roots</b><small>Built around living plants and everyday gardening.</small></span></div>
      <div class="story-trust-item"><span class="ti">${ic('shield',17)}</span><span><b>7-day plant guarantee</b><small>Clear support for eligible unhealthy arrivals.</small></span></div>
      <div class="story-trust-item"><span class="ti">${ic('doc',17)}</span><span><b>Care guidance</b><small>Useful watering, light and repotting articles.</small></span></div>
      <div class="story-trust-item"><span class="ti">${ic('mail',17)}</span><span><b>Human support</b><small>Order, delivery and plant-help contact options.</small></span></div>
    </section>

    <section class="story-intro-v2">
      <article class="story-content-card">
        <div class="story-section-label">Where Green Ocean began</div>
        <h2>A nursery story that moved online without losing the plant-first thinking.</h2>
        <p>${esc(paras[0]||'Green Ocean began with a simple idea: make healthy plants easier to discover and buy with confidence.')}</p>
        ${paras[1]?`<p>${esc(paras[1])}</p>`:''}
        <p>Today, the same idea shapes the Green Ocean website: clear plant categories, useful care information, straightforward delivery and return policies, and support that continues after checkout.</p>
      </article>
      <div class="story-image-stack" aria-label="Green Ocean plant collection">
        <div class="story-image-tile big"><img src="${src('img:hero')}" alt="Healthy indoor plants from Green Ocean"><span>Healthy greens for homes, workspaces and gifting.</span></div>
        <div class="story-image-tile"><img src="${src('img:content1')}" alt="Green Ocean plants and gardening"><span>Plant shopping with useful care context.</span></div>
        <div class="story-image-tile"><img src="${src('img:content4')}" alt="Plant care and nursery experience"><span>Support that continues after delivery.</span></div>
      </div>
    </section>

    <div class="story-section-head"><div><div class="story-section-label">From nursery to your home</div><h2>How the Green Ocean journey works</h2><p>Four simple stages keep plant shopping understandable before, during and after an order.</p></div></div>
    <section class="story-steps-v2">
      <article class="story-step-v2" data-step="01"><span class="si">${ic('search',17)}</span><b>Discover the right plant</b><p>Browse indoor plants, flowering plants, planters and gardening products with clearer product information.</p></article>
      <article class="story-step-v2" data-step="02"><span class="si">${ic('leaf',17)}</span><b>Prepare living products carefully</b><p>Plants need more thoughtful handling than ordinary parcels, so packing and dispatch are approached with that in mind.</p></article>
      <article class="story-step-v2" data-step="03"><span class="si">${ic('truck',17)}</span><b>Keep delivery transparent</b><p>Shipping information, order status and support pages help customers understand what happens after checkout.</p></article>
      <article class="story-step-v2" data-step="04"><span class="si">${ic('sun',17)}</span><b>Help the plant keep growing</b><p>Care articles cover practical topics such as watering, light, repotting and everyday plant health.</p></article>
    </section>

    <div class="story-section-head"><div><div class="story-section-label">What matters to us</div><h2>Simple principles behind the store</h2></div></div>
    <section class="story-values-v2">
      <article class="story-value-v2"><span class="vi">${ic('shield',18)}</span><b>Clear before checkout</b><p>Useful product details, visible policies and support links help customers make informed choices.</p></article>
      <article class="story-value-v2"><span class="vi">${ic('heart',18)}</span><b>Care after delivery</b><p>The relationship should not end when a box arrives, especially when the product is a living plant.</p></article>
      <article class="story-value-v2"><span class="vi">${ic('leaf',18)}</span><b>Practical plant knowledge</b><p>Plant care becomes easier when guidance is simple enough to use in everyday homes and workspaces.</p></article>
    </section>

    <div class="story-section-head"><div><div class="story-section-label">Explore Green Ocean</div><h2>Find a green match for your space.</h2><p>Start with the collections customers use most, then explore the full nursery catalogue.</p></div><a href="#/shop">View all products →</a></div>
    <section class="story-categories-v2">${cats.map((c,i)=>`<a class="story-category-v2" href="#/shop?cat=${encodeURIComponent(c.id)}"><img src="${src('img:'+catImgs[i])}" alt="${esc(c.name)} from Green Ocean"><span><b>${esc(c.name)}</b><small>${esc(c.desc||'Explore this Green Ocean collection')}</small></span></a>`).join('')}</section>

    <section class="story-founder-note"><blockquote>“A greener home can begin with one plant you understand, enjoy and keep growing.”<small>Green Ocean · Balihari, Dhanbad, Jharkhand</small></blockquote><span class="story-founder-mark">${ic('leaf',30)}</span></section>

    <section class="story-bottom-v2"><div><h3>Ready to bring a little more green home?</h3><p>Browse the nursery collection or read practical plant-care guidance before choosing.</p></div><div class="story-bottom-actions"><a class="btn btn-primary" href="#/shop">Shop plants</a><a class="btn btn-line" href="#/page/contact">Contact Green Ocean</a></div></section>
  </div></main>`+footer();
}
function viewReturnsPage(p){
  setGreenOceanPageSEO('returns'); ensureGreenOceanSchema();
  return header('returns')+`<main class="brand-page"><div class="brand-wrap">
    <section class="brand-hero returns"><div class="brand-hero-inner"><span class="brand-kicker">${ic('shield',14)} Returns & Refunds</span><h1>Plant support that is clear and practical.</h1><p>Plants are living products, so our returns process focuses first on transit damage, unhealthy arrival and genuine order issues. Read the steps below before submitting a request.</p><div class="brand-badges"><span>${ic('shield',14)} 7-Day Healthy Plant Guarantee</span><span>${ic('mail',14)} Support by email</span><span>${ic('wallet',14)} Refund or replacement after approval</span></div></div></section>
    <div class="brand-grid"><div class="brand-main">
      <section class="brand-card"><div class="brand-icon-title"><span class="bi">${ic('shield',19)}</span><div><h2>7-Day Healthy Plant Guarantee</h2></div></div><p>If a plant or eligible product reaches you damaged or unhealthy, contact <b>${esc(DB.settings.email)}</b> within 7 days of delivery. Please include your order details and clear photos of the plant or product and outer packaging so we can review the issue quickly.</p></section>
      <section class="brand-card"><h2>How a return or refund request works</h2><div class="return-rule"><span class="ri">${ic('doc',18)}</span><div><b>1. Contact us within 7 days</b><p>Share the order number, registered contact details and a short description of what went wrong.</p></div></div><div class="return-rule"><span class="ri">${ic('image',18)}</span><div><b>2. Send useful photos</b><p>For transit damage or an unhealthy plant, photos of the plant, product and package help us review the condition.</p></div></div><div class="return-rule"><span class="ri">${ic('check',18)}</span><div><b>3. We review the request</b><p>If the request is approved, we will arrange the appropriate resolution based on the order and product condition.</p></div></div><div class="return-rule"><span class="ri">${ic('wallet',18)}</span><div><b>4. Replacement or refund</b><p>Approved refunds are normally processed to the original payment method within 5–7 working days. Cash-on-delivery refunds are made to a bank account or UPI.</p></div></div></section>
      <div class="brand-features"><article class="brand-feature"><span class="bi">${ic('check',18)}</span><b>Issues we can review</b><p>Plants arriving damaged or unhealthy, wrong items, missing items, or eligible products damaged in transit.</p></article><article class="brand-feature"><span class="bi">${ic('x',18)}</span><b>What is generally not covered</b><p>Change of mind for living plants, or damage after delivery caused by over-watering, under-watering, pests, unsuitable placement or accidents.</p></article><article class="brand-feature"><span class="bi">${ic('back',18)}</span><b>Order cancellation</b><p>You can cancel an order before dispatch from Your Orders when that option is available. Once dispatched, cancellation may no longer be possible.</p></article><article class="brand-feature"><span class="bi">${ic('box',18)}</span><b>Planters and accessories</b><p>For a planter or non-living item damaged during delivery, contact us promptly with order details and photos of the item and package.</p></article></div>
      <section class="brand-card"><div class="brand-icon-title"><span class="bi">${ic('mail',19)}</span><div><h2>Before you send a request</h2></div></div><p>Keep the damaged item and original packaging until your request has been reviewed. Do not discard a plant, planter or shipping box if we may need additional photos or information to resolve the issue.</p><p>This page should be read together with our Terms & Conditions and Shipping Policy.</p></section>
      <div class="brand-cta"><div><h3>Need help with a delivered order?</h3><p>Send your order details and we’ll guide you through the next step.</p></div><a class="btn btn-primary btn-sq" href="#/page/contact">${ic('mail',15)} Contact Support</a></div>
    </div><aside class="brand-side">${brandSideNav('returns')}<div class="brand-side-card"><h3>Related policies</h3><a class="brand-side-link" href="#/page/shipping"><span class="bi">${ic('truck',15)}</span><span>Shipping Policy</span><span class="arr">›</span></a><a class="brand-side-link" href="#/page/terms"><span class="bi">${ic('doc',15)}</span><span>Terms & Conditions</span><span class="arr">›</span></a><a class="brand-side-link" href="#/page/faq"><span class="bi">${ic('doc',15)}</span><span>FAQ</span><span class="arr">›</span></a></div>${seoDiscoveryCard()}</aside></div>
  </div></main>`+footer();
}
function viewContactPage(p){
  setGreenOceanPageSEO('contact'); ensureGreenOceanSchema();
  const phone=DB.settings.phone||'+91 97189 85034', email=DB.settings.email||'support@greenocean.co.in';
  return header('contact')+`<main class="brand-page"><div class="brand-wrap">
    <section class="brand-hero contact"><div class="brand-hero-inner"><span class="brand-kicker">${ic('mail',14)} Contact Green Ocean</span><h1>Questions about plants or an order? Talk to us.</h1><p>Contact our nursery team for plant shopping questions, delivery support, order issues, planters, plant gifts and general Green Ocean help.</p><div class="brand-badges"><span>${ic('home',14)} Balihari, Dhanbad</span><span>${ic('phone',14)} Mon–Sat · 9 AM–7 PM</span><span>${ic('mail',14)} ${esc(email)}</span></div></div></section>
    <div class="brand-grid"><div class="brand-main">
      <div class="contact-cards"><article class="contact-card"><span class="ci">${ic('phone',19)}</span><div><b>Call us</b><a href="tel:${esc(phone.replace(/[^0-9+]/g,''))}">${esc(phone)}</a><p>Monday to Saturday, 9 AM to 7 PM</p></div></article><article class="contact-card"><span class="ci">${ic('mail',19)}</span><div><b>Email support</b><a href="mailto:${esc(email)}">${esc(email)}</a><p>Useful for order, return and policy questions.</p></div></article><article class="contact-card"><span class="ci">${ic('phone',19)}</span><div><b>WhatsApp</b><a href="https://wa.me/${esc(waNumber())}" target="_blank" rel="noopener">Chat with Green Ocean</a><p>Share your order number when asking about an existing order.</p></div></article><article class="contact-card"><span class="ci">${ic('home',19)}</span><div><b>Nursery</b><p>${esc(DB.settings.address||'Balihari, Dhanbad, Jharkhand 828116')}</p><p>Green Ocean plant nursery, Jharkhand.</p></div></article></div>
      <section class="brand-card contact-form-card"><div class="contact-form-head"><span class="ci">${ic('mail',19)}</span><div><h2>Send us a message</h2><p>Tell us what you need help with. For an order issue, include your order number.</p></div></div><form data-act="contactForm" novalidate><div class="row2">${authField('Your name','name','text','name','')}${authField('Email','email','email','email','','')}</div>${authField('Mobile number','phone','tel','phone','','')}<div class="field"><label>Message</label><textarea class="inp" name="msg" data-v="msg" data-label="Message" placeholder="Order number (if any) + how we can help"></textarea></div><input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true"><div style="display:flex;gap:8px;flex-wrap:wrap">${API.on?`<button class="btn btn-primary btn-sq btn-lg" data-via="api">${ic('mail',15)} Send message</button>`:`<button class="btn btn-primary btn-sq" data-via="wa">${ic('phone',15)} Send on WhatsApp</button><button class="btn btn-line btn-sq" data-via="mail">${ic('mail',15)} Send by email</button>`}</div></form><p class="brand-note">Please do not send passwords, card PINs, CVV numbers or other sensitive payment credentials in a message.</p></section>
      <section class="brand-card"><div class="brand-icon-title"><span class="bi">${ic('leaf',19)}</span><div><h2>What we can help with</h2></div></div><div class="brand-features"><article class="brand-feature"><span class="bi">${ic('search',18)}</span><b>Choosing plants</b><p>Questions about indoor plants, flowering plants, planters, gifting and product details.</p></article><article class="brand-feature"><span class="bi">${ic('truck',18)}</span><b>Orders & delivery</b><p>Order status, shipping questions, address issues and delivery support.</p></article><article class="brand-feature"><span class="bi">${ic('shield',18)}</span><b>Returns & plant guarantee</b><p>Help with damaged or unhealthy arrivals and eligible refund or replacement requests.</p></article><article class="brand-feature"><span class="bi">${ic('leaf',18)}</span><b>Plant care guidance</b><p>Start with our Plant Care Blog for practical watering, light and repotting guidance.</p></article></div></section>
      <div class="brand-cta"><div><h3>Shopping for plants online?</h3><p>Browse Green Ocean’s indoor plants, flowering plants, planters, gardening essentials and plant gifts.</p></div><a class="btn btn-primary btn-sq" href="#/shop">${ic('bag',15)} Browse Plants</a></div>
    </div><aside class="brand-side">${brandSideNav('contact')}<div class="brand-side-card"><h3>Before contacting us</h3><p>For faster order support, keep your order number, registered mobile number and delivery details ready.</p><a class="brand-side-link" href="#/orders"><span class="bi">${ic('bag',15)}</span><span>View Your Orders</span><span class="arr">›</span></a><a class="brand-side-link" href="#/page/faq"><span class="bi">${ic('doc',15)}</span><span>Read FAQ</span><span class="arr">›</span></a></div>${seoDiscoveryCard()}</aside></div>
  </div></main>`+footer();
}

function viewPage(slug){
  const p=DB.pages.find(x=>x.slug===slug&&x.active);
  if(!p)return header()+`<div class="wrap sec panel empty"><h3>Page not found</h3><a class="btn btn-primary btn-sq" href="#/">Go home</a></div>`+footer();
  if(slug==='faq')return viewFaq(p);
  if(slug==='shipping'||slug==='privacy'||slug==='terms')return viewPolicyPage(slug,p);
  if(slug==='story')return viewStoryPage(p);
  if(slug==='returns')return viewReturnsPage(p);
  if(slug==='contact')return viewContactPage(p);
  return header(slug)+`<div class="wrap sec">${backBar('Back','#/')}<div class="panel" style="max-width:720px;margin:0 auto">
    <h1 style="font-family:var(--serif);font-size:28px;margin:0 0 14px;font-weight:600">${esc(p.title)}</h1>
    ${p.body.split('\n').filter(Boolean).map(t=>t.startsWith('## ')?
      `<h3 style="font-family:var(--serif);font-size:19px;font-weight:600;margin:22px 0 6px">${esc(t.slice(3))}</h3>`:
      `<p style="max-width:70ch;margin:0 0 10px">${esc(t)}</p>`).join('')}
    ${slug==='contact'?`<form data-act="contactForm" style="margin-top:14px" novalidate>
      <div class="row2">${authField('Your name','name','text','name','')}${authField('Email','email','email','email','','')}</div>
      ${authField('Mobile number','phone','tel','phone','','')}
      <div class="field"><label>Message</label><textarea class="inp" name="msg" data-v="msg" data-label="Message" placeholder="Write your message"></textarea></div>
      <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${API.on?`<button class="btn btn-primary btn-sq btn-lg" data-via="api">${ic('mail',15)} Send message</button>`:
        `<button class="btn btn-primary btn-sq" data-via="wa">${ic('phone',15)} Send on WhatsApp</button>
        <button class="btn btn-line btn-sq" data-via="mail">${ic('mail',15)} Send by email</button>`}</div></form>`:''}
    </div></div>`+footer();
}
function setBlogSEO(b){
  const isArticle=!!b;
  const title=isArticle?`${b.title} | Green Ocean Plant Care Blog`:'Plant Care Blog | Green Ocean Online Nursery';
  const desc=isArticle?(b.excerpt||'Practical plant care guidance from Green Ocean.'):'Practical indoor plant care guides on watering, low light, repotting and everyday plant care from Green Ocean, a plant nursery in Dhanbad, Jharkhand.';
  document.title=title;
  const md=document.querySelector('meta[name="description"]'); if(md)md.setAttribute('content',desc);
  const ot=document.querySelector('meta[property="og:title"]'); if(ot)ot.setAttribute('content',title);
  const od=document.querySelector('meta[property="og:description"]'); if(od)od.setAttribute('content',desc);
}
function ensureBlogSchema(b){
  let el=document.getElementById('go-blog-schema');
  if(!el){el=document.createElement('script');el.id='go-blog-schema';el.type='application/ld+json';document.head.appendChild(el);}
  if(!b){el.textContent=JSON.stringify({'@context':'https://schema.org','@type':'Blog',name:'Green Ocean Plant Care Blog',url:'https://greenocean.co.in/#/blog',description:'Practical plant care articles from Green Ocean.'});return;}
  el.textContent=JSON.stringify({'@context':'https://schema.org','@type':'BlogPosting',headline:b.title,description:b.excerpt||'',datePublished:b.date||'',author:{'@type':'Organization',name:'Green Ocean'},publisher:{'@type':'Organization',name:'Green Ocean',logo:{'@type':'ImageObject',url:absoluteAsset('img:logo')}},mainEntityOfPage:'https://greenocean.co.in/#/blog/'+b.id});
}
function blogReadTime(b){const words=String((b&&b.body)||'').trim().split(/\s+/).filter(Boolean).length;return Math.max(1,Math.ceil(words/180));}
function viewBlog(id){
  const active=DB.blogs.filter(b=>b.active);
  if(id){
    const b=active.find(x=>x.id===id); if(!b)return viewBlog();
    setBlogSEO(b); ensureBlogSchema(b);
    const rel=active.filter(x=>x.id!==b.id).slice(0,3);
    const paras=String(b.body||'').split(/\n\s*\n|\n/).map(x=>x.trim()).filter(Boolean);
    return header('blog')+`<main class="blog-article"><div class="article-wrap">
      ${backBar('All plant care articles','#/blog')}
      <article class="article-hero"><div class="article-cover">${pic(b)}</div><div class="article-head"><span class="blog-label">${ic('leaf',13)} Plant Care Guide</span><h1>${esc(b.title)}</h1><div class="blog-meta"><span>${ic('doc',13)} ${esc(b.date||'')}</span><span>${ic('clock',13)} ${blogReadTime(b)} min read</span><span>${ic('leaf',13)} Green Ocean</span></div><p class="lead">${esc(b.excerpt||'Practical plant care guidance from our nursery.')}</p></div></article>
      <div class="article-layout"><section class="article-body">${paras.map(t=>`<p>${esc(t)}</p>`).join('')}<div class="article-callout"><b>${ic('leaf',14)} Quick takeaway</b><p>${esc(b.excerpt||'Observe the plant, light and soil before following a fixed routine.')}</p></div></section>
      <aside class="article-side"><div class="article-side-card"><h3>More plant-care guides</h3>${rel.length?rel.map(r=>`<a class="article-related" href="#/blog/${r.id}"><span>${pic(r)}</span><span><b>${esc(r.title)}</b><small>${esc(r.date||'')}</small></span></a>`).join(''):'<p style="font-size:12px;color:var(--muted);margin:0">More guides are coming soon.</p>'}</div><div class="article-side-card"><h3>Need a plant too?</h3><p style="font-size:12.5px;color:var(--muted);line-height:1.55;margin:0 0 10px">Browse indoor plants, flowering plants, planters and gardening essentials.</p><a class="btn btn-primary btn-sq" href="#/shop">Browse Plants</a></div></aside></div>
      <div class="blog-cta"><div><h3>Keep learning, keep growing.</h3><p>Explore more practical guides or find a plant that suits your space.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-line btn-sq" style="background:#fff" href="#/blog">All Articles</a><a class="btn btn-primary btn-sq" href="#/shop">Shop Plants</a></div></div>
    </div></main>`+footer();
  }
  setBlogSEO(null); ensureBlogSchema(null);
  const list=active, featured=list[0], rest=list.slice(1);
  return header('blog')+`<main class="care-home-v3"><div class="care-v3-wrap">
    <section class="care-v3-hero">
      <div class="care-v3-copy"><span class="care-v3-kicker">${ic('leaf',14)} Green Ocean Plant Care</span><h1>Grow better. Care smarter.</h1><p>Clear, practical plant-care guidance for real homes — from watering and light to repotting, low-light plants and everyday troubleshooting.</p><div class="care-v3-topics"><span class="care-v3-topic">${ic('drop',13)} Watering</span><span class="care-v3-topic">${ic('home',13)} Indoor plants</span><span class="care-v3-topic">${ic('sun',13)} Light</span><span class="care-v3-topic">${ic('planter',13)} Repotting</span></div></div>
      ${featured?`<article class="care-v3-feature"><a class="care-v3-feature-img" href="#/blog/${featured.id}" aria-label="Read ${esc(featured.title)}"><img src="${src('img:hero')}" alt="Healthy indoor plants styled in a bright Green Ocean home setting" loading="eager" fetchpriority="high" decoding="async"></a><div class="care-v3-feature-card"><span class="care-v3-badge">${ic('star',12)} Featured guide</span><h2>${esc(featured.title)}</h2><div class="care-v3-meta"><span>${ic('doc',12)} ${esc(featured.date||'')}</span><span>${ic('clock',12)} ${blogReadTime(featured)} min read</span></div><p>${esc(featured.excerpt||'Practical plant care guidance from Green Ocean.')}</p><a class="care-v3-read" href="#/blog/${featured.id}">Read the guide ${ic('arrow',13)}</a></div></article>`:`<div class="care-v3-feature"><a class="care-v3-feature-img" href="#/shop"><img src="${src('img:hero')}" alt="Healthy indoor plants from Green Ocean" loading="eager" fetchpriority="high" decoding="async"></a><div class="care-v3-feature-card"><span class="care-v3-badge">Plant care</span><h2>Practical guidance for healthier plants.</h2><a class="care-v3-read" href="#/shop">Explore plants ${ic('arrow',13)}</a></div></div>`}
    </section>
    <div class="care-v3-section-head"><div><h2>Latest plant-care guides</h2><p>Useful, easy-to-follow advice for healthier plants and more confident plant parents.</p></div><a class="care-v3-shop" href="#/shop">Shop plants ${ic('arrow',12)}</a></div>
    <section class="care-v3-guides">${(rest.length?rest:list).map(b=>`<a class="care-v3-guide" href="#/blog/${b.id}"><div class="care-v3-guide-img">${pic(b)}</div><div class="care-v3-guide-copy"><span class="blog-label">Plant care</span><h3>${esc(b.title)}</h3><div class="care-v3-meta"><span>${esc(b.date||'')}</span><span>${blogReadTime(b)} min read</span></div><p>${esc(b.excerpt||'')}</p><span class="care-v3-more">Read article ${ic('arrow',13)}</span></div></a>`).join('')}</section>
    <div class="blog-title-row"><div><h2>Plant-care basics</h2><p>Three habits that solve a surprising number of plant problems.</p></div></div>
    <section class="blog-basics"><article class="blog-basic"><span class="bi">${ic('drop',18)}</span><b>Check soil before watering</b><p>Moisture changes with season, light and pot size. Let the soil guide the schedule.</p></article><article class="blog-basic"><span class="bi">${ic('sun',18)}</span><b>Match the plant to the light</b><p>Low light, bright indirect light and direct sun are different environments. Choose accordingly.</p></article><article class="blog-basic"><span class="bi">${ic('planter',18)}</span><b>Repot only when needed</b><p>Move up gradually and avoid oversizing the pot. Roots need both moisture and air.</p></article></section>
    <div class="blog-cta"><div><h3>Need help choosing a plant?</h3><p>Browse plants by category or contact Green Ocean for product and order support.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-line btn-sq" style="background:#fff" href="#/page/contact">Contact Us</a><a class="btn btn-primary btn-sq" href="#/shop">Explore Plants</a></div></div>
  </div></main>`+footer();
}
