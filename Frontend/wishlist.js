 /* ==========================================================================
   Kenova - wishlist.js (v3 — Corrected)
   Unified keys: kenova-wishlist, kenova-cart
   ========================================================================== */

const WISHLIST_API = 'http://localhost:5000/api';
const WISHLIST_KEY = 'kenova-wishlist';
const CART_KEY = 'kenova-cart';

/* ---------- Helpers ---------- */
function getWishlistToken() {
  return localStorage.getItem('token') || localStorage.getItem('kenova-token');
}

async function wishlistApiCall(path, method = 'GET') {
  const token = getWishlistToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${WISHLIST_API}${path}`, { method, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || 'API error');
  return data;
}

function getLocalWishlist() {
  try {
    const list = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function saveLocalWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

function updateWishlistBadge() {
  const list = getLocalWishlist();
  document.querySelectorAll('#wishlistCount, .wishlist-count, .wishlist-badge, .header-badge').forEach((el) => {
    el.textContent = list.length;
  });
}

function updateCartBadge() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const count = cart.reduce((s, i) => s + (i.qty || 1), 0);
    document.querySelectorAll('.cart-count, #cartCount, .cart-badge').forEach((el) => {
      el.textContent = count;
    });
  } catch (e) { /* ignore */ }
}

/* ---------- Toast ---------- */
function showToast(message, type = 'success') {
  let toast = document.getElementById('wishlistToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'wishlistToast';
    toast.style.cssText = `
      position: fixed; bottom: 30px; left: 50%;
      transform: translateX(-50%) translateY(120%);
      background: ${type === 'error' ? '#dc2626' : '#1a1a2e'};
      color: #fff; padding: 14px 24px; border-radius: 10px;
      font-weight: 600; font-size: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,.25);
      z-index: 10000; transition: transform .3s ease;
      font-family: inherit; max-width: 90vw;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.background = type === 'error' ? '#dc2626' : '#1a1a2e';
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(120%)';
  }, 2400);
}

/* ==========================================================================
   LOAD WISHLIST
   ========================================================================== */
async function loadWishlist() {
  const grid = document.getElementById('wishlistGrid');
  const empty = document.getElementById('emptyState');
  const summary = document.getElementById('wishlistSummary');
  const loading = document.getElementById('wishlistLoading');

  if (loading) loading.hidden = false;
  if (grid) grid.hidden = true;
  if (empty) empty.hidden = true;

  const token = getWishlistToken();
  let items = [];

  try {
    // Try API first if logged in, then fall back to localStorage
    if (token) {
      try {
        const apiItems = await wishlistApiCall('/wishlist');
        items = Array.isArray(apiItems)
          ? apiItems
          : (apiItems.wishlist || apiItems.items || []);
      } catch (apiErr) {
        console.warn('API failed, using localStorage');
        items = getLocalWishlist();
      }
    } else {
      items = getLocalWishlist();
    }

    // If API returned nothing but localStorage has items, use localStorage
    if ((!items || !items.length) && getLocalWishlist().length) {
      items = getLocalWishlist();
    }

    if (!Array.isArray(items)) items = [];

    // If items lack full product data, try to enrich from product cache
    try {
      const cache = JSON.parse(localStorage.getItem('kenova-products-cache') || '[]');
      if (cache.length) {
        items = items.map(item => {
          const prod = item.product || item;
          if (prod.name && prod.price) return item;

          const full = cache.find(p => p.id === (prod.id || prod.product_id));
          if (full) {
            return { ...full, added_at: item.added_at || full.added_at };
          }
          return item;
        });
        saveLocalWishlist(items);
      }
    } catch (e) { /* ignore */ }

    updateWishlistBadge();

    if (loading) loading.hidden = true;

    if (!items.length) {
      if (grid) grid.hidden = true;
      if (empty) empty.hidden = false;
      if (summary) summary.textContent = 'You have no products in your wishlist yet';
      return;
    }

    if (grid) grid.hidden = false;
    if (empty) empty.hidden = true;
    if (summary) summary.textContent = `You have ${items.length} product${items.length !== 1 ? 's' : ''} saved`;

    renderWishlist(items);
  } catch (err) {
    console.error('Failed to load wishlist:', err);
    if (loading) loading.hidden = true;
    if (grid) grid.hidden = true;
    if (empty) empty.hidden = false;
    if (summary) summary.textContent = 'Could not load your wishlist';
  }
}

