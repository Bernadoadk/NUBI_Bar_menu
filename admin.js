
import CONFIG from './config.js';

let sb;
let currentSectionId = null;
let allSections = [];
let currentSubsections = [];

init();

async function init() {
    sb = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
    
    // Check auth status
    const { data: { session } } = await sb.auth.getSession();
    handleAuthState(session);

    // Watch for auth changes
    sb.auth.onAuthStateChange((_event, session) => {
        handleAuthState(session);
    });

    setupEventListeners();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // Load existing QR if any
    const savedQR = localStorage.getItem('nubi_menu_qr');
    if (savedQR) {
        document.getElementById('qr-preview-container').classList.remove('hidden');
        document.getElementById('qr-image').src = savedQR;
    }
}

function handleAuthState(session) {
    const authContainer = document.getElementById('auth-container');
    const dashboard = document.getElementById('dashboard');
    
    if (session) {
        authContainer.classList.add('opacity-0', 'pointer-events-none');
        dashboard.classList.remove('hidden');
        loadDashboard();
    } else {
        authContainer.classList.remove('opacity-0', 'pointer-events-none');
        dashboard.classList.add('hidden');
    }
}

function setupEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('login-error');
        
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => sb.auth.signOut());

    // QR Code
    document.getElementById('generate-qr-btn').addEventListener('click', () => generateAndShowQR());

    // Item Form
    document.getElementById('item-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        saveItem();
    });

    // Add Item Btn
    document.getElementById('add-item-btn').addEventListener('click', () => openModal());

    setupSubFormListener();
    setupCustomSelect();
}

async function generateAndShowQR() {
    const btn = document.getElementById('generate-qr-btn');
    const container = document.getElementById('qr-preview-container');
    const loader = document.getElementById('qr-loader');
    const img = document.getElementById('qr-image');
    
    // Show container and loader
    container.classList.remove('hidden');
    loader.classList.remove('hidden');
    
    // Determine Menu URL (Current origin)
    const menuUrl = window.location.origin;

    try {
        // Generate QR code using the library
        // We use a timeout to simulate a loading effect if it's too fast
        setTimeout(async () => {
            const qrDataUrl = await QRCode.toDataURL(menuUrl, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            });
            
            img.src = qrDataUrl;
            localStorage.setItem('nubi_menu_qr', qrDataUrl); // Save for persistence
            loader.classList.add('hidden');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 800);
    } catch (err) {
        console.error("QR Generation Error:", err);
        loader.classList.add('hidden');
    }
}

window.downloadQRCode = function() {
    const img = document.getElementById('qr-image');
    if (!img.src) return;
    
    const link = document.createElement('a');
    link.download = 'NUBI-Bar-Menu-QR.png';
    link.href = img.src;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

async function loadDashboard() {
    // 1. Load Sections
    const { data: sections, error } = await sb
        .from('sections')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error("Error loading sections:", error);
        return;
    }

    allSections = sections;
    renderSidebar();
    
    if (sections.length > 0 && !currentSectionId) {
        selectSection(sections[0].id);
    }
}
window.loadDashboard = loadDashboard;

function renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = allSections.map(s => `
        <button onclick="selectSection('${s.id}')" 
                class="w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-medium ${currentSectionId === s.id ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}">
            ${s.title_en}
        </button>
    `).join('');
}
window.renderSidebar = renderSidebar;

async function selectSection(id) {
    currentSectionId = id;
    const section = allSections.find(s => s.id === id);
    document.getElementById('current-section-title').textContent = section.title_en;
    renderSidebar();
    loadItems();
}
window.selectSection = selectSection;

