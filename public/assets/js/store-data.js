/* ================= DATA ================= */
const KEY='greenocean_v1';
const SEED=()=>({
 settings:{store:'Green Ocean',tag:'Plants, Planters & Gifts',email:'support@greenocean.co.in',phone:'+91 97189 85034',
   address:'Balihari, Dhanbad, Jharkhand 828116',gst:'20ABCDE1234F1Z5',currency:'INR',freeShipAbove:499,shipFee:59,
   orderMode:'whatsapp',
   instagram:'https://www.instagram.com/thegreeenocean',
   facebook:'https://www.facebook.com/share/1DXzzjny6W/',
   youtube:'https://youtube.com/@thegreenocean94',
   codEnabled:true,upiEnabled:true,cardEnabled:true,metaTitle:'Green Ocean — Buy Indoor Plants Online',
   metaDesc:'Healthy nursery-fresh plants, planters and gifts delivered across India.',
   heroTitle:'Happier Spaces Greener Lives',heroSub:'Healthy plants for a better tomorrow. Handpicked from our nursery, delivered to your doorstep.',
   heroKicker:'BRING NATURE HOME',heroNote:'Good Plants\nGood Days',theme:'#0F4632',adminPass:'admin123',adminEmail:'thegreenoceanplants@gmail.com',media:{},homeSlides:[{id:'hs1',img:'img:home_slide_1',link:'#/shop?cat=c1',alt:'Happier Spaces Greener Lives — Green Ocean indoor plant banner'},{id:'hs2',img:'img:home_slide_2',link:'#/shop?cat=c1',alt:'Soft leaves. Softer days. — indoor plant banner'},{id:'hs3',img:'img:home_slide_3',link:'#/shop',alt:'Give your balcony a greener mood — balcony plant banner'},{id:'hs4',img:'img:home_slide_4',link:'#/shop?cat=c6',alt:'A plant gift that keeps growing — Green Ocean gifting banner'}]},
 categories:[
  {id:'c1',name:'Indoor Plants',slug:'indoor',art:'snake',desc:'Low-light friendly greens for every room.',img:'img:cat_indoor'},
  {id:'c2',name:'Flowering Plants',slug:'flowering',art:'flower',desc:'Blooms that lift the whole room.',img:'img:cat_flowering'},
  {id:'c3',name:'Succulents',slug:'succulents',art:'succulent',desc:'Tiny, tough and almost unkillable.',img:'img:cat_succulents'},
  {id:'c4',name:'Planters & Pots',slug:'planters',art:'planter',desc:'Ceramic, terracotta and self-watering.',img:'img:cat_planters'},
  {id:'c5',name:'Gardening Essentials',slug:'gardening',art:'aloe',desc:'Soil, tools and plant food.',img:'img:cat_gardening'},
  {id:'c6',name:'Combos & Gifts',slug:'combos',art:'combo',desc:'Ready-to-gift plant sets.',img:'img:cat_combos'}],
 products:[
  {id:'p1',name:'Snake Plant',sub:'Low Maintenance',cat:'c1',art:'snake',img:'img:prod_snake',price:399,mrp:499,stock:50,rating:4.8,reviews:1200,badge:'Bestseller',active:true,
   desc:'Sansevieria, the plant that forgives everything. Filters indoor air at night and needs water only once a fortnight.',care:{light:'Low to bright indirect',water:'Every 12–15 days',pet:'Keep away from pets'}},
  {id:'p2',name:'Money Plant',sub:'Air Purifying',cat:'c1',art:'money',img:'img:prod_money',price:299,mrp:599,stock:30,rating:4.7,reviews:892,badge:'30% OFF',active:true,
   desc:'Pothos with glossy heart-shaped leaves. Grows in soil or a bottle of water on your desk.',care:{light:'Indirect sunlight',water:'Twice a week',pet:'Mildly toxic if chewed'}},
  {id:'p3',name:'Peace Lily',sub:'Beautiful Blooms',cat:'c2',art:'lily',img:'img:prod_peace',price:449,mrp:599,stock:25,rating:4.8,reviews:760,badge:'',active:true,
   desc:'White spathe flowers over deep green leaves. Droops when thirsty, so it tells you exactly what it wants.',care:{light:'Shade to indirect',water:'Twice a week',pet:'Keep away from pets'}},
  {id:'p4',name:'Aloe Vera',sub:'Natural Healer',cat:'c1',art:'aloe',img:'img:prod_aloe',price:249,mrp:399,stock:60,rating:4.6,reviews:540,badge:'',active:true,
   desc:'Fresh gel for burns and skin, straight from your balcony. Loves sun, hates overwatering.',care:{light:'Bright direct sun',water:'Every 15 days',pet:'Pet safe in small doses'}},
  {id:'p5',name:'ZZ Plant',sub:'Modern & Stylish',cat:'c1',art:'zz',img:'img:prod_zz',price:499,mrp:699,stock:20,rating:4.7,reviews:1400,badge:'',active:true,
   desc:'Waxy, architectural leaves that survive dark corners and forgotten watering cans.',care:{light:'Low light fine',water:'Every 15–20 days',pet:'Keep away from pets'}},
  {id:'p6',name:'Jade Plant',sub:'Good Luck Charm',cat:'c3',art:'succulent',img:'img:cat_succulents',price:279,mrp:349,stock:35,rating:4.5,reviews:310,badge:'',active:true,
   desc:'Thick coin-shaped leaves, said to bring prosperity. Thrives on neglect and sunlight.',care:{light:'Bright light',water:'Every 10 days',pet:'Keep away from pets'}},
  {id:'p7',name:'Hibiscus',sub:'Bright Blooms',cat:'c2',art:'flower',img:'img:cat_flowering',price:349,mrp:449,stock:18,rating:4.4,reviews:220,badge:'',active:true,
   desc:'Big tropical flowers all summer. Give it sun and a weekly feed and it will keep going.',care:{light:'Full sun',water:'Daily in summer',pet:'Pet friendly'}},
  {id:'p8',name:'Self-Watering Planter',sub:'8 inch · Ceramic White',cat:'c4',art:'planter',img:'img:selfwater_plant',price:599,mrp:799,stock:40,rating:4.6,reviews:480,badge:'New',active:true,
   desc:'Built-in reservoir keeps soil evenly moist for up to 10 days. Ideal if you travel.',care:{light:'—',water:'Refill reservoir weekly',pet:'—'}},
  {id:'p9',name:'Terracotta Pot Set',sub:'Set of 3 · Handmade',cat:'c4',art:'planter',img:'img:content4',price:449,mrp:649,stock:28,rating:4.5,reviews:190,badge:'',active:true,
   desc:'Breathable clay pots with drainage holes and matching trays, thrown by local potters.',care:{light:'—',water:'—',pet:'—'}},
  {id:'p10',name:'Desk Buddy Combo',sub:'3 Plants + Pots',cat:'c6',art:'combo',img:'img:cat_combos',price:899,mrp:1299,stock:15,rating:4.9,reviews:640,badge:'Combo',active:true,
   desc:'Snake plant, jade and money plant in matching pots. Our most gifted set.',care:{light:'Indirect',water:'Weekly',pet:'Keep away from pets'}},
  {id:'p11',name:'Potting Soil Mix',sub:'5 kg · Ready to use',cat:'c5',art:'bush',img:'img:content3',price:199,mrp:299,stock:100,rating:4.3,reviews:150,badge:'',active:true,
   desc:'Cocopeat, vermicompost and perlite blended for indoor pots. No smell, no pests.',care:{light:'—',water:'—',pet:'—'}},
  {id:'p12',name:'Areca Palm',sub:'Air Purifying',cat:'c1',art:'bush',img:'img:cat_gardening',price:649,mrp:899,stock:12,rating:4.6,reviews:410,badge:'',active:true,
   desc:'Feathery fronds that fill a corner and pull dry air back to comfortable.',care:{light:'Bright indirect',water:'Twice a week',pet:'Pet friendly'}}],
 orders:[
  {id:'1001',name:'Priya Sharma',phone:'9876543210',email:'priya@mail.com',address:'12 Park Street, Kolkata 700016',
   items:[{id:'p1',name:'Snake Plant',price:399,qty:1,art:'snake'},{id:'p11',name:'Potting Soil Mix',price:199,qty:1,art:'bush'}],
   total:698,pay:'UPI',status:'Delivered',date:'2026-09-14'},
  {id:'1000',name:'Rahul Verma',phone:'9812345678',email:'rahul@mail.com',address:'44 MG Road, Pune 411001',
   items:[{id:'p4',name:'Aloe Vera',price:249,qty:1,art:'aloe'},{id:'p6',name:'Jade Plant',price:279,qty:1,art:'succulent'}],
   total:399,pay:'COD',status:'Shipped',date:'2026-09-15'},
  {id:'0999',name:'Ankit Kumar',phone:'9900112233',email:'ankit@mail.com',address:'7 Civil Lines, Dhanbad 828116',
   items:[{id:'p10',name:'Desk Buddy Combo',price:899,qty:1,art:'combo'},{id:'p8',name:'Self-Watering Planter',price:599,qty:1,art:'planter'}],
   total:1249,pay:'Card',status:'Processing',date:'2026-09-17'},
  {id:'0998',name:'Neha Singh',phone:'9765432180',email:'neha@mail.com',address:'88 Lake View, Bengaluru 560034',
   items:[{id:'p5',name:'ZZ Plant',price:499,qty:1,art:'zz'}],total:499,pay:'UPI',status:'Delivered',date:'2026-09-18'},
  {id:'0997',name:'Sneha Patel',phone:'9123456780',email:'sneha@mail.com',address:'3 Satellite Road, Ahmedabad 380015',
   items:[{id:'p2',name:'Money Plant',price:299,qty:1,art:'money'}],total:299,pay:'COD',status:'Cancelled',date:'2026-09-19'}],
 customers:[
  {id:'u1',name:'Priya Sharma',email:'priya@mail.com',phone:'9876543210',city:'Kolkata',orders:4,spent:2480,joined:'2026-03-11'},
  {id:'u2',name:'Rahul Verma',email:'rahul@mail.com',phone:'9812345678',city:'Pune',orders:2,spent:998,joined:'2026-05-02'},
  {id:'u3',name:'Ankit Kumar',email:'ankit@mail.com',phone:'9900112233',city:'Dhanbad',orders:6,spent:5120,joined:'2025-12-20'},
  {id:'u4',name:'Neha Singh',email:'neha@mail.com',phone:'9765432180',city:'Bengaluru',orders:1,spent:499,joined:'2026-08-30'},
  {id:'u5',name:'Sneha Patel',email:'sneha@mail.com',phone:'9123456780',city:'Ahmedabad',orders:3,spent:1740,joined:'2026-01-16'}],
 banners:[
  {id:'b1',title:'Happier Spaces Greener Lives',sub:'BRING NATURE HOME',cta:'Shop Plants',link:'#/shop',art:'bush',img:'img:prod_snake',active:true},
  {id:'b2',title:'Monsoon Green Sale',sub:'UP TO 40% OFF',cta:'Grab the deal',link:'#/shop',art:'money',img:'img:prod_money',active:true},
  {id:'b3',title:'Gift a Plant, Gift a Habit',sub:'COMBOS FROM ₹899',cta:'Shop Combos',link:'#/shop?cat=c6',art:'combo',img:'img:prod_aloe',active:false}],
 coupons:[
  {id:'k1',code:'GREEN10',type:'percent',value:10,min:499,active:true,firstOrderOnly:false,homePromo:true},
  {id:'k2',code:'PLANT20',type:'percent',value:20,min:999,active:true,firstOrderOnly:false,homePromo:false},
  {id:'k3',code:'FREESHIP',type:'ship',value:0,min:299,active:true,firstOrderOnly:true,homePromo:false},
  {id:'k4',code:'WELCOME',type:'percent',value:15,min:399,active:false,firstOrderOnly:true,homePromo:false}],
 blogs:[
  {id:'g1',title:'5 plants that survive a dark flat',excerpt:'North-facing window? These five still grow.',date:'2026-09-02',active:true,art:'zz',img:'img:prod_zz',
   body:'Low light does not mean no light. Snake plant, ZZ, pothos, lucky bamboo and peace lily all manage on the light that bounces off a wall. Water less in low light — the soil dries slower and roots rot faster than leaves dry.'},
  {id:'g2',title:'How often should you really water?',excerpt:'Stop following a schedule. Follow the soil.',date:'2026-08-21',active:true,art:'drop',img:'img:cat_succulents',
   body:'Push a finger two inches into the soil. Dry means water, damp means wait. Pots without drainage holes will kill a plant faster than a missed week ever will.'},
  {id:'g3',title:'Repotting without the panic',excerpt:'Roots circling the pot? It is time.',date:'2026-07-30',active:true,art:'planter',img:'img:selfwater_plant',
   body:'Go one size up, never three. Loosen the root ball, keep the same soil line, water once and then leave it alone for a week.'}],
 reviews:[
  {id:'r1',av:'img:test1',product:'Snake Plant',name:'Aditi S.',rating:5,text:'Plants arrived in perfect shape. Loved the packaging and quality.',date:'2026-09-10',status:'Published'},
  {id:'r2',av:'img:test2',product:'Money Plant',name:'Karan M.',rating:5,text:'My home looks so lively now. Amazing plants and great service.',date:'2026-09-12',status:'Published'},
  {id:'r3',av:'img:test3',product:'Peace Lily',name:'Sneha P.',rating:4,text:'Best place to buy plants online. Highly recommended.',date:'2026-09-16',status:'Published'},
  {id:'r4',product:'ZZ Plant',name:'Vikram R.',rating:3,text:'Healthy plant but delivery took two extra days.',date:'2026-09-18',status:'Pending'}],
 pages:[
  {id:'pg1',title:'Our Story',slug:'story',active:true,body:'Green Ocean started in 2019 as a half-acre nursery in Balihari, Dhanbad. We grew tired of watching plants arrive at people\'s homes half dead, so we started packing and shipping them ourselves.\n\nEvery plant is grown on our own farm, hardened for two weeks before it ships, and travels in a box designed so the soil never spills onto the leaves. If a plant reaches you unhappy, we replace it within seven days, no photographs of receipts required.'},
  {id:'pg2',title:'Shipping Policy',slug:'shipping',active:true,body:'We ship across India within 2–6 working days. Orders above ₹499 ship free; below that a flat ₹59 applies.\n\nPlants are dispatched Monday to Thursday so they never sit in a warehouse over a weekend.'},
  {id:'pg3',title:'Returns & Refunds',slug:'returns',active:true,body:'Seven-day healthy plant guarantee. If a plant arrives damaged, write to support@greenocean.co.in within seven days and we will send a replacement or refund the amount to the original payment method within five working days.'},
  {id:'pg4',title:'FAQ',slug:'faq',active:true,body:'Do you deliver to my pincode? — We ship to every serviceable pincode in India.\n\nWill the pot be included? — Yes, every plant ships in the pot shown on the product page.\n\nCan I gift-wrap an order? — Add a note at checkout and we will wrap it free.'},
  {id:'pg6',title:'Privacy Policy',slug:'privacy',active:true,body:PRIVACY_TEXT},
  {id:'pg7',title:'Terms & Conditions',slug:'terms',active:true,body:TERMS_TEXT},
  {id:'pg5',title:'Contact',slug:'contact',active:true,body:'Nursery: Balihari, Dhanbad, Jharkhand 828116\nPhone: +91 97189 85034\nEmail: support@greenocean.co.in\n\nWe answer calls between 9am and 7pm, all days except Sunday.'}],
 subscribers:[{id:'s1',email:'priya@mail.com',date:'2026-09-01'},{id:'s2',email:'rahul@mail.com',date:'2026-09-08'}],
 users:[{id:'u_demo',name:'Priya Sharma',email:'priya@mail.com',phone:'9876543210',pass:'plant123',
   address:'12 Park Street, Ballygunge',city:'Kolkata',pin:'700016',joined:'2026-03-11'}],
 cart:[],wish:[],session:null,admin:false,counter:1002
});

