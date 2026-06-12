import { api } from './api.js';

const strings = {
  en: {
    cart: 'Cart', my_order: 'My Order', add: 'Add', added: 'Added!',
    empty_cart: 'Your cart is empty', note_placeholder: 'Note (e.g. less salt, no ice…)',
    quantity: 'Qty', total: 'Total', place_order: 'Place Order', ordering: 'Sending…',
    order_placed: 'Order sent!', order_number: 'Order', status_SENT: 'Sent',
    status_VIEWED: 'Viewed by staff', status_PREPARING: 'Being prepared',
    status_READY: 'Ready! Call your server', status_PAID: 'Paid', status_COMPLETED: 'Completed',
    estimated: 'Estimated', minutes: 'min', view_receipt: 'View receipt',
    download_receipt: 'Download receipt', receipt_title: 'NUBI BAR', receipt_thanks: 'Thank you for your visit',
    receipt_table: 'Table', receipt_order: 'Order', receipt_date: 'Date', receipt_items: 'Items',
    receipt_total: 'Total', close: 'Close', add_more: 'Add more items', call_server: 'Your order is ready — call your server',
    spirit_btl: 'Bottle', spirit_gls: 'Glass', spirit_shot: 'Shot', choose_size: 'Choose size',
    cancel_order: 'Cancel', modify_order: 'Edit', save_changes: 'Save', server_called: 'Server notified!',
    call_server_btn: 'Call server', status_CANCELLED: 'Cancelled', no_orders_yet: 'No orders yet',
    view_tab_receipt: 'View full receipt', session_closed: 'Your tab is closed. Thank you!',
    track_sent: 'Sent', track_seen: 'Seen', track_prep: 'Prep', track_ready: 'Ready', track_paid: 'Paid',
    receipt_ready: 'Receipt available', waiting_payment: 'Waiting for payment confirmation',
    receipt_client_copy: 'Client copy', receipt_issued_by: 'Issued by NUBI BAR',
    receipt_unit_price: 'Unit price', receipt_line_total: 'Amount', receipt_summary: 'Order summary'
  },
  fr: {
    cart: 'Panier', my_order: 'Ma commande', add: 'Ajouter', added: 'Ajouté !',
    empty_cart: 'Votre panier est vide', note_placeholder: 'Note (ex. peu de salade, sans glaçons…)',
    quantity: 'Qté', total: 'Total', place_order: 'Commander', ordering: 'Envoi…',
    order_placed: 'Commande envoyée !', order_number: 'Commande', status_SENT: 'Envoyée',
    status_VIEWED: 'Vue par le staff', status_PREPARING: 'En préparation',
    status_READY: 'Prête ! Appelez le serveur', status_PAID: 'Payée', status_COMPLETED: 'Terminée',
    estimated: 'Estimé', minutes: 'min', view_receipt: 'Voir le reçu',
    download_receipt: 'Télécharger le reçu', receipt_title: 'NUBI BAR', receipt_thanks: 'Merci de votre visite',
    receipt_table: 'Table', receipt_order: 'Commande', receipt_date: 'Date', receipt_items: 'Articles',
    receipt_total: 'Total', close: 'Fermer', add_more: 'Ajouter d\'autres plats', call_server: 'Votre commande est prête — appelez le serveur',
    spirit_btl: 'Bouteille', spirit_gls: 'Verre', spirit_shot: 'Shot', choose_size: 'Choisir le format',
    cancel_order: 'Annuler', modify_order: 'Modifier', save_changes: 'Enregistrer', server_called: 'Serveur prévenu !',
    call_server_btn: 'Appeler le serveur', status_CANCELLED: 'Annulée', no_orders_yet: 'Aucune commande',
    view_tab_receipt: 'Voir l\'addition', session_closed: 'Votre addition est clôturée. Merci !',
    track_sent: 'Envoyée', track_seen: 'Vue', track_prep: 'Prépa', track_ready: 'Prête', track_paid: 'Payée',
    receipt_ready: 'Reçu disponible', waiting_payment: 'En attente de validation du paiement',
    receipt_client_copy: 'Copie client', receipt_issued_by: 'Émis par NUBI BAR',
    receipt_unit_price: 'Prix unit.', receipt_line_total: 'Montant', receipt_summary: 'Résumé de commande'
  }
};

let lang = 'fr';
let sessionToken = null;
let tableNumber = null;
let cart = [];
let orders = [];
let pollTimer = null;
let cartOpen = false;
let activeTab = 'cart';
let editingOrderId = null;
let editItems = [];
let sessionClosed = false;
let currentReceipt = null;