async function loadItems() {
    const container = document.getElementById('items-container');
    container.innerHTML = '<div class="col-span-full py-20 text-center text-gray-500">Loading items...</div>';

    // 1. Fetch Subsections for this section
    const { data: subs } = await sb.from('subsections').select('*').eq('section_id', currentSectionId).order('sort_order');
    currentSubsections = subs || [];

    // 2. Fetch Items
    const { data: items, error } = await sb
        .from('items')
        .select('*')
        .eq('section_id', currentSectionId)
        .order('sort_order', { ascending: true });

    if (error) {
        container.innerHTML = `<div class="col-span-full py-20 text-center text-red-400">Error: ${error.message}</div>`;
        return;
    }

    if (items.length === 0 && currentSubsections.length === 0) {
        container.innerHTML = '<div class="col-span-full py-20 text-center text-gray-500 italic">No items or categories yet.</div>';
        return;
    }

    let finalHtml = '';
    
    // Group By Subsections
    if (currentSubsections.length > 0) {
        currentSubsections.forEach(sub => {
            const subItems = items.filter(i => i.subsection_id === sub.id);
            finalHtml += `
                <div class="col-span-full mt-10 mb-4 first:mt-0">
                    <div class="flex items-center justify-between border-b border-white/5 pb-4">
                        <div class="flex items-center gap-4">
                            <h2 class="text-xl font-serif text-purple-400 font-bold">${sub.name_en}</h2>
                            ${sub.default_price ? `<span class="bg-purple-500/10 text-purple-400 text-[10px] px-3 py-1 rounded-full border border-purple-500/20 font-bold tracking-widest">${sub.default_price}</span>` : ''}
                        </div>
                        <button onclick="editSubPrice('${sub.id}', '${sub.default_price || ''}')" class="text-[10px] font-bold text-gray-500 hover:text-white transition-colors tracking-widest uppercase">Edit Category Price</button>
                    </div>
                </div>
                ${subItems.map(item => renderItemCard(item)).join('')}
                ${subItems.length === 0 ? '<div class="col-span-full py-4 text-center text-gray-700 text-xs italic">Empty category</div>' : ''}
            `;
        });
    } else {
        // Flat items
        finalHtml = items.map(item => renderItemCard(item)).join('');
    }

    container.innerHTML = finalHtml || '<div class="col-span-full text-center py-10 opacity-50">No items found.</div>';
    
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}
window.loadItems = loadItems;

function renderItemCard(item) {
    return `
        <div class="item-card glass border border-white/5 rounded-2xl p-6 transition-all hover:glow-purple">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-white font-medium">${item.name_en}</h3>
                    <p class="text-xs text-gray-500 mt-1">${item.name_fr || ''}</p>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="toggleVisibility('${item.id}', ${item.is_visible})" 
                            class="p-2 rounded-lg hover:bg-white/5 transition-colors ${item.is_visible ? 'text-purple-400' : 'text-gray-600'}">
                        <i data-lucide="${item.is_visible ? 'eye' : 'eye-off'}" class="w-4 h-4"></i>
                    </button>
                    <button onclick="openModal('${item.id}')" class="p-2 text-gray-400 hover:text-white transition-colors">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteItem('${item.id}')" class="p-2 text-red-900/40 hover:text-red-400 transition-colors">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            <div class="flex justify-between items-end">
                <span class="text-purple-400 font-bold text-sm">${item.price || '<span class="text-gray-700 italic">Global Price</span>'}</span>
                <span class="text-[10px] text-gray-600 uppercase tracking-widest">${item.is_visible ? 'Visible' : 'Hidden'}</span>
            </div>
        </div>
    `;
}

async function editSubPrice(id) {
    const sub = currentSubsections.find(s => s.id === id);
    if (!sub) return;

    document.getElementById('sub-id').value = sub.id;
    document.getElementById('sub-name').value = sub.name_en;
    document.getElementById('sub-price').value = sub.default_price || '';

    const modal = document.getElementById('sub-modal-container');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}
window.editSubPrice = editSubPrice;

function closeSubModal() {
    const modal = document.getElementById('sub-modal-container');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}
window.closeSubModal = closeSubModal;