let DB;
function load(){
  try{const raw=localStorage.getItem(KEY); DB=raw?JSON.parse(raw):SEED();}
  catch(e){DB=SEED();}
  if(!DB||!DB.products)DB=SEED();
  if(!DB.users)DB.users=SEED().users;
  try{ if(DB.session&&DB.sessionTemp&&!sessionStorage.getItem('go_sess')){ DB.session=null; } }catch(e){}
  const fresh=SEED().settings;
  Object.keys(fresh).forEach(k=>{ if(DB.settings[k]===undefined)DB.settings[k]=fresh[k]; });
  if(DB.settings.phone==='+91 98765 43210')DB.settings.phone=fresh.phone;
  if(/826004/.test(DB.settings.address))DB.settings.address=fresh.address;
  if(DB.settings.email==='care@greenocean.in')DB.settings.email=fresh.email;
  if(DB.settings.adminEmail==='admin@greenocean.in')DB.settings.adminEmail=fresh.adminEmail;
  if(!DB.settings.media||typeof DB.settings.media!=='object')DB.settings.media={};
  if(!Array.isArray(DB.settings.homeSlides)||DB.settings.homeSlides.length!==4)DB.settings.homeSlides=fresh.homeSlides.map(x=>({...x}));
  SEED().pages.forEach(p=>{ if(!DB.pages.some(x=>x.slug===p.slug))DB.pages.push(p); });
  DB.pages.forEach(p=>{ if(p.body)p.body=p.body.replace(/826004/g,'828116').replace(/\+91 98765 43210/g,fresh.phone).replace(/care@greenocean\.in/g,fresh.email); });
  if(!DB.subscribers)DB.subscribers=[];
  if(!Array.isArray(DB.coupons))DB.coupons=[];
  DB.coupons.forEach(k=>{
    k.code=String(k.code||'').toUpperCase();
    if(k.firstOrderOnly===undefined)k.firstOrderOnly=(k.code==='FREESHIP');
    if(k.code==='FREESHIP')k.firstOrderOnly=true;
    if(k.homePromo===undefined)k.homePromo=false;
  });
  if(DB.coupons.length&&!DB.coupons.some(k=>k.homePromo)){
    const hp=DB.coupons.find(k=>k.active&&k.type==='percent')||DB.coupons.find(k=>k.active);
    if(hp)hp.homePromo=true;
  }
}
function save(){ try{localStorage.setItem(KEY,JSON.stringify(DB));}catch(e){} if(typeof schedulePublish==='function')schedulePublish(); }
function resetAll(){ try{localStorage.removeItem(KEY);}catch(e){} DB=SEED(); save(); }

