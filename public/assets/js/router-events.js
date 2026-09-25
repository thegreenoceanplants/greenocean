/* ================= ROUTER ================= */
function migrateLegacyHashRoute(){
  if(location.hash&&location.hash.startsWith('#/admin'))return false;
  if(location.hash&&location.hash.startsWith('#/')){
    const target=location.hash.slice(1)||'/';history.replaceState({},'',target);return true;
  }
  return false;
}
function normalizeDirectAdminRoute(){
  const p=location.pathname||'/';
  if(p==='/admin'||p.startsWith('/admin/')){
    const q=location.search||'';
    history.replaceState({},'', '/#'+p+q);
  }
}
function route(){
  const ah=adminHashPath();
  if(ah){
    const cut=ah.indexOf('?');
    const path=cut>=0?ah.slice(0,cut):ah;
    const query=cut>=0?ah.slice(cut+1):'';
    return {seg:path.split('/').filter(Boolean),query,path};
  }
  const path=location.pathname||'/';
  const query=(location.search||'').replace(/^\?/,'');
  const seg=path.split('/').filter(Boolean);
  return {seg,query,path};
}
function upgradeInternalLinks(scope){
  (scope||document).querySelectorAll('a[href^="#/"]').forEach(a=>{
    const raw=a.getAttribute('href')||'';
    if(raw.startsWith('#/admin'))return;
    a.setAttribute('href',cleanRouteTarget(raw));
  });
}
function seoBase(){
  const d=String((DB.settings&&DB.settings.domain)||'').trim().replace(/\/+$/,'');
  if(/^https?:\/\//i.test(d))return d;
  if(/(^|\.)greenocean\.co\.in$/i.test(location.hostname))return 'https://www.greenocean.co.in';
  return location.origin;
}
function absoluteAsset(v){const u=src(v)||v||'';if(!u)return '';try{return new URL(u,seoBase()).href}catch(e){return u}}
function setMeta(name,value,property=false){let q=property?`meta[property="${name}"]`:`meta[name="${name}"]`,m=document.querySelector(q);if(!m){m=document.createElement('meta');if(property)m.setAttribute('property',name);else m.setAttribute('name',name);document.head.appendChild(m);}m.setAttribute('content',value||'');}
function setCanonical(url){let l=document.querySelector('link[rel="canonical"]');if(!l){l=document.createElement('link');l.rel='canonical';document.head.appendChild(l);}l.href=url;setMeta('og:url',url,true);}
function putJSONLD(nodes){document.querySelectorAll('script[data-go-schema],script[data-ssr-schema]').forEach(x=>x.remove());(nodes||[]).filter(Boolean).forEach((node,i)=>{const sc=document.createElement('script');sc.type='application/ld+json';sc.dataset.goSchema=String(i);sc.textContent=JSON.stringify(node);document.head.appendChild(sc);});}
function businessSchema(){const s=DB.settings,b=seoBase();return {'@context':'https://schema.org','@type':'LocalBusiness','@id':b+'/#business',name:s.store||'Green Ocean',url:b+'/',logo:absoluteAsset('img:logo'),image:absoluteAsset('img:hero'),telephone:s.phone||'',email:s.email||'',address:{'@type':'PostalAddress',streetAddress:'Balihari',addressLocality:'Dhanbad',addressRegion:'Jharkhand',postalCode:'828116',addressCountry:'IN'},priceRange:'₹₹'};}
function crumbSchema(items){return {'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map((x,i)=>({'@type':'ListItem',position:i+1,name:x[0],item:seoBase()+x[1]}))};}
function productSchema(p){
  const b=seoBase(),revs=(DB.reviews||[]).filter(r=>r.status==='Published'&&r.product===p.name),obj={'@context':'https://schema.org','@type':'Product','@id':b+'/product/'+encodeURIComponent(p.id)+'#product',name:p.name,description:p.desc||p.sub||'',image:[absoluteAsset(p.img)].filter(Boolean),sku:String(p.id),brand:{'@type':'Brand',name:'Green Ocean'},offers:{'@type':'Offer',url:b+'/product/'+encodeURIComponent(p.id),priceCurrency:'INR',price:Number(p.price||0).toFixed(2),availability:p.stock>0?'https://schema.org/InStock':'https://schema.org/OutOfStock',itemCondition:'https://schema.org/NewCondition',seller:{'@id':b+'/#business'}}};
  if(revs.length){const avg=revs.reduce((a,r)=>a+Number(r.rating||0),0)/revs.length;obj.aggregateRating={'@type':'AggregateRating',ratingValue:avg.toFixed(1),reviewCount:revs.length};obj.review=revs.slice(0,8).map(r=>({'@type':'Review',author:{'@type':'Person',name:r.name},datePublished:r.date,reviewBody:r.text,reviewRating:{'@type':'Rating',ratingValue:Number(r.rating||0),bestRating:5,worstRating:1},...(r.photo?{image:r.photo}:{})}));}
  return obj;
}
function categorySchema(c,list){const b=seoBase();return {'@context':'https://schema.org','@type':'CollectionPage',name:c?c.name:'Plants, Planters & Gardening',url:b+location.pathname+location.search,mainEntity:{'@type':'ItemList',itemListElement:list.slice(0,24).map((p,i)=>({'@type':'ListItem',position:i+1,url:b+'/product/'+encodeURIComponent(p.id),name:p.name}))}};}
function faqSchema(p){const blocks=String((p&&p.body)||'').split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean),qa=blocks.map(block=>{const m=block.match(/^(.+?)\s+[—–-]\s+([\s\S]+)$/);return m?{q:m[1].trim(),a:m[2].trim()}:null;}).filter(Boolean);return qa.length?{'@context':'https://schema.org','@type':'FAQPage',mainEntity:qa.map(x=>({'@type':'Question',name:x.q,acceptedAnswer:{'@type':'Answer',text:x.a}}))}:null;}
function applyPageSEO(seg,query){
  const b=seoBase(),pub=!['admin','account','orders','cart','checkout','thanks','login','signup','wishlist'].includes(seg[0]||'');
  const robots=pub?'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1':'noindex,follow';setMeta('robots',robots);
  let title=DB.settings.metaTitle||'Green Ocean — Plants, Planters & Gifts',desc=DB.settings.metaDesc||'Healthy nursery-fresh plants, planters and gifts delivered across India.';
  const cleanPath=(location.pathname||'/').replace(/\/+$/,'')||'/';
  let url=b+cleanPath,schemas=[];
  if(pub)schemas.push(businessSchema());
  if(!seg[0]){title='Green Ocean — Buy Indoor Plants, Planters & Plant Gifts Online';schemas.push(crumbSchema([['Home','/']]));}
  else if(seg[0]==='product'){
    const p=prod(seg[1]);if(p){const c=cat(p.cat);title=`${p.name} | Buy Online at Green Ocean`;desc=p.desc||p.sub||desc;schemas.push(productSchema(p));schemas.push(crumbSchema([['Home','/'],['Shop','/shop'],[c?c.name:'Category','/shop?cat='+encodeURIComponent(p.cat)],[p.name,'/product/'+encodeURIComponent(p.id)]]));}
  } else if(seg[0]==='shop'){
    const q=new URLSearchParams(query),c=cat(q.get('cat'));const list=DB.products.filter(p=>p.active&&(!c||p.cat===c.id));if(c)url=b+'/shop?cat='+encodeURIComponent(c.id);title=c?`${c.name} | Green Ocean Online Nursery`:'Shop Plants, Planters & Gardening | Green Ocean';desc=c?(c.desc||`Shop ${c.name} from Green Ocean.`):'Shop nursery-fresh plants, planters, gardening essentials and plant gifts from Green Ocean.';schemas.push(categorySchema(c,list));schemas.push(crumbSchema(c?[['Home','/'],['Shop','/shop'],[c.name,'/shop?cat='+encodeURIComponent(c.id)]]:[['Home','/'],['Shop','/shop']]));
  } else if(seg[0]==='page'){
    const p=DB.pages.find(x=>x.slug===seg[1]);if(p){title=`${p.title} | Green Ocean`;desc=String(p.body||'').replace(/\s+/g,' ').slice(0,155)||desc;schemas.push(crumbSchema([['Home','/'],[p.title,'/page/'+encodeURIComponent(p.slug)]]));if(p.slug==='faq')schemas.push(faqSchema(p));}
  } else if(seg[0]==='blog'){
    const post=seg[1]&&DB.blogs.find(x=>x.id===seg[1]);title=post?`${post.title} | Green Ocean Plant Care`:'Green Ocean Plant Care — Guides & Tips';desc=post?(post.excerpt||post.body||'').replace(/\s+/g,' ').slice(0,155):'Practical plant care guides for watering, light, repotting and healthier indoor plants.';schemas.push(crumbSchema(post?[['Home','/'],['Plant Care','/blog'],[post.title,'/blog/'+encodeURIComponent(post.id)]]:[['Home','/'],['Plant Care','/blog']]));
  }
  document.title=title;setMeta('description',desc);setMeta('og:title',title,true);setMeta('og:description',desc,true);setMeta('og:type',seg[0]==='product'?'product':'website',true);setCanonical(url);putJSONLD(schemas);
}
function initPremiumMotion(scope){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const nodes=[...(scope||document).querySelectorAll('.card,.trust-i,.pdp-trust-item,.review-card,.blog-card,.story-trust-item,.story-step-v2')].slice(0,40);if(!nodes.length)return;document.body.classList.add('motion-ready');nodes.forEach(n=>n.classList.add('premium-reveal'));
  if(!('IntersectionObserver'in window)){nodes.forEach(n=>n.classList.add('is-visible'));return;}
  const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('is-visible');io.unobserve(x.target);}}),{rootMargin:'0px 0px -4% 0px',threshold:.08});nodes.forEach(n=>io.observe(n));
}
let LAST_MAIN_PAGE='';
function resetCheckoutFlow(){CO_STEP=1;CO_COUPON='';CPN_MSG=null;if(DB)DB.coupon='';}
function paint(){
  const {seg,query}=route();
  const mainPage=seg[0]||'home';
  if(mainPage==='checkout'&&LAST_MAIN_PAGE!=='checkout')resetCheckoutFlow();
  if(mainPage!=='checkout'&&LAST_MAIN_PAGE==='checkout')resetCheckoutFlow();
  LAST_MAIN_PAGE=mainPage;
  const root=$('#root'); let html='';
  if(seg[0]==='admin'){
    if(!DB.admin){html=adminLogin();}
    else{
      const page=seg[1]||'dashboard';
      const map={dashboard:admDashboard,products:()=>admProducts(query),categories:admCategories,orders:()=>admOrders(query),returns:admReturns,
        customers:admCustomers,inventory:admInventory,banners:admBanners,offers:admOffers,blog:admBlog,reviews:admReviews,
        pages:admPages,newsletter:admNewsletter,messages:admMessages,settings:admSettings,appearance:admAppearance,media:admMedia,reports:admReports,account:admAccount};
      html=(map[page]||admDashboard)();
    }
  } else {
    switch(seg[0]){
      case undefined: html=viewHome(); break;
      case 'shop': html=viewShop(query); break;
      case 'product': html=viewProduct(seg[1]); break;
      case 'cart': html=viewCart(); break;
      case 'wishlist': html=viewWishlist(); break;
      case 'checkout': html=viewCheckout(); break;
      case 'thanks': html=viewThanks(seg[1]); break;
      case 'orders': html=viewOrders(); break;
      case 'account': html=viewAccount(); break;
      case 'login': html=DB.session?viewAccount():viewLogin(); break;
      case 'signup': html=DB.session?viewAccount():viewSignup(); break;
      case 'page': html=viewPage(seg[1]); break;
      case 'blog': html=viewBlog(seg[1]); break;
      case 'sitemap': html=viewSitemap(); break;
      default: html=viewHome();
    }
  }
  root.innerHTML=html;
  upgradeInternalLinks(root);
  document.documentElement.style.setProperty('--green-800',DB.settings.theme||'#0F4632');
  applyMediaAssets();
  applyPageSEO(seg,query);
  if(seg[0]!=='admin')requestAnimationFrame(()=>{initPremiumMotion(root);initHomeHeroSlider(root);});
  if(seg[0]==='admin'&&DB.admin&&query.includes('new=1')){
    const p=seg[1];
    if(p==='products')productForm('new'); if(p==='offers')couponForm('new'); if(p==='banners')bannerForm('new');
  }
  const q=(new URLSearchParams(query)).get('q');
  if(q){const i=document.querySelector('.search input'); if(i)i.value=q;}
  if(seg[0]==='admin'&&DB.admin&&API.on)loadInbox(false);
  if((seg[0]==='orders'||seg[0]==='account')&&DB.session&&API.on)setTimeout(()=>syncMyOrders(false),0);
}
let NAV_DEPTH=0;
window.addEventListener('popstate',()=>{FORM_DIRTY=false;closeLayer();window.scrollTo(0,0);paint();});
window.addEventListener('hashchange',()=>{
  if(location.hash&&location.hash.startsWith('#/admin')){FORM_DIRTY=false;closeLayer();window.scrollTo(0,0);paint();return;}
  if(migrateLegacyHashRoute()){FORM_DIRTY=false;closeLayer();window.scrollTo(0,0);paint();}
});

