import { menuData, uiStrings } from './menu_data.js';

let currentLang = 'en';

const sectionImages = {
    'drinks-of-the-week': 'https://images.unsplash.com/photo-1772311698901-fe3fa07141be?fm=jpg&q=60&w=3000&auto=format&fit=crop',
    'wine-menu': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80',
    'champagnes': 'https://plus.unsplash.com/premium_photo-1661508738591-ce22ac766586?fm=jpg&q=60&w=3000&auto=format&fit=crop',
    'spirits': 'https://punchdrink.com/wp-content/uploads/2024/02/Article-High-End-Spirits-Cocktails.jpg?w=1024',
    'food': 'https://thumbs.dreamstime.com/b/three-pizzas-dark-background-overhead-view-441929329.jpg',
    'desserts': 'https://thumbs.dreamstime.com/b/three-creamy-delicious-milkshake-variations-elegant-glasses-three-milkshakes-whipped-cream-chocolate-drizzle-displayed-362520258.jpg'
};

document.addEventListener('DOMContentLoaded', () => {
    init();
});

function init() {
    if (typeof lucide !== 'undefined') lucide.createIcons();
    updateUI();
    renderNav();
    renderMenu();
    setupNavigation();
    setupLangToggle();
    if (typeof gsap !== 'undefined') initScrollAnimations();
}

function updateUI() {
    const s = uiStrings[currentLang];
    document.getElementById('hero-subtitle').textContent = s.hero_subtitle;
    document.getElementById('hero-categories').textContent = s.hero_categories;
    document.getElementById('footer-tagline').textContent = s.footer_tagline;
    document.getElementById('footer-disclaimer').textContent = s.footer_disclaimer;
    document.getElementById('whatsapp-text').textContent = s.whatsapp_text;
    document.getElementById('lang-text').textContent = currentLang === 'en' ? 'FR' : 'EN';
    
    const waBase = "https://wa.me/225000000000?text=";
    const waText = currentLang === 'en' ? "Hello NUBI Bar, I'd like to reserve a table." : "Bonjour NUBI Bar, je souhaiterais réserver une table.";
    document.getElementById('whatsapp-btn').href = waBase + encodeURIComponent(waText);
}

function renderNav() {
    const navList = document.getElementById('nav-list');
    navList.innerHTML = menuData.map(section => `
        <li><a href="#${section.id}" class="nav-link">${section.title[currentLang]}</a></li>
    `).join('');
}

