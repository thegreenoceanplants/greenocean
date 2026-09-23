<script>
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
  const sub=cartSubtotal(), s=DB.settings;
  const c=DB.coupon&&DB.coupons.find(k=>k.code===DB.coupon&&k.active);
  let off=0, ship=sub>=s.freeShipAbove?0:s.shipFee;
  if(c){ if(c.type==='percent')off=Math.round(sub*c.value/100); if(c.type==='ship')ship=0; }
  const u=DB.session||{};
  return header()+`<div class="wrap sec">
   ${backBar('Back to basket','#/cart')}
   <div class="stepper"><b>1 Basket</b> ${ic('arrow',12)} <b>2 Address & payment</b> ${ic('arrow',12)} <span>3 Confirmation</span></div>
   <div class="shop" style="grid-template-columns:1fr 330px">
    <form class="panel" id="coForm" novalidate>
      <div id="coErr"></div>
      <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
      <h3 style="font-family:var(--serif);margin:0 0 12px;font-size:19px">Delivery details</h3>
      <div class="row2">${authField('Full name','name','text','name',u.name)}${authField('Mobile number','phone','tel','phone',u.phone,'')}</div>
      ${authField('Email','email','email','email',u.email,'')}
      <div class="field"><label>Full address</label><textarea class="inp" name="address" data-v="address" data-label="Address" placeholder="House number, street, area, landmark">${esc(u.address||'')}</textarea></div>
      <div class="row2">${authField('City','city','text','city',u.city)}${authField('Pincode','pin','tel','pin',u.pin,'')}</div>
      <h3 style="font-family:var(--serif);margin:16px 0 10px;font-size:19px">Payment</h3>
      <div class="chips" style="margin:0">
        ${s.upiEnabled?`<label class="chip"><input type="radio" name="pay" value="UPI" checked> ${ic('phone',14)} UPI</label>`:''}
        ${s.cardEnabled?`<label class="chip"><input type="radio" name="pay" value="Card"> ${ic('card',14)} Card</label>`:''}
        ${s.codEnabled?`<label class="chip"><input type="radio" name="pay" value="COD"> ${ic('wallet',14)} Cash on delivery</label>`:''}</div>
      <div class="field" style="margin-top:14px"><label>Gift note (optional)</label><input class="inp" name="note" placeholder="We will write it on the card"></div>
      <p style="font-size:12px;color:var(--muted);margin:4px 0 10px">By placing this order you agree to our
        <a href="#/page/terms" style="color:var(--green-700);font-weight:600">Terms & Conditions</a> and
        <a href="#/page/privacy" style="color:var(--green-700);font-weight:600">Privacy Policy</a>.</p>
      ${s.orderMode==='whatsapp'?
        `<button class="btn btn-primary btn-lg btn-block" type="submit">${ic('phone',16)} Send order on WhatsApp · ${money(sub-off+ship)}</button>
         <p style="font-size:12px;color:var(--muted);margin:8px 0 0;text-align:center">WhatsApp opens with your order written out — just press send. We confirm stock and payment there.</p>`:
        `<button class="btn btn-primary btn-lg btn-block" type="submit">Place order · ${money(sub-off+ship)}</button>`}
    </form>
    <aside class="panel filters">
      <h3 style="font-family:var(--serif);margin:0 0 10px;font-size:18px">Order summary</h3>
      ${DB.cart.map(l=>{const p=prod(l.id);return p?`<div class="sumrow"><span>${esc(p.name)} × ${l.qty}</span><b>${money(p.price*l.qty)}</b></div>`:''}).join('')}
      <div style="display:flex;gap:6px;margin:12px 0">
        <input class="inp ${CPN_MSG&&!CPN_MSG.ok?'bad':''}" id="cpn" placeholder="Coupon code" value="${esc(DB.coupon||(CPN_MSG&&CPN_MSG.code)||'')}" style="text-transform:uppercase" aria-describedby="cpnMsg">
        <button class="btn btn-soft btn-sq" data-act="applyCoupon">Apply</button></div>
      <div id="cpnMsg" class="cpn-msg ${CPN_MSG?(CPN_MSG.ok?'good':'bad'):''}" role="status">${CPN_MSG?esc(CPN_MSG.text):''}</div>
      ${c?`<div class="sumrow"><span class="pill green">${esc(c.code)} applied</span><button class="btn btn-sm" style="color:var(--red)" data-act="removeCoupon">Remove</button></div>`:''}
      <div class="sumrow"><span>Subtotal</span><b>${money(sub)}</b></div>
      ${off?`<div class="sumrow"><span>Discount</span><b style="color:#1F7A4D">− ${money(off)}</b></div>`:''}
      <div class="sumrow"><span>Delivery</span><b>${ship?money(ship):'Free'}</b></div>
      <div class="sumrow total"><span>To pay</span><span>${money(sub-off+ship)}</span></div>
      <p style="font-size:11.5px;color:var(--muted);margin-top:10px">${ic('lock',13)} ${s.orderMode==='whatsapp'?
        'No payment is taken on this page. We confirm every order with you on WhatsApp before dispatch.':
        'No card details are stored on this website.'}</p>
    </aside></div></div>`+footer();
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
  const c=DB.coupon&&DB.coupons.find(k=>k.code===DB.coupon&&k.active);
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
  DB.cart=[]; DB.coupon=''; save(); go('#/thanks/'+id); return id;
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
const STEPS=['Processing','Shipped','Delivered'];
function viewOrders(){
  if(!DB.session)return header()+`<div class="wrap sec">${backBar('Back','#/')}<div class="panel authbox" style="text-align:center">
    <h2>Sign in to see your orders</h2><p style="color:var(--muted);font-size:13.5px">Your orders are linked to your account.</p>
    <a class="btn btn-primary btn-sq btn-block" href="#/login" style="margin-top:12px">Sign in</a>
    <a class="btn btn-line btn-sq btn-block" href="#/signup" style="margin-top:8px">Create an account</a></div></div>`+footer();
  const mine=DB.session?DB.orders.filter(o=>o.email.toLowerCase()===DB.session.email.toLowerCase()):[];
  return header()+`<div class="wrap sec">${backBar('Back','#/account')}<div class="sec-head"><h2>Your Orders</h2><a class="link-more" href="#/shop">Order again</a></div>
   ${mine.length?mine.map(o=>{const step=STEPS.indexOf(o.status);
     return `<div class="panel" style="margin-bottom:12px">
      <div class="card-h"><div><b>Order #${esc(o.id)}</b><br><small style="color:var(--muted)">${esc(o.date)} · ${esc(o.pay)}</small></div>
        <span class="pill ${o.status==='Delivered'?'green':o.status==='Cancelled'?'red':o.status==='Shipped'?'blue':'amber'}">${esc(o.status)}</span></div>
      ${o.items.map(i=>`<div class="crow" style="border:0;padding:6px 0">${pic(i,'thumb')}
        <div style="flex:1"><b style="font-size:13.5px">${esc(i.name)}</b><div style="font-size:12px;color:var(--muted)">Qty ${i.qty}</div></div>
        <b>${money(i.price*i.qty)}</b></div>`).join('')}
      ${o.status!=='Cancelled'?`<div class="bar" style="margin:10px 0 6px"><i style="width:${[33,66,100][Math.max(step,0)]}%"></i></div>
      <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted)"><span>Packed</span><span>On the way</span><span>Delivered</span></div>`:''}
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
        <b style="margin-right:auto">${money(o.total)}</b>
        ${o.status==='Processing'?`<button class="btn btn-danger btn-sq btn-sm" data-cancel="${o.id}">Cancel order</button>`:''}
        <button class="btn btn-line btn-sq btn-sm" data-reorder="${o.id}">Buy again</button></div></div>`;}).join(''):
     `<div class="panel empty">${ic('bag',30)}<h3>No orders yet</h3><p>Your orders will appear here after checkout.</p>
      <a class="btn btn-primary btn-sq" href="#/shop">Start shopping</a></div>`}</div>`+footer();
}
function viewAccount(){
  const u=currentUser();
  if(!u)return header()+`<div class="wrap sec"><div class="panel authbox" style="text-align:center">
    <h2>You are signed out</h2><p style="color:var(--muted);font-size:13.5px">Sign in to see your orders and saved address.</p>
    <a class="btn btn-primary btn-sq btn-block" href="#/login" style="margin-top:12px">Sign in</a>
    <a class="btn btn-line btn-sq btn-block" href="#/signup" style="margin-top:8px">Create an account</a></div></div>`+footer();
  const mine=DB.orders.filter(o=>o.email.toLowerCase()===u.email.toLowerCase());
  return header()+`<div class="wrap sec">${backBar('Back to home','#/')}<div class="sec-head"><h2>Your Account</h2></div>
   <div class="shop" style="grid-template-columns:1fr 1fr">
    <div class="panel">
      <h3 style="font-family:var(--serif);margin:0 0 2px;font-size:20px">${esc(u.name)}</h3>
      <p style="color:var(--muted);font-size:13.5px;margin:0 0 14px">${esc(u.email)} · ${esc(u.phone)}</p>
      <form id="acForm" novalidate>
        ${authField('Full name','name','text','name',u.name)}
        ${authField('Mobile number','phone','tel','phone',u.phone,'')}
        <div class="field"><label>Delivery address</label><textarea class="inp" name="address" data-v="address" data-label="Address" placeholder="House number, street, area, landmark">${esc(u.address||'')}</textarea></div>
        <div class="row2">${authField('City','city','text','city',u.city)}${authField('Pincode','pin','tel','pin',u.pin,'')}</div>
        <button class="btn btn-primary btn-sq">Save changes</button>
        <button class="btn btn-line btn-sq" type="button" data-act="logout" style="margin-left:8px">Sign out</button></form>
      <hr style="border:0;border-top:1px solid var(--line);margin:18px 0">
      <h3 style="font-family:var(--serif);margin:0 0 10px;font-size:17px">${IS_RECOVERY?'Set a new password':'Change password'}</h3>
      <form id="pwForm" novalidate>
        ${IS_RECOVERY?'':authField('Current password','oldpass','password','any','')}
        ${authField('New password','pass','password','pass','')}
        ${authField('Confirm new password','pass2','password','any','')}
        <button class="btn btn-soft btn-sq">Update password</button></form>
    </div>
    <div class="panel"><h3 style="font-family:var(--serif);margin:0 0 10px;font-size:18px">Quick links</h3>
      <a class="mline" href="#/orders">${ic('bag',15)} Your orders (${mine.length})</a>
      <a class="mline" href="#/wishlist">${ic('heart',15)} Wishlist (${DB.wish.length})</a>
      <a class="mline" href="#/blog">${ic('doc',15)} Plant care blog</a>
      <a class="mline" href="#/page/contact">${ic('mail',15)} Contact us</a>
      <a class="mline" style="border:0" href="#/admin">${ic('lock',15)} Admin panel</a></div>
   </div></div>`+footer();
}
function viewPage(slug){
  const p=DB.pages.find(x=>x.slug===slug&&x.active);
  if(!p)return header()+`<div class="wrap sec panel empty"><h3>Page not found</h3><a class="btn btn-primary btn-sq" href="#/">Go home</a></div>`+footer();
  return header(slug)+`<div class="wrap sec">${backBar('Back','#/')}<div class="panel" style="max-width:720px;margin:0 auto">
    <h1 style="font-family:var(--serif);font-size:28px;margin:0 0 14px;font-weight:600">${esc(p.title)}</h1>
    ${p.body.split('\n').filter(Boolean).map(t=>t.startsWith('## ')?
      `<h3 style="font-family:var(--serif);font-size:19px;font-weight:600;margin:22px 0 6px">${esc(t.slice(3))}</h3>`:
      `<p style="max-width:70ch;margin:0 0 10px">${esc(t)}</p>`).join('')}
    ${slug==='privacy'||slug==='terms'?`<p style="margin-top:18px;font-size:13px;color:var(--muted)">See also:
      ${slug==='privacy'?'<a href="#/page/terms" style="color:var(--green-700);font-weight:600">Terms & Conditions</a>':'<a href="#/page/privacy" style="color:var(--green-700);font-weight:600">Privacy Policy</a>'}
      · <a href="#/page/returns" style="color:var(--green-700);font-weight:600">Returns & Refunds</a></p>`:''}
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
function viewBlog(id){
  if(id){const b=DB.blogs.find(x=>x.id===id);
    if(!b)return viewBlog();
    return header('blog')+`<div class="wrap sec">${backBar('All articles','#/blog')}<div class="panel" style="max-width:720px;margin:0 auto">
      <div style="border-radius:var(--r);overflow:hidden;margin-bottom:14px">${pic(b)}</div>
      <h1 style="font-family:var(--serif);font-size:28px;margin:0 0 6px;font-weight:600">${esc(b.title)}</h1>
      <p style="color:var(--muted);font-size:12.5px">${esc(b.date)}</p>
      ${b.body.split('\n').filter(Boolean).map(t=>`<p style="max-width:70ch">${esc(t)}</p>`).join('')}
      <a class="btn btn-line btn-sq" href="#/blog">All articles</a></div></div>`+footer();}
  const list=DB.blogs.filter(b=>b.active);
  return header('blog')+`<div class="wrap sec">${backBar('Back to home','#/')}<div class="sec-head"><div><h2>Plant Care Blog</h2><p>Short, practical notes from our nursery.</p></div></div>
   <div class="grid grid-3">${list.map(b=>`<a class="card" href="#/blog/${b.id}"><span class="ph" style="aspect-ratio:1.5">${pic(b)}</span>
     <span class="bd"><h3>${esc(b.title)}</h3><span class="sub">${esc(b.date)}</span>
     <p style="font-size:13px;color:var(--muted);margin:6px 0 0">${esc(b.excerpt)}</p></span></a>`).join('')}</div></div>`+footer();
}
</script>
