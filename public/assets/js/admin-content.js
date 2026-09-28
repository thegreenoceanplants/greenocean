/* ================= ADMIN-CONTROLLED SITE CONTENT ================= */
const SITE_CONTENT_DEFAULTS={
  ribbon:[
    {icon:'truck',text:'Free Pan-India Delivery on Orders Above {freeShipAbove}'},
    {icon:'shield',text:'7-Day Healthy Plant Guarantee'},
    {icon:'tag',text:'Use FREESHIP - Free shipping - First order only',bold:true},
    {icon:'leaf',text:'Plants Make Better Days'}
  ],
  nav:[
    {label:'Home',link:'#/',key:'home'},{label:'Plants',link:'#/shop',key:'plants'},{label:'Planters',link:'#/shop?cat=c4',key:'planters'},
    {label:'Plant Care',link:'#/blog',key:'care'},{label:'FAQ',link:'#/page/faq',key:'faq'},{label:'Contact',link:'#/page/contact',key:'contact'}
  ],
  home:{
    trust:[['heart','Healthy Plants','7-Day Guarantee'],['truck','Pan-India Delivery','Safe & Secure'],['home','Direct from Nursery','Balihari, Dhanbad'],['users','Customer Support','Order & Plant-Care Help']],
    categoryTitle:'Shop by Category',categoryMore:'View all',bestTitle:'Bestselling Plants',bestMore:'View all',
    promoPlantersLink:'#/shop?cat=c4',promoCombosLink:'#/shop?cat=c6',
    selfTitle:'Self-Watering Planters',selfSub:'Plants that take care of themselves.',selfCta:'Explore Planters',selfLink:'#/shop?cat=c4',
    selfFeatures:[['shield','Smart Design',''],['drop','Less Watering','Once in 10 days'],['heart','Healthier Plants',''],['clock','Busy Lifestyles','']],
    spacesTitle:'Plants for Every Space',spacesSub:'From cosy corners to big balconies.',
    spaces:[['Living Room','sp_living','#/shop'],['Bedroom','sp_bedroom','#/shop'],['Workspace','sp_workspace','#/shop'],['Balcony','sp_balcony','#/shop'],['Outdoor Garden','sp_outdoor','#/shop']],
    whyTitle:'Why Choose {store}?',why:[['heart','Healthy Plants','7-Day Guarantee'],['home','Nursery Fresh','Directly from our farm'],['truck','Pan-India Delivery','Safe & Secure'],['users','Trusted by','10,000+ Plant Lovers']],
    reviewsTitle:'What Our Customers Say',reviewsLinkText:'Plant care blog',reviewsLink:'#/blog',
    newsletterTitle:'Join Our Green Community',newsletterSub:'Get plant care tips, new arrivals and exclusive offers.',newsletterScript:'Plants\nPeople\nA Better Tomorrow ♥'
  },
  footer:{
    company:[['Our Story','#/page/story'],['Plant Care Blog','#/blog'],['Contact','#/page/contact'],['FAQ','#/page/faq'],['Privacy Policy','#/page/privacy'],['Terms & Conditions','#/page/terms']],
    support:[['Track Order','#/orders'],['Site Map','#/sitemap'],['Shipping Policy','#/page/shipping'],['Returns & Refunds','#/page/returns'],['Help Centre','#/page/contact']],
    copyright:'© 2026 {store}. All rights reserved.'
  },
  plantCare:{
    kicker:'Green Ocean Plant Care',title:'Grow better. Care smarter.',sub:'Clear, practical plant-care guidance for real homes — from watering and light to repotting, low-light plants and everyday troubleshooting.',
    topics:[['drop','Watering'],['home','Indoor plants'],['sun','Light'],['planter','Repotting']],
    latestTitle:'Latest plant-care guides',latestSub:'Useful, easy-to-follow advice for healthier plants and more confident plant parents.',latestCta:'Shop plants',latestLink:'#/shop',
    basicsTitle:'Plant-care basics',basicsSub:'Three habits that solve a surprising number of plant problems.',
    basics:[['drop','Check soil before watering','Moisture changes with season, light and pot size. Let the soil guide the schedule.'],['sun','Match the plant to the light','Low light, bright indirect light and direct sun are different environments. Choose accordingly.'],['planter','Repot only when needed','Move up gradually and avoid oversizing the pot. Roots need both moisture and air.']],
    ctaTitle:'Need help choosing a plant?',ctaSub:'Browse plants by category or contact Green Ocean for product and order support.',contactText:'Contact Us',contactLink:'#/page/contact',shopText:'Explore Plants',shopLink:'#/shop'
  }
};
function deepFill(target,defaults){
  if(!target||typeof target!=='object'||Array.isArray(target))target={};
  Object.entries(defaults).forEach(([k,v])=>{if(target[k]===undefined)target[k]=JSON.parse(JSON.stringify(v));else if(v&&typeof v==='object'&&!Array.isArray(v))target[k]=deepFill(target[k],v);});
  return target;
}
function normalizeAdminContent(db){if(!db||!db.settings)return;db.settings.content=deepFill(db.settings.content||{},SITE_CONTENT_DEFAULTS);}
function siteContent(){normalizeAdminContent(DB);return DB.settings.content;}
function contentText(s){return String(s||'').replace(/\{freeShipAbove\}/g,money(DB.settings.freeShipAbove)).replace(/\{store\}/g,DB.settings.store||'Green Ocean');}
function parseLinkLines(v){return String(v||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>{const p=x.split('|');return [String(p[0]||'').trim(),String(p.slice(1).join('|')||'#').trim()];}).filter(x=>x[0]);}
function linkLines(a){return (a||[]).map(x=>`${x[0]}|${x[1]}`).join('\n');}
function parseTripleLines(v){return String(v||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>{const p=x.split('|');return [String(p[0]||'leaf').trim(),String(p[1]||'').trim(),String(p.slice(2).join('|')||'').trim()];});}
function tripleLines(a){return (a||[]).map(x=>`${x[0]}|${x[1]}|${x[2]||''}`).join('\n');}
function parseSpaces(v){return String(v||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>{const p=x.split('|');return [String(p[0]||'').trim(),String(p[1]||'sp_living').trim(),String(p.slice(2).join('|')||'#/shop').trim()];});}
function spacesLines(a){return (a||[]).map(x=>`${x[0]}|${x[1]}|${x[2]||'#/shop'}`).join('\n');}
function parseTopics(v){return String(v||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>{const p=x.split('|');return [String(p[0]||'leaf').trim(),String(p.slice(1).join('|')||'').trim()];});}
function topicLines(a){return (a||[]).map(x=>`${x[0]}|${x[1]}`).join('\n');}
function fieldTA(label,name,value,hint=''){return `<div class="field"><label>${esc(label)}</label><textarea class="inp" name="${esc(name)}" style="min-height:110px">${esc(value||'')}</textarea>${hint?`<small class="hint">${esc(hint)}</small>`:''}</div>`;}
function fieldIn(label,name,value){return `<div class="field"><label>${esc(label)}</label><input class="inp" name="${esc(name)}" value="${esc(value||'')}"></div>`;}
function admContent(){
  const c=siteContent(),h=c.home,pc=c.plantCare,f=c.footer;
  return adminShell('content',`<form id="siteContentForm" novalidate>
    <div class="media-guide-note"><b>Connection rule:</b> these fields are the live source used by the storefront. Saving here publishes through the existing store API, so no index.html edit is needed.</div>
    <div class="two">
      <div>
        <div class="panel" style="margin-bottom:14px"><div class="card-h"><h3>Header & ribbon</h3></div>
          ${fieldTA('Top ribbon — one line per message','ribbon',c.ribbon.map(x=>`${x.icon}|${x.text}|${x.bold?'1':'0'}`).join('\n'),'Format: icon|text|bold(1/0). Use {freeShipAbove} for the live free-shipping amount.')}
          ${fieldTA('Main navigation','nav',c.nav.map(x=>`${x.label}|${x.link}|${x.key}`).join('\n'),'Format: label|link|active-key. Keep keys: home, plants, planters, care, faq, contact.')}
        </div>
        <div class="panel" style="margin-bottom:14px"><div class="card-h"><h3>Homepage headings & links</h3></div>
          ${fieldIn('Category heading','categoryTitle',h.categoryTitle)}${fieldIn('Category “view all” text','categoryMore',h.categoryMore)}
          ${fieldIn('Bestselling heading','bestTitle',h.bestTitle)}${fieldIn('Bestselling “view all” text','bestMore',h.bestMore)}
          <div class="row2">${fieldIn('Planters promo link','promoPlantersLink',h.promoPlantersLink)}${fieldIn('Combos promo link','promoCombosLink',h.promoCombosLink)}</div>
          ${fieldTA('Homepage trust items','homeTrust',tripleLines(h.trust),'Format: icon|title|subtitle. Keep 4 items for the current layout.')}
        </div>
        <div class="panel" style="margin-bottom:14px"><div class="card-h"><h3>Self-watering & spaces</h3></div>
          ${fieldIn('Self-watering title','selfTitle',h.selfTitle)}${fieldIn('Self-watering subtitle','selfSub',h.selfSub)}
          <div class="row2">${fieldIn('CTA text','selfCta',h.selfCta)}${fieldIn('CTA link','selfLink',h.selfLink)}</div>
          ${fieldTA('Feature items','selfFeatures',tripleLines(h.selfFeatures),'Format: icon|title|subtitle.')}
          ${fieldIn('Spaces heading','spacesTitle',h.spacesTitle)}${fieldIn('Spaces subtitle','spacesSub',h.spacesSub)}
          ${fieldTA('Space cards','spaces',spacesLines(h.spaces),'Format: title|image-key|link. Image keys already map to Media Manager assets.')}
        </div>
      </div>
      <div>
        <div class="panel" style="margin-bottom:14px"><div class="card-h"><h3>Homepage community content</h3></div>
          ${fieldIn('Why choose heading','whyTitle',h.whyTitle)}${fieldTA('Why choose items','why',tripleLines(h.why),'Format: icon|title|subtitle.')}
          ${fieldIn('Reviews heading','reviewsTitle',h.reviewsTitle)}<div class="row2">${fieldIn('Reviews link text','reviewsLinkText',h.reviewsLinkText)}${fieldIn('Reviews link','reviewsLink',h.reviewsLink)}</div>
          ${fieldIn('Newsletter title','newsletterTitle',h.newsletterTitle)}${fieldIn('Newsletter subtitle','newsletterSub',h.newsletterSub)}${fieldTA('Newsletter decorative message','newsletterScript',h.newsletterScript,'Line breaks are preserved.')}
        </div>
        <div class="panel" style="margin-bottom:14px"><div class="card-h"><h3>Footer links</h3></div>
          ${fieldTA('Company links','footerCompany',linkLines(f.company),'Format: label|link.')}${fieldTA('Support links','footerSupport',linkLines(f.support),'Format: label|link.')}${fieldIn('Copyright line','copyright',f.copyright)}
        </div>
        <div class="panel"><div class="card-h"><h3>Plant Care page</h3></div>
          ${fieldIn('Kicker','pcKicker',pc.kicker)}${fieldIn('Hero title','pcTitle',pc.title)}${fieldTA('Hero description','pcSub',pc.sub)}${fieldTA('Topic chips','pcTopics',topicLines(pc.topics),'Format: icon|label.')}
          ${fieldIn('Latest guides heading','pcLatestTitle',pc.latestTitle)}${fieldIn('Latest guides description','pcLatestSub',pc.latestSub)}<div class="row2">${fieldIn('Latest CTA text','pcLatestCta',pc.latestCta)}${fieldIn('Latest CTA link','pcLatestLink',pc.latestLink)}</div>
          ${fieldIn('Basics heading','pcBasicsTitle',pc.basicsTitle)}${fieldIn('Basics description','pcBasicsSub',pc.basicsSub)}${fieldTA('Basic-care cards','pcBasics',tripleLines(pc.basics),'Format: icon|title|description. Keep 3 cards for the current layout.')}
          ${fieldIn('Bottom CTA title','pcCtaTitle',pc.ctaTitle)}${fieldIn('Bottom CTA description','pcCtaSub',pc.ctaSub)}
          <div class="row2">${fieldIn('Contact button text','pcContactText',pc.contactText)}${fieldIn('Contact button link','pcContactLink',pc.contactLink)}</div>
          <div class="row2">${fieldIn('Shop button text','pcShopText',pc.shopText)}${fieldIn('Shop button link','pcShopLink',pc.shopLink)}</div>
        </div>
      </div>
    </div>
    <button class="btn btn-primary btn-sq btn-lg" style="margin-top:14px" type="submit">Save site content</button>
  </form>`,'Site Content','Edit existing storefront text and links without redesigning the website.');
}
document.addEventListener('submit',e=>{
  const form=e.target;if(!form||form.id!=='siteContentForm')return;e.preventDefault();
  const d=Object.fromEntries(new FormData(form).entries()),c=siteContent(),h=c.home,pc=c.plantCare;
  const ribbon=String(d.ribbon||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>{const p=x.split('|');return {icon:(p[0]||'leaf').trim(),text:(p[1]||'').trim(),bold:String(p[2]||'0').trim()==='1'};}).filter(x=>x.text);if(ribbon.length)c.ribbon=ribbon;
  const nav=String(d.nav||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(x=>{const p=x.split('|');return {label:(p[0]||'').trim(),link:(p[1]||'#/').trim(),key:(p[2]||'').trim()};}).filter(x=>x.label);if(nav.length)c.nav=nav;
  Object.assign(h,{categoryTitle:d.categoryTitle,categoryMore:d.categoryMore,bestTitle:d.bestTitle,bestMore:d.bestMore,promoPlantersLink:d.promoPlantersLink,promoCombosLink:d.promoCombosLink,selfTitle:d.selfTitle,selfSub:d.selfSub,selfCta:d.selfCta,selfLink:d.selfLink,spacesTitle:d.spacesTitle,spacesSub:d.spacesSub,whyTitle:d.whyTitle,reviewsTitle:d.reviewsTitle,reviewsLinkText:d.reviewsLinkText,reviewsLink:d.reviewsLink,newsletterTitle:d.newsletterTitle,newsletterSub:d.newsletterSub,newsletterScript:d.newsletterScript});
  const ht=parseTripleLines(d.homeTrust);if(ht.length)h.trust=ht;const sf=parseTripleLines(d.selfFeatures);if(sf.length)h.selfFeatures=sf;const sp=parseSpaces(d.spaces);if(sp.length)h.spaces=sp;const why=parseTripleLines(d.why);if(why.length)h.why=why;
  const fc=parseLinkLines(d.footerCompany);if(fc.length)c.footer.company=fc;const fs=parseLinkLines(d.footerSupport);if(fs.length)c.footer.support=fs;c.footer.copyright=d.copyright||c.footer.copyright;
  Object.assign(pc,{kicker:d.pcKicker,title:d.pcTitle,sub:d.pcSub,latestTitle:d.pcLatestTitle,latestSub:d.pcLatestSub,latestCta:d.pcLatestCta,latestLink:d.pcLatestLink,basicsTitle:d.pcBasicsTitle,basicsSub:d.pcBasicsSub,ctaTitle:d.pcCtaTitle,ctaSub:d.pcCtaSub,contactText:d.pcContactText,contactLink:d.pcContactLink,shopText:d.pcShopText,shopLink:d.pcShopLink});
  const topics=parseTopics(d.pcTopics);if(topics.length)pc.topics=topics;const basics=parseTripleLines(d.pcBasics);if(basics.length)pc.basics=basics;
  DB.settings.content=c;save();paint();toast('Site content saved');
});
