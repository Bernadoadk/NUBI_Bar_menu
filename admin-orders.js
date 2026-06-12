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
let orders = [];
let pollTimer = null;
let lastSentCount = 0;
let pendingStatusUpdate = null;
let notifiedServerCalls = new Set();

const statusActions = {
  SENT: { next: 'VIEWED', labelKey: 'mark_viewed', icon: 'eye' },
  VIEWED: { next: 'PREPARING', labelKey: 'mark_preparing', icon: 'chef-hat', needsTime: true },
  PREPARING: { next: 'READY', labelKey: 'mark_ready', icon: 'bell-ring' },
  READY: { next: 'PAID', labelKey: 'mark_paid', icon: 'banknote' }
};

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function itemName(item) {
  return currentLang === 'fr' ? (item.name_fr || item.name_en) : item.name_en;
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString(currentLang === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
}

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const num = parseInt(String(priceStr).replace(/[^\d]/g, ''), 10);
  return Number.isNaN(num) ? 0 : num;
}

function formatPrice(amount) {
  if (!amount) return '0 FCFA';
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

function orderTotal(order) {
  return order.items.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
}

function isRecentCall(order) {
  if (!order.called_at) return false;
  return Date.now() - new Date(order.called_at).getTime() < 30 * 60 * 1000;
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

function updateUI() {
  document.documentElement.lang = currentLang;
  document.title = t('orders_page_title');
  document.getElementById('lang-text').textContent = currentLang === 'fr' ? 'EN' : 'FR';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  updateAdminNotificationLabels(notificationLabels());
}

function setupLangToggle() {
  document.getElementById('lang-toggle').addEventListener('click', () => {
    currentLang = currentLang === 'fr' ? 'en' : 'fr';
    localStorage.setItem('nubi_admin_lang', currentLang);
    updateUI();
    renderOrders();
    if (typeof lucide !== 'undefined') lucide.createIcons();
  });
}

function handleAuthState(isAuthenticated) {
  document.getElementById('auth-container').classList.toggle('opacity-0', isAuthenticated);
  document.getElementById('auth-container').classList.toggle('pointer-events-none', isAuthenticated);
  document.getElementById('dashboard').classList.toggle('hidden', !isAuthenticated);
  if (isAuthenticated) {
    setAdminNotificationsVisible(true);
    requestNotificationPermission();
    loadOrders();
    startPolling();
  } else {
    setAdminNotificationsVisible(false);
    if (pollTimer) clearInterval(pollTimer);
  }
}

function setupEventListeners() {
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const { token } = await api.login(document.getElementById('email').value, document.getElementById('password').value);
      localStorage.setItem('nubi_admin_token', token);
      document.getElementById('login-error').classList.add('hidden');
      handleAuthState(true);
    } catch (error) {
      const el = document.getElementById('login-error');
      el.textContent = error.message;
      el.classList.remove('hidden');
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('nubi_admin_token');
    handleAuthState(false);
  });

  document.getElementById('time-cancel').addEventListener('click', () => {
    document.getElementById('time-modal').classList.add('hidden');
    pendingStatusUpdate = null;
  });

  document.getElementById('time-confirm').addEventListener('click', async () => {
    if (!pendingStatusUpdate) return;
    const minutes = parseInt(document.getElementById('estimated-minutes').value, 10) || 15;
    document.getElementById('time-modal').classList.add('hidden');
    await updateStatus(pendingStatusUpdate.orderId, pendingStatusUpdate.status, minutes);
    pendingStatusUpdate = null;
  });
}