function t(key) {
  return strings[lang][key] || strings.en[key] || key;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cartKey() {
  return `nubi_cart_${sessionToken}`;
}

function loadCart() {
  try {
    const raw = localStorage.getItem(cartKey());
    cart = raw ? JSON.parse(raw) : [];
  } catch {
    cart = [];
  }
}

function saveCart() {
  localStorage.setItem(cartKey(), JSON.stringify(cart));
}

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const num = parseInt(String(priceStr).replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

function formatPrice(amount) {
  if (!amount) return '';
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

function itemName(item) {
  return lang === 'fr' ? (item.name_fr || item.name_en) : item.name_en;
}

export function setOrderingLang(newLang) {
  lang = newLang;
  updateCartUI();
  renderOrders();
}

export async function initOrdering(tableNum, token) {
  tableNumber = tableNum;
  sessionToken = token;
  loadCart();

  document.getElementById('whatsapp-btn')?.classList.add('hidden');
  document.getElementById('cart-fab')?.classList.remove('hidden');

  setupCartEvents();
  updateCartUI();
  await refreshOrders();
  startPolling();
}

export function renderAddButton(item, priceOverride = null) {
  const price = priceOverride || item.price || '';
  const data = JSON.stringify({
    id: item.id,
    name_en: item.name?.en || item.name_en,
    name_fr: item.name?.fr || item.name_fr,
    price
  }).replace(/"/g, '&quot;');

  return `
    <button type="button" class="add-to-cart-btn mt-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-400 hover:text-purple-300 transition-colors"
      data-item="${data}">
      <i data-lucide="plus-circle" class="w-3.5 h-3.5"></i> ${t('add')}
    </button>`;
}

export function renderSpiritAddButton(item) {
  const data = JSON.stringify({
    id: item.id,
    name_en: item.name?.en || item.name_en,
    name_fr: item.name?.fr || item.name_fr,
    prices: item.prices || []
  }).replace(/"/g, '&quot;');

  return `
    <button type="button" class="spirit-add-btn text-purple-400 hover:text-purple-300 transition-colors p-1" data-spirit="${data}" title="${t('add')}">
      <i data-lucide="plus-circle" class="w-4 h-4"></i>
    </button>`;
}

export function setupMenuCartListeners() {
  document.getElementById('menu-container')?.addEventListener('click', (e) => {
    const addBtn = e.target.closest('.add-to-cart-btn');
    if (addBtn) {
      const item = JSON.parse(addBtn.dataset.item);
      addToCart(item);
      flashButton(addBtn);
      return;
    }

    const spiritBtn = e.target.closest('.spirit-add-btn');
    if (spiritBtn) {
      const item = JSON.parse(spiritBtn.dataset.spirit);
      showSpiritPicker(spiritBtn, item);
    }
  });
}

function flashButton(btn) {
  const orig = btn.innerHTML;
  btn.innerHTML = `<i data-lucide="check" class="w-3.5 h-3.5"></i> ${t('added')}`;
  if (typeof lucide !== 'undefined') lucide.createIcons();
  setTimeout(() => {
    btn.innerHTML = orig;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }, 1200);
}

function showSpiritPicker(anchor, item) {
  document.querySelectorAll('.spirit-picker').forEach(el => el.remove());

  const prices = item.prices || [];
  const labels = [t('spirit_btl'), t('spirit_gls'), t('spirit_shot')];
  const picker = document.createElement('div');
  picker.className = 'spirit-picker absolute z-50 bg-[#0a0a0a] border border-purple-500/30 rounded-xl p-2 shadow-2xl min-w-[140px]';
  picker.innerHTML = `<p class="text-[9px] text-gray-500 uppercase tracking-widest px-2 py-1 mb-1">${t('choose_size')}</p>` +
    prices.map((p, i) => p ? `
      <button type="button" class="spirit-pick w-full text-left px-3 py-2 text-xs text-white hover:bg-purple-500/10 rounded-lg transition-colors"
        data-price="${p}" data-name-en="${item.name_en}" data-name-fr="${item.name_fr || ''}" data-id="${item.id}">
        ${labels[i]} — <span class="text-purple-400">${p}</span>
      </button>` : '').join('');

  const rect = anchor.getBoundingClientRect();
  picker.style.position = 'fixed';
  picker.style.top = `${rect.bottom + 4}px`;
  picker.style.right = `${window.innerWidth - rect.right}px`;

  document.body.appendChild(picker);

  picker.querySelectorAll('.spirit-pick').forEach(btn => {
    btn.addEventListener('click', () => {
      addToCart({
        id: btn.dataset.id,
        name_en: btn.dataset.nameEn,
        name_fr: btn.dataset.nameFr,
        price: btn.dataset.price
      });
      picker.remove();
      flashButton(anchor);
    });
  });

  setTimeout(() => {
    document.addEventListener('click', function closePicker(ev) {
      if (!picker.contains(ev.target) && ev.target !== anchor) {
        picker.remove();
        document.removeEventListener('click', closePicker);
      }
    });
  }, 10);
}

function addToCart(item) {
  const key = `${item.id}_${item.price}`;
  const existing = cart.find(c => c.key === key);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      key,
      item_id: item.id,
      name_en: item.name_en,
      name_fr: item.name_fr || null,
      price: item.price || null,
      quantity: 1,
      note: ''
    });
  }
  saveCart();
  updateCartUI();
}

function updateCartQty(key, delta) {
  const item = cart.find(c => c.key === key);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) cart = cart.filter(c => c.key !== key);
  saveCart();
  updateCartUI();
}

function updateCartNote(key, note) {
  const item = cart.find(c => c.key === key);
  if (item) {
    item.note = note;
    saveCart();
  }
}

function cartTotal() {
  return cart.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);
}