/* ================= helpers ================= */
function toast(msg,err){
  const t=document.createElement('div'); t.className='toast'+(err?' err':''); t.textContent=msg;
  $('#toasts').appendChild(t); setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(()=>t.remove(),320);},2100);
}
function cleanRouteTarget(target){
  target=String(target||'/').trim();
  if(target.startsWith('#/'))target=target.slice(1);
  if(target==='#'||target==='')return '/';
  if(/^https?:\/\//i.test(target)||target.startsWith('mailto:')||target.startsWith('tel:'))return target;
  if(!target.startsWith('/'))target='/'+target.replace(/^#?\/?/,'');
  return target;
}
function adminHashPath(){
  const h=String(location.hash||'');
  return h.startsWith('#/admin')?h.slice(1):'';
}
function appPath(){return adminHashPath()||((location.pathname||'/')+(location.search||''));}
function go(target,opt={}){
  const href=cleanRouteTarget(target);
  if(/^https?:\/\//i.test(href)){location.href=href;return;}
  /* Admin stays on a hash route so Cloudflare/static hosting never receives /admin/... as a page request. */
  if(href==='/admin'||href.startsWith('/admin/')){
    const next='#'+href;
    FORM_DIRTY=false;closeLayer();window.scrollTo(0,0);
    if(location.hash!==next){location.hash=next;}
    else paint();
    return;
  }
  if(opt.replace)history.replaceState({},'',href);else history.pushState({},'',href);
  if(typeof NAV_DEPTH!=='undefined')NAV_DEPTH++;
  FORM_DIRTY=false;closeLayer();window.scrollTo(0,0);paint();
}
let layerStack=[];
function closeLayer(){ $('#layer').innerHTML=''; layerStack=[]; document.body.style.overflow=''; }
function openModal(title,bodyHTML,footHTML){
  document.body.style.overflow='hidden';
  $('#layer').innerHTML=`<div class="ov" data-close="1"><div class="modal" role="dialog" aria-modal="true">
    <div class="modal-h"><h3>${esc(title)}</h3><button class="icon-btn" data-close="1" aria-label="Close">${ic('x',20)}</button></div>
    <div class="modal-b">${bodyHTML}</div>${footHTML?`<div class="modal-f">${footHTML}</div>`:''}</div></div>`;
  if(typeof upgradeInternalLinks==='function')upgradeInternalLinks($('#layer'));
}
function openDrawer(title,bodyHTML,footHTML,side){
  document.body.style.overflow='hidden';
  $('#layer').innerHTML=`<div class="ov" data-close="1"></div><aside class="drawer${side==='left'?' left':''}">
    <div class="drawer-h"><h3>${esc(title)}</h3><button class="icon-btn" data-close="1" aria-label="Close">${ic('x',20)}</button></div>
    <div class="drawer-b">${bodyHTML}</div>${footHTML?`<div class="drawer-f">${footHTML}</div>`:''}</aside>`;
  if(typeof upgradeInternalLinks==='function')upgradeInternalLinks($('#layer'));
}
function confirmBox(msg,onYes){
  openModal('Please confirm',`<p style="margin:0;font-size:14.5px">${esc(msg)}</p>`,
    `<button class="btn btn-line btn-sq" data-close="1">Keep it</button><button class="btn btn-primary btn-sq" id="cfmYes">Yes, continue</button>`);
  $('#cfmYes').onclick=()=>{closeLayer();onYes();};
}
const prod=id=>DB.products.find(p=>p.id===id);
const cat=id=>DB.categories.find(c=>c.id===id);
const cartCount=()=>DB.cart.reduce((s,i)=>s+i.qty,0);
const cartSubtotal=()=>DB.cart.reduce((s,i)=>{const p=prod(i.id);return s+(p?p.price*i.qty:0);},0);
function addToCart(id,qty){
  if(typeof clearCheckoutCoupon==='function')clearCheckoutCoupon(false);
  const p=prod(id); if(!p)return;
  if(p.stock<1){toast('Out of stock right now',true);return;}
  const line=DB.cart.find(i=>i.id===id);
  if(line)line.qty=Math.min(line.qty+(qty||1),p.stock); else DB.cart.push({id,qty:Math.min(qty||1,p.stock)});
  save(); paint(); toast(p.name+' added to basket');
}
function setQty(id,q){
  if(typeof clearCheckoutCoupon==='function')clearCheckoutCoupon(false);
  const line=DB.cart.find(i=>i.id===id); if(!line)return;
  const p=prod(id); line.qty=Math.max(0,Math.min(q,p?p.stock:99));
  if(line.qty===0)DB.cart=DB.cart.filter(i=>i.id!==id);
  save(); paint();
}
function toggleWish(id){
  if(DB.wish.includes(id)){DB.wish=DB.wish.filter(w=>w!==id);toast('Removed from wishlist');}
  else{DB.wish.push(id);toast('Saved to wishlist');}
  save(); paint();
}
function stars(r){ const full=Math.round(r); let s=''; for(let i=0;i<5;i++)s+=`<i>${i<full?'★':'☆'}</i>`; return s; }
function discount(p){ return p.mrp>p.price?Math.round((1-p.price/p.mrp)*100):0; }