function renderMenu() {
    const container = document.getElementById('menu-container');
    if (!container) return;
    container.innerHTML = ''; 

    menuData.forEach(section => {
        const bgWrapper = document.createElement('div');
        bgWrapper.className = 'menu-section-wrapper py-24 md:py-32';
        bgWrapper.style.backgroundImage = `url('${sectionImages[section.id] || ''}')`;
        
        const contentContainer = document.createElement('div');
        contentContainer.className = 'container mx-auto px-4 max-w-5xl relative z-20';
        
        const sectionEl = document.createElement('section');
        sectionEl.id = section.id;
        sectionEl.className = 'scroll-mt-32';

        const subtitleText = section.subtitle ? section.subtitle[currentLang] : '';
        const headerHtml = `
            <div class="mb-16 text-center">
                <h2 class="text-4xl md:text-7xl font-serif text-white mb-6 drop-shadow-lg">${section.title[currentLang]}</h2>
                <div class="flex items-center justify-center gap-6">
                    <div class="h-px bg-purple-500/50 w-12"></div>
                    ${subtitleText ? `<p class="text-purple-400 text-[10px] tracking-[0.3em] uppercase font-bold glow-text">${subtitleText}</p>` : '<div class="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></div>'}
                    <div class="h-px bg-purple-500/50 w-12"></div>
                </div>
            </div>
        `;

        let bodyHtml = '';
        if (section.type === 'featured') {
            bodyHtml += `<div class="grid md:grid-cols-2 gap-8">`;
            section.subsections.forEach(sub => {
                bodyHtml += `
                    <div class="premium-card p-8 rounded-2xl backdrop-blur-md bg-black/50 border border-white/10">
                        <h3 class="text-xl font-serif text-white mb-6 border-b border-white/10 pb-4 flex justify-between items-end">
                            ${sub.name[currentLang]}
                            ${sub.defaultPrice ? `<span class="text-purple-400 text-xs font-sans tracking-tight">${sub.defaultPrice}</span>` : ''}
                        </h3>
                        <div class="space-y-6">
                            ${sub.items.map(item => `
                                <div>
                                    <div class="flex justify-between gap-4 items-baseline">
                                        <span class="text-white font-medium text-sm tracking-wide">${typeof item.name === 'object' ? item.name[currentLang] : item.name}</span>
                                        ${item.price ? `<span class="text-purple-400 font-semibold text-xs whitespace-nowrap glow-text">${item.price}</span>` : ''}
                                    </div>
                                    ${item.description ? `<p class="text-gray-400 text-[11px] mt-1 leading-relaxed font-light italic opacity-80">${item.description[currentLang]}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
            bodyHtml += `</div>`;
        } else if (section.type === 'spirits') {
            const s = uiStrings[currentLang];
            bodyHtml += `<div class="grid lg:grid-cols-2 gap-10">`;
            section.categories.forEach(cat => {
                bodyHtml += `
                    <div class="backdrop-blur-sm bg-black/40 p-6 rounded-xl border border-white/5">
                        <h3 class="text-lg font-serif text-purple-400 mb-6 flex items-center gap-3">
                            <span class="w-6 h-px bg-purple-500/30"></span>
                            ${cat.name[currentLang]}
                        </h3>
                        <div class="spirit-grid-header text-purple-200/40">
                            <span>${s.name}</span>
                            <span class="text-right">${s.btl}</span>
                            <span class="text-right">${s.gls}</span>
                            <span class="text-right">${s.shot}</span>
                        </div>
                        <div class="mt-2">
                            ${cat.items.map(item => `
                                <div class="spirit-item group">
                                    <span class="text-white text-xs font-medium group-hover:text-purple-400 transition-colors">${item.name}</span>
                                    <span class="spirit-price text-gray-400">${item.prices[0]}</span>
                                    <span class="spirit-price text-gray-400">${item.prices[1]}</span>
                                    <span class="spirit-price text-purple-400 font-bold glow-text">${item.prices[2]}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            });
            bodyHtml += `</div>`;
        } else {
            const listWrapperStart = `<div class="backdrop-blur-md bg-black/50 p-6 md:p-10 rounded-2xl border border-white/10">`;
            let listContent = '';
            if (section.subsections) {
                listContent += `<div class="space-y-12">`;
                section.subsections.forEach(sub => {
                    listContent += `
                        <div>
                            <h3 class="text-xl font-serif text-purple-200/50 mb-6 italic flex items-center gap-4">
                                ${sub.name[currentLang]}
                                <div class="h-px bg-white/10 flex-grow"></div>
                            </h3>
                            <div class="grid md:grid-cols-2 gap-x-10 gap-y-2">
                                ${sub.items.map(item => renderListItem(item)).join('')}
                            </div>
                        </div>
                    `;
                });
                listContent += `</div>`;
            } else {
                listContent += `<div class="grid md:grid-cols-2 gap-x-10 gap-y-2">
                    ${section.items.map(item => renderListItem(item)).join('')}
                </div>`;
            }
            bodyHtml += listWrapperStart + listContent + `</div>`;
        }

        sectionEl.innerHTML = headerHtml + bodyHtml;
        contentContainer.appendChild(sectionEl);
        bgWrapper.appendChild(contentContainer);
        container.appendChild(bgWrapper);
    });
}

function renderListItem(item) {
    const name = typeof item.name === 'object' ? item.name[currentLang] : item.name;
    const note = item.note ? (typeof item.note === 'object' ? item.note[currentLang] : item.note) : null;
    const desc = item.description ? (typeof item.description === 'object' ? item.description[currentLang] : item.description) : null;
    
    return `
        <div class="group py-2">
            <div class="menu-item">
                <span class="text-white group-hover:text-purple-400 transition-colors text-sm font-medium tracking-wide">${name}</span>
                <span class="dots"></span>
                <span class="text-purple-400 font-bold text-xs tracking-tighter whitespace-nowrap glow-text">${item.price}</span>
            </div>
            ${note ? `<p class="text-[9px] text-purple-500/80 uppercase tracking-[0.15em] font-bold mt-1">${note}</p>` : ''}
            ${desc ? `<p class="text-[11px] text-gray-400 mt-1 font-light leading-relaxed opacity-70 italic">${desc}</p>` : ''}
        </div>
    `;
}

function setupNavigation() {
    const observerOptions = { root: null, rootMargin: '-20% 0px -70% 0px', threshold: 0 };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, observerOptions);
    document.querySelectorAll('section').forEach(section => observer.observe(section));
}

function setupLangToggle() {
    document.getElementById('lang-toggle').addEventListener('click', () => {
        currentLang = currentLang === 'en' ? 'fr' : 'en';
        updateUI();
        renderNav();
        renderMenu();

        setupNavigation();
    });
}

function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray('.menu-section-wrapper').forEach(wrapper => {
        const section = wrapper.querySelector('section');
        if (section) {
            gsap.from(section, {
                opacity: 0,
                y: 30,
                duration: 0.8,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: wrapper,
                    start: "top 85%",
                    toggleActions: "play none none none"
                }
            });
        }
    });
}