function setupCartEvents() {
  document.getElementById('cart-fab')?.addEventListener('click', toggleCart);
  document.getElementById('cart-close')?.addEventListener('click', closeCart);
  document.getElementById('cart-overlay')?.addEventListener('click', closeCart);
  document.getElementById('cart-tab-cart')?.addEventListener('click', () => switchTab('cart'));
  document.getElementById('cart-tab-orders')?.addEventListener('click', () => switchTab('orders'));
  document.getElementById('place-order-btn')?.addEventListener('click', placeOrder);
  document.getElementById('receipt-close')?.addEventListener('click', () => {
    document.getElementById('receipt-modal')?.classList.add('hidden');
  });
  document.getElementById('receipt-download')?.addEventListener('click', downloadReceipt);
}

function toggleCart() {
  cartOpen = !cartOpen;
  document.getElementById('cart-panel')?.classList.toggle('hidden', !cartOpen);
  document.getElementById('cart-overlay')?.classList.toggle('hidden', !cartOpen);
  if (cartOpen && typeof lucide !== 'undefined') lucide.createIcons();
}

function closeCart() {
  cartOpen = false;
  document.getElementById('cart-panel')?.classList.add('hidden');
  document.getElementById('cart-overlay')?.classList.add('hidden');
}

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('cart-tab-cart')?.classList.toggle('text-purple-400', tab === 'cart');
  document.getElementById('cart-tab-cart')?.classList.toggle('border-purple-500', tab === 'cart');
  document.getElementById('cart-tab-orders')?.classList.toggle('text-purple-400', tab === 'orders');
  document.getElementById('cart-tab-orders')?.classList.toggle('border-purple-500', tab === 'orders');
  document.getElementById('cart-content')?.classList.toggle('hidden', tab !== 'cart');
  document.getElementById('orders-content')?.classList.toggle('hidden', tab !== 'orders');
}

function updateCartUI() {
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const badge = document.getElementById('cart-badge');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  }

  const list = document.getElementById('cart-items');
  if (!list) return;

  if (cart.length === 0) {
    list.innerHTML = `<p class="text-gray-500 text-sm text-center py-8">${t('empty_cart')}</p>`;
    document.getElementById('cart-total')?.classList.add('hidden');
    document.getElementById('place-order-btn')?.classList.add('hidden');
    return;
  }

  list.innerHTML = cart.map(item => `
    <div class="cart-line border-b border-white/5 pb-4 mb-4" data-key="${item.key}">
      <div class="flex justify-between items-start gap-3 mb-2">
        <div class="flex-1">
          <p class="text-white text-sm font-medium">${escapeHtml(itemName(item))}</p>
          ${item.price ? `<p class="text-purple-400 text-xs mt-0.5">${escapeHtml(item.price)}</p>` : ''}
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="qty-btn w-7 h-7 rounded-lg bg-white/5 text-white text-sm hover:bg-purple-500/20" data-key="${item.key}" data-delta="-1">−</button>
          <span class="text-white text-sm w-5 text-center">${escapeHtml(item.quantity)}</span>
          <button type="button" class="qty-btn w-7 h-7 rounded-lg bg-white/5 text-white text-sm hover:bg-purple-500/20" data-key="${item.key}" data-delta="1">+</button>
        </div>
      </div>
      <input type="text" class="cart-note w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 focus:border-purple-500 outline-none"
        placeholder="${escapeHtml(t('note_placeholder'))}" value="${escapeHtml(item.note || '')}" data-key="${item.key}">
    </div>
  `).join('');

  list.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => updateCartQty(btn.dataset.key, parseInt(btn.dataset.delta, 10)));
  });
  list.querySelectorAll('.cart-note').forEach(input => {
    input.addEventListener('input', () => updateCartNote(input.dataset.key, input.value));
  });

  const totalEl = document.getElementById('cart-total-amount');
  if (totalEl) totalEl.textContent = formatPrice(cartTotal());
  document.getElementById('cart-total')?.classList.remove('hidden');
  document.getElementById('place-order-btn')?.classList.remove('hidden');
}