/* ================= EVENTS ================= */
document.addEventListener('click',e=>{
  if(e.target.classList&&e.target.classList.contains('ov')){closeLayer();return;}
  const internal=e.target.closest&&e.target.closest('a[href^="/"]');
  if(internal&&internal.target!=='_blank'&&!internal.hasAttribute('download')){e.preventDefault();if(internal.dataset.close!==undefined)closeLayer();go(internal.getAttribute('href'));return;}
  const t=e.target.closest('[data-close]:not(.ov),[data-add],[data-buy],[data-wish],[data-qty],[data-rm],[data-link],[data-act],[data-edit-product],[data-del-product],[data-toggle-product],[data-edit-cat],[data-del-cat],[data-view-order],[data-fulfill-order],[data-request-return],[data-view-return],[data-return-status],[data-advance],[data-cancel-admin],[data-cancel],[data-reorder],[data-view-cust],[data-del-cust],[data-adjust-stock],[data-stock-save],[data-edit-banner],[data-del-banner],[data-toggle-banner],[data-edit-media],[data-reset-media],[data-edit-coupon],[data-del-coupon],[data-toggle-coupon],[data-edit-blog],[data-del-blog],[data-edit-page],[data-del-page],[data-pub-review],[data-hide-review],[data-del-review],[data-del-sub],[data-brand],[data-msg-read],[data-msg-del]');
  if(!t)return;
  const d=t.dataset;
  if(d.close!==undefined){closeLayer(); if(t.tagName!=='A')return; return;}
  if(d.add){e.preventDefault();addToCart(d.add);return;}
  if(d.buy){e.preventDefault();addToCart(d.buy);closeLayer();go('#/checkout');return;}
  if(d.wish){e.preventDefault();toggleWish(d.wish);return;}
  if(d.qty){e.preventDefault();const l=DB.cart.find(i=>i.id===d.qty);setQty(d.qty,l.qty+(+d.d));if($('.drawer'))openCart();return;}
  if(d.rm){e.preventDefault();setQty(d.rm,0);if($('.drawer'))openCart();return;}
  if(d.link){e.preventDefault();closeLayer();go(d.link);return;}
  if(d.cancel){confirmBox('Cancel order #'+d.cancel+'? Reserved stock will be released.',async()=>{
    const o=DB.orders.find(x=>x.id===d.cancel);if(!o)return;
    if(API.on&&DB.session){const r=await API.call('/api/orders/cancel',{method:'POST',body:{id:o.id,email:DB.session.email}});if(!r.ok){toast(r.error,true);return;}Object.assign(o,r.order||{status:'Cancelled'});}
    else{o.status='Cancelled';o.items.forEach(i=>{const p=prod(i.id);if(p)p.stock+=i.qty;});}
    save();paint();toast('Order cancelled');});return;}
  if(d.reorder){const o=DB.orders.find(x=>x.id===d.reorder);
    o.items.forEach(i=>{if(prod(i.id))addToCart(i.id,i.qty);}); go('#/cart'); return;}
  /* --- admin --- */
  if(d.editProduct){productForm(d.editProduct);return;}
  if(d.delProduct){const p=prod(d.delProduct);confirmBox('Delete “'+p.name+'” from the store?',()=>{
    DB.products=DB.products.filter(x=>x.id!==d.delProduct);save();paint();toast('Product deleted');});return;}
  if(d.toggleProduct){const p=prod(d.toggleProduct);p.active=!p.active;save();paint();toast(p.active?'Now visible':'Hidden from website');return;}
  if(d.editCat){catForm(d.editCat);return;}
  if(d.delCat){confirmBox('Delete this category? Products stay, but lose their group.',()=>{
    DB.categories=DB.categories.filter(x=>x.id!==d.delCat);save();paint();toast('Category deleted');});return;}
  if(d.viewOrder){orderView(d.viewOrder);return;}
  if(d.fulfillOrder){fulfillmentModal(d.fulfillOrder);return;}
  if(d.requestReturn){requestReturn(d.requestReturn);return;}
  if(d.viewReturn){returnView(d.viewReturn);return;}
  if(d.returnStatus){updateReturn(d.returnKey,d.returnStatus);return;}
  if(d.advance){const o=DB.orders.find(x=>x.id===d.advance);const i=STEPS.indexOf(o.status);
    closeLayer(); setOrderStatus(o,STEPS[Math.min(i+1,2)]||'Processing').then(ok=>{if(ok)toast('Order marked '+o.status);});return;}
  if(d.cancelAdmin){const o=DB.orders.find(x=>x.id===d.cancelAdmin); closeLayer(); setOrderStatus(o,'Cancelled').then(ok=>{if(ok)toast('Order cancelled');});return;}
  if(d.msgRead){const m=API.messages.find(x=>x._key===d.msgRead); if(m){m.read=true;paint();
    API.call('/api/admin/item/'+encodeURIComponent(m._key),{method:'PATCH',admin:true,body:{read:true}});} return;}
  if(d.msgDel){confirmBox('Delete this message?',async()=>{ if(await deleteItem(d.msgDel)){API.messages=API.messages.filter(x=>x._key!==d.msgDel);paint();toast('Message deleted');} });return;}
  if(d.viewCust){const c=DB.customers.find(x=>x.id===d.viewCust); if(!c)return;
    const his=DB.orders.filter(o=>(o.email||'').toLowerCase()===(c.email||'').toLowerCase());
    openModal(c.name,`<p style="margin:0 0 10px;color:var(--muted);font-size:13.5px">${esc(c.email)} · ${esc(c.phone)} · ${esc(c.city)}</p>
      <div class="sumrow"><span>Orders</span><b>${c.orders}</b></div><div class="sumrow"><span>Lifetime spend</span><b>${money(c.spent)}</b></div>
      <div class="sumrow"><span>Customer since</span><b>${esc(c.joined)}</b></div>
      <h4 style="margin:14px 0 6px">Order history</h4>
      ${his.length?his.map(o=>`<div class="orow"><b>#${esc(o.id)}</b><span style="flex:1">${esc(o.date)}</span><b>${money(o.total)}</b>
        <span class="pill ${o.status==='Delivered'?'green':'amber'}">${esc(o.status)}</span></div>`).join(''):'<p style="color:var(--muted);font-size:13px">No orders stored in this store yet.</p>'}`,
      `<button class="btn btn-danger btn-sq" data-del-cust="${esc(c.id)}">Remove from list</button><button class="btn btn-line btn-sq" data-close="1">Close</button>`);return;}
  if(d.delCust){const c=DB.customers.find(x=>x.id===d.delCust); if(!c)return;
    closeLayer(); confirmBox('Remove '+c.name+' from the Customers list? Past orders and their sign-in account will not be deleted.',()=>{
      DB.hiddenCustomers=DB.hiddenCustomers||[]; const em=(c.email||'').toLowerCase(); if(em&&!DB.hiddenCustomers.includes(em))DB.hiddenCustomers.push(em);
      DB.customers=DB.customers.filter(x=>x.id!==c.id); save(); paint(); toast('Customer removed from the admin list'); });return;}
  if(d.adjustStock){const p=prod(d.adjustStock);if(!p)return;
    openModal('Adjust stock — '+p.name,`<div class="field"><label>Available units</label><input class="inp" id="stockAdjustInput" type="number" min="0" step="1" value="${+p.stock||0}"></div><div class="field"><label>Reason</label><select class="inp" id="stockAdjustReason"><option>New stock received</option><option>Physical stock count</option><option>Damaged / unsellable stock</option><option>Correction</option><option>Other</option></select></div><p class="fulfill-note">Website orders already reserve inventory automatically. Use manual adjustment only for real stock changes or corrections.</p>`, `<button class="btn btn-line btn-sq" data-close="1">Cancel</button><button class="btn btn-primary btn-sq" id="stockAdjustSave">Save adjustment</button>`);
    $('#stockAdjustSave').onclick=async()=>{const inp=$('#stockAdjustInput'),reason=$('#stockAdjustReason').value,next=Math.max(0,Math.floor(+inp.value||0)),btn=$('#stockAdjustSave'),label=btn.textContent;btn.disabled=true;btn.textContent='Saving…';
      if(API.on){const r=await API.call('/api/admin/stock/'+encodeURIComponent(p.id),{method:'PATCH',admin:true,body:{stock:next,reason}});btn.disabled=false;btn.textContent=label;if(!r.ok){toast(r.error,true);return;}p.stock=next;DB.storeVer=r.updatedAt||DB.storeVer;closeLayer();save();paint();toast(p.name+' stock updated');loadInbox(true);}
      else{p.stock=next;save();closeLayer();paint();toast(p.name+' stock adjusted locally');}};return;}
  if(d.editBanner){bannerForm(d.editBanner);return;}
  if(d.editMedia){mediaForm(d.editMedia);return;}
  if(d.resetMedia){confirmBox('Restore the original website image?',()=>mediaReset(d.resetMedia));return;}
  if(d.delBanner){confirmBox('Delete this banner?',()=>{DB.banners=DB.banners.filter(x=>x.id!==d.delBanner);save();paint();toast('Banner deleted');});return;}
  if(d.toggleBanner){const b=DB.banners.find(x=>x.id===d.toggleBanner);b.active=!b.active;save();paint();return;}
  if(d.editCoupon){couponForm(d.editCoupon);return;}
  if(d.delCoupon){confirmBox('Delete this coupon?',()=>{DB.coupons=DB.coupons.filter(x=>x.id!==d.delCoupon);save();paint();toast('Coupon deleted');});return;}
  if(d.toggleCoupon){const k=DB.coupons.find(x=>x.id===d.toggleCoupon);k.active=!k.active;save();paint();return;}
  if(d.editBlog){blogForm(d.editBlog);return;}
  if(d.delBlog){confirmBox('Delete this post?',()=>{DB.blogs=DB.blogs.filter(x=>x.id!==d.delBlog);save();paint();toast('Post deleted');});return;}
  if(d.editPage){pageForm(d.editPage);return;}
  if(d.delPage){confirmBox('Delete this page?',()=>{DB.pages=DB.pages.filter(x=>x.id!==d.delPage);save();paint();toast('Page deleted');});return;}
  if(d.pubReview){
    const pend=(API.pendingReviews||[]).find(x=>x.id===d.pubReview);
    if(pend){ const {_key,_pending,...clean}=pend; clean.status='Published'; DB.reviews.unshift(clean); rateProduct(clean,1);
      API.pendingReviews=API.pendingReviews.filter(x=>x!==pend); save(); paint(); deleteItem(_key); toast('Review published on the website'); return; }
    const rv=DB.reviews.find(x=>x.id===d.pubReview); rv.status='Published'; rateProduct(rv,1); save();paint();toast('Review published');return;}
  if(d.hideReview){const rv=DB.reviews.find(x=>x.id===d.hideReview); rv.status='Pending'; rateProduct(rv,-1); save();paint();return;}
  if(d.delReview){confirmBox('Delete this review?',()=>{
    const pend=(API.pendingReviews||[]).find(x=>x.id===d.delReview);
    if(pend){ API.pendingReviews=API.pendingReviews.filter(x=>x!==pend); deleteItem(pend._key); paint(); return; }
    const rv=DB.reviews.find(x=>x.id===d.delReview); if(rv&&rv.status==='Published')rateProduct(rv,-1);
    DB.reviews=DB.reviews.filter(x=>x.id!==d.delReview);save();paint();});return;}
  if(d.delSub){const key=d.delSub; DB.subscribers=DB.subscribers.filter(x=>x.id!==key);save();paint();
    if(API.on&&/^sub:/.test(key))deleteItem(key); toast('Removed');return;}
  if(d.brand){DB.settings.theme=d.brand;save();paint();toast('Brand colour updated');return;}
  /* --- named actions --- */
  switch(d.act){
    case 'back': { closeLayer();
      if(NAV_DEPTH>0){NAV_DEPTH-=2;history.back();} else go(d.href||'#/'); break;}
    case 'sitemap': {
      const dom=(document.querySelector('[name="domain"]')||{}).value||'';
      if(!/^https?:\/\//.test(dom.trim())){toast('Add your website address first, like https://greenocean.in',true);break;}
      DB.settings.domain=dom.trim(); save();
      try{const a=document.createElement('a');
        a.href='data:application/xml;charset=utf-8,'+encodeURIComponent(sitemapXML(dom));
        a.download='sitemap.xml';a.click();toast('sitemap.xml downloaded');}
      catch(e){toast('Could not download here',true);}
      break;}
    case 'accountEdit': { const n=document.getElementById('accountName'); if(n){n.focus();n.select();} break; }
    case 'accountMenu': openModal('Account',`<div style="display:grid;gap:10px"><a class="btn btn-line btn-sq btn-block" href="#/orders" data-close="1">${ic('bag',16)} My orders</a><button class="btn btn-danger btn-sq btn-block" data-act="logout">Sign out</button></div>`,''); break;
    case 'cart': openCart(); break;
    case 'heroPrev': { const box=document.querySelector('[data-home-slider]'); if(box&&box.__setHomeHero){const i=+box.dataset.index||0; box.__setHomeHero(i-1);} break; }
    case 'heroNext': { const box=document.querySelector('[data-home-slider]'); if(box&&box.__setHomeHero){const i=+box.dataset.index||0; box.__setHomeHero(i+1);} break; }
    case 'heroDot': { const box=document.querySelector('[data-home-slider]'); if(box&&box.__setHomeHero){box.__setHomeHero(+d.i||0);} break; }
    case 'menu': openDrawer('Menu',`<form class="search" data-act="search" style="display:flex;max-width:none;margin:0 0 12px"><span>${ic('search',16)}</span>
        <input name="q" placeholder="Search plants, planters..." aria-label="Search products"></form>
      ${NAV_MAIN.map(n=>`<a class="mline" href="${n[1]}" data-close="1" style="${navOn(n[2])?'color:var(--green-700);font-weight:700':''}">${n[0]}</a>`).join('')}`,'','left');
      if(t.classList.contains('msearch')){const i=document.querySelector('.drawer .search input'); if(i)i.focus();} break;
    case 'admMenu': $('#side').classList.toggle('open'); break;
    case 'admLogout': adminSignOut();toast('Signed out of admin'); break;
    case 'eye': { const inp=t.parentElement.querySelector('input'); const show=inp.type==='password';
      inp.type=show?'text':'password'; t.innerHTML=ic(show?'eyeoff':'eye',18); t.setAttribute('aria-label',show?'Hide password':'Show password'); break; }
    case 'authTab': AUTH_TAB=d.tab||'pw'; OTP_SENT_EMAIL=''; paint(); break;
    case 'otpChangeEmail': e.preventDefault(); OTP_SENT_EMAIL=''; paint(); break;
    case 'forgot': e.preventDefault(); openModal('Reset your password',
      `<div class="field"><label>Email address</label><input class="inp" id="fpEmail" type="email" placeholder="Enter the email on your account"></div>
       <p style="margin:8px 0 0;font-size:12.5px;color:var(--muted)">We'll email you a link to set a new password. Signed up with only a mobile number? Message us on WhatsApp instead.</p>`,
      `<a class="btn btn-line btn-sq" target="_blank" rel="noopener" href="https://wa.me/${waNumber()}?text=${encodeURIComponent('Hi Green Ocean, I forgot my website password. My registered mobile number is ')}">${ic('phone',15)} WhatsApp</a>
       <button class="btn btn-primary btn-sq" id="fpSend">Send reset link</button>`);
      $('#fpSend').onclick=async()=>{
        const em=($('#fpEmail').value||'').trim(); const chk=RULES.email(em);
        if(chk!==true){toast(chk,true);return;}
        const btn=$('#fpSend'); btn.disabled=true; btn.textContent='Sending…';
        const res=await SB.resetPassword(em);
        btn.disabled=false; btn.textContent='Send reset link';
        if(!res.ok){toast(res.error,true);return;}
        closeLayer(); toast('Check your inbox for the reset link');};
      break;
    case 'socialLogin':
      if((d.p||'Google')==='Google'){ SB.signInWithGoogle(); break; }
      openModal('Continue with Apple',`<p style="margin:0;line-height:1.6">Apple sign-in isn't available yet. Please use email/mobile, OTP, or Google for now.</p>`,
        `<button class="btn btn-primary btn-sq" data-close="1">OK</button>`); break;
    case 'syncInventory': { if(!API.on){toast('Preview mode uses the inventory saved in this browser');break;} toast('Syncing live inventory…'); loadInbox(true); break; }
    case 'publishNow': schedulePublish(true); toast('Publishing to the live website…'); break;
    case 'contactAgain': paint(); break;
    case 'logout': SB.signOut();DB.afterLogin='';DB.session=null;DB.sessionTemp=false;DB.cart=[];DB.coupon='';CO_COUPON='';CPN_MSG=null;CO_STEP=1;save();go('/');toast('Signed out — basket cleared'); break;
    case 'openShopFilter': {
      const f=document.getElementById('shopFilters'), sh=document.getElementById('shopFilterShade');
      if(f){f.classList.add('open');sh&&sh.classList.add('open');document.body.classList.add('filter-lock');
        if(d.panel==='sort')setTimeout(()=>{const g=f.querySelector('[data-filter-group="sort"]');if(g)g.scrollIntoView({block:'start',behavior:'smooth'});},80);}
      break;}
    case 'closeShopFilter': {
      const f=document.getElementById('shopFilters'), sh=document.getElementById('shopFilterShade');
      f&&f.classList.remove('open');sh&&sh.classList.remove('open');document.body.classList.remove('filter-lock');break;}
    case 'applyFilter': {
      const p=new URLSearchParams();
      const g=n=>{const el=document.querySelector(`#shopFilters input[name="${n}"]:checked`);return el?el.value:'';};
      const current=route(); const old=new URLSearchParams(current.query||''); if(old.get('q'))p.set('q',old.get('q'));
      if(g('cat'))p.set('cat',g('cat')); if(g('max'))p.set('max',g('max')); if(g('sort')&&g('sort')!=='pop')p.set('sort',g('sort'));
      document.body.classList.remove('filter-lock');
      go('#/shop'+(p.toString()?'?'+p:'')); break;}
    case 'clearFilter': document.body.classList.remove('filter-lock'); go('#/shop'); break;
    case 'checkoutNext': {
      const step=+d.step||Math.min(4,CO_STEP+1);
      if(CO_STEP===2&&!validateCheckoutAddress())break;
      checkoutShowStep(step,false); break;}
    case 'checkoutBack': checkoutShowStep(+d.step||Math.max(1,CO_STEP-1),true); break;
    case 'applyCoupon': e.preventDefault(); applyCheckoutCoupon(); break;
    case 'removeCoupon': clearCheckoutCoupon(true); const ci=document.getElementById('cpn'); if(ci)ci.value=''; break;
    case 'writeReview': {
      let reviewPhoto='';
      openModal('Write a review',`<form id="rForm" novalidate><div class="field"><label>Your name</label><input class="inp" name="name" data-v="name" data-label="Your name" placeholder="Enter your full name" value="${esc((DB.session&&DB.session.name)||'')}"></div>
        <div class="field"><label>Rating</label><select class="inp" name="rating">${[5,4,3,2,1].map(n=>`<option value="${n}">${n} star${n>1?'s':''}</option>`).join('')}</select></div>
        <div class="field"><label>Your review</label><textarea class="inp" name="text" data-v="text" data-label="Review" placeholder="How did your plant arrive?"></textarea></div>
        <div class="field"><label>Add a real product photo <span style="font-weight:500;color:var(--muted)">(optional)</span></label><div class="review-photo-input"><input class="inp" type="file" accept="image/*" id="rPhoto"><img id="rPhotoPreview" class="review-photo-preview" alt="Review photo preview"></div><div class="photo-note">${ic('image',14)} <span>Photos are compressed before upload for faster mobile loading. Only publish photos you took or have permission to share.</span></div></div>
        <input type="hidden" name="product" value="${esc(d.p)}"></form>`,
        `<button class="btn btn-line btn-sq" data-close="1">Cancel</button><button class="btn btn-primary btn-sq" id="rSave">Submit review</button>`);
      const rp=$('#rPhoto'),preview=$('#rPhotoPreview');if(rp)rp.onchange=e=>{const file=e.target.files&&e.target.files[0];if(!file)return;readReviewImage(file,u=>{reviewPhoto=u;if(preview){preview.src=u;preview.style.display='block';}toast('Photo ready');});};
      $('#rSave').onclick=async()=>{const f=$('#rForm'); if(!validateForm(f))return;
        const v=Object.fromEntries(new FormData(f).entries());
        if(API.on){ const btn=$('#rSave'); btn.disabled=true; btn.textContent='Sending…';
          const res=await API.call('/api/reviews',{method:'POST',body:{product:v.product,name:v.name,rating:+v.rating,text:v.text,photo:reviewPhoto}});
          if(!res.ok){btn.disabled=false;btn.textContent='Submit review';toast(res.error,true);return;} }
        else DB.reviews.unshift({id:uid('r'),product:v.product,name:v.name,rating:+v.rating,text:v.text,photo:reviewPhoto,date:today(),status:'Pending'});
        save();closeLayer();toast('Thank you, '+v.name.split(' ')[0]+'! Your review will appear once our team checks it.');};
      break;}
    case 'exportOrders': {
      const rows=[['Order','Customer','Phone','Total','Payment','Status','Date']].concat(
        DB.orders.map(o=>[o.id,o.name,o.phone,o.total,o.pay,o.status,o.date]));
      download('orders.csv',rows.map(r=>r.join(',')).join('\n')); break;}
    case 'exportSubs': download('subscribers.csv',DB.subscribers.map(s=>s.email).join('\n')); break;
    case 'launch': confirmBox('Remove all sample orders, customers, accounts, reviews and subscribers? Products, banners and pages stay.',()=>{
      DB.orders=[];DB.customers=[];DB.users=[];DB.reviews=[];DB.subscribers=[];DB.session=null;DB.cart=[];DB.wish=[];DB.coupon='';
      DB.products.forEach(p=>{p.rating=0;p.reviews=0;}); DB.counter=1001; DB.launched=true; save(); paint();
      toast('Sample data removed — your store is ready for real customers');}); break;
    case 'reset':
      if(API.on){ confirmBox('Throw away changes in this browser and load the live website data?',async()=>{
        const s=await API.call('/api/store'); if(s.ok&&s.store){applyStore(s.store);API.lastPub=pubString();API.status='live';paint();toast('Loaded the live website data');}
        else toast(s.error||'Nothing published yet',true);}); break; }
    case 'reset': confirmBox('Reset the whole store back to demo content?',()=>{resetAll();go('#/admin/dashboard');paint();toast('Store reset');}); break;
    case 'notif': {const rows=(API.messages||[]).filter(m=>!m.read).map(m=>`<div class="orow"><b>✉️</b><span style="flex:1">${esc(m.name)} sent a message</span><a class="link-more" href="#/admin/messages" data-close="1">Open</a></div>`).join('')+DB.orders.filter(o=>['Processing','Packed'].includes(o.status)).map(o=>`<div class="orow"><b>#${esc(o.id)}</b><span style="flex:1">${esc(o.name)} · ${esc(o.status)}</span><a class="link-more" href="#/admin/orders" data-close="1">Open</a></div>`).join('')+(API.returns||[]).filter(r=>['Requested','Under review'].includes(r.status)).map(r=>`<div class="orow"><b>↩</b><span style="flex:1">${esc(r.id)} · ${esc(r.status)}</span><a class="link-more" href="#/admin/returns" data-close="1">Review</a></div>`).join('');openModal('Notifications',rows||'<div class="empty">Nothing new right now.</div>',`<button class="btn btn-line btn-sq" data-close="1">Close</button>`);break;}
  }
});
function download(name,text){
  try{const a=document.createElement('a');
    a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(text);a.download=name;a.click();toast('Downloaded '+name);}
  catch(e){toast('Could not download here',true);}
}
function rateProduct(rv,dir){
  const p=DB.products.find(x=>x.name===rv.product); if(!p)return;
  const n=p.reviews||0, sum=(p.rating||0)*n + dir*rv.rating, m=Math.max(0,n+dir);
  p.reviews=m; p.rating=m?Math.round(sum/m*10)/10:0;
}
async function submitOrderLive(f){
  const d=Object.fromEntries(new FormData(f).entries());
  const wa=DB.settings.orderMode==='whatsapp';
  const btn=f.querySelector('button[type="submit"]'), label=btn.innerHTML;
  btn.disabled=true; btn.innerHTML='Placing your order…'; $('#coErr').innerHTML='';
  const win=wa?window.open('','_blank'):null;
  let authToken='';
  if(sb&&DB.session&&DB.session.id){try{const s=await sb.auth.getSession();authToken=s&&s.data&&s.data.session&&s.data.session.access_token||'';}catch(e){}}
  const res=await API.call('/api/orders',{method:'POST',authToken,body:{...d,coupon:CO_COUPON||'',via:wa?'WhatsApp':'Website',
    items:DB.cart.map(l=>{const p=prod(l.id);return{id:l.id,qty:l.qty,name:p&&p.name,price:p&&p.price,art:p&&p.art};})}});
  if(!res.ok){ if(win)win.close(); btn.disabled=false; btn.innerHTML=label;
    $('#coErr').innerHTML=`<div class="form-err" role="alert">${esc(res.error)}</div>`; $('#coErr').scrollIntoView({block:'center'}); return; }
  const id=placeOrder(f,res);
  const o=DB.orders.find(x=>x.id===id);
  if(win&&o){ try{ win.location.href=orderWhatsAppLink(o); }catch(e){} }
}
/* ---------- change events ---------- */
document.addEventListener('change',e=>{
  if(e.target.type==='checkbox'&&e.target.dataset.v)markField(e.target);
  if(e.target.dataset.range){DASH_RANGE=+e.target.value;paint();return;}
  const st=e.target.dataset.status;
  if(st){const o=DB.orders.find(x=>x.id===st); const val=e.target.value;
    if(val==='Cancelled'&&!o._key)o.items.forEach(i=>{const p=prod(i.id);if(p)p.stock+=i.qty;});
    setOrderStatus(o,val).then(ok=>{if(ok)toast('Order #'+st+' is now '+val);});}
});
/* ---------- form submits ---------- */
document.addEventListener('submit',async e=>{
  const f=e.target, act=f.dataset.act;
  if(act==='search'){e.preventDefault();const q=new FormData(f).get('q');go('#/shop?q='+encodeURIComponent(q||''));return;}
  if(act==='admSearch'){e.preventDefault();const q=new FormData(f).get('q');go('#/admin/products?q='+encodeURIComponent(q||''));return;}
  if(act==='subscribe'){e.preventDefault(); if(!validateForm(f))return; const em=new FormData(f).get('email').trim().toLowerCase();
    const who=(DB.session&&DB.session.name)||em.split('@')[0].replace(/[^a-z]/gi,' ').trim()||'friend';
    const done=()=>{ const box=f.parentElement; f.remove(); box.insertAdjacentHTML('beforeend',thankYouCard(who,em,'news')); };
    if(API.on){ const b=f.querySelector('button'); b.disabled=true; b.textContent='Joining…';
      API.call('/api/subscribe',{method:'POST',body:{email:em}}).then(res=>{
        if(!res.ok){b.disabled=false;b.textContent='Subscribe';toast(res.error,true);return;}
        done(); }); return; }
    if(!DB.subscribers.some(s=>s.email===em))DB.subscribers.unshift({id:uid('s'),email:em,date:today()});
    save(); done(); return;}
  if(act==='contactForm'){e.preventDefault(); if(!validateForm(f))return;
    const d=Object.fromEntries(new FormData(f).entries());
    const text=`Message from ${location.host||'greenocean.co.in'}\nName: ${d.name}\nEmail: ${d.email}\nMobile: ${d.phone}\n\n${d.msg}`;
    const via=(e.submitter&&e.submitter.dataset.via)||(API.on?'api':'wa');
    if(via==='api'){ const b=f.querySelector('[data-via="api"]'); b.disabled=true; b.innerHTML='Sending…';
      API.call('/api/contact',{method:'POST',body:d}).then(res=>{
        if(!res.ok){ b.disabled=false; b.innerHTML='Send message'; toast(res.error,true); return; }
        f.outerHTML=thankYouCard(d.name,d.email,'contact'); window.scrollTo({top:0,behavior:'smooth'}); });
      return; }
    if(via==='mail') location.href='mailto:'+DB.settings.email+'?subject='+encodeURIComponent('Website enquiry from '+d.name)+'&body='+encodeURIComponent(text);
    else window.open('https://wa.me/'+waNumber()+'?text='+encodeURIComponent(text),'_blank','noopener');
    f.reset(); f.querySelectorAll('.inp').forEach(i=>i.classList.remove('good','bad'));
    toast(via==='mail'?'Your email app is opening — press send there':'WhatsApp is opening — press send there');return;}
  if(act==='campaign'){e.preventDefault(); if(!validateForm(f))return; f.reset();toast('Campaign saved as a draft');return;}
  if(f.id==='admForm'){e.preventDefault(); if(!validateForm(f))return; const d=Object.fromEntries(new FormData(f).entries());
    if(API.on){
      if(d.user.trim().toLowerCase()!=='admin'){toast('Username or password is wrong',true);return;}
      const b=f.querySelector('button[type="submit"]'); b.disabled=true; b.textContent='Checking…';
      API.key=d.pass;
      API.call('/api/admin/check',{method:'POST',admin:true,body:{}}).then(res=>{
        b.disabled=false; b.textContent='Sign in';
        if(!res.ok){ API.key=null; toast(res.status===503?'Admin password is not set in Cloudflare yet (ADMIN_PASSWORD).':'Username or password is wrong',true); return; }
        try{sessionStorage.setItem('go_admin_key',d.pass);}catch(e){}
        DB.admin=true; save(); go('#/admin/dashboard'); paint(); loadInbox(true); toast('Welcome back');
        if(API.storeMissing)schedulePublish(true); });
      return; }
    if(d.user.trim().toLowerCase()==='admin'&&d.pass===DB.settings.adminPass){
      DB.admin=true;save();go('#/admin/dashboard');paint();toast('Welcome back');}
    else toast('Username or password is wrong',true);
    return;}
  if(f.id==='coForm'){e.preventDefault(); if(!validateForm(f))return;
    if(API.on){ submitOrderLive(f); return; }
    const id=placeOrder(f);
    if(DB.settings.orderMode==='whatsapp'){const o=DB.orders.find(x=>x.id===id); if(o)window.open(orderWhatsAppLink(o),'_blank','noopener');}
    return;}
  if(f.id==='suForm'){e.preventDefault(); if(!validateForm(f))return;
    const d=Object.fromEntries(new FormData(f).entries());
    const btn=f.querySelector('button[type="submit"]'),label=btn.innerHTML; btn.disabled=true; btn.innerHTML='Creating account…';
    const res=await SB.signUp({name:d.name.trim(),email:d.email.trim().toLowerCase(),phone:d.phone,pass:d.pass});
    btn.disabled=false; btn.innerHTML=label;
    if(!res.ok){toast(res.error,true); if(/already has an account/.test(res.error))go('#/login'); return;}
    if(res.needsConfirm){ openModal('Confirm your email',`<p style="margin:0;line-height:1.6">We've sent a confirmation link to <b>${esc(d.email)}</b>. Please open it, then come back and sign in.</p>`,
      `<button class="btn btn-primary btn-sq" data-close="1">OK</button>`); go('#/login'); return; }
    return;}
  if(f.id==='liForm'){e.preventDefault(); if(!validateForm(f))return;
    const d=Object.fromEntries(new FormData(f).entries());
    const btn=f.querySelector('button[type="submit"]'),label=btn.innerHTML; btn.disabled=true; btn.innerHTML='Signing in…';
    if(!d.remember)DB.sessionTemp=true;
    const res=await SB.signIn({login:d.email,pass:d.pass});
    btn.disabled=false; btn.innerHTML=label;
    if(!res.ok){toast(res.error,true);return;}
    // Do not depend only on the auth-state event: apply the returned session and navigate now.
    await SB.applySession(res.session);
    if(DB.session&&!DB.customers.some(c=>c.email===DB.session.email))
      DB.customers.unshift({id:DB.session.id,name:DB.session.name,email:DB.session.email,phone:DB.session.phone,city:'',orders:0,spent:0,joined:today()});
    const nx=DB.afterLogin; DB.afterLogin=''; save();
    try{sessionStorage.setItem('go_sess','1');}catch(e){}
    go(nx==='checkout'?'#/checkout':'#/account');
    toast('Welcome'+(DB.session&&DB.session.name?', '+DB.session.name.split(' ')[0]:'')+'!');
    return;}
  if(f.id==='otpForm'){e.preventDefault();
    const d=Object.fromEntries(new FormData(f).entries());
    const btn=f.querySelector('button'),label=btn.innerHTML;
    if(!OTP_SENT_EMAIL){
      const chk=RULES.email(d.email); if(chk!==true){toast(chk,true);return;}
      btn.disabled=true; btn.innerHTML='Sending…';
      const res=await SB.sendOtp(d.email.trim().toLowerCase());
      btn.disabled=false; btn.innerHTML=label;
      if(!res.ok){toast(res.error,true);return;}
      OTP_SENT_EMAIL=d.email.trim().toLowerCase(); paint(); toast('Code sent — check your email'); return;
    }
    if(!/^[0-9]{6}$/.test((d.token||'').trim())){toast('Enter the 6-digit code',true);return;}
    btn.disabled=true; btn.innerHTML='Verifying…';
    const res=await SB.verifyOtp(OTP_SENT_EMAIL,d.token.trim());
    btn.disabled=false; btn.innerHTML=label;
    if(!res.ok){toast(res.error,true);return;}
    OTP_SENT_EMAIL=''; try{sessionStorage.setItem('go_sess','1');}catch(e){}
    return;}
  if(f.id==='acForm'){e.preventDefault(); if(!validateForm(f))return;
    const d=Object.fromEntries(new FormData(f).entries());
    const btn=f.querySelector('button'),label=btn.innerHTML; btn.disabled=true; btn.innerHTML='Saving…';
    const res=await SB.updateProfile({name:d.name,phone:d.phone,address:d.address,city:d.city,pin:d.pin});
    btn.disabled=false; btn.innerHTML=label;
    if(!res.ok){toast(res.error,true);return;}
    Object.assign(DB.session,{name:d.name,phone:d.phone,address:d.address,city:d.city,pin:d.pin});
    const c=DB.customers.find(x=>x.email===DB.session.email); if(c){c.name=d.name;c.phone=d.phone;c.city=d.city;}
    save();paint();toast('Details saved');return;}
  if(f.id==='pwForm'){e.preventDefault(); if(!validateForm(f))return;
    const d=Object.fromEntries(new FormData(f).entries());
    if(d.pass!==d.pass2){toast('New password and confirmation do not match',true);return;}
    const wasRecovery=IS_RECOVERY;
    const btn=f.querySelector('button[type="submit"]'),label=btn.innerHTML; btn.disabled=true; btn.innerHTML='Updating…';
    const res=await SB.updatePassword(d.pass,d.oldpass);
    btn.disabled=false; btn.innerHTML=label;
    if(!res.ok){toast(res.error,true);return;}
    f.reset(); f.querySelectorAll('.inp').forEach(i=>i.classList.remove('good','bad'));
    if(wasRecovery)paint();
    toast('Password updated');return;}
  if(f.id==='setForm'){e.preventDefault(); if(!validateForm(f))return;const d=Object.fromEntries(new FormData(f).entries());
    Object.assign(DB.settings,{store:d.store,tag:d.tag,email:d.email,phone:d.phone,address:d.address,gst:d.gst,
      freeShipAbove:+d.freeShipAbove,shipFee:+d.shipFee,upiEnabled:!!d.upiEnabled,cardEnabled:!!d.cardEnabled,codEnabled:!!d.codEnabled,
      metaTitle:d.metaTitle,metaDesc:d.metaDesc,domain:(d.domain||'').trim(),orderMode:d.orderMode==='online'?'online':'whatsapp',
      instagram:(d.instagram||'').trim(),facebook:(d.facebook||'').trim(),youtube:(d.youtube||'').trim()});
    save();paint();toast('Settings saved');return;}
  if(f.id==='appForm'){e.preventDefault(); if(!validateForm(f))return;const d=Object.fromEntries(new FormData(f).entries());
    Object.assign(DB.settings,{heroKicker:d.heroKicker,heroTitle:d.heroTitle,heroSub:d.heroSub});
    if(DB.banners[0])DB.banners[0].title=d.heroTitle;
    save();paint();toast('Homepage updated');return;}
  if(f.id==='accForm'){e.preventDefault(); if(!validateForm(f))return;const d=Object.fromEntries(new FormData(f).entries());
    DB.settings.adminEmail=d.adminEmail;DB.settings.adminPass=d.adminPass;save();toast('Admin login updated');return;}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const f=document.getElementById('shopFilters'),sh=document.getElementById('shopFilterShade');if(f&&f.classList.contains('open')){f.classList.remove('open');sh&&sh.classList.remove('open');document.body.classList.remove('filter-lock');return;}closeLayer();}
  if(e.key==='Enter'&&e.target&&e.target.id==='cpn'){e.preventDefault();const b=document.querySelector('[data-act="applyCoupon"]');if(b)b.click();}});
document.addEventListener('input',e=>{ if(e.target&&e.target.id==='cpn'&&CPN_MSG){ CPN_MSG=null; const m=document.getElementById('cpnMsg'); if(m){m.textContent='';m.className='cpn-msg';} e.target.classList.remove('bad'); } });
document.addEventListener('change',e=>{if(e.target&&e.target.closest&&e.target.closest('#shopFilters'))shopFilterPreviewCount();});
/* ---------- boot ---------- */
normalizeDirectAdminRoute();
migrateLegacyHashRoute();
load(); paint(); API.init(); SB.init();
// Keep merchant data fresh while the admin is open. Inventory updates from new orders
// become visible automatically; no manual page refresh is required.
setInterval(()=>{if(DB.admin&&API.on&&document.visibilityState==='visible')loadInbox(true);},15000);
