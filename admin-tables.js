import { api } from './api.js';
import { adminStrings } from './admin_i18n.js';
import {
    initAdminNotifications,
    updateAdminNotificationLabels,
    setAdminNotificationsVisible,
    requestNotificationPermission,
    notifyAdmin,
    playOrderSound
} from './adminNotify.js';

let currentLang = localStorage.getItem('nubi_admin_lang') || 'fr';
let allTables = [];
let searchQuery = '';
let ordersPollTimer = null;
let lastPendingCount = 0;
const qrCache = new Map();

function t(key) {
    return adminStrings[currentLang][key] || adminStrings.fr[key] || key;
}

function notificationLabels() {
    return {
        title: t('notifications'),
        empty: t('notifications_empty'),
        mark_read: t('notifications_mark_read'),
        clear: t('notifications_clear'),
        open_orders: t('notifications_open_orders'),
        unread: t('notifications_unread')
    };
}

function getMenuBaseUrl() {
    return window.location.origin.replace(/\/admin.*$/, '');
}

function updateUI() {
    document.documentElement.lang = currentLang;
    document.title = t('tables_page_title');
    document.getElementById('lang-text').textContent = currentLang === 'fr' ? 'EN' : 'FR';

    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    updateAdminNotificationLabels(notificationLabels());
}

init();

async function init() {
    initAdminNotifications(notificationLabels());
    setAdminNotificationsVisible(false);
    updateUI();
    setupLangToggle();
    setupEventListeners();

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

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function setupLangToggle() {
    document.getElementById('lang-toggle').addEventListener('click', () => {
        currentLang = currentLang === 'fr' ? 'en' : 'fr';
        localStorage.setItem('nubi_admin_lang', currentLang);
        updateUI();
        renderTables();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });
}

function handleAuthState(isAuthenticated) {
    const authContainer = document.getElementById('auth-container');
    const dashboard = document.getElementById('dashboard');

    if (isAuthenticated) {
        authContainer.classList.add('opacity-0', 'pointer-events-none');
        dashboard.classList.remove('hidden');
        setAdminNotificationsVisible(true);
        loadTables();
        requestNotificationPermission();
        pollPendingOrders();
        if (!ordersPollTimer) ordersPollTimer = setInterval(pollPendingOrders, 8000);
    } else {
        authContainer.classList.remove('opacity-0', 'pointer-events-none');
        dashboard.classList.add('hidden');
        setAdminNotificationsVisible(false);
        if (ordersPollTimer) { clearInterval(ordersPollTimer); ordersPollTimer = null; }
    }
}

async function pollPendingOrders() {
    try {
        const { count } = await api.getPendingOrderCount();
        if (count > lastPendingCount && lastPendingCount > 0) {
            playOrderSound();
            notifyAdmin(t('new_order_title'), t('new_order_body').replace('{n}', count), {
                type: 'order',
                href: '/admin-orders.html',
                tag: 'nubi-new-order'
            });
        }
        lastPendingCount = count;
    } catch { /* ignore */ }
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

    document.getElementById('add-table-btn').addEventListener('click', addTable);

    document.getElementById('table-search').addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        renderTables();
    });
}

async function loadTables() {
    try {
        allTables = await api.getTables();
        renderTables();
    } catch (error) {
        console.error('Error loading tables:', error);
    }
}

async function generateQR(number) {
    if (qrCache.has(number)) return qrCache.get(number);

    const url = `${getMenuBaseUrl()}/?table=${number}`;
    const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
    });

    qrCache.set(number, dataUrl);
    return dataUrl;
}

function getFilteredTables() {
    if (!searchQuery) return allTables;
    return allTables.filter(table => String(table.number).includes(searchQuery));
}