async function placeOrder() {
  if (cart.length === 0 || !sessionToken) return;

  const btn = document.getElementById('place-order-btn');
  btn.disabled = true;
  btn.textContent = t('ordering');

  try {
    const items = cart.map(c => ({
      item_id: c.item_id,
      name_en: c.name_en,
      name_fr: c.name_fr,
      price: c.price,
      quantity: c.quantity,
      note: c.note
    }));

    await api.createOrder(sessionToken, items);
    cart = [];
    saveCart();
    updateCartUI();
    await refreshOrders();
    switchTab('orders');
    btn.textContent = t('order_placed');
    setTimeout(() => { btn.textContent = t('place_order'); }, 2000);
  } catch (error) {
    alert(error.message);
    btn.textContent = t('place_order');
  } finally {
    btn.disabled = false;
  }
}

async function refreshOrders() {
  if (!sessionToken) return;
  try {
    orders = await api.getSessionOrders(sessionToken);
    sessionClosed = orders.some(o => o.session_status === 'CLOSED');
    renderOrders();
    if (sessionClosed) showTabReceiptButton();
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
}

function showTabReceiptButton() {
  const container = document.getElementById('orders-content');
  if (!container || container.querySelector('.tab-receipt-btn')) return;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'tab-receipt-btn w-full mb-4 py-3 text-[10px] font-bold uppercase tracking-widest text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-500/10';
  btn.textContent = t('view_tab_receipt');
  btn.addEventListener('click', showTabReceipt);
  container.prepend(btn);
}

function statusLabel(status) {
  return t(`status_${status}`);
}

function statusIcon(status) {
  const icons = { SENT: 'send', VIEWED: 'eye', PREPARING: 'chef-hat', READY: 'bell-ring', PAID: 'banknote', COMPLETED: 'check-circle', CANCELLED: 'x-circle' };
  return icons[status] || 'circle';
}

function renderStatusTrail(status) {
  const steps = [
    { key: 'SENT', label: t('track_sent') },
    { key: 'VIEWED', label: t('track_seen') },
    { key: 'PREPARING', label: t('track_prep') },
    { key: 'READY', label: t('track_ready') },
    { key: 'PAID', label: t('track_paid') }
  ];
  const currentIndex = status === 'COMPLETED'
    ? steps.length - 1
    : Math.max(0, steps.findIndex(step => step.key === status));

  return `
    <div class="grid grid-cols-5 gap-1.5 mb-4" aria-label="${escapeHtml(statusLabel(status))}">
      ${steps.map((step, index) => {
        const done = index <= currentIndex;
        const current = step.key === status || (status === 'COMPLETED' && step.key === 'PAID');
        return `
          <div class="min-w-0">
            <div class="h-1.5 rounded-full ${done ? 'bg-purple-500' : 'bg-white/10'}"></div>
            <p class="mt-1 text-[9px] uppercase font-bold tracking-widest truncate ${current ? 'text-white' : done ? 'text-purple-300' : 'text-gray-600'}">${escapeHtml(step.label)}</p>
          </div>
        `;
      }).join('')}
    </div>`;
}

async function cancelOrder(orderId) {
  if (!confirm(lang === 'fr' ? 'Annuler cette commande ?' : 'Cancel this order?')) return;
  try {
    await api.cancelOrder(orderId, sessionToken);
    await refreshOrders();
  } catch (error) {
    alert(error.message);
  }
}

function startEditOrder(order) {
  editingOrderId = order.id;
  editItems = order.items.map(i => ({
    item_id: i.item_id,
    name_en: i.name_en,
    name_fr: i.name_fr,
    price: i.price,
    quantity: i.quantity,
    note: i.note || ''
  }));
  renderOrders();
}

async function saveEditOrder() {
  try {
    await api.updateOrderItems(editingOrderId, sessionToken, editItems);
    editingOrderId = null;
    editItems = [];
    await refreshOrders();
  } catch (error) {
    alert(error.message);
  }
}

async function callServer(orderId) {
  try {
    await api.callServer(orderId, sessionToken);
    const btn = document.querySelector(`[data-call-id="${orderId}"]`);
    if (btn) {
      btn.textContent = t('server_called');
      btn.disabled = true;
    }
  } catch (error) {
    alert(error.message);
  }
}

function renderOrders() {
  const container = document.getElementById('orders-content');
  if (!container) return;

  const visible = orders.filter(o => o.status !== 'CANCELLED');
  const active = visible.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status));
  const completed = visible.filter(o => o.status === 'COMPLETED');

  if (visible.length === 0) {
    container.innerHTML = `<p class="text-gray-500 text-sm text-center py-8">${t('no_orders_yet')}</p>`;
    return;
  }

  const renderCard = (order) => {
    const isReady = order.status === 'READY';
    const isCompleted = ['PAID', 'COMPLETED'].includes(order.status);
    const isEditing = editingOrderId === order.id;
    const canCancel = ['SENT', 'VIEWED'].includes(order.status);
    const canEdit = order.status === 'SENT';
    const serverCalled = Boolean(order.called_at);

    let itemsHtml = '';
    if (isEditing) {
      itemsHtml = editItems.map((item, idx) => `
        <div class="mb-3 pb-3 border-b border-white/5">
          <p class="text-white text-xs mb-2">${escapeHtml(itemName(item))}</p>
          <div class="flex items-center gap-2 mb-2">
            <button type="button" class="edit-qty w-6 h-6 rounded bg-white/5 text-xs" data-idx="${idx}" data-d="-1">−</button>
            <span class="text-sm">${escapeHtml(item.quantity)}</span>
            <button type="button" class="edit-qty w-6 h-6 rounded bg-white/5 text-xs" data-idx="${idx}" data-d="1">+</button>
          </div>
          <input type="text" class="edit-note w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs" data-idx="${idx}" value="${escapeHtml(item.note || '')}" placeholder="${escapeHtml(t('note_placeholder'))}">
        </div>
      `).join('') + `
        <div class="flex gap-2">
          <button type="button" class="save-edit flex-1 py-2 text-[10px] font-bold uppercase bg-purple-600 rounded-xl">${t('save_changes')}</button>
          <button type="button" class="cancel-edit flex-1 py-2 text-[10px] font-bold uppercase border border-white/10 rounded-xl">${t('close')}</button>
        </div>`;
    } else {
      itemsHtml = order.items.map(i => `
        <div class="flex justify-between text-xs">
          <span class="text-gray-300">${escapeHtml(lang === 'fr' ? (i.name_fr || i.name_en) : i.name_en)} × ${escapeHtml(i.quantity)}</span>
          ${i.price ? `<span class="text-purple-400/70">${escapeHtml(i.price)}</span>` : ''}
        </div>
        ${i.note ? `<p class="text-[10px] text-gray-500 italic pl-2">"${escapeHtml(i.note)}"</p>` : ''}
      `).join('');
    }

    return `
      <div class="order-card border border-white/10 rounded-2xl p-4 mb-4 ${isReady ? 'border-green-500/40 bg-green-500/5' : ''}">
        <div class="flex justify-between items-center mb-3">
          <span class="text-white font-serif text-lg">${t('order_number')} #${order.display_number}</span>
          <span class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${isReady ? 'text-green-400' : order.status === 'PAID' ? 'text-emerald-400' : order.status === 'CANCELLED' ? 'text-red-400' : 'text-purple-400'}">
            <i data-lucide="${statusIcon(order.status)}" class="w-3.5 h-3.5"></i>
            ${statusLabel(order.status)}
          </span>
        </div>
        ${renderStatusTrail(order.status)}
        ${order.status === 'PREPARING' && order.estimated_minutes ? `
          <p class="text-gray-400 text-xs mb-3">${t('estimated')} : ~${order.estimated_minutes} ${t('minutes')}</p>` : ''}
        ${order.status === 'PAID' ? `<p class="text-emerald-400 text-xs mb-3">${t('receipt_ready')}</p>` : ''}
        ${order.status === 'READY' ? `<p class="text-green-400/80 text-xs mb-3">${serverCalled ? t('server_called') : t('waiting_payment')}</p>` : ''}
        <div class="space-y-1 mb-3">${itemsHtml}</div>
        ${isReady ? `
          <button type="button" data-call-id="${order.id}" ${serverCalled ? 'disabled' : ''} class="call-server-btn w-full py-3 mb-2 text-[10px] font-bold uppercase tracking-widest ${serverCalled ? 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed' : 'bg-green-600/20 border border-green-500/40 text-green-400 hover:bg-green-600/30'} rounded-xl flex items-center justify-center gap-2">
            <i data-lucide="${serverCalled ? 'check' : 'bell-ring'}" class="w-4 h-4"></i> ${serverCalled ? t('server_called') : t('call_server_btn')}
          </button>` : ''}
        <div class="flex gap-2">
          ${canEdit && !isEditing ? `<button type="button" class="edit-order-btn flex-1 py-2 text-[10px] font-bold uppercase border border-white/10 rounded-xl" data-id="${order.id}">${t('modify_order')}</button>` : ''}
          ${canCancel ? `<button type="button" class="cancel-order-btn flex-1 py-2 text-[10px] font-bold uppercase border border-red-500/30 text-red-400 rounded-xl" data-id="${order.id}">${t('cancel_order')}</button>` : ''}
        </div>
        ${isCompleted ? `
          <button type="button" class="view-receipt-btn w-full mt-2 py-2 text-[10px] font-bold uppercase tracking-widest text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-500/10"
            data-order-id="${order.id}">${t('view_receipt')}</button>` : ''}
      </div>`;
  };

  let html = '';
  if (sessionClosed) {
    html += `<p class="text-center text-green-400/80 text-xs mb-4 italic">${t('session_closed')}</p>`;
  }
  html += active.map(renderCard).join('');
  if (completed.length) html += `<div class="border-t border-white/5 pt-4 mt-2">${completed.map(renderCard).join('')}</div>`;

  container.innerHTML = html;

  container.querySelectorAll('.view-receipt-btn').forEach(btn => {
    btn.addEventListener('click', () => showReceipt(btn.dataset.orderId));
  });
  container.querySelectorAll('.cancel-order-btn').forEach(btn => {
    btn.addEventListener('click', () => cancelOrder(btn.dataset.id));
  });
  container.querySelectorAll('.edit-order-btn').forEach(btn => {
    btn.addEventListener('click', () => startEditOrder(orders.find(o => o.id === btn.dataset.id)));
  });
  container.querySelectorAll('.call-server-btn').forEach(btn => {
    btn.addEventListener('click', () => callServer(btn.dataset.callId));
  });
  container.querySelectorAll('.edit-qty').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      editItems[idx].quantity = Math.max(1, editItems[idx].quantity + parseInt(btn.dataset.d, 10));
      renderOrders();
    });
  });
  container.querySelectorAll('.edit-note').forEach(input => {
    input.addEventListener('input', () => {
      editItems[parseInt(input.dataset.idx, 10)].note = input.value;
    });
  });
  container.querySelector('.save-edit')?.addEventListener('click', saveEditOrder);
  container.querySelector('.cancel-edit')?.addEventListener('click', () => { editingOrderId = null; renderOrders(); });

  if (sessionClosed) showTabReceiptButton();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(refreshOrders, 8000);
}

