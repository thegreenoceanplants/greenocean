/* ==========================================================
   GREEN OCEAN — single file store + admin
   ========================================================== */
const $=(s,r=document)=>r.querySelector(s);
const money=n=>'₹'+Number(n||0).toLocaleString('en-IN');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+Math.random().toString(36).slice(2,8);
const today=()=>new Date().toISOString().slice(0,10);

/* ---------- icons (inline svg, stroke based) ---------- */
const I={
 leaf:'<path d="M4 20c0-9 6-15 16-16 0 10-6 16-16 16Z"/><path d="M9 15c2-3 5-5 8-6"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.2-3.2"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
 heart:'<path d="M12 20s-7-4.5-7-9.5A4 4 0 0 1 12 8a4 4 0 0 1 7 2.5C19 15.5 12 20 12 20Z"/>',
 cart:'<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.6 12h11L21 7H6"/>',
 menu:'<path d="M3 6h18M3 12h18M3 18h18"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 planter:'<path d="M9 9V7a3 3 0 0 1 6 0v2"/><path d="M4 9h16"/><path d="M6 9h12l-1.3 9.6a2 2 0 0 1-2 1.7H9.3a2 2 0 0 1-2-1.7L6 9Z"/>',
 box:'<path d="M12 3 3 7.5v9L12 21l9-4.5v-9L12 3Z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
 bag:'<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
 users:'<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c1.2-3.4 3.7-5 6.5-5s5.3 1.6 6.5 5"/><path d="M17 5.5a3 3 0 0 1 0 5.6M18 20c-.3-1.6-.8-3-1.6-4"/>',
 stack:'<path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z"/><path d="m3 12 9 4.5L21 12M3 16.5 12 21l9-4.5"/>',
 image:'<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.7"/><path d="m4 18 5-4.5 3.5 3L16 12l4 4"/>',
 tag:'<path d="M3 11V4h7l11 11-7 7L3 11Z"/><circle cx="7.5" cy="7.5" r="1.4"/>',
 doc:'<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
 star:'<path d="m12 4 2.4 5 5.6.8-4 3.9 1 5.5-5-2.7-5 2.7 1-5.5-4-3.9 5.6-.8L12 4Z"/>',
 pages:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"/>',
 brush:'<path d="M4 20c3 1 5-1 5-3 0-1.5-1-2.5-2.5-2.5C5 14.5 4 16 4 20Z"/><path d="M10 15 20 5l-1.5-1.5L8.5 13.5"/>',
 chart:'<path d="M4 20V4"/><path d="M4 20h16"/><path d="M8 17V11M13 17V7M18 17v-4"/>',
 gear:'<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
 home:'<path d="m3 11 9-7 9 7"/><path d="M6 10v10h12V10"/>',
 back:'<path d="M20 12H4"/><path d="m10 6-6 6 6 6"/>',
 bell:'<path d="M18 16V11a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 16Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 edit:'<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m14.5 5.5 4 4"/>',
 trash:'<path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/>',
 eye:'<path d="M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6-10-6-10-6Z"/><circle cx="12" cy="12" r="2.6"/>',
 check:'<path d="m5 13 4 4 10-10"/>',
 truck:'<path d="M3 6h11v10H3z"/><path d="M14 9h4l3 3.5V16h-7"/><circle cx="7" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>',
 shield:'<path d="M12 3 5 6v6c0 4.2 3 7.5 7 9 4-1.5 7-4.8 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
 drop:'<path d="M12 3s6 6.4 6 10.2A6 6 0 0 1 6 13.2C6 9.4 12 3 12 3Z"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19"/>',
 sparkle:'<path d="M12 4v6M12 14v6M4 12h6M14 12h6"/>',
 arrow:'<path d="M4 12h16"/><path d="m14 6 6 6-6 6"/>',
 lock:'<rect x="4.5" y="10" width="15" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
 pin:'<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>',
 card:'<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/>',
 wallet:'<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M16 12.5h2"/>',
 phone:'<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.2 2"/>',
 gift:'<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M3 12h18M12 8v13"/><path d="M12 8c-2.5 0-4.5-1-4.5-2.8S9.5 3 12 8c2.5-5 4.5-4.6 4.5-2.8S14.5 8 12 8Z"/>',
 eyeoff:'<path d="M3 3l18 18"/><path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6.2 0 10 6 10 6a17 17 0 0 1-3.1 3.8M6.3 7.4C3.8 9.1 2 12 2 12s3.8 6 10 6c1.6 0 3-.4 4.3-1"/><path d="M9.9 10a3 3 0 0 0 4.2 4.1"/>',
 google:'<path d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" fill="#4285F4" stroke="none"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" fill="#34A853" stroke="none"/><path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z" fill="#FBBC05" stroke="none"/><path d="M12 6c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 6 12 6Z" fill="#EA4335" stroke="none"/>',
 apple:'<path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5a4.4 4.4 0 0 0-3.4-1.9c-1.5-.1-2.8.9-3.6.9s-1.9-.8-3.1-.8a4.6 4.6 0 0 0-3.9 2.4c-1.7 2.9-.4 7.2 1.2 9.5.8 1.1 1.7 2.4 2.9 2.4s1.6-.8 3-.8 1.8.8 3.1.7 2-1.1 2.8-2.3a9.6 9.6 0 0 0 1.3-2.6 3.9 3.9 0 0 1-2.3-4ZM14 5.8a4 4 0 0 0 .9-2.8 3.9 3.9 0 0 0-2.6 1.3 3.7 3.7 0 0 0-.9 2.7A3.3 3.3 0 0 0 14 5.8Z" fill="currentColor" stroke="none"/>',
 instagram:'<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1"/>',
 facebook:'<path d="M14.5 8.5h2.2V5.6h-2.4c-2.3 0-3.8 1.5-3.8 3.9v1.6H8.2v3h2.3V21h3.2v-6.9h2.3l.5-3h-2.8V9.8c0-.8.3-1.3 1.3-1.3Z"/>',
 youtube:'<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path d="m10.5 9.5 5 2.5-5 2.5Z"/>'
};
const ic=(n,s=18,c='currentColor')=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${I[n]||''}</svg>`;

/* ---------- built-in plant artwork (used until real photos added) ---------- */
const POT={terra:['#D98E62','#C1764C'],white:['#F2F1EC','#DDDBD2'],sage:['#CBD9C8','#B2C4AE'],stone:['#DCD6CB','#C4BDB0'],clay:['#E3A87F','#CE8B63']};
function plantArt(kind,seed){
  const p=POT[(kind&&kind.pot)||'terra']||POT.terra, g1=(kind&&kind.leaf)||'#2F7D5B', g2=(kind&&kind.leaf2)||'#1C5B3F';
  const shape=(kind&&kind.shape)||'bush'; const bg=(kind&&kind.bg)||'#EDF3EC';
  let leaves='';
  if(shape==='blade'){ // snake plant
    for(let i=0;i<7;i++){const x=100+(i-3)*11,h=54+Math.abs(3-i)*-6+42,w=7;
      leaves+=`<path d="M${x} 132 C${x-w} ${132-h*.5} ${x-w*.7} ${132-h*.85} ${x} ${132-h} C${x+w*.7} ${132-h*.85} ${x+w} ${132-h*.5} ${x} 132Z" fill="${i%2?g1:g2}"/>`;}
  } else if(shape==='vine'){ // money plant
    for(let i=0;i<9;i++){const a=(i/8)*Math.PI*1.6-2.5,r=46+(i%3)*13,x=100+Math.cos(a)*r,y=104+Math.sin(a)*r*.62;
      leaves+=`<path d="M100 116 Q${(100+x)/2} ${(116+y)/2-8} ${x} ${y}" stroke="${g2}" stroke-width="2.4" fill="none"/>
      <path d="M${x} ${y} c-11-9-11-19 0-23 11 4 11 14 0 23Z" fill="${i%2?g1:g2}" transform="rotate(${a*57+90} ${x} ${y})"/>`;}
  } else if(shape==='lily'){
    for(let i=0;i<6;i++){const x=100+(i-2.5)*15,h=66+((i%2)?10:0);
      leaves+=`<path d="M100 134 Q${x} ${134-h*.7} ${x} ${134-h} Q${x+10} ${134-h*.5} 100 134Z" fill="${i%2?g1:g2}"/>`;}
    leaves+=`<ellipse cx="100" cy="56" rx="11" ry="17" fill="#FBFAF4"/><ellipse cx="118" cy="66" rx="9" ry="14" fill="#FBFAF4"/>`;
  } else if(shape==='aloe'){
    for(let i=0;i<7;i++){const a=(i-3)*17,x=100+a*1.4;
      leaves+=`<path d="M100 136 Q${x*1.02} 96 ${x+(a>0?16:-16)} ${58+Math.abs(a)*.5} Q${x} 96 100 136Z" fill="${i%2?g1:g2}"/>`;}
  } else if(shape==='zz'){
    for(let s=-1;s<=1;s+=2){for(let i=0;i<5;i++){const y=124-i*17,x=100+s*(12+i*7);
      leaves+=`<ellipse cx="${x}" cy="${y}" rx="13" ry="9" fill="${i%2?g1:g2}" transform="rotate(${s*32} ${x} ${y})"/>`;}}
    leaves+=`<path d="M100 136 Q88 96 84 60M100 136 Q112 96 116 60" stroke="${g2}" stroke-width="3" fill="none"/>`;
  } else if(shape==='succulent'){
    for(let r=3;r>=1;r--){const n=r*4,rad=r*17;
      for(let i=0;i<n;i++){const a=(i/n)*Math.PI*2,x=100+Math.cos(a)*rad*.8,y=108+Math.sin(a)*rad*.5;
        leaves+=`<ellipse cx="${x}" cy="${y}" rx="12" ry="8" fill="${r%2?g1:g2}" transform="rotate(${a*57} ${x} ${y})"/>`;}}
  } else if(shape==='flower'){
    leaves+=`<path d="M100 140 V92" stroke="${g2}" stroke-width="3"/>`;
    for(let i=0;i<8;i++){const a=(i/8)*Math.PI*2,x=100+Math.cos(a)*24,y=78+Math.sin(a)*24;
      leaves+=`<ellipse cx="${x}" cy="${y}" rx="13" ry="9" fill="${(kind&&kind.flower)||'#E4707F'}" transform="rotate(${a*57} ${x} ${y})"/>`;}
    leaves+=`<circle cx="100" cy="78" r="10" fill="#F4C24A"/>
    <path d="M100 118c-16-4-22-14-22-14s14-4 22 8M100 112c14-4 20-13 20-13s-13-4-20 7" fill="${g1}"/>`;
  } else {
    for(let i=0;i<9;i++){const a=(i/8)*Math.PI-Math.PI,x=100+Math.cos(a)*40,y=104+Math.sin(a)*34;
      leaves+=`<ellipse cx="${x}" cy="${y}" rx="17" ry="11" fill="${i%2?g1:g2}" transform="rotate(${a*57+90} ${x} ${y})"/>`;}
    leaves+=`<circle cx="100" cy="92" r="20" fill="${g1}"/>`;
  }
  const potTop=(kind&&kind.potTop)||136;
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
  <rect width="200" height="200" fill="${bg}"/>
  <circle cx="100" cy="104" r="76" fill="rgba(255,255,255,.55)"/>
  ${leaves}
  <path d="M${100-34} ${potTop} h68 l-9 42 a6 6 0 0 1-6 5 h-38 a6 6 0 0 1-6-5 Z" fill="${p[0]}"/>
  <path d="M${100-38} ${potTop-8} h76 a4 4 0 0 1 4 4 v5 a4 4 0 0 1-4 4 h-76 a4 4 0 0 1-4-4 v-5 a4 4 0 0 1 4-4Z" fill="${p[1]}"/>
  <ellipse cx="100" cy="188" rx="46" ry="6" fill="rgba(20,60,40,.10)"/></svg>`;
}
const ART={
  snake:{shape:'blade',pot:'white',leaf:'#2F7D5B',leaf2:'#17513A',bg:'#EEF3EA'},
  money:{shape:'vine',pot:'terra',leaf:'#4E9B5F',leaf2:'#2C6E45',bg:'#F0F4E9'},
  lily:{shape:'lily',pot:'white',leaf:'#2E7B57',leaf2:'#1A5239',bg:'#EDF2EF'},
  aloe:{shape:'aloe',pot:'terra',leaf:'#6BA86F',leaf2:'#3C7A52',bg:'#F1F3E7'},
  zz:{shape:'zz',pot:'stone',leaf:'#2B7350',leaf2:'#184C36',bg:'#EFF2EC'},
  succulent:{shape:'succulent',pot:'sage',leaf:'#7FAE74',leaf2:'#4E8455',bg:'#F1F4EA'},
  flower:{shape:'flower',pot:'clay',leaf:'#4E9B5F',leaf2:'#2C6E45',flower:'#E4707F',bg:'#FBF0EE'},
  bush:{shape:'bush',pot:'terra',leaf:'#3C8A5D',leaf2:'#215E42',bg:'#EEF3EA'},
  planter:{shape:'succulent',pot:'white',leaf:'#5A9C68',leaf2:'#35795089',bg:'#FBF1EE'},
  combo:{shape:'bush',pot:'sage',leaf:'#4E9B5F',leaf2:'#2C6E45',bg:'#E9F1E7'}
};
function artFor(key){return plantArt(ART[key]||ART.bush);}
const artURI=key=>'data:image/svg+xml;utf8,'+encodeURIComponent(artFor(key));
/* photo if admin set one, else built-in artwork. Broken photo falls back automatically. */
function src(v){ if(!v) return ''; if(v.slice(0,4)==='img:'){ const k=v.slice(4),ov=(typeof DB!=='undefined'&&DB&&DB.settings&&DB.settings.media&&DB.settings.media[k])||''; return ov||((typeof IMG!=='undefined'&&IMG[k])||''); } return v; }
function pic(item,cls='',priority='auto'){
  const k=(item&&item.art)||'bush';
  const fb=artURI(k).replace(/'/g,'%27');
  const s=src(item&&item.img);
  const eager=priority==='eager'||(item&&item.img==='img:hero');
  const perf=`loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''}`;
  if(s) return `<img class="${cls}" src="${s}" alt="${esc(item.name||'')}" ${perf} onerror="this.onerror=null;this.src='${fb}'">`;
  return `<img class="${cls}" src="${fb}" alt="${esc((item&&item.name)||'')}" ${perf}>`;
}
/* room / lifestyle scene art */
function sceneArt(label,tone){
  const t=tone||['#2F5F49','#8FB69B'];
  return 'data:image/svg+xml;utf8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 190"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t[0]}"/><stop offset="1" stop-color="${t[1]}"/></linearGradient></defs><rect width="240" height="190" fill="url(#g)"/><g opacity=".5" fill="#fff"><ellipse cx="60" cy="150" rx="46" ry="14"/><ellipse cx="186" cy="158" rx="40" ry="12"/></g><g fill="#12412F" opacity=".75"><path d="M52 150c0-30 12-46 30-50 2 30-10 48-30 50Z"/><path d="M60 150c-16-6-24-20-24-36 20 2 28 18 24 36Z"/><path d="M176 158c0-26 10-40 26-44 2 26-8 42-26 44Z"/></g><rect x="0" y="162" width="240" height="28" fill="rgba(0,0,0,.18)"/></svg>`);
}
