(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))s(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const p of o.addedNodes)p.tagName==="LINK"&&p.rel==="modulepreload"&&s(p)}).observe(document,{childList:!0,subtree:!0});function i(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(n){if(n.ep)return;n.ep=!0;const o=i(n);fetch(n.href,o)}})();const _={SUPABASE_URL:"https://ijqfzidwrsblraenovun.supabase.co",SUPABASE_ANON_KEY:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcWZ6aWR3cnNibHJhZW5vdnVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NDg4MTIsImV4cCI6MjA5MjEyNDgxMn0.Mg97_wa43p2QPcnf5LsEiEnM9GsYe8JAYgxVU8CNW7g"};window.CONFIG=_;let c="en",m=[],u;const E={"drinks-of-the-week":"https://images.unsplash.com/photo-1772311698901-fe3fa07141be?fm=jpg&q=60&w=3000&auto=format&fit=crop","wine-menu":"https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80",champagnes:"https://plus.unsplash.com/premium_photo-1661508738591-ce22ac766586?fm=jpg&q=60&w=3000&auto=format&fit=crop",spirits:"https://punchdrink.com/wp-content/uploads/2024/02/Article-High-End-Spirits-Cocktails.jpg?w=1024",food:"https://thumbs.dreamstime.com/b/three-pizzas-dark-background-overhead-view-441929329.jpg",desserts:"https://thumbs.dreamstime.com/b/three-creamy-delicious-milkshake-variations-elegant-glasses-three-milkshakes-whipped-cream-chocolate-drizzle-displayed-362520258.jpg"},h={en:{hero_subtitle:"Discover Our Selection",hero_categories:"Wines • Spirits • Cocktails • Food",footer_tagline:"Elegance in every pour.",footer_disclaimer:"© 2026 NUBI Bar • All prices in FCFA • Please drink responsibly",whatsapp_text:"RESERVE TABLE",btl:"BTL",gls:"GLS",shot:"SHOT",name:"NAME"},fr:{hero_subtitle:"Découvrez Notre Sélection",hero_categories:"Vins • Spiritueux • Cocktails • Cuisine",footer_tagline:"L'élégance dans chaque verre.",footer_disclaimer:"© 2026 NUBI Bar • Prix en FCFA • À consommer avec modération",whatsapp_text:"RÉSERVER",btl:"BTE",gls:"VER",shot:"SHOT",name:"NOM"}};document.addEventListener("DOMContentLoaded",()=>{I()});async function I(){u=supabase.createClient(CONFIG.SUPABASE_URL,CONFIG.SUPABASE_ANON_KEY),await $(),typeof lucide<"u"&&lucide.createIcons(),x(),b(),v(),y(),N(),typeof gsap<"u"&&S()}async function $(){const{data:e}=await u.from("sections").select("*").order("sort_order"),{data:t}=await u.from("subsections").select("*").order("sort_order"),{data:i}=await u.from("items").select("*").eq("is_visible",!0).order("sort_order");m=e.map(s=>{const n=t.filter(r=>r.section_id===s.id),o=i.filter(r=>r.section_id===s.id),p={id:s.slug,title:{en:s.title_en,fr:s.title_fr},subtitle:s.subtitle_en?{en:s.subtitle_en,fr:s.subtitle_fr}:null,type:s.type};return s.type==="spirits"?p.categories=n.map(r=>({name:{en:r.name_en,fr:r.name_fr},items:i.filter(a=>a.subsection_id===r.id).map(a=>({name:a.name_en,prices:a.prices_array}))})):n.length>0?p.subsections=n.map(r=>({name:{en:r.name_en,fr:r.name_fr},defaultPrice:r.default_price,items:i.filter(a=>a.subsection_id===r.id).map(f)})):p.items=o.map(f),p})}function f(e){return{name:e.name_fr?{en:e.name_en,fr:e.name_fr}:e.name_en,price:e.price,description:e.description_en?{en:e.description_en,fr:e.description_fr}:null,note:e.note_en?{en:e.note_en,fr:e.note_fr}:null}}function x(){const e=h[c];document.getElementById("hero-subtitle").textContent=e.hero_subtitle,document.getElementById("hero-categories").textContent=e.hero_categories,document.getElementById("footer-tagline").textContent=e.footer_tagline,document.getElementById("footer-disclaimer").textContent=e.footer_disclaimer,document.getElementById("whatsapp-text").textContent=e.whatsapp_text,document.getElementById("lang-text").textContent=c==="en"?"FR":"EN";const t="https://wa.me/225000000000?text=",i=c==="en"?"Hello NUBI Bar, I'd like to reserve a table.":"Bonjour NUBI Bar, je souhaiterais réserver une table.",s=document.getElementById("whatsapp-btn");s&&(s.href=t+encodeURIComponent(i))}function b(){const e=document.getElementById("nav-list");e&&(e.innerHTML=m.map(t=>`
        <li><a href="#${t.id}" class="nav-link">${t.title[c]}</a></li>
    `).join(""))}function v(){const e=document.getElementById("menu-container");e&&(e.innerHTML="",m.forEach(t=>{const i=document.createElement("div");i.className="menu-section-wrapper py-24 md:py-32",i.style.backgroundImage=`url('${E[t.id]||""}')`;const s=document.createElement("div");s.className="container mx-auto px-4 max-w-5xl relative z-20";const n=document.createElement("section");n.id=t.id,n.className="scroll-mt-32";const o=t.subtitle?t.subtitle[c]:"",p=`
            <div class="mb-16 text-center">
                <h2 class="text-4xl md:text-7xl font-serif text-white mb-6 drop-shadow-lg">${t.title[c]}</h2>
                <div class="flex items-center justify-center gap-6">
                    <div class="h-px bg-purple-500/50 w-12"></div>
                    ${o?`<p class="text-purple-400 text-[10px] tracking-[0.3em] uppercase font-bold glow-text">${o}</p>`:'<div class="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></div>'}
                    <div class="h-px bg-purple-500/50 w-12"></div>
                </div>
            </div>
        `;let r="";if(t.type==="featured")r+='<div class="grid md:grid-cols-2 gap-8">',t.subsections.forEach(a=>{r+=`
                    <div class="premium-card p-8 rounded-2xl backdrop-blur-md bg-black/50 border border-white/10">
                        <h3 class="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4 flex justify-between items-end">
                            ${a.name[c]}
                            ${a.defaultPrice?`<span class="text-purple-400 text-xs font-sans tracking-tight">${a.defaultPrice}</span>`:""}
                        </h3>
                        <div class="space-y-6">
                            ${a.items.map(l=>`
                                <div>
                                    <div class="flex justify-between gap-4 items-baseline">
                                        <span class="text-white font-medium text-sm tracking-wide">${typeof l.name=="object"?l.name[c]:l.name}</span>
                                        ${l.price?`<span class="text-purple-400 font-semibold text-xs whitespace-nowrap glow-text">${l.price}</span>`:""}
                                    </div>
                                    ${l.description?`<p class="text-gray-400 text-[11px] mt-1 leading-relaxed font-light italic opacity-80">${l.description[c]}</p>`:""}
                                </div>
                            `).join("")}
                        </div>
                    </div>
                `}),r+="</div>";else if(t.type==="spirits"){const a=h[c];r+='<div class="grid lg:grid-cols-2 gap-10">',t.categories.forEach(l=>{r+=`
                    <div class="backdrop-blur-sm bg-black/40 p-6 rounded-xl border border-white/5">
                        <h3 class="text-lg font-serif text-purple-400 mb-6 flex items-center gap-3">
                            <span class="w-6 h-px bg-purple-500/30"></span>
                            ${l.name[c]}
                        </h3>
                        <div class="spirit-grid-header text-purple-200/40">
                            <span>${a.name}</span>
                            <span class="text-right">${a.btl}</span>
                            <span class="text-right">${a.gls}</span>
                            <span class="text-right">${a.shot}</span>
                        </div>
                        <div class="mt-2">
                            ${l.items.map(d=>`
                                <div class="spirit-item group">
                                    <span class="text-white text-xs font-medium group-hover:text-purple-400 transition-colors">${d.name}</span>
                                    <span class="spirit-price text-gray-400">${d.prices[0]||"-"}</span>
                                    <span class="spirit-price text-gray-400">${d.prices[1]||"-"}</span>
                                    <span class="spirit-price text-purple-400 font-bold glow-text">${d.prices[2]||"-"}</span>
                                </div>
                            `).join("")}
                        </div>
                    </div>
                `}),r+="</div>"}else{const a='<div class="backdrop-blur-md bg-black/50 p-6 md:p-10 rounded-2xl border border-white/10">';let l="";t.subsections?(l+='<div class="space-y-12">',t.subsections.forEach(d=>{l+=`
                        <div>
                            <h3 class="text-xl font-serif text-purple-200/50 mb-6 italic flex items-center gap-4">
                                ${d.name[c]}
                                <div class="h-px bg-white/10 flex-grow"></div>
                            </h3>
                            <div class="grid md:grid-cols-2 gap-x-10 gap-y-2">
                                ${d.items.map(w=>g(w)).join("")}
                            </div>
                        </div>
                    `}),l+="</div>"):l+=`<div class="grid md:grid-cols-2 gap-x-10 gap-y-2">
                    ${t.items.map(d=>g(d)).join("")}
                </div>`,r+=a+l+"</div>"}n.innerHTML=p+r,s.appendChild(n),i.appendChild(s),e.appendChild(i)}))}function g(e){const t=typeof e.name=="object"?e.name[c]:e.name,i=e.note?typeof e.note=="object"?e.note[c]:e.note:null,s=e.description?typeof e.description=="object"?e.description[c]:e.description:null;return`
        <div class="group py-2">
            <div class="menu-item">
                <span class="text-white group-hover:text-purple-400 transition-colors text-sm font-medium tracking-wide">${t}</span>
                <span class="dots"></span>
                <span class="text-purple-400 font-bold text-xs tracking-tighter whitespace-nowrap glow-text">${e.price||""}</span>
            </div>
            ${i?`<p class="text-[9px] text-purple-500/80 uppercase tracking-[0.15em] font-bold mt-1">${i}</p>`:""}
            ${s?`<p class="text-[11px] text-gray-400 mt-1 font-light leading-relaxed opacity-70 italic">${s}</p>`:""}
        </div>
    `}function y(){const e={root:null,rootMargin:"-20% 0px -70% 0px",threshold:0},t=new IntersectionObserver(i=>{i.forEach(s=>{if(s.isIntersecting){const n=s.target.getAttribute("id");document.querySelectorAll(".nav-link").forEach(o=>{o.classList.toggle("active",o.getAttribute("href")===`#${n}`)})}})},e);document.querySelectorAll("section").forEach(i=>t.observe(i))}function N(){const e=document.getElementById("lang-toggle");e&&e.addEventListener("click",()=>{c=c==="en"?"fr":"en",x(),b(),v(),y()})}function S(){gsap.registerPlugin(ScrollTrigger),gsap.utils.toArray(".menu-section-wrapper").forEach(e=>{const t=e.querySelector("section");t&&gsap.from(t,{opacity:0,y:30,duration:.8,ease:"power2.out",scrollTrigger:{trigger:e,start:"top 85%",toggleActions:"play none none none"}})})}