async function showReceipt(orderId) {
  try {
    const order = await api.getOrderReceipt(orderId, sessionToken);
    currentReceipt = { type: 'order', data: order };
    const body = document.getElementById('receipt-body');
    const date = new Date(order.completed_at || order.created_at).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB');

    let total = 0;
    const lines = order.items.map(i => {
      const lineTotal = parsePrice(i.price) * i.quantity;
      total += lineTotal;
      return `
        <tr class="border-b border-gray-100">
          <td class="py-3 text-left">
            <span class="block font-semibold text-gray-950">${escapeHtml(lang === 'fr' ? (i.name_fr || i.name_en) : i.name_en)}</span>
            <span class="block text-[11px] text-gray-500">x ${escapeHtml(i.quantity)} · ${escapeHtml(t('receipt_unit_price'))} ${escapeHtml(i.price || '—')}</span>
            ${i.note ? `<span class="block text-gray-400 text-[10px] italic mt-1">"${escapeHtml(i.note)}"</span>` : ''}
          </td>
          <td class="py-3 text-right whitespace-nowrap font-semibold">${escapeHtml(i.price ? formatPrice(lineTotal) : '—')}</td>
        </tr>`;
    }).join('');

    body.innerHTML = `
      <div class="rounded-3xl border border-purple-100 overflow-hidden bg-white">
        <div class="bg-purple-700 text-white px-5 py-5">
          <p class="text-[10px] uppercase tracking-widest text-purple-100 font-bold">${t('receipt_client_copy')}</p>
          <div class="flex items-end justify-between gap-4 mt-2">
            <h2 class="font-serif text-3xl font-bold tracking-widest">${t('receipt_title')}</h2>
            <span class="text-xs font-bold bg-white/15 rounded-full px-3 py-1">#${escapeHtml(order.display_number)}</span>
          </div>
        </div>
        <div class="p-5">
          <div class="grid grid-cols-2 gap-3 mb-5">
            <div class="rounded-2xl bg-purple-50 px-4 py-3">
              <p class="text-[10px] uppercase tracking-widest text-purple-700 font-bold">${t('receipt_table')}</p>
              <p class="text-2xl font-serif text-gray-950">${escapeHtml(order.table_number)}</p>
            </div>
            <div class="rounded-2xl bg-gray-50 px-4 py-3">
              <p class="text-[10px] uppercase tracking-widest text-gray-500 font-bold">${t('receipt_date')}</p>
              <p class="text-xs font-semibold text-gray-900 mt-1">${escapeHtml(date)}</p>
            </div>
          </div>
          <p class="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">${t('receipt_summary')}</p>
          <table class="w-full text-sm mb-4">
            <thead><tr class="border-b-2 border-gray-900"><th class="py-2 text-left text-[10px] uppercase tracking-widest">${t('receipt_items')}</th><th class="py-2 text-right text-[10px] uppercase tracking-widest">${t('receipt_line_total')}</th></tr></thead>
            <tbody>${lines}</tbody>
          </table>
          <div class="rounded-2xl bg-gray-950 text-white px-4 py-4 flex items-center justify-between">
            <span class="text-xs uppercase tracking-widest text-gray-300">${t('receipt_total')}</span>
            <span class="text-xl font-bold">${formatPrice(total)}</span>
          </div>
          <p class="text-center text-xs text-gray-500 italic mt-5">${t('receipt_thanks')}</p>
          <p class="text-center text-[10px] uppercase tracking-widest text-purple-700 font-bold mt-2">${t('receipt_issued_by')}</p>
        </div>
      </div>
    `;

    const downloadBtn = document.getElementById('receipt-download');
    if (downloadBtn) downloadBtn.textContent = t('download_receipt');
    document.getElementById('receipt-modal')?.classList.remove('hidden');
  } catch (error) {
    alert(error.message);
  }
}

