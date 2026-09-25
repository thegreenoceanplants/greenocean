/* ================= SUPABASE AUTH ================= */
const SUPABASE_URL='https://kkuxyrwklyszargqfgzw.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrdXh5cndrbHlzemFyZ3FmZ3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNjg5MDMsImV4cCI6MjEwNTY0NDkwM30.mgUkIgAU51nTgua8TxDmJ8gOwXOQQ4acDLpv1diQGYY';
const sb=(window.supabase&&window.supabase.createClient)?window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY,
  {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'}}):null;

function sbError(e){
  const m=(e&&e.message)||'Something went wrong. Please try again.';
  if(/already registered/i.test(m))return 'That email already has an account — sign in instead';
  if(/Invalid login credentials/i.test(m))return 'That email/mobile number or password is not right';
  if(/email not confirmed/i.test(m))return 'Please confirm your email first, then sign in.';
  if(/Password should be/i.test(m))return 'Password must be at least 6 characters';
  if(/rate limit|too many/i.test(m))return 'Too many attempts — please wait a minute and try again';
  if(/Token has expired|invalid/i.test(m))return 'That code is wrong or has expired — please try again';
  return m;
}

const SB={
  ready:false,
  async syncAccount(session){
    if(!session||!session.access_token||!session.user||!API.on)return {ok:false};
    try{
      const r=await API.call('/api/account/sync',{method:'POST',authToken:session.access_token,body:{}});
      if(r.ok&&r.account){
        const em=String(r.account.email||'').toLowerCase();
        DB.registeredEmails=Array.from(new Set([...(DB.registeredEmails||[]).map(x=>String(x).toLowerCase()),em].filter(Boolean)));
        DB.registeredAccounts=Array.isArray(DB.registeredAccounts)?DB.registeredAccounts:[];
        const i=DB.registeredAccounts.findIndex(x=>String(x.email||'').toLowerCase()===em);
        if(i>=0)DB.registeredAccounts[i]=r.account;else DB.registeredAccounts.unshift(r.account);
        const c=(DB.customers||[]).find(x=>String(x.email||'').toLowerCase()===em);if(c){c.registered=true;c.accountId=r.account.id||c.accountId||'';}
        save();
        if(appPath().startsWith('/admin/customers'))softRepaint();
      }
      return r;
    }catch(e){return {ok:false,error:String(e&&e.message||e)};}
  },
  async profileToSession(user){
    if(!user)return null;
    let prof=null;
    try{ const r=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle(); prof=r.data; }catch(e){}
    const meta=user.user_metadata||{};
    return {id:user.id,
      name:(prof&&prof.name)||meta.name||meta.full_name||(user.email||'').split('@')[0],
      email:user.email||(prof&&prof.email)||'',
      phone:(prof&&prof.phone)||user.phone||'',
      address:(prof&&prof.address)||'',city:(prof&&prof.city)||'',pin:(prof&&prof.pin)||''};
  },
  async applySession(session){
    if(!session){
      DB.session=null; DB.sessionTemp=false; save();
      if(typeof paint==='function')paint();
      return;
    }
    // Make the signed-in state available immediately. Do not block login on the profiles table.
    const user=session.user, meta=user.user_metadata||{};
    DB.session={id:user.id,
      name:meta.name||meta.full_name||(user.email||'').split('@')[0],
      email:user.email||'',phone:meta.phone||user.phone||'',address:'',city:'',pin:''};
    save();
    if(typeof paint==='function')paint();
    // Verify this Supabase session with the Worker and remember the account in KV.
    // This makes old/existing registered customers show as Registered in admin after their next session/login.
    setTimeout(()=>SB.syncAccount(session),0);
    // Hydrate optional profile fields in the background; auth must still work if this table is slow/unavailable.
    setTimeout(async()=>{
      try{
        const r=await sb.from('profiles').select('*').eq('id',user.id).maybeSingle();
        const prof=r&&r.data;
        if(prof&&DB.session&&DB.session.id===user.id){
          Object.assign(DB.session,{
            name:prof.name||DB.session.name,email:user.email||prof.email||DB.session.email,
            phone:prof.phone||DB.session.phone,address:prof.address||'',city:prof.city||'',pin:prof.pin||''
          });
          save(); if(typeof paint==='function')paint();
        }
      }catch(e){}
    },0);
  },
  async init(){
    if(!sb){ console.warn('Supabase failed to load — check your connection.'); return; }
    try{
      const {data:{session}}=await sb.auth.getSession();
      if(session)await SB.applySession(session);
    }catch(e){}
    sb.auth.onAuthStateChange((event,session)=>{
      if(event==='PASSWORD_RECOVERY'){ IS_RECOVERY=true; }
      // Defer Supabase/profile work until the auth callback has returned.
      // Running another Supabase query directly inside onAuthStateChange can stall sign-in.
      setTimeout(async()=>{
        try{
          await SB.applySession(session);
          if(event==='PASSWORD_RECOVERY'&&session){ go('#/account'); paint(); toast('Set a new password to finish resetting your account'); return; }
          if(event==='SIGNED_IN'&&session){
            if(!DB.customers.some(c=>c.email===DB.session.email))
              DB.customers.unshift({id:DB.session.id,name:DB.session.name,email:DB.session.email,phone:DB.session.phone,city:'',orders:0,spent:0,joined:today()});
            const nx=DB.afterLogin; DB.afterLogin=''; save();
            if(location.pathname==='/login'||location.pathname==='/signup')go(nx==='checkout'?'#/checkout':'#/account');
            toast('Welcome'+(DB.session.name?', '+DB.session.name.split(' ')[0]:'')+'!');
          }
        }catch(e){ console.error('Auth session update failed',e); }
      },0);
    });
    SB.ready=true;
  },
  async lookupEmailByPhone(phone){
    try{ const {data}=await sb.from('profiles').select('email').eq('phone',phone).maybeSingle(); return data&&data.email||null; }
    catch(e){ return null; }
  },
  async signUp({name,email,phone,pass}){
    if(!sb)return {ok:false,error:'Accounts are temporarily unavailable — please try again shortly.'};
    const {data,error}=await sb.auth.signUp({email,password:pass,
      options:{data:{name,phone},emailRedirectTo:location.origin+location.pathname}});
    if(error)return {ok:false,error:sbError(error)};
    if(data && data.user && !data.session) return {ok:true,needsConfirm:true};
    return {ok:true};
  },
  async signIn({login,pass}){
    if(!sb)return {ok:false,error:'Accounts are temporarily unavailable — please try again shortly.'};
    let email=login.trim();
    const digits=email.replace(/[^0-9]/g,'');
    if(/^[6-9][0-9]{9}$/.test(digits)){
      const found=await SB.lookupEmailByPhone(digits);
      if(!found)return {ok:false,error:'No account found for that mobile number. Try your email, or create an account.'};
      email=found;
    }
    const {data,error}=await sb.auth.signInWithPassword({email,password:pass});
    if(error)return {ok:false,error:sbError(error)};
    if(!data||!data.session)return {ok:false,error:'Sign-in succeeded but no session was returned. Please try again.'};
    return {ok:true,session:data.session,user:data.user};
  },
  async signInWithGoogle(){
    if(!sb)return;
    await sb.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});
  },
  async sendOtp(email){
    if(!sb)return {ok:false,error:'Accounts are temporarily unavailable — please try again shortly.'};
    const {error}=await sb.auth.signInWithOtp({email,options:{shouldCreateUser:true}});
    if(error)return {ok:false,error:sbError(error)};
    return {ok:true};
  },
  async verifyOtp(email,token){
    const {error}=await sb.auth.verifyOtp({email,token,type:'email'});
    if(error)return {ok:false,error:sbError(error)};
    return {ok:true};
  },
  async resetPassword(email){
    if(!sb)return {ok:false,error:'Accounts are temporarily unavailable — please try again shortly.'};
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin+'/account'});
    if(error)return {ok:false,error:sbError(error)};
    return {ok:true};
  },
  async updatePassword(newPass,oldPass){
    const opts=IS_RECOVERY?{password:newPass}:{password:newPass,currentPassword:oldPass};
    const {error}=await sb.auth.updateUser(opts);
    if(error)return {ok:false,error:sbError(error)};
    IS_RECOVERY=false;
    return {ok:true};
  },
  async updateProfile(fields){
    const u=DB.session; if(!u)return {ok:false,error:'Not signed in'};
    const {error}=await sb.from('profiles').update({...fields,updated_at:new Date().toISOString()}).eq('id',u.id);
    if(error)return {ok:false,error:sbError(error)};
    return {ok:true};
  },
  async signOut(){ if(sb)await sb.auth.signOut(); }
};
let OTP_SENT_EMAIL='';
let IS_RECOVERY=false;