async function loadOrders() {
  try {
    orders = await api.getOrders();
    const sentCount = orders.filter(o => o.status === 'SENT').length;
    const readyCount = orders.filter(o => o.status === 'READY').length;
    const openTables = new Set(orders.map(o => o.table_number)).size;
    const serverCalls = orders.filter(isRecentCall);

    if (sentCount > lastSentCount && lastSentCount > 0) {
      playOrderSound();
      notifyAdmin(t('new_order_title'), t('new_order_body').replace('{n}', sentCount), {
        type: 'order',
        href: '/admin-orders.html',
        tag: 'nubi-new-order'
      });
    }
    const newServerCalls = serverCalls.filter(o => o.called_at && !notifiedServerCalls.has(`${o.id}:${o.called_at}`));
    if (newServerCalls.length > 0) {
      playOrderSound('server-call');
      notifyAdmin(t('server_call_title'), t('server_call_body'), {
        type: 'server-call',
        href: '/admin-orders.html',
        tag: 'nubi-server-call'
      });
      newServerCalls.forEach(o => notifiedServerCalls.add(`${o.id}:${o.called_at}`));
    }
    lastSentCount = sentCount;

    document.getElementById('pending-count').textContent = sentCount;
    document.getElementById('metric-active-orders').textContent = orders.length;
    document.getElementById('metric-new-orders').textContent = sentCount;
    document.getElementById('metric-ready-orders').textContent = readyCount;
    document.getElementById('metric-open-tables').textContent = openTables;
    renderOrders();
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(loadOrders, 5000);
}

function statusBadge(status) {
  const colors = {
    SENT: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    VIEWED: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    PREPARING: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    READY: 'bg-green-500/10 text-green-400 border-green-500/30',
    PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    COMPLETED: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
    CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/30'
  };
  return `<span class="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${colors[status] || ''}">${t('status_' + status)}</span>`;
}

function renderStatusTrail(status) {
  const steps = [
    { key: 'SENT', icon: 'send' },
    { key: 'VIEWED', icon: 'eye' },
    { key: 'PREPARING', icon: 'chef-hat' },
    { key: 'READY', icon: 'bell-ring' },
    { key: 'PAID', icon: 'banknote' }
  ];
  const currentIndex = status === 'COMPLETED'
    ? steps.length - 1
    : Math.max(0, steps.findIndex(step => step.key === status));

  return `
    <div class="grid grid-cols-5 gap-1.5 mb-4">
      ${steps.map((step, index) => {
        const done = index <= currentIndex;
        const current = step.key === status || (status === 'COMPLETED' && step.key === 'PAID');
        return `
          <div class="min-w-0">
            <div class="h-1.5 rounded-full ${done ? 'bg-purple-500' : 'bg-white/10'}"></div>
            <div class="mt-1 flex items-center gap-1 ${current ? 'text-white' : done ? 'text-purple-300' : 'text-gray-700'}">
              <i data-lucide="${step.icon}" class="w-3 h-3 shrink-0"></i>
              <span class="text-[8px] font-bold uppercase tracking-widest truncate">${escapeHtml(t('status_' + step.key))}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>`;
}

function groupByTable(orderList) {
  const groups = {};
  orderList.forEach(o => {
    const n = o.table_number;
    if (!groups[n]) groups[n] = [];
    groups[n].push(o);
  });
  return Object.entries(groups).sort(([a], [b]) => Number(a) - Number(b));
}

function canCloseTab(tableOrders) {
  if (tableOrders.length === 0) return false;
  return tableOrders.every(o => o.status === 'PAID') &&
    tableOrders.some(o => o.status === 'PAID');
}

function tableStatusSummary(tableOrders) {
  const counts = tableOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([status, count]) => `${count} ${t('status_' + status).toLowerCase()}`)
    .join(' · ');
}

function printTicket(order) {
  const date = new Date(order.created_at).toLocaleString(currentLang === 'fr' ? 'fr-FR' : 'en-GB');
  const total = orderTotal(order);
  const rows = order.items.map(item => `
    <tr>
      <td class="qty">${escapeHtml(item.quantity)}x</td>
      <td>
        <strong>${escapeHtml(itemName(item))}</strong>
        ${item.note ? `<br><small>${escapeHtml(item.note)}</small>` : ''}
      </td>
      <td class="amount">${escapeHtml(formatPrice(parsePrice(item.price) * item.quantity))}</td>
    </tr>
  `).join('');

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
    <html>
      <head>
        <title>NUBI Ticket #${escapeHtml(order.display_number)}</title>
        <style>
          *{box-sizing:border-box}
          body{font-family:"Courier New",monospace;max-width:320px;margin:0 auto;padding:14px 10px;color:#111;background:#fff}
          .brand{text-align:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:10px}
          h1{font-family:Georgia,serif;font-size:24px;letter-spacing:2px;margin:0}
          .subtitle{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;margin-top:4px}
          .meta{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:10px 0 12px}
          .meta div{border:1px solid #111;padding:6px}
          .label{display:block;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#555}
          .value{display:block;font-size:15px;font-weight:700;margin-top:2px}
          p{margin:4px 0;font-size:12px}
          table{width:100%;border-collapse:collapse;margin-top:12px}
          td{padding:8px 0;border-bottom:1px dashed #999;font-size:12px;vertical-align:top}
          .qty{width:30px;font-weight:700}
          .amount{text-align:right;white-space:nowrap;font-weight:700}
          small{color:#555;font-style:italic}
          .total{display:flex;justify-content:space-between;align-items:center;border-top:2px solid #111;margin-top:12px;padding-top:10px;font-size:16px;font-weight:800}
          .thanks{text-align:center;margin-top:14px;font-size:10px;text-transform:uppercase;letter-spacing:1px}
          @media print{body{padding:0}.no-print{display:none}}
        </style>
      </head>
      <body>
        <div class="brand">
          <h1>NUBI BAR</h1>
          <div class="subtitle">${escapeHtml(t('receipt_admin_ticket'))}</div>
        </div>
        <div class="meta">
          <div><span class="label">${escapeHtml(t('table_label'))}</span><span class="value">${escapeHtml(order.table_number)}</span></div>
          <div><span class="label">${escapeHtml(t('receipt_order'))}</span><span class="value">#${escapeHtml(order.display_number)}</span></div>
        </div>
        <p>${escapeHtml(date)}</p>
        <table><tbody>${rows}</tbody></table>
        <div class="total"><span>${escapeHtml(t('receipt_total'))}</span><span>${escapeHtml(formatPrice(total))}</span></div>
        <p class="thanks">NUBI BAR</p>
      </body>
    </html>`);
  win.document.close();
  win.print();
}

