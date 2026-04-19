import CONFIG from './config.js';

let currentLang = 'en';
let menuData = [];
let sb;

const sectionImages = {
    'drinks-of-the-week': 'https://images.unsplash.com/photo-1772311698901-fe3fa07141be?fm=jpg&q=60&w=3000&auto=format&fit=crop',
    'wine-menu': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80',
    'champagnes': 'https://plus.unsplash.com/premium_photo-1661508738591-ce22ac766586?fm=jpg&q=60&w=3000&auto=format&fit=crop',
    'spirits': 'https://punchdrink.com/wp-content/uploads/2024/02/Article-High-End-Spirits-Cocktails.jpg?w=1024',
    'food': 'https://thumbs.dreamstime.com/b/three-pizzas-dark-background-overhead-view-441929329.jpg',
    'desserts': 'https://thumbs.dreamstime.com/b/three-creamy-delicious-milkshake-variations-elegant-glasses-three-milkshakes-whipped-cream-chocolate-drizzle-displayed-362520258.jpg'
};

const uiStrings = {
    en: {
        hero_subtitle: "Discover Our Selection",
        hero_categories: "Wines • Spirits • Cocktails • Food",
        footer_tagline: "Elegance in every pour.",
        footer_disclaimer: "© 2026 NUBI Bar • All prices in FCFA • Please drink responsibly",
        whatsapp_text: "RESERVE TABLE", btl: "BTL", gls: "GLS", shot: "SHOT", name: "NAME"
    },
    fr: {
        hero_subtitle: "Découvrez Notre Sélection",
        hero_categories: "Vins • Spiritueux • Cocktails • Cuisine",
        footer_tagline: "L'élégance dans chaque verre.",
        footer_disclaimer: "© 2026 NUBI Bar • Prix en FCFA • À consommer avec modération",
        whatsapp_text: "RÉSERVER", btl: "BTE", gls: "VER", shot: "SHOT", name: "NOM"
    }
};

init();

async function init() {
    sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    
    await loadMenuData();
    renderContent();
    setupEventListeners();
}

async function loadMenuData() {
    // 1. Fetch Sections
    const { data: sections, error: secError } = await sb.from('sections').select('*').order('sort_order');
    if (secError) { console.error(secError); return; }

    // 2. Fetch Subsections
    const { data: subsections, error: subError } = await sb.from('subsections').select('*').order('sort_order');
    if (subError) { console.error(subError); return; }

    // 3. Fetch Items
    const { data: items, error: itemError } = await sb.from('items').select('*').eq('is_visible', true).order('sort_order');
    if (itemError) { console.error(itemError); return; }

    // Assemble hierarchical data
    menuData = sections.map(sec => {
        const secSubs = subsections.filter(s => s.section_id === sec.id);
        const secItems = items.filter(i => i.section_id === sec.id && !i.subsection_id);
        
        return {
            id: sec.id,
            slug: sec.slug,
            title: { en: sec.title_en, fr: sec.title_fr },
            subsections: secSubs.map(sub => ({
                id: sub.id,
                name: { en: sub.name_en, fr: sub.name_fr },
                defaultPrice: sub.default_price,
                items: items.filter(i => i.subsection_id === sub.id)
            })),
            items: secItems
        };
    });
}

function renderContent() {
    // Update static text
    document.getElementById('hero-subtitle').textContent = uiStrings[currentLang].hero_subtitle;
    document.getElementById('hero-categories').textContent = uiStrings[currentLang].hero_categories;
    document.getElementById('footer-tagline').textContent = uiStrings[currentLang].footer_tagline;
    document.getElementById('footer-disclaimer').textContent = uiStrings[currentLang].footer_disclaimer;
    document.getElementById('whatsapp-text').textContent = uiStrings[currentLang].whatsapp_text;

    renderMenu();
}

function renderMenu() {
    const container = document.getElementById('menu-sections');
    container.innerHTML = menuData.map(section => `
        <section id="${section.slug}" class="mb-20">
            <div class="relative h-64 md:h-80 rounded-3xl overflow-hidden mb-12 group">
                <img src="${sectionImages[section.slug] || ''}" alt="${section.title[currentLang]}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
                <div class="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
                <div class="absolute bottom-8 left-8">
                    <h2 class="text-4xl md:text-5xl font-serif text-white uppercase tracking-wider">${section.title[currentLang]}</h2>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                ${section.subsections.map(sub => `
                    <div class="col-span-full mb-4">
                        <div class="flex items-center gap-6 mb-8 group">
                            <div class="h-px flex-grow bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
                            <h3 class="text-2xl font-serif text-purple-400 uppercase tracking-widest px-4 flex items-center gap-4">
                                ${sub.name[currentLang]}
                                ${sub.defaultPrice ? `<span class="text-sm font-sans bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full border border-purple-500/20">${sub.defaultPrice}</span>` : ''}
                            </h3>
                            <div class="h-px flex-grow bg-gradient-to-r from-transparent via-purple-500/30 to-transparent"></div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10">
                            ${sub.items.map(item => renderItem(item)).join('')}
                        </div>
                    </div>
                `).join('')}
                
                ${section.items.map(item => renderItem(item)).join('')}
            </div>
        </section>
    `).join('');
}

function renderItem(item) {
    const hasDetails = (currentLang === 'en' ? item.description_en : item.description_fr);
    return `
        <div class="group">
            <div class="flex justify-between items-baseline mb-2">
                <h4 class="text-lg font-medium text-gray-200 group-hover:text-purple-400 transition-colors uppercase tracking-tight">
                    ${currentLang === 'en' ? item.name_en : (item.name_fr || item.name_en)}
                </h4>
                ${item.price ? `<span class="text-purple-400 font-bold ml-4">${item.price}</span>` : ''}
            </div>
            ${hasDetails ? `<p class="text-sm text-gray-500 font-light leading-relaxed italic">${hasDetails}</p>` : ''}
        </div>
    `;
}

function setupEventListeners() {
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentLang = e.target.dataset.lang;
            
            // UI Updates
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('bg-purple-600', 'text-white'));
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.add('text-gray-500'));
            e.target.classList.add('bg-purple-600', 'text-white');
            e.target.classList.remove('text-gray-500');

            renderContent();
        });
    });
}