async function showTabReceipt() {
  try {
    const data = await api.getTabReceipt(sessionToken);
    currentReceipt = { type: 'tab', data };
    const body = document.getElementById('receipt-body');
    let total = 0;
    const orderBlocks = data.orders.map(order => {
      const lines = order.items.map(i => {
        const lt = parsePrice(i.price) * i.quantity;
        total += lt;
        return `<tr class="border-b border-gray-100"><td class="py-2 text-left text-xs"><span class="font-semibold text-gray-950">${escapeHtml(lang === 'fr' ? (i.name_fr || i.name_en) : i.name_en)}</span><br><span class="text-gray-500">x ${escapeHtml(i.quantity)} · ${escapeHtml(i.price || '—')}</span></td><td class="py-2 text-right text-xs font-semibold">${escapeHtml(i.price ? formatPrice(lt) : '—')}</td></tr>`;
      }).join('');
      return `<div class="rounded-2xl border border-gray-100 p-3 mb-3"><p class="text-[10px] uppercase tracking-widest text-purple-700 font-bold mb-1">${t('order_number')} #${escapeHtml(order.display_number)}</p><table class="w-full"><tbody>${lines}</tbody></table></div>`;
    }).join('');

    body.innerHTML = `
      <div class="rounded-3xl border border-purple-100 overflow-hidden bg-white">
        <div class="bg-purple-700 text-white px-5 py-5">
          <p class="text-[10px] uppercase tracking-widest text-purple-100 font-bold">${t('receipt_client_copy')}</p>
          <div class="flex items-end justify-between gap-4 mt-2">
            <h2 class="font-serif text-3xl font-bold tracking-widest">${t('receipt_title')}</h2>
            <span class="text-xs font-bold bg-white/15 rounded-full px-3 py-1">${t('receipt_table')} ${escapeHtml(data.table_number)}</span>
          </div>
        </div>
        <div class="p-5">
          <p class="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-3">${t('receipt_summary')}</p>
          ${orderBlocks}
          <div class="rounded-2xl bg-gray-950 text-white px-4 py-4 flex items-center justify-between mt-4">
            <span class="text-xs uppercase tracking-widest text-gray-300">${t('receipt_total')}</span>
            <span class="text-xl font-bold">${formatPrice(total)}</span>
          </div>
          <p class="text-center text-xs text-gray-500 italic mt-5">${t('receipt_thanks')}</p>
          <p class="text-center text-[10px] uppercase tracking-widest text-purple-700 font-bold mt-2">${t('receipt_issued_by')}</p>
        </div>
      </div>
    `;
    const downloadBtn = document.getElementById('receipt-download');
    if (downloadBtn) downloadBtn.textContent = t('download_receipt');
    document.getElementById('receipt-modal')?.classList.remove('hidden');
  } catch (error) {
    alert(error.message);
  }
}