function renderOrders() {
  const list = document.getElementById('orders-list');
  const empty = document.getElementById('orders-empty');

  if (orders.length === 0) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  const groups = groupByTable(orders);

  list.innerHTML = groups.map(([tableNum, tableOrders]) => {
    const closeable = canCloseTab(tableOrders);
    const cards = tableOrders.map(order => {
      const action = statusActions[order.status];
      const isNew = order.status === 'SENT';
      const called = isRecentCall(order);
      const total = orderTotal(order);

      return `
        <div class="order-admin-card glass border rounded-3xl p-5 mb-4 shadow-2xl shadow-black/20 ${isNew ? 'new-order border-yellow-500/35 bg-yellow-500/[0.035]' : called ? 'border-orange-500/45 bg-orange-500/[0.035]' : 'border-white/10'}">
          ${called ? `<div class="flex items-center gap-2 text-orange-300 bg-orange-500/10 border border-orange-500/20 rounded-2xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest mb-4"><i data-lucide="bell-ring" class="w-4 h-4"></i>${t('client_waiting')}</div>` : ''}
          <div class="flex justify-between items-start gap-4 mb-4">
            <div>
              <p class="text-gray-500 text-[10px] font-bold uppercase tracking-widest">${t('receipt_order')}</p>
              <p class="text-white font-serif text-3xl leading-none mt-1">#${order.display_number}</p>
              <p class="text-gray-500 text-xs mt-2 flex items-center gap-1.5"><i data-lucide="clock" class="w-3.5 h-3.5"></i>${formatTime(order.created_at)}</p>
            </div>
            <div class="text-right">
              ${statusBadge(order.status)}
              <p class="text-purple-200 font-bold text-lg mt-3">${escapeHtml(formatPrice(total))}</p>
            </div>
          </div>
          ${renderStatusTrail(order.status)}
          <div class="space-y-2.5 mb-4 border-t border-white/5 pt-4">
            ${order.items.map(item => `
              <div class="text-sm rounded-2xl bg-black/20 border border-white/5 px-3 py-2.5">
                <div class="grid grid-cols-[1fr_auto] gap-3">
                  <span class="text-gray-100 font-medium">${escapeHtml(itemName(item))} <span class="text-gray-500">×${escapeHtml(item.quantity)}</span></span>
                  ${item.price ? `<span class="text-purple-200 text-xs font-semibold whitespace-nowrap">${escapeHtml(formatPrice(parsePrice(item.price) * item.quantity))}</span>` : ''}
                </div>
                ${item.note ? `<p class="text-[10px] text-gray-500 italic mt-0.5 pl-2 border-l border-purple-500/30">"${escapeHtml(item.note)}"</p>` : ''}
              </div>
            `).join('')}
          </div>
          ${order.status === 'PREPARING' && order.estimated_minutes ? `
            <p class="text-orange-400/80 text-xs mb-3">~${order.estimated_minutes} ${t('minutes')}</p>` : ''}
          <div class="grid grid-cols-[1fr_auto] gap-2">
            ${action ? `
              <button type="button" class="status-btn min-w-0 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all
                ${order.status === 'READY' ? 'bg-green-600/20 border border-green-500/40 text-green-300 hover:bg-green-600/30' : 'bg-purple-600/15 border border-purple-500/30 text-purple-200 hover:bg-purple-600/25'}"
                data-order-id="${order.id}" data-status="${action.next}" data-needs-time="${action.needsTime || false}">
                <i data-lucide="${action.icon}" class="w-4 h-4"></i> ${t(action.labelKey)}
              </button>` : ''}
            ${!['PAID', 'COMPLETED', 'CANCELLED'].includes(order.status) ? `
              <button type="button" class="cancel-admin-btn w-12 h-12 flex items-center justify-center rounded-2xl text-[10px] font-bold uppercase border border-red-500/30 text-red-300 hover:bg-red-500/10" data-order-id="${order.id}">
                <i data-lucide="x" class="w-4 h-4"></i>
              </button>` : ''}
          </div>
          ${['READY', 'PAID'].includes(order.status) ? `
            <button type="button" class="print-ticket-btn w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest border border-white/10 text-gray-300 hover:text-white hover:bg-white/5" data-order-id="${order.id}">
              <i data-lucide="printer" class="w-4 h-4"></i> ${t('print_ticket')}
            </button>` : ''}
        </div>`;
    }).join('');

    return `
      <div class="table-group">
        <div class="flex items-start justify-between gap-4 mb-4 px-1">
          <div>
            <h3 class="text-purple-200 font-serif text-2xl">${t('table_label')} ${tableNum}</h3>
            <p class="text-gray-500 text-[10px] uppercase tracking-widest mt-1">${tableOrders.length} ${t('active_orders')} · ${escapeHtml(tableStatusSummary(tableOrders))}</p>
          </div>
          ${closeable ? `
            <button type="button" class="close-tab-btn shrink-0 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-2xl border border-green-500/40 text-green-300 hover:bg-green-500/10" data-table="${tableNum}">
              ${t('close_tab')}
            </button>` : ''}
        </div>
        ${cards}
      </div>`;
  }).join('');

  list.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.needsTime === 'true') {
        pendingStatusUpdate = { orderId: btn.dataset.orderId, status: btn.dataset.status };
        document.getElementById('time-modal').classList.remove('hidden');
      } else {
        updateStatus(btn.dataset.orderId, btn.dataset.status);
      }
    });
  });

  list.querySelectorAll('.cancel-admin-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(t('confirm_cancel_order'))) return;
      try {
        await api.cancelOrderAdmin(btn.dataset.orderId);
        await loadOrders();
      } catch (error) {
        alert(t('error_prefix') + error.message);
      }
    });
  });

  list.querySelectorAll('.close-tab-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm(t('confirm_close_tab').replace('{n}', btn.dataset.table))) return;
      try {
        await api.closeTableTab(parseInt(btn.dataset.table, 10));
        await loadOrders();
      } catch (error) {
        alert(t('error_prefix') + error.message);
      }
    });
  });

  list.querySelectorAll('.print-ticket-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const order = orders.find(o => o.id === btn.dataset.orderId);
      if (order) printTicket(order);
    });
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

async function updateStatus(orderId, status, estimatedMinutes) {
  try {
    await api.updateOrderStatus(orderId, status, estimatedMinutes);
    await loadOrders();
  } catch (error) {
    alert(t('error_prefix') + error.message);
  }
}
