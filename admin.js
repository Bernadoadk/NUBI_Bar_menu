
import { api } from './api.js';
import { adminStrings } from './admin_i18n.js';

let currentLang = localStorage.getItem('nubi_admin_lang') || 'fr';
let currentSectionId = null;
let allSections = [];
let currentSubsections = [];

function t(key) {
    return adminStrings[currentLang][key] || adminStrings.fr[key] || key;
}

function sectionTitle(section) {
    return currentLang === 'fr' ? (section.title_fr || section.title_en) : section.title_en;
}

function subsectionName(sub) {
    return currentLang === 'fr' ? (sub.name_fr || sub.name_en) : sub.name_en;
}

function itemDisplayName(item) {
    return currentLang === 'fr' ? (item.name_fr || item.name_en) : item.name_en;
}

function itemSecondaryName(item) {
    return currentLang === 'fr' ? item.name_en : (item.name_fr || '');
}

function updateUI() {
    document.documentElement.lang = currentLang;
    document.title = t('page_title');
    document.getElementById('lang-text').textContent = currentLang === 'fr' ? 'EN' : 'FR';

    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
        el.alt = t(el.dataset.i18nAlt);
    });

    if (allSections.length > 0) {
        renderSidebar();
        if (currentSectionId) {
            const section = allSections.find(s => s.id === currentSectionId);
            if (section) {
                document.getElementById('current-section-title').textContent = sectionTitle(section);
            }
        } else {
            document.getElementById('current-section-title').textContent = t('menu_management');
        }
    } else {
        document.getElementById('current-section-title').textContent = t('menu_management');
    }
}

init();

async function init() {
    updateUI();
    setupLangToggle();

    const token = localStorage.getItem('nubi_admin_token');
    if (token) {
        try {
            await api.getMe();
            handleAuthState(true);
        } catch {
            localStorage.removeItem('nubi_admin_token');
            handleAuthState(false);
        }
    } else {
        handleAuthState(false);
    }

    setupEventListeners();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function setupLangToggle() {
    document.getElementById('lang-toggle').addEventListener('click', () => {
        currentLang = currentLang === 'fr' ? 'en' : 'fr';
        localStorage.setItem('nubi_admin_lang', currentLang);
        updateUI();
        if (currentSectionId) loadItems();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
}

function handleAuthState(isAuthenticated) {
    const authContainer = document.getElementById('auth-container');
    const dashboard = document.getElementById('dashboard');

    if (isAuthenticated) {
        authContainer.classList.add('opacity-0', 'pointer-events-none');
        dashboard.classList.remove('hidden');
        loadDashboard();

        const savedQR = localStorage.getItem('nubi_menu_qr');
        if (savedQR) {
            const container = document.getElementById('qr-preview-container');
            const img = document.getElementById('qr-image');
            const loader = document.getElementById('qr-loader');

            if (container && img) {
                container.classList.remove('hidden');
                if (loader) loader.classList.add('hidden');
                img.src = savedQR;
            }
        }
    } else {
        authContainer.classList.remove('opacity-0', 'pointer-events-none');
        dashboard.classList.add('hidden');
    }
}

function setupEventListeners() {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('login-error');

        try {
            const { token } = await api.login(email, password);
            localStorage.setItem('nubi_admin_token', token);
            errorEl.classList.add('hidden');
            handleAuthState(true);
        } catch (error) {
            errorEl.textContent = error.message;
            errorEl.classList.remove('hidden');
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('nubi_admin_token');
        handleAuthState(false);
    });

    document.getElementById('generate-qr-btn').addEventListener('click', () => generateAndShowQR());
    document.getElementById('item-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        saveItem();
    });
    document.getElementById('add-item-btn').addEventListener('click', () => openModal());

    setupSubFormListener();
    setupCustomSelect();
}

async function generateAndShowQR() {
    const container = document.getElementById('qr-preview-container');
    const loader = document.getElementById('qr-loader');
    const img = document.getElementById('qr-image');

    container.classList.remove('hidden');
    loader.classList.remove('hidden');

    const menuUrl = window.location.origin.replace(/\/admin.*$/, '');

    try {
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
            localStorage.setItem('nubi_menu_qr', qrDataUrl);
            loader.classList.add('hidden');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }, 800);
    } catch (err) {
        console.error('QR Generation Error:', err);
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
    try {
        allSections = await api.getSections();
        renderSidebar();

        if (allSections.length > 0 && !currentSectionId) {
            selectSection(allSections[0].id);
        }
    } catch (error) {
        console.error('Error loading sections:', error);
    }
}
window.loadDashboard = loadDashboard;

