let permissionRequested = false;
let initialized = false;
let isOpen = false;
let labels = {};

const STORE_KEY = 'nubi_admin_notifications';
const MAX_NOTIFICATIONS = 40;

const defaultLabels = {
  title: 'Notifications',
  empty: 'No notifications yet.',
  mark_read: 'Mark all read',
  clear: 'Clear',
  open_orders: 'Open orders',
  unread: 'unread'
};

function t(key) {
  return labels[key] || defaultLabels[key] || key;
}

function readNotifications() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeNotifications(items) {
  localStorage.setItem(STORE_KEY, JSON.stringify(items.slice(0, MAX_NOTIFICATIONS)));
}

function unreadCount(items = readNotifications()) {
  return items.filter(item => !item.read).length;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function ensureStyles() {
  if (document.getElementById('admin-notification-styles')) return;
  const style = document.createElement('style');
  style.id = 'admin-notification-styles';
  style.textContent = `
    .admin-notification-toast { animation: adminToastIn .22s ease-out; }
    @keyframes adminToastIn { from { opacity: 0; transform: translateY(-8px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    .admin-notification-panel { transform-origin: top right; animation: adminPanelIn .18s ease-out; }
    @keyframes adminPanelIn { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @media (prefers-reduced-motion: reduce) { .admin-notification-toast, .admin-notification-panel { animation: none; } }
  `;
  document.head.appendChild(style);
}

function ensureShell() {
  if (document.getElementById('admin-notification-root')) return;
  ensureStyles();

  const root = document.createElement('div');
  root.id = 'admin-notification-root';
  root.innerHTML = `
    <div class="fixed top-6 right-28 z-[125]">
      <button id="admin-notification-toggle" type="button" aria-expanded="false" class="relative bg-black/55 backdrop-blur-md border border-purple-500/30 w-11 h-11 rounded-full hover:border-purple-500 hover:bg-purple-500/10 transition-all flex items-center justify-center shadow-2xl shadow-black/25" title="${escapeHtml(t('title'))}">
        <i data-lucide="bell" class="w-4 h-4 text-purple-400"></i>
        <span id="admin-notification-badge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-5 h-5 px-1 rounded-full items-center justify-center">0</span>
      </button>
      <div id="admin-notification-panel" class="admin-notification-panel hidden absolute right-0 mt-3 w-[min(390px,calc(100vw-32px))] bg-[#09070d]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        <div class="flex items-start justify-between gap-3 p-4 border-b border-white/5 bg-white/[0.035]">
          <div class="flex items-center gap-2">
            <span class="w-9 h-9 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <i data-lucide="bell-ring" class="w-4 h-4 text-purple-300"></i>
            </span>
            <span>
              <h2 id="admin-notification-title" class="text-white text-sm font-bold uppercase tracking-widest">${escapeHtml(t('title'))}</h2>
              <span id="admin-notification-count" class="block text-[10px] text-gray-500 uppercase tracking-widest mt-1"></span>
            </span>
          </div>
          <button id="admin-notification-close" type="button" class="text-gray-500 hover:text-white p-2 rounded-xl hover:bg-white/5">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>
        <div class="flex gap-2 p-3 border-b border-white/5">
          <button id="admin-notification-read" type="button" class="flex-1 text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-2xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5">${escapeHtml(t('mark_read'))}</button>
          <button id="admin-notification-clear" type="button" class="flex-1 text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-2xl border border-white/10 text-gray-300 hover:text-white hover:bg-white/5">${escapeHtml(t('clear'))}</button>
        </div>
        <div id="admin-notification-list" class="max-h-[420px] overflow-y-auto"></div>
      </div>
    </div>
    <div id="admin-notification-toasts" class="fixed top-20 right-6 z-[130] w-[min(360px,calc(100vw-32px))] space-y-3 pointer-events-none"></div>
  `;

  document.body.appendChild(root);
  document.getElementById('admin-notification-toggle')?.addEventListener('click', toggleNotificationPanel);
  document.getElementById('admin-notification-close')?.addEventListener('click', closeNotificationPanel);
  document.getElementById('admin-notification-read')?.addEventListener('click', markAllNotificationsRead);
  document.getElementById('admin-notification-clear')?.addEventListener('click', clearNotifications);
  document.addEventListener('click', (event) => {
    const panel = document.getElementById('admin-notification-panel');
    const toggle = document.getElementById('admin-notification-toggle');
    if (!isOpen || panel?.contains(event.target) || toggle?.contains(event.target)) return;
    closeNotificationPanel();
  });
}

function renderNotifications() {
  if (!initialized) return;
  ensureShell();

  const items = readNotifications();
  const count = unreadCount(items);
  const badge = document.getElementById('admin-notification-badge');
  if (badge) {
    badge.textContent = String(Math.min(count, 99));
    badge.classList.toggle('hidden', count === 0);
    badge.classList.toggle('flex', count > 0);
  }

  const title = document.getElementById('admin-notification-title');
  if (title) title.textContent = t('title');
  const countLabel = document.getElementById('admin-notification-count');
  if (countLabel) countLabel.textContent = count > 0 ? `${count} ${t('unread')}` : '';
  const readBtn = document.getElementById('admin-notification-read');
  if (readBtn) readBtn.textContent = t('mark_read');
  const clearBtn = document.getElementById('admin-notification-clear');
  if (clearBtn) clearBtn.textContent = t('clear');

  const list = document.getElementById('admin-notification-list');
  if (!list) return;
  if (items.length === 0) {
    list.innerHTML = `
      <div class="text-center py-12 px-6">
        <span class="mx-auto w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500">
          <i data-lucide="bell-off" class="w-5 h-5"></i>
        </span>
        <p class="text-gray-500 text-sm mt-4">${escapeHtml(t('empty'))}</p>
      </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
    return;
  }

  list.innerHTML = items.map(item => `
    <button type="button" class="notification-row w-full text-left p-4 border-b border-white/5 hover:bg-white/[0.055] transition-colors ${item.read ? 'opacity-60' : 'bg-purple-500/[0.035]'}" data-id="${escapeHtml(item.id)}">
      <div class="flex items-start gap-3">
        <span class="mt-0.5 w-10 h-10 rounded-2xl border ${item.type === 'server-call' ? 'border-orange-500/20 bg-orange-500/10 text-orange-300' : 'border-purple-500/20 bg-purple-500/10 text-purple-300'} flex items-center justify-center">
          <i data-lucide="${item.type === 'server-call' ? 'bell-ring' : 'clipboard-list'}" class="w-4 h-4"></i>
        </span>
        <span class="flex-1 min-w-0">
          <span class="block text-white text-sm font-semibold">${escapeHtml(item.title)}</span>
          <span class="block text-gray-400 text-xs mt-1 leading-relaxed">${escapeHtml(item.body)}</span>
          <span class="block text-gray-600 text-[10px] font-bold uppercase tracking-widest mt-2">${escapeHtml(formatTime(item.createdAt))}</span>
        </span>
        ${item.read ? '' : '<span class="mt-1 w-2 h-2 rounded-full bg-red-500"></span>'}
      </div>
    </button>
  `).join('');

  list.querySelectorAll('.notification-row').forEach(row => {
    row.addEventListener('click', () => openNotification(row.dataset.id));
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleNotificationPanel() {
  isOpen = !isOpen;
  document.getElementById('admin-notification-panel')?.classList.toggle('hidden', !isOpen);
  document.getElementById('admin-notification-toggle')?.setAttribute('aria-expanded', String(isOpen));
  if (isOpen) renderNotifications();
}

function closeNotificationPanel() {
  isOpen = false;
  document.getElementById('admin-notification-panel')?.classList.add('hidden');
  document.getElementById('admin-notification-toggle')?.setAttribute('aria-expanded', 'false');
}

function markAllNotificationsRead() {
  const items = readNotifications().map(item => ({ ...item, read: true }));
  writeNotifications(items);
  renderNotifications();
}

function clearNotifications() {
  writeNotifications([]);
  renderNotifications();
}

function openNotification(id) {
  const items = readNotifications();
  const item = items.find(n => n.id === id);
  writeNotifications(items.map(n => n.id === id ? { ...n, read: true } : n));
  renderNotifications();
  if (item?.href) window.location.href = item.href;
}

function showToast(notification) {
  const container = document.getElementById('admin-notification-toasts');
  if (!container) return;

  const toast = document.createElement('button');
  toast.type = 'button';
  toast.className = 'admin-notification-toast pointer-events-auto w-full text-left bg-[#09070d]/95 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-4 shadow-2xl hover:border-purple-500 transition-all overflow-hidden';
  toast.innerHTML = `
    <div class="flex items-start gap-3">
      <span class="w-10 h-10 rounded-2xl border flex items-center justify-center ${notification.type === 'server-call' ? 'border-orange-500/20 bg-orange-500/10 text-orange-300' : 'border-purple-500/20 bg-purple-500/10 text-purple-300'}">
        <i data-lucide="${notification.type === 'server-call' ? 'bell-ring' : 'clipboard-list'}" class="w-4 h-4"></i>
      </span>
      <span class="flex-1">
        <span class="block text-white text-sm font-bold">${escapeHtml(notification.title)}</span>
        <span class="block text-gray-400 text-xs mt-1">${escapeHtml(notification.body)}</span>
      </span>
      <i data-lucide="chevron-right" class="w-4 h-4 text-gray-600 mt-1"></i>
    </div>
    <span class="block h-0.5 bg-purple-500/50 mt-4 rounded-full"></span>
  `;
  toast.addEventListener('click', () => openNotification(notification.id));
  container.prepend(toast);
  if (typeof lucide !== 'undefined') lucide.createIcons();

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    toast.style.transition = 'opacity .18s ease, transform .18s ease';
    setTimeout(() => toast.remove(), 220);
  }, 6500);
}

export function initAdminNotifications(nextLabels = {}) {
  labels = { ...defaultLabels, ...nextLabels };
  initialized = true;
  ensureShell();
  renderNotifications();
}

export function updateAdminNotificationLabels(nextLabels = {}) {
  labels = { ...defaultLabels, ...nextLabels };
  renderNotifications();
}

export function setAdminNotificationsVisible(visible) {
  document.getElementById('admin-notification-root')?.classList.toggle('hidden', !visible);
  if (!visible) closeNotificationPanel();
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (permissionRequested) return Notification.permission;
  permissionRequested = true;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
  return Notification.permission;
}

export function notifyAdmin(title, body, options = {}) {
  const notification = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    body,
    type: options.type || 'order',
    href: options.href || '/admin-orders.html',
    read: false,
    createdAt: new Date().toISOString()
  };

  const items = [notification, ...readNotifications()];
  writeNotifications(items);
  if (initialized) {
    renderNotifications();
    showToast(notification);
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return;

  try {
    const n = new Notification(title, { body, tag: options.tag || 'nubi-order', icon: '/favicon.ico' });
    n.onclick = () => { window.focus(); n.close(); if (notification.href) window.location.href = notification.href; };
  } catch { /* unsupported */ }
}

export function playOrderSound(type = 'order') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75);

    const sequence = type === 'server-call'
      ? [{ f: 660, t: 0 }, { f: 880, t: 0.16 }, { f: 660, t: 0.32 }]
      : [{ f: 784, t: 0 }, { f: 1046, t: 0.14 }];

    sequence.forEach(note => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = note.f;
      osc.connect(gain);
      osc.start(ctx.currentTime + note.t);
      osc.stop(ctx.currentTime + note.t + 0.18);
    });

    setTimeout(() => ctx.close?.(), 1000);
  } catch { /* audio not available */ }
}
