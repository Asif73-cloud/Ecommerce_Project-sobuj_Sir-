 /* ==========================================================================
   Kenova - home.js (v7 — Complete & Tested)
   ========================================================================== */

const HOME_API = 'http://localhost:5000/api';
const CACHE_KEY = 'kenova-products-cache';
const CACHE_TIME_KEY = 'kenova-products-cache-time';
const WISHLIST_KEY = 'kenova-wishlist';
const CART_KEY = 'kenova-cart';
const CACHE_DURATION = 5 * 60 * 1000;

let allProducts = [];
let filteredProducts = [];
let currentFilters = {
  page: 1,
  limit: 500,
  category: '',
  brand: '',
  min: '',
  max: '',
  rating: '',
  sort: 'default',
  search: ''
};

/* ==========================================================================
   HELPERS
   ========================================================================== */
function getHomeToken() {
  return localStorage.getItem('token') || localStorage.getItem('kenova-token');
}

const money = (n) => '৳' + Number(n || 0).toLocaleString('en-BD');

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let out = '';
  for (let i = 0; i < 5; i++) {
    if (i < full) out += '★';
    else if (i === full && half) out += '½';
    else out += '☆';
  }
  return out;
}

function getWishlist() {
  try {
    const list = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(cart) ? cart : [];
  } catch (e) {
    return [];
  }
}

/* ==========================================================================
   TOAST
   ========================================================================== */
function showToast(message, type = 'success') {
  let toast = document.getElementById('homeToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'homeToast';
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
   CACHE
   ========================================================================== */
function getCachedProducts() {
  try {
    const time = Number(localStorage.getItem(CACHE_TIME_KEY) || 0);
    const now = Date.now();
    if (now - time > CACHE_DURATION) return null;
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    return Array.isArray(cached) && cached.length ? cached : null;
  } catch (e) {
    return null;
  }
}

function saveProductsCache(products) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(products));
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  } catch (e) { /* ignore */ }
}

/* ==========================================================================
   BADGES
   ========================================================================== */
function updateBadges() {
  try {
    const cart = getCart();
    const cartCount = cart.reduce((s, i) => s + (Number(i.qty) || 1), 0);
    document.querySelectorAll('.cart-count, #cartCount, .cart-badge').forEach(el => {
      el.textContent = String(cartCount);
    });
  } catch (e) { /* ignore */ }

  try {
    const wishlist = getWishlist();
    document.querySelectorAll('#wishlistCount, .wishlist-count, .wishlist-badge').forEach(el => {
      if (el.id === 'cartCount' || el.classList.contains('cart-count')) return;
      el.textContent = String(wishlist.length);
    });
  } catch (e) { /* ignore */ }
}

/* ==========================================================================
   LOAD PRODUCTS FROM API
   ========================================================================== */