function renderSidebar() {
    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = allSections.map(s => `
        <button onclick="selectSection('${s.id}')"
                class="w-full text-left px-4 py-3 rounded-xl transition-all text-sm font-medium ${currentSectionId === s.id ? 'bg-purple-600/10 text-purple-400 border border-purple-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}">
            ${sectionTitle(s)}
        </button>
    `).join('');
}
window.renderSidebar = renderSidebar;

async function selectSection(id) {
    currentSectionId = id;
    const section = allSections.find(s => s.id === id);
    document.getElementById('current-section-title').textContent = sectionTitle(section);
    renderSidebar();
    loadItems();
}
window.selectSection = selectSection;

async function loadItems() {
    const container = document.getElementById('items-container');
    container.innerHTML = `<div class="col-span-full py-20 text-center text-gray-500">${t('loading_items')}</div>`;

    try {
        currentSubsections = await api.getSubsections(currentSectionId);
        const items = await api.getItems(currentSectionId);

        if (items.length === 0 && currentSubsections.length === 0) {
            container.innerHTML = `<div class="col-span-full py-20 text-center text-gray-500 italic">${t('no_items_categories')}</div>`;
            return;
        }

        let finalHtml = '';

        if (currentSubsections.length > 0) {
            currentSubsections.forEach(sub => {
                const subItems = items.filter(i => i.subsection_id === sub.id);
                finalHtml += `
                    <div class="col-span-full mt-10 mb-4 first:mt-0">
                        <div class="flex items-center justify-between border-b border-white/5 pb-4">
                            <div class="flex items-center gap-4">
                                <h2 class="text-xl font-serif text-purple-400 font-bold">${subsectionName(sub)}</h2>
                                ${sub.default_price ? `<span class="bg-purple-500/10 text-purple-400 text-[10px] px-3 py-1 rounded-full border border-purple-500/20 font-bold tracking-widest">${sub.default_price}</span>` : ''}
                            </div>
                            <button onclick="openSubModal('${sub.id}')" class="text-[10px] font-bold text-gray-500 hover:text-white transition-colors tracking-widest uppercase">${t('edit_category')}</button>
                        </div>
                    </div>
                    ${subItems.map(item => renderItemCard(item)).join('')}
                    ${subItems.length === 0 ? `<div class="col-span-full py-4 text-center text-gray-700 text-xs italic">${t('empty_category')}</div>` : ''}
                `;
            });
        } else {
            finalHtml = items.map(item => renderItemCard(item)).join('');
        }

        container.innerHTML = finalHtml || `<div class="col-span-full text-center py-10 opacity-50">${t('no_items_found')}</div>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (error) {
        container.innerHTML = `<div class="col-span-full py-20 text-center text-red-400">${t('error_prefix')}${error.message}</div>`;
    }
}
window.loadItems = loadItems;

function renderItemCard(item) {
    const globalPriceHtml = `<span class="text-gray-700 italic">${t('global_price')}</span>`;
    return `
        <div class="item-card glass border border-white/5 rounded-2xl p-6 transition-all hover:glow-purple">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-white font-medium">${itemDisplayName(item)}</h3>
                    <p class="text-xs text-gray-500 mt-1">${itemSecondaryName(item)}</p>
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
                <span class="text-purple-400 font-bold text-sm">${item.price || globalPriceHtml}</span>
                <span class="text-[10px] text-gray-600 uppercase tracking-widest">${item.is_visible ? t('visible') : t('hidden')}</span>
            </div>
        </div>
    `;
}

async function openSubModal(id = null) {
    const modal = document.getElementById('sub-modal-container');
    const form = document.getElementById('sub-form');
    const title = document.getElementById('sub-modal-title');
    const deleteBtn = document.getElementById('delete-sub-btn');

    form.reset();
    document.getElementById('sub-id').value = id || '';

    if (id) {
        title.textContent = t('edit_category');
        deleteBtn.classList.remove('hidden');
        const sub = currentSubsections.find(s => s.id === id);
        if (sub) {
            document.getElementById('sub-name').value = sub.name_en;
            document.getElementById('sub-name-fr').value = sub.name_fr || '';
            document.getElementById('sub-price').value = sub.default_price || '';
        }
    } else {
        title.textContent = t('add_new_category');
        deleteBtn.classList.add('hidden');
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}
window.openSubModal = openSubModal;

function closeSubModal() {
    const modal = document.getElementById('sub-modal-container');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}
window.closeSubModal = closeSubModal;

function setupSubFormListener() {
    document.getElementById('sub-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('sub-id').value;
        const subData = {
            section_id: currentSectionId,
            name_en: document.getElementById('sub-name').value,
            name_fr: document.getElementById('sub-name-fr').value,
            default_price: document.getElementById('sub-price').value
        };

        try {
            if (id) {
                await api.updateSubsection(id, subData);
            } else {
                await api.createSubsection(subData);
            }
            closeSubModal();
            loadItems();
        } catch (error) {
            alert(t('error_save_category') + error.message);
        }
    });
}

async function deleteSub() {
    const id = document.getElementById('sub-id').value;
    if (!id) return;

    if (!confirm(t('confirm_delete_category'))) return;

    try {
        await api.deleteSubsection(id);
        closeSubModal();
        loadItems();
    } catch (error) {
        alert(t('error_delete_category') + error.message);
    }
}
window.deleteSub = deleteSub;

async function openModal(id = null) {
    const modal = document.getElementById('modal-container');
    const form = document.getElementById('item-form');
    document.getElementById('modal-title').textContent = id ? t('edit_item') : t('add_new_item');
    form.reset();
    document.getElementById('item-id').value = id || '';

    const hiddenInput = document.getElementById('item-subsection');
    hiddenInput.value = '';
    document.getElementById('selected-text').textContent = t('select_category');

    const optionsContainer = document.getElementById('select-options');
    let optionsHtml = currentSubsections.map(s => {
        const name = subsectionName(s).replace(/'/g, "\\'");
        return `<div class="custom-option" onclick="selectCustomOption('${s.id}', '${name}')">${subsectionName(s)}</div>`;
    }).join('');

    if (currentSubsections.length === 0) {
        optionsHtml = `<div class="custom-option" onclick="selectCustomOption('', '${t('main')}')">${t('main')}</div>`;
    }
    optionsContainer.innerHTML = optionsHtml;

    if (id) {
        const item = await api.getItem(id);
        if (item) {
            document.getElementById('item-name-en').value = item.name_en;
            document.getElementById('item-name-fr').value = item.name_fr || '';

            const sub = currentSubsections.find(s => s.id === item.subsection_id);
            const defaultLabel = currentSubsections.length === 0 ? t('main') : t('select_category');
            selectCustomOption(item.subsection_id || '', sub ? subsectionName(sub) : defaultLabel);

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

    document.querySelectorAll('.custom-option').forEach(opt => {
        opt.classList.toggle('selected', opt.textContent === text);
    });
}
window.selectCustomOption = selectCustomOption;

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

    try {
        if (id) {
            await api.updateItem(id, itemData);
        } else {
            await api.createItem(itemData);
        }
        closeModal();
        loadItems();
    } catch (error) {
        alert(t('error_save_item') + error.message);
    }
}

async function deleteItem(id) {
    if (!confirm(t('confirm_delete_item'))) return;

    try {
        await api.deleteItem(id);
        loadItems();
    } catch (error) {
        alert(t('error_delete_item') + error.message);
    }
}
window.deleteItem = deleteItem;

async function toggleVisibility(id, current) {
    try {
        await api.toggleItemVisibility(id, !current);
        loadItems();
    } catch (error) {
        alert(t('error_visibility') + error.message);
    }
}
window.toggleVisibility = toggleVisibility;