/* ==========================================================================
   RENDER WISHLIST
   ========================================================================== */
function renderWishlist(items) {
  const grid = document.getElementById('wishlistGrid');
  if (!grid) return;

  grid.innerHTML = items.map((item) => {
    const product = item.product || item;

    const displayPrice = Number(product.discount_price || product.price) || 0;
    const originalPrice = Number(product.oldPrice || product.old_price || product.price) || 0;
    const hasDiscount = product.discount_price && Number(product.discount_price) < originalPrice;
    const stock = Number(product.stock ?? 10);
    const inStock = stock > 0;
    const stockClass = !inStock ? 'stock-out' : stock < 5 ? 'stock-low' : 'stock-in';
    const stockText = !inStock ? 'Out of Stock' : stock < 5 ? 'Low Stock' : 'In Stock';
    const safeName = String(product.name || 'Product').replace(/'/g, "\\'");
    const brandName = product.brand_name || product.brand || 'Kenova';

    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-image-wrap">
          <a href="product-details.html?id=${product.id}">
            <img src="${product.image || 'images/kanovalogo.png'}"
                 alt="${product.name || 'Product'}"
                 loading="lazy"
                 onerror="this.src='images/kanovalogo.png'">
          </a>
          <button type="button" class="remove-btn"
                  onclick="removeFromWishlist(${product.id})"
                  title="Remove from wishlist">
            <i class="fas fa-times"></i>
          </button>
          <span class="stock-status ${stockClass}">${stockText}</span>
        </div>
        <div class="product-info">
          <p class="product-brand">${brandName}</p>
          <h3 class="product-title">
            <a href="product-details.html?id=${product.id}">${product.name || 'Unnamed Product'}</a>
          </h3>
          <div class="product-price-row">
            <span class="product-price">৳${Number(displayPrice).toLocaleString('en-BD')}</span>
            ${hasDiscount ? `<span class="product-old-price">৳${Number(originalPrice).toLocaleString('en-BD')}</span>` : ''}
          </div>
          <button type="button" class="btn-add-cart" ${inStock ? '' : 'disabled'}
                  onclick="wishlistAddToCart(event, ${product.id}, '${safeName}', ${displayPrice})">
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* ==========================================================================
   REMOVE FROM WISHLIST
   ========================================================================== */
async function removeFromWishlist(productId) {
  if (!confirm('Remove this product from your wishlist?')) return;

  const token = getWishlistToken();

  try {
    if (token) {
      try {
        await wishlistApiCall(`/wishlist/${productId}`, 'DELETE');
      } catch (apiErr) {
        console.warn('API delete failed');
      }
    }

    let items = getLocalWishlist();
    items = items.filter((i) => (i.product?.id || i.id) !== productId);
    saveLocalWishlist(items);

    updateWishlistBadge();
    loadWishlist();
    showToast('Removed from wishlist');
  } catch (err) {
    console.error(err);
    showToast('Could not remove item', 'error');
  }
}

/* ==========================================================================
   ADD TO CART (uses kenova-cart)
   ========================================================================== */
function wishlistAddToCart(event, id, name, price) {
  if (event) event.preventDefault();

  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    const existing = cart.find((i) => i.id === id);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ id, name, price, qty: 1, img: '' });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();

    if (window.KenovaCart && typeof window.KenovaCart.add === 'function') {
      window.KenovaCart.add({ id, name, price, img: '' });
    } else {
      showToast(`${name} added to cart`);
    }
  } catch (err) {
    console.error(err);
    showToast('Could not add to cart', 'error');
  }
}

/* ==========================================================================
   LOGOUT
   ========================================================================== */
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (!confirm('Logout?')) return;
  localStorage.removeItem('token');
  localStorage.removeItem('kenova-token');
  localStorage.removeItem('user');
  localStorage.removeItem('kenova-user');
  window.location.href = 'login.html';
});

/* ==========================================================================
   INIT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadWishlist();
  updateCartBadge();

  const header = document.querySelector('.shopz-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) header?.classList.add('scrolled');
    else header?.classList.remove('scrolled');
  });
});