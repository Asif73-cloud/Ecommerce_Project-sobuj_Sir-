/* ==========================================================================
   Kenova - orders.js
   Reads orders from localStorage (populated by checkout.js).
   Falls back to API if a token is available.
   ========================================================================== */

const ORDERS_API = 'http://localhost:5000/api';

/* ---------- Helpers ---------- */
function getOrdersToken() {
  return localStorage.getItem('token')
      || localStorage.getItem('kenova-token');
}

const formatMoney = (n) =>
  '৳' + Number(n || 0).toLocaleString('en-BD');

const formatDate = (d) => {
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

/* ---------- Load orders ---------- */
let allOrders = [];
let currentStatusFilter = '';

function loadOrders() {
  const list = document.getElementById('ordersList');
  const empty = document.getElementById('emptyState');
  const summary = document.getElementById('ordersSummary');

  // Read from localStorage
  let orders = [];
  try {
    orders = JSON.parse(localStorage.getItem('orders') || '[]');
    if (!Array.isArray(orders)) orders = [];
  } catch (e) {
    orders = [];
  }

  allOrders = orders;

  if (!orders.length) {
    list.hidden = true;
    empty.hidden = false;
    if (summary) summary.textContent = 'You have no orders yet';
    return;
  }

  list.hidden = false;
  empty.hidden = true;

  applyFilter();
}

/* ---------- Apply status filter ---------- */
function applyFilter() {
  const summary = document.getElementById('ordersSummary');
  const filtered = currentStatusFilter
    ? allOrders.filter((o) => (o.status || '').toLowerCase() === currentStatusFilter)
    : allOrders;

  if (summary) {
    summary.textContent = filtered.length
      ? `You have ${filtered.length} order(s)`
      : 'No orders match this filter';
  }

  renderOrders(filtered);
}

/* ---------- Render orders ---------- */
function renderOrders(orders) {
  const list = document.getElementById('ordersList');

  if (!orders.length) {
    list.innerHTML = `
      <div class="empty-state" style="display:block">
        <i class="fas fa-box-open"></i>
        <h3>No orders in this category</h3>
        <p>Try selecting a different status filter.</p>
      </div>`;
    return;
  }

  list.innerHTML = orders.map((order) => {
    const items = order.items || order.orderitems || [];
    const status = (order.status || 'pending').toLowerCase();
    const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

    // Item name line
    const itemNames = items.slice(0, 2)
      .map((it) => `<strong>${it.product_name || it.name || 'Product'}</strong> × ${it.quantity || 1}`)
      .join(', ') + (items.length > 2 ? ` and ${items.length - 2} more` : '');

    // Cancel button only for pending/processing
    const canCancel = ['pending', 'processing'].includes(status);

    return `
      <div class="order-card" data-id="${order.id}">

        <div class="order-card-header">
          <div class="order-meta">
            <h3 class="order-number">Order #${order.order_number || order.id}</h3>
            <p class="order-date">
              <i class="far fa-calendar"></i>
              ${formatDate(order.created_at || new Date())}
            </p>
          </div>
          <span class="order-status-badge status-${status}">${statusLabel}</span>
        </div>

        <div class="order-card-body">

          <p class="order-item-names">${itemNames}</p>

          <div class="order-summary-row">
            <div class="order-total">
              <span class="order-total-label">Total</span>
              <span class="order-total-value">${formatMoney(order.total)}</span>
            </div>

            <div class="order-actions">
              <button class="btn-view-details" onclick="toggleDetails(${order.id})">
                <i class="fas fa-eye"></i> View Details
              </button>
              ${canCancel
                ? `<button class="btn-cancel-order" onclick="cancelOrder(${order.id})">
                     <i class="fas fa-times"></i> Cancel
                   </button>`
                : ''}
            </div>
          </div>

          <div class="order-details-panel" id="details-${order.id}">
            <div class="details-grid">
              <div class="details-section">
                <h4>Shipping Address</h4>
                <p>${order.shipping_address?.full_name || 'N/A'}</p>
                <p>${order.shipping_address?.address_line || ''}</p>
                <p>${order.shipping_address?.city || ''} ${order.shipping_address?.postal_code || ''}</p>
                <p>${order.shipping_address?.phone || ''}</p>
              </div>

              <div class="details-section">
                <h4>Payment</h4>
                <p><strong>Method:</strong> ${order.payment_method || 'Cash on Delivery'}</p>
                <p><strong>Status:</strong> ${order.payment_status || 'Unpaid'}</p>
                <p><strong>Subtotal:</strong> ${formatMoney(order.subtotal)}</p>
                ${order.discount
                  ? `<p><strong>Discount:</strong> -${formatMoney(order.discount)}</p>`
                  : ''}
                ${order.shipping_fee != null
                  ? `<p><strong>Shipping:</strong> ${order.shipping_fee === 0 ? 'FREE' : formatMoney(order.shipping_fee)}</p>`
                  : ''}
              </div>
            </div>

            <ul class="details-items-list">
              ${items.map((it) => `
                <li class="details-item-row">
                  <div>
                    <div class="details-item-name">${it.product_name || it.name || 'Product'}</div>
                    <div class="details-item-qty">Qty: ${it.quantity || 1}</div>
                  </div>
                  <div class="details-item-price">
                    ${formatMoney((it.price || 0) * (it.quantity || 1))}
                  </div>
                </li>
              `).join('')}
            </ul>
          </div>

        </div>
      </div>
    `;
  }).join('');
}

/* ---------- Toggle details panel ---------- */
function toggleDetails(orderId) {
  const panel = document.getElementById(`details-${orderId}`);
  if (panel) panel.classList.toggle('open');
}

/* ---------- Cancel an order ---------- */
function cancelOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order?')) return;

  const orders = JSON.parse(localStorage.getItem('orders') || '[]');
  const target = orders.find((o) => o.id === orderId);
  if (target) target.status = 'cancelled';
  localStorage.setItem('orders', JSON.stringify(orders));

  loadOrders();
}

/* ---------- Status tab clicks ---------- */
document.getElementById('orderTabs')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;

  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');

  currentStatusFilter = btn.dataset.status || '';
  applyFilter();
});

/* ---------- Logout ---------- */
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('kenova-token');
  localStorage.removeItem('user');
  localStorage.removeItem('kenova-user');
  window.location.href = 'login.html';
});

/* ---------- Footer cart link ---------- */
document.getElementById('footerCartLink')?.addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('cartIcon')?.click();
});

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadOrders();

  // Sync cart badge
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (!cart.length) {
    cart = JSON.parse(localStorage.getItem('kenova-cart') || '[]');
  }
  const count = cart.reduce((s, i) => s + (i.qty || 1), 0);
  document.querySelectorAll('.cart-count').forEach((el) => {
    el.textContent = count;
  });

  // Sync wishlist badge
  const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
  const wCount = document.getElementById('wishlistCount');
  if (wCount) wCount.textContent = wishlist.length;

  // Header shadow on scroll
  const header = document.querySelector('.shopz-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) header?.classList.add('scrolled');
    else header?.classList.remove('scrolled');
  });
});