function downloadReceipt() {
  if (!currentReceipt) return;

  const width = 900;
  const padding = 56;
  const contentWidth = width - padding * 2;
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  let titleSuffix = '';
  let tableLabel = '';
  let dateLabel = new Date().toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB');
  let receiptOrders = [];

  if (currentReceipt.type === 'order') {
    const order = currentReceipt.data;
    titleSuffix = `Commande-${order.display_number}`;
    tableLabel = `${t('receipt_table')} ${order.table_number}`;
    dateLabel = new Date(order.completed_at || order.created_at).toLocaleString(lang === 'fr' ? 'fr-FR' : 'en-GB');
    receiptOrders = [order];
  } else {
    const data = currentReceipt.data;
    titleSuffix = `Table-${data.table_number}`;
    tableLabel = `${t('receipt_table')} ${data.table_number}`;
    receiptOrders = data.orders;
  }

  const total = receiptOrders
    .flatMap(order => order.items)
    .reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0);

  function wrapText(text, maxWidth, font) {
    measureCtx.font = font;
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    words.forEach(word => {
      const test = line ? `${line} ${word}` : word;
      if (measureCtx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  const rows = [];
  receiptOrders.forEach(order => {
    rows.push({ type: 'order', text: `${t('receipt_order')} #${order.display_number}` });
    order.items.forEach(item => {
      rows.push({
        type: 'item',
        nameLines: wrapText(lang === 'fr' ? (item.name_fr || item.name_en) : item.name_en, 470, '600 22px Inter, Arial, sans-serif'),
        detail: `x ${item.quantity} · ${t('receipt_unit_price')} ${item.price || '-'}`,
        amount: item.price ? formatPrice(parsePrice(item.price) * item.quantity) : '-',
        noteLines: item.note ? wrapText(`"${item.note}"`, 560, 'italic 17px Inter, Arial, sans-serif') : []
      });
    });
  });

  const rowsHeight = rows.reduce((height, row) => {
    if (row.type === 'order') return height + 46;
    return height + 34 + row.nameLines.length * 27 + row.noteLines.length * 22;
  }, 0);
  const height = Math.max(760, 330 + rowsHeight + 156);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#f5f3ff';
  roundedRect(28, 28, width - 56, height - 56, 34);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundedRect(36, 36, width - 72, height - 72, 30);
  ctx.fill();

  ctx.fillStyle = '#6d28d9';
  roundedRect(padding, padding, contentWidth, 130, 26);
  ctx.fill();
  ctx.fillStyle = '#ede9fe';
  ctx.textAlign = 'left';
  ctx.font = '700 15px Inter, Arial, sans-serif';
  ctx.fillText(t('receipt_client_copy').toUpperCase(), padding + 28, padding + 38);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 46px Georgia, serif';
  ctx.fillText(t('receipt_title'), padding + 28, padding + 92);
  ctx.textAlign = 'right';
  ctx.font = '700 18px Inter, Arial, sans-serif';
  ctx.fillText(t('receipt_issued_by'), padding + contentWidth - 28, padding + 72);

  let y = padding + 162;
  const chipWidth = (contentWidth - 18) / 2;
  [
    { label: tableLabel, value: currentReceipt.type === 'order' ? `${t('receipt_order')} #${currentReceipt.data.display_number}` : t('receipt_summary') },
    { label: t('receipt_date'), value: dateLabel }
  ].forEach((chip, index) => {
    const x = padding + index * (chipWidth + 18);
    ctx.fillStyle = index === 0 ? '#faf5ff' : '#f8fafc';
    roundedRect(x, y, chipWidth, 78, 18);
    ctx.fill();
    ctx.fillStyle = index === 0 ? '#6d28d9' : '#64748b';
    ctx.font = '700 13px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(chip.label.toUpperCase(), x + 20, y + 30);
    ctx.fillStyle = '#111827';
    ctx.font = '700 20px Inter, Arial, sans-serif';
    wrapText(chip.value, chipWidth - 40, '700 20px Inter, Arial, sans-serif').slice(0, 1).forEach(line => {
      ctx.fillText(line, x + 20, y + 56);
    });
  });

  y += 118;
  ctx.fillStyle = '#111827';
  ctx.font = '700 14px Inter, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(t('receipt_items').toUpperCase(), padding, y);
  ctx.textAlign = 'right';
  ctx.fillText(t('receipt_line_total').toUpperCase(), padding + contentWidth, y);
  y += 18;
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(padding + contentWidth, y);
  ctx.stroke();
  y += 24;

  rows.forEach(row => {
    if (row.type === 'order') {
      ctx.fillStyle = '#6d28d9';
      ctx.font = '700 15px Inter, Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(row.text.toUpperCase(), padding, y);
      y += 30;
      return;
    }

    ctx.fillStyle = '#111827';
    ctx.font = '600 22px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    row.nameLines.forEach(line => {
      ctx.fillText(line, padding, y);
      y += 27;
    });
    ctx.fillStyle = '#6b7280';
    ctx.font = '500 17px Inter, Arial, sans-serif';
    ctx.fillText(row.detail, padding, y);
    ctx.fillStyle = '#111827';
    ctx.font = '700 20px Inter, Arial, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(row.amount, padding + contentWidth, y - 12);
    y += 24;
    if (row.noteLines.length) {
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'italic 17px Inter, Arial, sans-serif';
      ctx.textAlign = 'left';
      row.noteLines.forEach(line => {
        ctx.fillText(line, padding + 14, y);
        y += 22;
      });
    }
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(padding + contentWidth, y);
    ctx.stroke();
    y += 24;
  });

  y += 8;
  ctx.fillStyle = '#111827';
  roundedRect(padding, y, contentWidth, 76, 20);
  ctx.fill();
  ctx.fillStyle = '#d1d5db';
  ctx.font = '700 15px Inter, Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(t('receipt_total').toUpperCase(), padding + 24, y + 46);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 30px Inter, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(formatPrice(total), padding + contentWidth - 24, y + 48);

  ctx.fillStyle = '#6b7280';
  ctx.font = 'italic 17px Inter, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(t('receipt_thanks'), width / 2, height - 72);
  ctx.fillStyle = '#6d28d9';
  ctx.font = '700 13px Inter, Arial, sans-serif';
  ctx.fillText(t('receipt_title'), width / 2, height - 48);

  const link = document.createElement('a');
  link.download = `NUBI-${titleSuffix}-recu.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