// Add to setupEventListeners or init
function setupSubFormListener() {
    document.getElementById('sub-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('sub-id').value;
        const subData = {
            name_en: document.getElementById('sub-name').value,
            default_price: document.getElementById('sub-price').value
        };

        const { error } = await sb.from('subsections').update(subData).eq('id', id);
        if (error) {
            alert("Error updating category: " + error.message);
        } else {
            closeSubModal();
            loadItems();
        }
    });
}

async function openModal(id = null) {
    const modal = document.getElementById('modal-container');
    const form = document.getElementById('item-form');
    document.getElementById('modal-title').textContent = id ? 'Edit Item' : 'Add New Item';
    form.reset();
    document.getElementById('item-id').value = id || '';
    
    // Clear and reset custom select
    const hiddenInput = document.getElementById('item-subsection');
    hiddenInput.value = '';
    document.getElementById('selected-text').textContent = 'Select Category';

    // Populate Custom Select Options
    const optionsContainer = document.getElementById('select-options');
    let optionsHtml = currentSubsections.map(s => `
        <div class="custom-option" onclick="selectCustomOption('${s.id}', '${s.name_en}')">${s.name_en}</div>
    `).join('');
    
    if (currentSubsections.length === 0) {
        optionsHtml = '<div class="custom-option" onclick="selectCustomOption(\'\', \'Main\')">Main</div>';
    }
    optionsContainer.innerHTML = optionsHtml;

    if (id) {
        const { data: item } = await sb.from('items').select('*').eq('id', id).single();
        if (item) {
            document.getElementById('item-name-en').value = item.name_en;
            document.getElementById('item-name-fr').value = item.name_fr || '';
            
            const sub = currentSubsections.find(s => s.id === item.subsection_id);
            selectCustomOption(item.subsection_id || '', sub ? sub.name_en : (currentSubsections.length === 0 ? 'Main' : 'Select Category'));

            document.getElementById('item-price').value = item.price || '';
            document.getElementById('item-desc-en').value = item.description_en || '';
            document.getElementById('item-desc-fr').value = item.description_fr || '';
            document.getElementById('item-visible').checked = item.is_visible;
        }
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}
window.openModal = openModal;

function selectCustomOption(val, text) {
    document.getElementById('item-subsection').value = val;
    document.getElementById('selected-text').textContent = text;
    document.getElementById('select-options').classList.add('hidden');
    
    // Mark as selected in UI
    document.querySelectorAll('.custom-option').forEach(opt => {
        opt.classList.toggle('selected', opt.textContent === text);
    });
}
window.selectCustomOption = selectCustomOption;

// Add these to setupEventListeners
function setupCustomSelect() {
    const trigger = document.getElementById('select-trigger');
    const options = document.getElementById('select-options');

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        options.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
        options.classList.add('hidden');
    });
}

function closeModal() {
    const modal = document.getElementById('modal-container');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}
window.closeModal = closeModal;

async function saveItem() {
    const id = document.getElementById('item-id').value;
    const itemData = {
        section_id: currentSectionId,
        subsection_id: document.getElementById('item-subsection').value || null,
        name_en: document.getElementById('item-name-en').value,
        name_fr: document.getElementById('item-name-fr').value,
        price: document.getElementById('item-price').value,
        description_en: document.getElementById('item-desc-en').value,
        description_fr: document.getElementById('item-desc-fr').value,
        is_visible: document.getElementById('item-visible').checked
    };

    let error;
    if (id) {
        ({ error } = await sb.from('items').update(itemData).eq('id', id));
    } else {
        ({ error } = await sb.from('items').insert([itemData]));
    }

    if (error) {
        alert("Error saving item: " + error.message);
    } else {
        closeModal();
        loadItems();
    }
}

async function deleteItem(id) {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const { error } = await sb.from('items').delete().eq('id', id);
    if (error) alert("Error deleting item: " + error.message);
    else loadItems();
}
window.deleteItem = deleteItem;

async function toggleVisibility(id, current) {
    const { error } = await sb.from('items').update({ is_visible: !current }).eq('id', id);
    if (!error) loadItems();
}
window.toggleVisibility = toggleVisibility;
