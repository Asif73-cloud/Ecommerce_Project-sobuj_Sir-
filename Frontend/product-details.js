 /* ==========================================================================
   Kenova - product-details.js (FULLY FIXED)
   Loads product, related products, handles cart/wishlist, reviews
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ========================================================================
     1. STATE
     ======================================================================== */
  let currentProduct = null;
  let relatedProducts = [];
  let allProducts = [];
  let quantity = 1;
  let currentImageIndex = 0;

  /* ========================================================================
     2. GET PRODUCT ID FROM URL
     ======================================================================== */
  const urlParams = new URLSearchParams(window.location.search);
  const productId = Number(urlParams.get("id"));

  console.log("[Product] ID from URL:", productId);

  if (!productId) {
    showError("No product specified");
    return;
  }

  /* ========================================================================
     3. ELEMENT REFERENCES
     ======================================================================== */
  const el = {
    loadingState: document.getElementById("loadingState"),
    productDetails: document.getElementById("productDetails"),
    productTabs: document.getElementById("productTabs"),
    relatedSection: document.getElementById("relatedSection"),

    mainImage: document.getElementById("mainImage"),
    thumbnailList: document.getElementById("thumbnailList"),
    productBadge: document.getElementById("productBadge"),

    productBrand: document.getElementById("productBrand"),
    productCategory: document.getElementById("productCategory"),
    productTitle: document.getElementById("productTitle"),
    productRating: document.getElementById("productRating"),
    productPrice: document.getElementById("productPrice"),
    productOldPrice: document.getElementById("productOldPrice"),
    productDiscount: document.getElementById("productDiscount"),
    stockInfo: document.getElementById("stockInfo"),
    productDescription: document.getElementById("productDescription"),
    productSku: document.getElementById("productSku"),
    breadcrumb: document.getElementById("breadcrumb"),

    qtyInput: document.getElementById("qtyInput"),
    qtyMinus: document.getElementById("qtyMinus"),
    qtyPlus: document.getElementById("qtyPlus"),
    addToCartBtn: document.getElementById("addToCartBtn"),
    wishlistBtn: document.getElementById("wishlistBtn"),

    fullDescription: document.getElementById("fullDescription"),
    specBrand: document.getElementById("specBrand"),
    specCategory: document.getElementById("specCategory"),
    specSku: document.getElementById("specSku"),
    specStock: document.getElementById("specStock"),

    avgRating: document.getElementById("avgRating"),
    avgStars: document.getElementById("avgStars"),
    totalReviews: document.getElementById("totalReviews"),
    reviewsList: document.getElementById("reviewsList"),

    relatedGrid: document.getElementById("relatedGrid"),
    wishlistCount: document.getElementById("wishlistCount"),
    userMenu: document.getElementById("userMenu"),
  };

  /* ========================================================================
     4. USER MENU
     ======================================================================== */
  function renderUserMenu() {
    if (!el.userMenu) return;
    const user = JSON.parse(localStorage.getItem("kenova-user") || "null");

    if (user && user.isLoggedIn) {
      el.userMenu.innerHTML = `
        <a href="profile.html"><i class="fa-solid fa-user"></i> My Profile</a>
        <a href="orders.html"><i class="fa-solid fa-box"></i> My Orders</a>
        <a href="wishlist.html"><i class="fa-solid fa-heart"></i> Wishlist</a>
        <a href="#" id="logoutBtn"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
      `;
      el.userMenu.querySelector("#logoutBtn")?.addEventListener("click", (e) => {
        e.preventDefault();
        if (confirm("Logout?")) {
          localStorage.removeItem("kenova-user");
          localStorage.removeItem("kenova-token");
          localStorage.removeItem("token");
          window.location.href = "home.html";
        }
      });
    } else {
      el.userMenu.innerHTML = `
        <a href="login.html"><i class="fa-solid fa-right-to-bracket"></i> Sign In</a>
        <a href="register.html"><i class="fa-solid fa-user-plus"></i> Create Account</a>
      `;
    }
  }
  renderUserMenu();

  /* ========================================================================
     5. LOAD PRODUCT (FIXED for {success, product} structure)
     ======================================================================== */
  async function loadProduct() {
    try {
      console.log('[Product] Loading ID:', productId);

      const data = await api("/products/" + productId);
      console.log('[Product] API Response:', data);

      // ✅ Handle the actual response shape:
      // { success: true, product: { id, name, price, ... } }
      let productData = null;

      if (data && data.success && data.product) {
        productData = data.product;
      } else if (data && data.id) {
        productData = data;
      } else if (data && data.product && data.product.id) {
        productData = data.product;
      }

      if (productData) {
        currentProduct = normalizeProduct(productData);
        console.log('[Product] Loaded:', currentProduct.name);
        renderProduct();
        loadRelatedProducts();
        return;
      }

      throw new Error("Invalid product data structure");
    } catch (err) {
      console.error('[Product] Failed:', err.message);

      // Fallback: load all products and find by id
      try {
        const data = await api("/products");
        let list = [];
        if (data && Array.isArray(data.products)) list = data.products;
        else if (Array.isArray(data)) list = data;

        allProducts = list.map(normalizeProduct);
        currentProduct = allProducts.find((p) => p.id === productId);

        if (currentProduct) {
          console.log('[Product] Found via fallback:', currentProduct.name);
          renderProduct();
          loadRelatedProducts();
          return;
        }
      } catch (err2) {
        console.error("Fallback failed:", err2);
      }

      showError("Product not found");
    }
  }

  /* ========================================================================
     6. NORMALIZE PRODUCT
     ======================================================================== */
  function normalizeProduct(p) {
    const price = Number(p.discount_price || p.price) || 0;
    const oldPrice = Number(p.oldPrice || p.price) || 0;

    let discount = 0;
    if (p.discount) {
      discount = Number(p.discount);
    } else if (oldPrice > price) {
      discount = Math.round(((oldPrice - price) / oldPrice) * 100);
    }

    let image = p.image || p.imageUrl || p.image_url || "";
    if (image && !image.startsWith("http") && !image.startsWith("data:")) {
      image = "images/" + image;
    }
    if (!image) {
      image = "images/kanovalogo.png";
    }

    return {
      id: p.id,
      name: p.name || "Product",
      brand: p.brand_name || p.brand || "Kenova",
      price: price,
      oldPrice: oldPrice,
      discount: discount,
      rating: Number(p.rating_avg || p.rating) || 0,
      reviews: Number(p.rating_count || p.reviews) || 0,
      image: image,
      category: p.category || p.category_name || "general",
      stock: p.stock ?? 100,
      sku: p.sku || `SKU-${p.id}`,
      description: p.description || `High-quality ${p.name}. Perfect for everyday use. Made with premium materials and crafted to last.`,
    };
  }

  /* ========================================================================
     7. RENDER PRODUCT
     ======================================================================== */
  function renderProduct() {
    const p = currentProduct;

    el.loadingState.hidden = true;
    el.productDetails.hidden = false;
    el.productTabs.hidden = false;

    el.breadcrumb.innerHTML = `
      <a href="home.html">Home</a>
      <span>/</span>
      <a href="home.html">${capitalize(p.category)}</a>
      <span>/</span>
      <span aria-current="page">${escapeHtml(p.name)}</span>
    `;

    el.mainImage.src = p.image;
    el.mainImage.alt = p.name;
    el.mainImage.onerror = function() {
      this.src = "images/kanovalogo.png";
    };

    renderThumbnails(p);

    if (p.discount > 0) {
      el.productBadge.textContent = `-${p.discount}%`;
      el.productBadge.hidden = false;
    } else {
      el.productBadge.hidden = true;
    }

    el.productBrand.textContent = p.brand;
    el.productCategory.textContent = capitalize(p.category);

    el.productTitle.textContent = p.name;
    document.title = `${p.name} | Kenova`;

    const stars = "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating));
    if (p.reviews > 0) {
      el.productRating.innerHTML = `
        <span class="stars">${stars}</span>
        <span class="rating-value">${p.rating.toFixed(1)} (${p.reviews} reviews)</span>
      `;
    } else {
      el.productRating.innerHTML = `<span class="rating-value" style="font-style:italic;">No ratings yet</span>`;
    }

    el.productPrice.textContent = `৳${Math.round(p.price).toLocaleString()}`;

    if (p.oldPrice > p.price) {
      el.productOldPrice.textContent = `৳${Math.round(p.oldPrice).toLocaleString()}`;
      el.productOldPrice.hidden = false;
      el.productDiscount.textContent = `-${p.discount}%`;
      el.productDiscount.hidden = false;
    } else {
      el.productOldPrice.hidden = true;
      el.productDiscount.hidden = true;
    }

    if (p.stock === 0) {
      el.stockInfo.className = "stock-info out";
      el.stockInfo.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <span>Out of Stock</span>`;
      if (el.addToCartBtn) el.addToCartBtn.disabled = true;
    } else if (p.stock < 10) {
      el.stockInfo.className = "stock-info low";
      el.stockInfo.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> <span>Only ${p.stock} left</span>`;
    } else {
      el.stockInfo.className = "stock-info";
      el.stockInfo.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>In Stock</span>`;
    }

    el.productDescription.textContent = p.description;
    el.fullDescription.textContent = p.description;

    el.productSku.textContent = p.sku;

    el.specBrand.textContent = p.brand;
    el.specCategory.textContent = capitalize(p.category);
    el.specSku.textContent = p.sku;
    el.specStock.textContent = p.stock > 0 ? `${p.stock} available` : "Out of stock";

    const wishlist = getWishlist();
    if (wishlist.includes(p.id)) {
      el.wishlistBtn.classList.add("active");
      el.wishlistBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
    } else {
      el.wishlistBtn.classList.remove("active");
      el.wishlistBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
    }

    attachEvents();
  }

  /* ========================================================================
     8. RENDER THUMBNAILS
     ======================================================================== */
  function renderThumbnails(p) {
    const images = [p.image, p.image, p.image, p.image];

    el.thumbnailList.innerHTML = images
      .map(
        (img, i) => `<img src="${img}" alt="Thumbnail ${i + 1}" 
                      class="${i === 0 ? "active" : ""}" data-index="${i}">`
      )
      .join("");

    el.thumbnailList.querySelectorAll("img").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        el.thumbnailList.querySelectorAll("img").forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
        el.mainImage.src = thumb.src;
        currentImageIndex = Number(thumb.dataset.index);
      });
      thumb.addEventListener("error", function () {
        this.src = "images/kanovalogo.png";
      });
    });
  }

  /* ========================================================================
     9. ATTACH EVENTS
     ======================================================================== */
  function attachEvents() {
    el.qtyMinus?.addEventListener("click", () => {
      if (quantity > 1) {
        quantity--;
        el.qtyInput.value = quantity;
      }
    });

    el.qtyPlus?.addEventListener("click", () => {
      const max = currentProduct.stock || 10;
      if (quantity < max) {
        quantity++;
        el.qtyInput.value = quantity;
      }
    });

    el.addToCartBtn?.addEventListener("click", () => {
      if (window.KenovaCart) {
        for (let i = 0; i < quantity; i++) {
          window.KenovaCart.add({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            old: currentProduct.oldPrice || 0,
            discount: currentProduct.discount || 0,
            img: currentProduct.image,
          });
        }
      } else {
        addToCartFallback(currentProduct, quantity);
      }

      const originalHTML = el.addToCartBtn.innerHTML;
      el.addToCartBtn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
      el.addToCartBtn.disabled = true;
      setTimeout(() => {
        el.addToCartBtn.innerHTML = originalHTML;
        el.addToCartBtn.disabled = false;
      }, 1500);
    });

    el.wishlistBtn?.addEventListener("click", () => {
      const wishlist = getWishlist();
      const idx = wishlist.indexOf(currentProduct.id);

      if (idx === -1) {
        wishlist.push(currentProduct.id);
        el.wishlistBtn.classList.add("active");
        el.wishlistBtn.innerHTML = `<i class="fa-solid fa-heart"></i>`;
        showToast("Added to wishlist ❤️");
      } else {
        wishlist.splice(idx, 1);
        el.wishlistBtn.classList.remove("active");
        el.wishlistBtn.innerHTML = `<i class="fa-regular fa-heart"></i>`;
        showToast("Removed from wishlist");
      }

      localStorage.setItem("kenova-wishlist", JSON.stringify(wishlist));
      updateWishlistBadge();
    });

    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;

        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
        document.getElementById(`tab-${tab}`)?.classList.add("active");
      });
    });
  }

  /* ========================================================================
     10. LOAD RELATED PRODUCTS
     ======================================================================== */
  async function loadRelatedProducts() {
    try {
      let products = allProducts;

      if (products.length === 0) {
        const data = await api("/products?limit=50");
        let list = [];
        if (data && Array.isArray(data.products)) list = data.products;
        else if (Array.isArray(data)) list = data;

        products = list.map(normalizeProduct);
      }

      relatedProducts = products
        .filter((p) => p.category === currentProduct.category && p.id !== currentProduct.id)
        .slice(0, 4);

      if (relatedProducts.length === 0) {
        relatedProducts = products.filter((p) => p.id !== currentProduct.id).slice(0, 4);
      }

      renderRelatedProducts();
    } catch (err) {
      console.warn("Related products failed:", err.message);
    }
  }

  function renderRelatedProducts() {
    if (relatedProducts.length === 0) return;

    el.relatedSection.hidden = false;

    el.relatedGrid.innerHTML = relatedProducts
      .map((p) => {
        const stars = "★".repeat(Math.round(p.rating)) + "☆".repeat(5 - Math.round(p.rating));
        const stockClass = p.stock === 0 ? "stock-out" : p.stock < 10 ? "stock-low" : "stock-in";
        const stockText = p.stock === 0 ? "Out of Stock" : p.stock < 10 ? `Only ${p.stock} left` : "In Stock";

        return `
          <article class="product-card" data-id="${p.id}">
            <div class="product-image-wrap">
              ${p.discount ? `<span class="product-badge">-${p.discount}%</span>` : ""}
              <img src="${p.image}" alt="${escapeHtml(p.name)}"
                   onerror="this.src='images/kanovalogo.png'">
              <span class="stock-status ${stockClass}">${stockText}</span>
            </div>
            <div class="product-info">
              <span class="product-brand">${escapeHtml(p.brand)}</span>
              <h3 class="product-title">${escapeHtml(p.name)}</h3>
              ${p.reviews > 0 ? `<div class="product-rating"><span class="stars">${stars}</span> <span>${p.rating.toFixed(1)}</span></div>` : ""}
              <div class="product-price-row">
                <span class="product-price">৳${Math.round(p.price).toLocaleString()}</span>
                ${p.oldPrice > p.price ? `<span class="product-old-price">৳${Math.round(p.oldPrice).toLocaleString()}</span>` : ""}
              </div>
              <button class="btn-add-cart" data-id="${p.id}" ${p.stock === 0 ? "disabled" : ""}>
                <i class="fa-solid fa-cart-plus"></i>
                ${p.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    el.relatedGrid.querySelectorAll(".product-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".btn-add-cart")) return;
        const id = card.dataset.id;
        window.location.href = `product-details.html?id=${id}`;
      });
    });

    el.relatedGrid.querySelectorAll(".btn-add-cart").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        const product = relatedProducts.find((p) => p.id === id);
        if (!product) return;

        if (window.KenovaCart) {
          window.KenovaCart.add({
            id: product.id,
            name: product.name,
            price: product.price,
            old: product.oldPrice || 0,
            discount: product.discount || 0,
            img: product.image,
          });
        }

        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Added!';
        btn.disabled = true;
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.disabled = product.stock === 0;
        }, 1200);
      });
    });
  }

  /* ========================================================================
     11. WISHLIST HELPERS
     ======================================================================== */
  function getWishlist() {
    try {
      let list = JSON.parse(localStorage.getItem("wishlist") || "[]");
      if (!list.length) {
        list = JSON.parse(localStorage.getItem("kenova-wishlist") || "[]");
      }
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function updateWishlistBadge() {
    const wishlist = getWishlist();
    const count = wishlist.length;
    if (el.wishlistCount) el.wishlistCount.textContent = count;
  }
  updateWishlistBadge();

  /* ========================================================================
     12. CART FALLBACK
     ======================================================================== */
  function addToCartFallback(product, qty = 1) {
    const CART_KEY = "kenova-cart";
    let cart = [];
    try {
      cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(cart)) cart = [];
    } catch {
      cart = [];
    }

    for (let i = 0; i < qty; i++) {
      const existing = cart.find((item) => item.id === product.id);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          price: product.price,
          old: product.oldPrice || 0,
          discount: product.discount || 0,
          qty: 1,
          img: product.image,
        });
      }
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));

    const cartBadge = document.getElementById("cartCount");
    if (cartBadge) {
      const total = cart.reduce((n, i) => n + (i.qty || 1), 0);
      cartBadge.textContent = total;
    }
  }

  /* ========================================================================
     13. HELPERS
     ======================================================================== */
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function capitalize(s) {
    return String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1);
  }

  function showError(msg) {
    el.loadingState.innerHTML = `
      <i class="fa-solid fa-circle-exclamation" style="color:#dc2626;"></i>
      <p style="color:#dc2626;font-weight:600;">${msg}</p>
      <a href="home.html" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#c2185b;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
        Back to Home
      </a>
    `;
  }

  function showToast(message) {
    const existing = document.querySelector(".toast-msg");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast-msg";
    toast.textContent = message;

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%) translateY(20px)",
      background: "#1a1a2e",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "8px",
      fontSize: "0.88rem",
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      zIndex: "9999",
      opacity: "0",
      transition: "opacity 0.25s, transform 0.25s",
      fontFamily: "var(--font, sans-serif)",
      maxWidth: "90vw",
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  /* ========================================================================
     14. CATEGORY DROPDOWN
     ======================================================================== */
  const categoryBtn = document.getElementById("categoryBtn");
  const categoryDropdown = document.getElementById("categoryDropdown");

  categoryBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    categoryDropdown?.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".category-dropdown")) {
      categoryDropdown?.classList.remove("open");
    }
  });

  /* ========================================================================
     15. SEARCH
     ======================================================================== */
  document.getElementById("searchForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = document.getElementById("searchInput").value.trim();
    if (q) {
      window.location.href = `home.html?search=${encodeURIComponent(q)}`;
    }
  });

  /* ========================================================================
     16. INIT — Load Product
     ======================================================================== */
  loadProduct();
});