async function renderTables() {
    const grid = document.getElementById('tables-grid');
    const emptyEl = document.getElementById('tables-empty');
    const noMatchEl = document.getElementById('tables-no-match');
    const countEl = document.getElementById('tables-count');
    const filtered = getFilteredTables();

    grid.innerHTML = '';
    if (countEl) countEl.textContent = String(allTables.length);

    if (allTables.length === 0) {
        emptyEl.classList.remove('hidden');
        noMatchEl.classList.add('hidden');
        return;
    }

    emptyEl.classList.add('hidden');

    if (filtered.length === 0) {
        noMatchEl.classList.remove('hidden');
        return;
    }

    noMatchEl.classList.add('hidden');

    for (const table of filtered) {
        const card = document.createElement('div');
        card.className = 'relative overflow-hidden bg-white/[0.055] border border-white/10 rounded-3xl p-5 flex flex-col gap-4 shadow-2xl shadow-black/20 hover:border-purple-500/35 transition-all';
        card.dataset.tableId = table.id;

        const header = document.createElement('div');
        header.className = 'flex items-center justify-between gap-3';
        header.innerHTML = `
            <div>
                <p class="text-[10px] uppercase tracking-widest text-purple-300 font-bold">${t('table_label')}</p>
                <p class="text-white font-serif text-3xl tracking-wide">${table.number}</p>
            </div>
            <span class="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-center">
                <i data-lucide="utensils" class="w-5 h-5"></i>
            </span>
        `;

        const qrWrapper = document.createElement('div');
        qrWrapper.className = 'relative group w-full aspect-square rounded-3xl bg-white p-4 shadow-inner shadow-purple-950/10';

        const loader = document.createElement('div');
        loader.className = 'absolute inset-0 flex items-center justify-center bg-white rounded-3xl z-10';
        loader.innerHTML = '<div class="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>';

        const img = document.createElement('img');
        img.className = 'w-full h-full object-contain rounded-2xl bg-white';
        img.alt = `${t('qr_table_alt')} ${table.number}`;

        const overlay = document.createElement('div');
        overlay.className = 'absolute inset-3 bg-black/78 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl';
        overlay.innerHTML = `
            <i data-lucide="download" class="w-8 h-8 text-white mb-2"></i>
            <span class="text-[10px] text-white font-bold uppercase tracking-widest">${t('download')}</span>
        `;
        overlay.addEventListener('click', () => downloadQR(table.number, img.src));

        qrWrapper.appendChild(loader);
        qrWrapper.appendChild(img);
        qrWrapper.appendChild(overlay);

        const actions = document.createElement('div');
        actions.className = 'grid grid-cols-[1fr_auto] gap-2';
        actions.innerHTML = `
            <button type="button" class="download-table-btn flex items-center justify-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-purple-200 hover:bg-purple-500/20 transition-colors">
                <i data-lucide="download" class="w-4 h-4"></i>
                <span>${t('download')}</span>
            </button>
        `;
        actions.querySelector('.download-table-btn').addEventListener('click', () => downloadQR(table.number, img.src));

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'w-11 h-11 rounded-2xl border border-white/10 text-gray-500 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10 transition-colors flex items-center justify-center';
        deleteBtn.title = t('delete');
        deleteBtn.innerHTML = '<i data-lucide="trash-2" class="w-4 h-4"></i>';
        deleteBtn.addEventListener('click', () => deleteTable(table));
        actions.appendChild(deleteBtn);

        card.appendChild(header);
        card.appendChild(qrWrapper);
        card.appendChild(actions);
        grid.appendChild(card);

        try {
            img.src = await generateQR(table.number);
            loader.remove();
        } catch (err) {
            console.error('QR generation error:', err);
            loader.remove();
        }
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function addTable() {
    const btn = document.getElementById('add-table-btn');
    btn.disabled = true;
    btn.classList.add('opacity-60', 'cursor-wait');

    try {
        await api.createTable();
        await loadTables();
    } catch (error) {
        console.error('Error creating table:', error);
        alert(t('error_prefix') + error.message);
    } finally {
        btn.disabled = false;
        btn.classList.remove('opacity-60', 'cursor-wait');
    }
}

async function deleteTable(table) {
    const message = t('confirm_delete_table').replace('{n}', table.number);
    if (!confirm(message)) return;

    try {
        await api.deleteTable(table.id);
        qrCache.delete(table.number);
        await loadTables();
    } catch (error) {
        console.error('Error deleting table:', error);
        alert(t('error_prefix') + error.message);
    }
}

function downloadQR(number, src) {
    if (!src) return;

    const link = document.createElement('a');
    link.download = `NUBI-Table-${number}-QR.png`;
    link.href = src;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
