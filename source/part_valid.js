<script>
/* ================= VALIDATION ================= */
const RULES={
  name:v=>/^[A-Za-z][A-Za-z .']{1,39}$/.test(v.trim())||'Use letters only, at least 2 characters',
  email:v=>/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(v.trim())||'Enter a working email, like name@gmail.com',
  phone:v=>/^[6-9][0-9]{9}$/.test(v.replace(/[^0-9]/g,''))||'10-digit Indian mobile number starting with 6, 7, 8 or 9',
  pin:v=>/^[1-9][0-9]{5}$/.test(v.trim())||'Enter a valid 6-digit pincode',
  address:v=>v.trim().length>=10||'House, street and area — at least 10 characters',
  city:v=>/^[A-Za-z][A-Za-z .-]{1,39}$/.test(v.trim())||'City name in letters',
  pass:v=>/^(?=.*[A-Za-z])(?=.*[0-9]).{6,}$/.test(v)||'At least 6 characters with one letter and one number',
  login:v=>/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(v.trim())||/^[6-9][0-9]{9}$/.test(v.replace(/[^0-9]/g,''))||'Enter your email address or 10-digit mobile number',
  text:v=>v.trim().length>=3||'Too short — write a little more',
  msg:v=>v.trim().length>=10||'Write at least 10 characters so we can help',
  price:v=>(+v>0&&+v<1000000)||'Enter an amount above 0',
  num:v=>(v!==''&&+v>=0&&Number.isInteger(+v))||'Whole numbers only',
  code:v=>/^[A-Za-z0-9]{4,15}$/.test(v.trim())||'4–15 letters or numbers, no spaces',
  slug:v=>v.trim()===''||/^[A-Za-z0-9 -]{2,40}$/.test(v.trim())||'Letters, numbers and dashes only',
  any:v=>v.trim().length>0||'This cannot be left empty',
  agree:()=>true,
  url:v=>v.trim()===''||/^https?:\/\/[^\s]+\.[^\s]{2,}$/.test(v.trim())||'Paste the full link starting with https://'
};
const OPTIONAL={url:1,slug:1};
function fieldError(inp){
  if(inp.type==='checkbox')return inp.checked?'':'Please tick this box to continue';
  const rule=RULES[inp.dataset.v]; if(!rule)return '';
  const v=inp.value==null?'':inp.value;
  if(!v.trim())return OPTIONAL[inp.dataset.v]?'':(inp.dataset.label?(inp.dataset.label+' is needed'):'This is needed');
  const r=rule(v); return r===true?'':r;
}
function markField(inp){
  const msg=fieldError(inp);
  const host=inp.type==='checkbox'?inp.closest('.field'):inp.parentElement;
  let slot=host.querySelector('.err');
  if(!slot){slot=document.createElement('span');slot.className='err';host.appendChild(slot);}
  slot.textContent=msg; slot.classList.toggle('on',!!msg);
  inp.classList.toggle('bad',!!msg);
  if(inp.type!=='checkbox')inp.classList.toggle('good',!msg&&!!inp.value.trim());
  return !msg;
}
function validateForm(form){
  const list=[...form.querySelectorAll('[data-v]')];
  let first=null, allOk=true;
  list.forEach(i=>{ if(!markField(i)){allOk=false; if(!first)first=i;} });
  const p1=form.querySelector('[name="pass"]'), p2=form.querySelector('[name="pass2"]');
  if(p1&&p2&&p1.value!==p2.value){
    let slot=p2.parentElement.querySelector('.err');
    if(!slot){slot=document.createElement('span');slot.className='err';p2.parentElement.appendChild(slot);}
    slot.textContent='Both passwords must match'; slot.classList.add('on'); p2.classList.add('bad');
    allOk=false; if(!first)first=p2;
  }
  if(first){first.focus(); first.scrollIntoView({block:'center',behavior:'smooth'}); toast('Please fix the highlighted fields',true);}
  return allOk;
}
document.addEventListener('blur',e=>{ if(e.target&&e.target.dataset&&e.target.dataset.v)markField(e.target); },true);
document.addEventListener('input',e=>{
  const i=e.target; if(!i||!i.dataset||!i.dataset.v)return;
  if(i.dataset.v==='phone')i.value=i.value.replace(/[^0-9]/g,'').slice(0,10);
  if(i.dataset.v==='pin')i.value=i.value.replace(/[^0-9]/g,'').slice(0,6);
  if(i.classList.contains('bad'))markField(i);
});
/* ================= ACCOUNTS ================= */
function userByEmail(em){ return (DB.users||[]).find(u=>u.email.toLowerCase()===String(em).trim().toLowerCase()); }
function userByLogin(x){ x=String(x||'').trim(); const digits=x.replace(/[^0-9]/g,'');
  return userByEmail(x)||((/^[6-9][0-9]{9}$/.test(digits)&&!x.includes('@'))?(DB.users||[]).find(u=>u.phone===digits):null); }
function signIn(u){ DB.session={id:u.id,name:u.name,email:u.email,phone:u.phone,address:u.address||'',city:u.city||'',pin:u.pin||''}; save(); }
function currentUser(){ return DB.session?(DB.users||[]).find(u=>u.id===DB.session.id)||DB.session:null; }
const AUTO_PH={name:'Enter your full name',email:'Enter your email address',phone:'Enter 10-digit mobile number',
  pin:'Enter 6-digit pincode',city:'Enter your city',pass:'Enter a password'};
function authField(label,name,type,rule,val,ph,hint){
  if(!ph){ ph=AUTO_PH[rule]||'';
    if(name==='pass2')ph='Re-enter the same password';
    if(name==='oldpass')ph='Enter your current password';
    if(name==='pass'&&rule==='any')ph='Enter your password'; }
  return `<div class="field"><label>${label}</label>
    <input class="inp" name="${name}" type="${type}" data-v="${rule}" data-label="${label}" value="${esc(val||'')}" placeholder="${esc(ph||'')}" ${rule==='phone'?'inputmode="numeric"':''} ${rule==='pin'?'inputmode="numeric"':''}>
    ${hint?`<small class="hint">${esc(hint)}</small>`:''}</div>`;
}
function iField(label,name,type,rule,icon,ph,hint,eye,val){
  return `<div class="field"><label for="f_${name}">${label}</label><div class="ifield">
    <span class="ico">${ic(icon,18)}</span>
    <input class="inp${eye?' has-eye':''}" id="f_${name}" name="${name}" type="${type}" data-v="${rule}" data-label="${label}"
      placeholder="${esc(ph||'')}" value="${esc(val||'')}" ${rule==='phone'?'inputmode="numeric"':''} ${type==='password'?'autocomplete="'+(name==='pass'&&rule==='any'?'current-password':'new-password')+'"':''}>
    ${eye?`<button type="button" class="eye" data-act="eye" aria-label="Show password">${ic('eye',18)}</button>`:''}
    </div>${hint?`<small class="hint">${esc(hint)}</small>`:''}</div>`;
}
function authShell(kind,card){
  const login=kind==='login';
  const trust=login?[['truck','Free Pan-India<br>Delivery'],['leaf','7-Day Healthy<br>Plant Guarantee'],['gift','Exclusive<br>Member Offers']]
                   :[['leaf','Premium<br>Plant Collection'],['heart','Loved by<br>Plant Parents'],['star','Sustainable<br>& Eco-Friendly']];
  const ben=login?[['gift','Your cart is safe','Pick up where you left off'],['shield','Secure & easy checkout','Shop with confidence'],['leaf','Exclusive plant deals','Only for our members']]
                 :[['gift','Exclusive member deals','Get special offers and early access'],['heart','Save your favourites','Keep track of plants you love'],['truck','Faster checkout','A smoother shopping experience'],['shield','Secure & private','Your data is always protected']];
  return header()+`<section class="auth ${login?'li':'su'}">
    <img class="auth-deco bl" src="${src(login?'img:auth_leaf_a':'img:auth_leaf_b')}" alt="" aria-hidden="true">
    ${login?`<img class="auth-deco r" src="${src('img:auth_pot')}" alt="" aria-hidden="true">`:`<img class="auth-deco tr" src="${src('img:auth_note')}" alt="" aria-hidden="true">`}
    ${login?'':`<div class="auth-sign" aria-hidden="true">Good<br>Plants<br>Brighter<br>Days ♡</div>`}
    <div class="wrap">${backBar('Back','#/')}
    <div class="auth-grid">
      <div class="auth-top">
        <div>${login?`<span class="auth-script">Plants<br>&nbsp;Make<br>&nbsp;&nbsp;Better Days <span class="h">♡</span></span>`:`<p class="auth-quote">“A Greener Tomorrow Starts with You”</p>`}</div>
        <div class="auth-trust">${trust.map(t=>`<div><span class="cc">${ic(t[0],22)}</span><span>${t[1]}</span></div>`).join('')}</div>
      </div>
      <aside class="auth-side">
        <span class="lf">${ic('leaf',30)}</span>
        <h2>${login?'Welcome Back':'Join Green Ocean'}</h2>
        <p>${login?'Sign in to continue your plant journey.<br>Your basket is saved and waiting for you.':'Create your account and start your green journey.'}</p>
        ${ben.map(b=>`<div class="auth-ben"><span class="cc">${ic(b[0],22)}</span><span><b>${b[1]}</b><small>${b[2]}</small></span></div>`).join('')}
      </aside>
      <div class="auth-card">${card}</div>
    </div></div></section>`+footer();
}
let AUTH_TAB='pw';
function viewLogin(){
  const next=DB.afterLogin||'';
  const card=`<h1>${next==='checkout'?'Sign in to place your order':'Sign in to your account'}</h1>
    <p class="sub">Enter your details to continue</p>
    <div class="auth-tabs" role="tablist">
      <button type="button" role="tab" class="${AUTH_TAB==='pw'?'on':''}" data-act="authTab" data-tab="pw">Email / Mobile</button>
      <button type="button" role="tab" class="${AUTH_TAB==='otp'?'on':''}" data-act="authTab" data-tab="otp">Passwordless (OTP)</button></div>
    ${AUTH_TAB==='pw'?`<form id="liForm" novalidate>
      ${iField('Email or Mobile number','email','text','login','mail','Enter your email or mobile number')}
      ${iField('Password','pass','password','any','lock','Enter your password','',true)}
      <div class="auth-row"><label><input type="checkbox" name="remember" checked> Remember me</label>
        <a href="#/login" class="auth-link" data-act="forgot">Forgot password?</a></div>
      <button class="btn btn-primary btn-block btn-lg">Sign in ${ic('arrow',16)}</button></form>`:
     `<form id="otpForm" novalidate>
      ${!OTP_SENT_EMAIL?iField('Email address','email','email','email','mail','Enter your email address'):
        `<p style="margin:0 0 10px;font-size:13.5px;color:var(--muted)">Code sent to <b>${esc(OTP_SENT_EMAIL)}</b>. <a href="#" data-act="otpChangeEmail" style="color:var(--green-700);font-weight:600">Change email</a></p>
         ${iField('6-digit code','token','text','code','lock','Enter the code from your email')}`}
      <button class="btn btn-primary btn-block btn-lg" style="margin-top:2px">${OTP_SENT_EMAIL?'Verify & sign in':'Send code'} ${ic('arrow',16)}</button></form>`}
    <div class="auth-or">OR</div>
    <button type="button" class="auth-alt" data-act="socialLogin" data-p="Google">${ic('google',18)} Continue with Google</button>
    <p class="auth-foot">New to Green Ocean? <a href="#/signup">Create a new account</a></p>`;
  return authShell('login',card);
}
function viewSignup(){
  const card=`<h1>Create your account</h1>
    <p class="sub">One account for orders, wishlist and faster checkout.</p>
    <form id="suForm" novalidate>
      ${iField('Full name','name','text','name','user','Enter your full name')}
      ${iField('Email','email','email','email','mail','Enter your email address')}
      ${iField('Mobile number','phone','tel','phone','phone','Enter 10-digit mobile number',"We'll send order updates on this number")}
      ${iField('Password','pass','password','pass','lock','Create a password','At least 6 characters with a mix of letters and numbers',true)}
      ${iField('Confirm password','pass2','password','any','lock','Re-enter the same password','',true)}
      <div class="field"><label style="display:flex;gap:9px;align-items:flex-start;font-weight:500;color:var(--ink);font-size:13px;cursor:pointer">
        <input type="checkbox" name="agree" data-v="agree" data-label="Agreement" style="margin-top:2px;width:16px;height:16px;flex:none">
        <span>I agree to the <a href="#/page/terms" style="color:var(--green-700);font-weight:600;text-decoration:underline">Terms &amp; Conditions</a> and
        <a href="#/page/privacy" style="color:var(--green-700);font-weight:600;text-decoration:underline">Privacy Policy</a></span></label></div>
      <button class="btn btn-primary btn-block btn-lg">Create account ${ic('arrow',16)}</button>
    </form>
    <p class="auth-foot">Already have an account? <a href="#/login">Sign in</a></p>`;
  return authShell('signup',card);
}
</script>