/* ==========================================================================
   CUSTOMER REVIEWS SYSTEM (Independent IIFE)
   ========================================================================== */

(function () {
  const CR_API = 'http://localhost:5000/api';

  let crProductId = null;
  let crAllReviews = [];
  let crFilter = 'all';
  let crSelectedRating = 0;
  const crRatingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  /* ---------- Helpers ---------- */
  function crEsc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function crStarsHtml(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let out = '';
    for (let i = 0; i < 5; i++) {
      if (i < full) out += '<i class="fa-solid fa-star"></i>';
      else if (i === full && half) out += '<i class="fa-solid fa-star-half-alt"></i>';
      else out += '<i class="fa-regular fa-star"></i>';
    }
    return out;
  }

  function crStarsPlain(rating) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    let out = '';
    for (let i = 0; i < 5; i++) {
      if (i < full) out += '★';
      else if (i === full && half) out += '★';
      else out += '☆';
    }
    return out;
  }

  function crFormatDate(str) {
    const d = new Date(str);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  function crInitials(name) {
    const parts = String(name || '?').split(' ').filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function crGetToken() {
    return localStorage.getItem('token') || localStorage.getItem('kenova-token');
  }

  /* ---------- Load Reviews ---------- */
  async function crLoadReviews() {
    const list = document.getElementById('crReviewsList');
    const empty = document.getElementById('crEmpty');
    if (!list || !crProductId) return;

    list.innerHTML = '<p class="cr-loading">Loading reviews...</p>';
    if (empty) empty.hidden = true;

    let reviews = [];

    try {
      const res = await fetch(`${CR_API}/reviews/product/${crProductId}`);
      if (res.ok) {
        const data = await res.json();
        reviews = data.reviews || [];
      }
    } catch (err) {
      console.warn('Reviews API failed:', err.message);
    }

    crAllReviews = reviews;

    if (!reviews.length) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      crUpdateSummary([]);
      return;
    }

    const nameEl = document.getElementById('crProductName');
    if (nameEl && reviews[0].productName) {
      nameEl.textContent = reviews[0].productName;
    }

    crUpdateSummary(reviews);
    crApplyFilter();
  }

  /* ---------- Summary ---------- */
  function crUpdateSummary(reviews) {
    const avgEl = document.getElementById('crAvgRating');
    const starsEl = document.getElementById('crAvgStars');
    const totalEl = document.getElementById('crTotalReviews');

    if (!reviews.length) {
      if (avgEl) avgEl.textContent = '0.0';
      if (starsEl) starsEl.textContent = '☆☆☆☆☆';
      if (totalEl) totalEl.textContent = '0 Reviews';
      [1,2,3,4,5].forEach(n => {
        const bar = document.getElementById('crBar' + n);
        const pct = document.getElementById('crPercent' + n);
        if (bar) bar.style.width = '0%';
        if (pct) pct.textContent = '0%';
      });
      return;
    }

    const sum = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0);
    const avg = sum / reviews.length;

    if (avgEl) avgEl.textContent = avg.toFixed(1);
    if (starsEl) starsEl.textContent = crStarsPlain(avg);
    if (totalEl) totalEl.textContent = reviews.length + ' Review' + (reviews.length !== 1 ? 's' : '');

    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
      const n = Math.round(Number(r.rating) || 0);
      if (counts[n] !== undefined) counts[n]++;
    });

    [1,2,3,4,5].forEach(n => {
      const pct = Math.round((counts[n] / reviews.length) * 100);
      const bar = document.getElementById('crBar' + n);
      const pctEl = document.getElementById('crPercent' + n);
      if (bar) bar.style.width = pct + '%';
      if (pctEl) pctEl.textContent = pct + '%';
    });

    const photos = reviews.map(r => r.productImage).filter(Boolean).slice(0, 12);
    const photosSection = document.getElementById('crPhotosSection');
    const photosGrid = document.getElementById('crPhotosGrid');

    if (photos.length && photosSection && photosGrid) {
      photosSection.hidden = false;
      photosGrid.innerHTML = photos.map(img => `
        <div class="cr-photo-thumb">
          <img src="${crEsc(img)}" alt="Review photo" onerror="this.parentElement.style.display='none'">
        </div>
      `).join('');
    } else if (photosSection) {
      photosSection.hidden = true;
    }
  }

  /* ---------- Filter ---------- */
  function crApplyFilter() {
    let filtered = [...crAllReviews];

    if (['1','2','3','4','5'].includes(crFilter)) {
      filtered = filtered.filter(r => Number(r.rating) === Number(crFilter));
    } else if (crFilter === 'media') {
      filtered = filtered.filter(r => r.productImage);
    } else if (crFilter === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    crRenderReviews(filtered);
  }

  /* ---------- Render ---------- */
  function crRenderReviews(reviews) {
    const list = document.getElementById('crReviewsList');
    if (!list) return;

    if (!reviews.length) {
      list.innerHTML = '<p class="cr-loading">No reviews match this filter.</p>';
      return;
    }

    list.innerHTML = reviews.map(r => {
      const name = r.userName || 'Anonymous';
      const comment = r.comment || '';
      const rating = Number(r.rating) || 0;
      const date = crFormatDate(r.createdAt || new Date());
      const img = r.productImage || '';

      return `
        <div class="cr-review-card">
          <div class="cr-review-avatar">${crInitials(name)}</div>

          <div class="cr-review-body">
            <div class="cr-review-top">
              <div class="cr-review-user">
                <p class="cr-review-name">${crEsc(name)}</p>
                <span class="cr-review-date">${date}</span>
              </div>

              <div class="cr-review-right">
                <div class="cr-review-stars">${crStarsHtml(rating)}</div>
                <span class="cr-verified-badge">
                  <i class="fa-solid fa-circle-check"></i> Verified
                </span>
              </div>
            </div>

            <p class="cr-review-comment">${crEsc(comment)}</p>

            ${img ? `<img class="cr-review-image" src="${crEsc(img)}" alt="Review" onerror="this.style.display='none'">` : ''}

            <div class="cr-review-actions">
              <button type="button" class="cr-action-btn">
                <i class="fa-regular fa-thumbs-up"></i> Helpful (0)
              </button>
              <button type="button" class="cr-action-btn">
                <i class="fa-regular fa-thumbs-down"></i> Dislike (0)
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /* ---------- Tabs ---------- */
  function crInitTabs() {
    document.querySelectorAll('.cr-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.cr-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        crFilter = tab.dataset.filter || 'all';
        crApplyFilter();
      });
    });
  }

  /* ---------- Modal ---------- */
  function crInitModal() {
    const overlay = document.getElementById('crModalOverlay');
    const writeBtn = document.getElementById('crWriteBtn');
    const closeBtn = document.getElementById('crModalClose');
    const cancelBtn = document.getElementById('crCancelBtn');
    const form = document.getElementById('crReviewForm');

    writeBtn?.addEventListener('click', () => {
      if (!crGetToken()) {
        alert('Please login to write a review');
        window.location.href = 'login.html';
        return;
      }
      overlay?.classList.add('show');
      crResetForm();
    });

    closeBtn?.addEventListener('click', () => overlay?.classList.remove('show'));
    cancelBtn?.addEventListener('click', () => overlay?.classList.remove('show'));
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('show');
    });

    const picker = document.getElementById('crStarPicker');
    const ratingInput = document.getElementById('crRatingInput');
    const ratingText = document.getElementById('crRatingText');

    picker?.querySelectorAll('i').forEach(star => {
      star.addEventListener('mouseenter', () => {
        const val = Number(star.dataset.value);
        picker.querySelectorAll('i').forEach((s, i) => {
          s.className = i < val ? 'fa-solid fa-star' : 'fa-regular fa-star';
        });
      });

      star.addEventListener('click', () => {
        const val = Number(star.dataset.value);
        crSelectedRating = val;
        if (ratingInput) ratingInput.value = val;
        picker.querySelectorAll('i').forEach((s, i) => {
          s.className = i < val ? 'fa-solid fa-star' : 'fa-regular fa-star';
        });
        if (ratingText) ratingText.textContent = crRatingLabels[val] || 'Tap to rate';
      });
    });

    picker?.addEventListener('mouseleave', () => {
      picker.querySelectorAll('i').forEach((s, i) => {
        s.className = i < crSelectedRating ? 'fa-solid fa-star' : 'fa-regular fa-star';
      });
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      await crSubmitReview();
    });
  }

  function crResetForm() {
    crSelectedRating = 0;
    const input = document.getElementById('crRatingInput');
    const comment = document.getElementById('crCommentInput');
    const picker = document.getElementById('crStarPicker');
    const ratingText = document.getElementById('crRatingText');

    if (input) input.value = 0;
    if (comment) comment.value = '';
    if (ratingText) ratingText.textContent = 'Tap to rate';
    picker?.querySelectorAll('i').forEach(s => s.className = 'fa-regular fa-star');
  }

  /* ---------- Submit ---------- */
  async function crSubmitReview() {
    const comment = document.getElementById('crCommentInput')?.value.trim();

    if (!crSelectedRating || crSelectedRating < 1) {
      alert('Please select a rating');
      return;
    }
    if (!comment || comment.length < 3) {
      alert('Please write a review (min 3 characters)');
      return;
    }

    const btn = document.getElementById('crSubmitBtn');
    const orig = btn ? btn.innerHTML : '';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
    }

    try {
      const res = await fetch(`${CR_API}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${crGetToken()}`
        },
        body: JSON.stringify({
          productId: Number(crProductId),
          rating: crSelectedRating,
          comment: comment
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }

      document.getElementById('crModalOverlay')?.classList.remove('show');
      alert('Thank you! Your review has been submitted.');
      crLoadReviews();

    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = orig;
      }
    }
  }

  /* ---------- Init ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    crProductId = params.get('id');

    if (crProductId) {
      crInitTabs();
      crInitModal();

      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.dataset.tab === 'reviews') {
            setTimeout(crLoadReviews, 50);
          }
        });
      });

      crLoadReviews();
    }
  });

})();