async function loadAllProductsFromAPI() {
  console.log('[Home] Loading products...');

  // 1. Try fresh cache
  const cached = getCachedProducts();
  if (cached && cached.length) {
    allProducts = cached;
    console.log('[Home] Loaded from fresh cache:', allProducts.length);
    return true;
  }

  // 2. Try API
  try {
    let data = null;

    if (typeof api === 'function') {
      data = await api('/products?limit=5000');
    } else {
      const res = await fetch(HOME_API + '/products?limit=5000');
      data = await res.json();
    }

    if (data && Array.isArray(data.products) && data.products.length) {
      allProducts = data.products;
      saveProductsCache(allProducts);
      console.log('[Home] Loaded from API:', allProducts.length);
      return true;
    }
  } catch (err) {
    console.warn('[Home] API failed:', err.message);
  }

  // 3. Try old cache
  try {
    const oldCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
    if (oldCache.length) {
      allProducts = oldCache;
      console.log('[Home] Loaded from old cache:', allProducts.length);
      return true;
    }
  } catch (e) { /* ignore */ }

  // 4. Demo data
  console.warn('[Home] Using demo data');
  allProducts = [
    { id: 1, name: "Xiaomi Mi Colorful Mini Backpack", brand_name: "Xiaomi", category: "mens-fashion", price: 750, discount_price: 0, stock: 10, rating_avg: 4.5, rating_count: 12, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400" },
    { id: 2, name: "WIWU Alpha Tech Pouch", brand_name: "WIWU", category: "mens-fashion", price: 1050, discount_price: 850, stock: 5, rating_avg: 4.8, rating_count: 25, image: "https://images.unsplash.com/photo-1605733513597-a8c9c9b1b6c6?w=400" },
    { id: 3, name: "Xiaomi Mi Urban Backpack", brand_name: "Xiaomi", category: "mens-fashion", price: 3350, discount_price: 3000, stock: 8, rating_avg: 4.6, rating_count: 18, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400" }
  ];
  return true;
}

/* ==========================================================================
   APPLY FILTERS
   ========================================================================== */
function applyFilters() {
  let result = [...allProducts];

  if (currentFilters.category && currentFilters.category !== 'all') {
    const cat = currentFilters.category.toLowerCase();
    result = result.filter(p => {
      const pCat = String(p.category || '').toLowerCase();
      return pCat === cat || pCat.includes(cat);
    });
  }

  if (currentFilters.brand) {
    const brand = currentFilters.brand.toLowerCase();
    result = result.filter(p => {
      const pBrand = String(p.brand_name || p.brand || '').toLowerCase();
      return pBrand.includes(brand);
    });
  }

  if (currentFilters.min) {
    const min = Number(currentFilters.min);
    result = result.filter(p => (Number(p.discount_price || p.price) || 0) >= min);
  }

  if (currentFilters.max) {
    const max = Number(currentFilters.max);
    result = result.filter(p => (Number(p.discount_price || p.price) || 0) <= max);
  }

  if (currentFilters.rating && currentFilters.rating !== '0') {
    const r = Number(currentFilters.rating);
    result = result.filter(p => (Number(p.rating_avg) || 5) >= r);
  }

  if (currentFilters.search) {
    const search = currentFilters.search.toLowerCase();
    result = result.filter(p => {
      const name = String(p.name || '').toLowerCase();
      const brand = String(p.brand_name || p.brand || '').toLowerCase();
      return name.includes(search) || brand.includes(search);
    });
  }

  switch (currentFilters.sort) {
    case 'price-low':
      result.sort((a, b) =>
        (Number(a.discount_price || a.price) || 0) -
        (Number(b.discount_price || b.price) || 0)
      );
      break;
    case 'price-high':
      result.sort((a, b) =>
        (Number(b.discount_price || b.price) || 0) -
        (Number(a.discount_price || a.price) || 0)
      );
      break;
    case 'rating':
      result.sort((a, b) => (Number(b.rating_avg) || 0) - (Number(a.rating_avg) || 0));
      break;
    case 'newest':
      result.sort((a, b) => Number(b.id) - Number(a.id));
      break;
  }

  const total = result.length;
  const perPage = 20;
  const totalPages = Math.ceil(total / perPage);
  const page = Math.min(currentFilters.page, totalPages) || 1;
  const start = (page - 1) * perPage;
  const paged = result.slice(start, start + perPage);

  filteredProducts = paged;

  return { products: paged, total, page, totalPages };
}

/* ==========================================================================
   RENDER PRODUCTS
   ========================================================================== */
function renderProducts(products) {
  const grid = document.getElementById('productsGrid');
  const empty = document.getElementById('emptyState');
  if (!grid) {
    console.warn('[Home] productsGrid not found');
    return;
  }

  if (!products || !products.length) {
    grid.innerHTML = '';
    if (empty) empty.hidden = false;
    console.log('[Home] No products to render');
    return;
  }

  if (empty) empty.hidden = true;

  const wishlist = getWishlist();

  grid.innerHTML = products.map(p => {
    const price = Number(p.discount_price || p.price) || 0;
    const oldPrice = Number(p.price) || 0;
    const hasDiscount = p.discount_price && Number(p.discount_price) < oldPrice;
    const discountPercent = hasDiscount
      ? Math.round(((oldPrice - price) / oldPrice) * 100)
      : 0;

    const inStock = (p.stock ?? 1) > 0;
    const rating = Number(p.rating_avg) || 5;
    const ratingCount = Number(p.rating_count) || 0;
    const isWished = wishlist.some(i => i.id === p.id || i.product_id === p.id);

    return `
      <div class="product-card" data-id="${p.id}">
        <div class="product-image-wrap">
          <a href="product-details.html?id=${p.id}">
            <img src="${esc(p.image || 'images/kanovalogo.png')}"
                 alt="${esc(p.name)}"
                 loading="lazy"
                 onerror="this.src='images/kanovalogo.png'">
          </a>

          ${hasDiscount ? `<span class="product-badge">-${discountPercent}%</span>` : ''}

          <button type="button"
                  class="wishlist-btn ${isWished ? 'active' : ''}"
                  onclick="addToWishlist(event, ${p.id})"
                  aria-label="Add to wishlist">
            <i class="${isWished ? 'fas' : 'far'} fa-heart"></i>
          </button>

          <span class="stock-status ${inStock ? 'stock-in' : 'stock-out'}">
            ${inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        <div class="product-info">
          <p class="product-brand">${esc(p.brand_name || p.brand || 'Kenova')}</p>
          <h3 class="product-title">
            <a href="product-details.html?id=${p.id}">${esc(p.name)}</a>
          </h3>

          <div class="product-rating">
            <span class="stars">${renderStars(rating)}</span>
            <span>${rating.toFixed(1)} (${ratingCount})</span>
          </div>

          <div class="product-price-row">
            <span class="product-price">${money(price)}</span>
            ${hasDiscount ? `<span class="product-old-price">${money(oldPrice)}</span>` : ''}
          </div>

          <button type="button"
                  class="btn-add-cart"
                  ${!inStock ? 'disabled' : ''}
                  onclick="addProductToCart(event, ${p.id}, '${esc(p.name).replace(/'/g, "\\'")}', ${price})">
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
        </div>
      </div>
    `;
  }).join('');

  console.log('[Home] Rendered', products.length, 'products');
}

/* ==========================================================================
   LOAD / PAGINATION
   ========================================================================== */
function loadProducts(filters = {}, updateUrl = true) {
  currentFilters = { ...currentFilters, ...filters };
  const result = applyFilters();
  renderProducts(result.products);
  updateResultsCount(result.total);
  renderPagination(result.page, result.totalPages);

  if (updateUrl && window.history && window.history.replaceState) {
    const params = new URLSearchParams();
    if (currentFilters.category && currentFilters.category !== 'all') {
      params.set('category', currentFilters.category);
    }
    if (currentFilters.search) params.set('search', currentFilters.search);
    if (currentFilters.sort && currentFilters.sort !== 'default') {
      params.set('sort', currentFilters.sort);
    }
    const query = params.toString();
    const newUrl = query ? `?${query}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }
}

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const category = params.get('category');
  const search = params.get('search');
  const sort = params.get('sort');

  if (category) currentFilters.category = category;
  if (search) currentFilters.search = search;
  if (sort) currentFilters.sort = sort;

  if (search) {
    const input = document.getElementById('searchInput');
    if (input) input.value = search;
  }

  if (category && category !== 'all') {
    const heading = document.getElementById('pageHeading');
    if (heading) {
      heading.textContent = category.split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  if (sort) {
    const sel = document.getElementById('sortSelect');
    if (sel) sel.value = sort;
  }
}

function updateResultsCount(count) {
  const el = document.getElementById('resultsCount');
  if (el) el.textContent = `Showing ${count} product${count !== 1 ? 's' : ''}`;
}

function renderPagination(currentPage, totalPages) {
  const el = document.getElementById('pagination');
  if (!el) return;

  if (totalPages <= 1) {
    el.innerHTML = '';
    return;
  }

  let html = '';

  if (currentPage > 1) {
    html += `<button onclick="loadProducts({page: ${currentPage - 1}}, false)">Prev</button>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
      html += `<button class="${i === currentPage ? 'active' : ''}" onclick="loadProducts({page: ${i}}, false)">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += '<span class="dots">…</span>';
    }
  }

  if (currentPage < totalPages) {
    html += `<button onclick="loadProducts({page: ${currentPage + 1}}, false)">Next</button>`;
  }

  el.innerHTML = html;
}

/* ==========================================================================
   ADD TO CART
   ========================================================================== */
function addProductToCart(event, id, name, price) {
  if (event) event.preventDefault();

  const cart = getCart();
  const existing = cart.find(i => i.id === id);

  const product = allProducts.find(p => p.id === id) || {};

  let imageUrl = product.image || product.imageUrl || '';
  if (!imageUrl) {
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
      const cached = cache.find(p => p.id === id);
      imageUrl = cached?.image || '';
    } catch (e) { /* ignore */ }
  }

  if (existing) {
    existing.qty += 1;
    if (!existing.img && imageUrl) existing.img = imageUrl;
  } else {
    cart.push({
      id: id,
      name: name || product.name || 'Product',
      price: price || Number(product.discount_price || product.price) || 0,
      qty: 1,
      img: imageUrl,
      old: Number(product.oldPrice || product.price) || 0,
      oldPrice: Number(product.oldPrice || product.price) || 0,
      discount: Number(product.discount) || 0,
      stock: Number(product.stock) || 10,
      category: product.category || '',
      brand: product.brand_name || product.brand || 'Kenova'
    });
  }

  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateBadges();

  if (window.KenovaCart && typeof window.KenovaCart.add === 'function') {
    window.KenovaCart.add({
      id: id,
      name: name || product.name,
      price: price || Number(product.discount_price || product.price),
      img: imageUrl,
      old: Number(product.oldPrice || product.price) || 0,
      discount: Number(product.discount) || 0
    });
  } else {
    showToast(`${name} added to cart`);
  }
}

/* ==========================================================================
   ADD TO WISHLIST
   ========================================================================== */
function addToWishlist(event, id) {
  if (event) event.preventDefault();

  const wishlist = getWishlist();
  const existingIdx = wishlist.findIndex(i => i.id === id || i.product_id === id);

  if (existingIdx >= 0) {
    wishlist.splice(existingIdx, 1);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    showToast('Removed from wishlist');

    const btn = event.target.closest('.wishlist-btn');
    if (btn) {
      btn.classList.remove('active');
      const icon = btn.querySelector('i');
      if (icon) icon.className = 'far fa-heart';
    }
  } else {
    const product = allProducts.find(p => p.id === id);
    if (!product) {
      showToast('Product not found', 'error');
      return;
    }

    wishlist.push({
      id: product.id,
      product_id: product.id,
      name: product.name || 'Unnamed Product',
      brand: product.brand_name || product.brand || 'Kenova',
      brand_name: product.brand_name || product.brand || 'Kenova',
      price: Number(product.price) || 0,
      discount_price: Number(product.discount_price) || 0,
      oldPrice: Number(product.price) || 0,
      old_price: Number(product.price) || 0,
      stock: Number(product.stock) || 10,
      image: product.image || 'images/kanovalogo.png',
      category: product.category || '',
      rating_avg: Number(product.rating_avg) || 5,
      rating_count: Number(product.rating_count) || 0,
      added_at: new Date().toISOString()
    });

    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    showToast('Added to wishlist ❤️');

    const btn = event.target.closest('.wishlist-btn');
    if (btn) {
      btn.classList.add('active');
      const icon = btn.querySelector('i');
      if (icon) icon.className = 'fas fa-heart';
    }
  }

  updateBadges();
}

/* ==========================================================================
   CATEGORY DROPDOWN
   ========================================================================== */
function initCategoryDropdown() {
  const dropdown = document.getElementById('categoryDropdown');
  const btn = document.getElementById('categoryBtn');
  const menu = document.getElementById('categoryMenu');

  if (!dropdown || !btn) return;

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.category-dropdown')) {
      dropdown.classList.remove('open');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dropdown.classList.remove('open');
  });

  if (menu) {
    menu.querySelectorAll('a[data-category]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const category = link.dataset.category;

        menu.querySelectorAll('a').forEach(a => a.classList.remove('active'));
        link.classList.add('active');

        const heading = document.getElementById('pageHeading');
        if (heading) {
          heading.textContent = category === 'all' ? 'All Products' : link.textContent.trim();
        }

        loadProducts({ category: category === 'all' ? '' : category, page: 1 });

        dropdown.classList.remove('open');

        const area = document.getElementById('productsArea');
        if (area) area.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }
}

/* ==========================================================================
   SEARCH
   ========================================================================== */
function initSearch() {
  const input = document.getElementById('searchInput');
  const form = document.getElementById('searchForm');
  const clearBtn = document.getElementById('searchClear');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = input?.value.trim() || '';
      loadProducts({ search: q, page: 1 });
    });
  }

  if (input) {
    let timer = null;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      if (clearBtn) clearBtn.hidden = !input.value;

      timer = setTimeout(() => {
        loadProducts({ search: input.value.trim(), page: 1 }, false);
      }, 400);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        loadProducts({ search: input.value.trim(), page: 1 });
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (input) input.value = '';
      clearBtn.hidden = true;
      loadProducts({ search: '', page: 1 });
    });
  }
}

/* ==========================================================================
   FILTERS
   ========================================================================== */
function initFilters() {
  document.querySelectorAll('input[name="price"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const [min, max] = e.target.value.split('-');
      loadProducts({ min, max, page: 1 });
    });
  });

  document.querySelectorAll('input[name="rating"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const val = e.target.value;
      loadProducts({ rating: val === '0' ? '' : val, page: 1 });
    });
  });

  document.getElementById('sortSelect')?.addEventListener('change', (e) => {
    loadProducts({ sort: e.target.value, page: 1 });
  });

  document.getElementById('resetFilters')?.addEventListener('click', () => {
    document.querySelectorAll('input[name="price"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="rating"]').forEach(r => r.checked = false);
    const allRating = document.querySelector('input[name="rating"][value="0"]');
    if (allRating) allRating.checked = true;

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.hidden = true;

    currentFilters = {
      page: 1,
      limit: 500,
      category: '',
      brand: '',
      min: '',
      max: '',
      rating: '',
      sort: 'default',
      search: ''
    };

    const heading = document.getElementById('pageHeading');
    if (heading) heading.textContent = 'All Products';

    loadProducts({});
  });

  document.getElementById('clearEmpty')?.addEventListener('click', () => {
    document.getElementById('resetFilters')?.click();
  });

  const backToTop = document.getElementById('backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) backToTop.classList.add('show');
      else backToTop.classList.remove('show');
    });

    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* ==========================================================================
   HEADER SCROLL
   ========================================================================== */
function initHeaderScroll() {
  const header = document.querySelector('.shopz-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  });
}

/* ==========================================================================
   LOGOUT
   ========================================================================== */
function initLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('kenova-token');
      localStorage.removeItem('user');
      localStorage.removeItem('kenova-user');
      window.location.href = 'login.html';
    }
  });
}

/* ==========================================================================
   INIT
   ========================================================================== */
async function initHome() {
  console.log('[Home] Initializing...');

  try {
    initCategoryDropdown();
    initSearch();
    initFilters();
    initHeaderScroll();
    initLogout();
    updateBadges();
    readUrlParams();

    await loadAllProductsFromAPI();

    console.log('[Home] Products loaded:', allProducts.length);
    console.log('[Home] Calling loadProducts...');

    loadProducts({}, false);

    console.log('[Home] Initial render done');

    // Update badges a few times after render
    setTimeout(updateBadges, 100);
    setTimeout(updateBadges, 500);
    setTimeout(updateBadges, 1500);

  } catch (err) {
    console.error('[Home] Init error:', err);

    // Fallback: try to render at least demo products
    const grid = document.getElementById('productsGrid');
    if (grid) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#dc2626;padding:40px;">Failed to load products. Please refresh.</p>';
    }
  }
}

// Run init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHome);
} else {
  initHome();
}