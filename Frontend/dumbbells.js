/* ==========================================================================
   Kenova - Dumbbells page logic
   Filters + sort + view toggle + pagination + cart + toast + fallback SVG
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- Helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const on = (id, event, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
  };

  const CART_KEY = "kenova-cart";
  const money = (n) => "৳" + Math.round(n).toLocaleString("en-US");

  const escAttr = (s) => s.replace(/"/g, "&quot;");
  const slug    = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const cap     = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- DATA ---------- */
  const RAW = [
    { b: "Bowflex", n: "Bowflex SelectTech 552 Adjustable Dumbbells (Pair)", p: 32000, o: 38000, d: 16, r: 5, c: 4,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "PowerBlock", n: "PowerBlock Elite EXP Adjustable Dumbbell Set", p: 28000, o: 34000, d: 18, r: 5, c: 3,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "Nike", n: "Nike Rubber Hex Dumbbell - 10kg (Single)", p: 4500, r: 4, c: 6,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "Adidas", n: "Adidas Performance Dumbbell Set 2x5kg", p: 5800, o: 6800, d: 15, r: 4, c: 2,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "CAP Barbell", n: "CAP Barbell Neoprene Dumbbell - 8kg (Pair)", p: 3600, r: 0, c: 0,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "Rogue", n: "Rogue Rubber Hex Dumbbell - 15kg (Single)", p: 8500, r: 5, c: 2,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "Bowflex", n: "Bowflex SelectTech 1090 Adjustable Dumbbell", p: 42000, o: 48000, d: 13, r: 5, c: 2,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "PowerBlock", n: "PowerBlock Sport 24 Adjustable Dumbbell Set", p: 18500, r: 4, c: 1,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "Nike", n: "Nike Chrome Dumbbell - 5kg (Pair)", p: 7200, o: 8500, d: 15, r: 0, c: 0,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "Adidas", n: "Adidas Neo Dumbbell Set 2x2kg", p: 3200, r: 4, c: 3,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "CAP Barbell", n: "CAP Barbell Cast Iron Dumbbell - 20kg (Single)", p: 9500, r: 0, c: 0,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "Rogue", n: "Rogue Urethane Dumbbell - 25kg (Pair)", p: 28000, o: 32000, d: 13, r: 5, c: 1,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "Bowflex", n: "Bowflex SelectTech 560 Dumbbell (Single)", p: 22000, r: 4, c: 2,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "PowerBlock", n: "PowerBlock Pro 50 Adjustable Dumbbells", p: 35000, r: 0, c: 0,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "Nike", n: "Nike Essential Dumbbell - 12kg (Pair)", p: 11500, o: 13000, d: 12, r: 0, c: 0,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "Adidas", n: "Adidas Adjustable Dumbbell 20kg Set", p: 15500, r: 4, c: 1,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "CAP Barbell", n: "CAP Hex Dumbbell Set with Rack - 5-25kg", p: 45000, o: 52000, d: 13, r: 5, c: 1,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "Rogue", n: "Rogue KG Black Urethane Dumbbells (Pair)", p: 24000, r: 0, c: 0,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "Bowflex", n: "Bowflex SelectTech 2080 Barbell + Dumbbell", p: 52000, r: 5, c: 1,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },

    { b: "PowerBlock", n: "PowerBlock Elite USA Adjustable Dumbbells", p: 31000, o: 36000, d: 14, r: 4, c: 2,
      img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=400&h=400&fit=crop" },
  ];

  const PRODUCTS = RAW.map((x, i) => ({
    id: 12000 + i,
    brand: x.b,
    name: x.n,
    price: x.p,
    old: x.o || 0,
    discount: x.d || (x.o ? Math.round((1 - x.p / x.o) * 100) : 0),
    rating: x.r || 0,
    reviews: x.c || 0,
    type: x.t || "dumbbell",
    img: x.img,
  }));

  /* ---------- Filter configuration ---------- */
  const PRICE_RANGES = [
    { label: "Under ৳5,000",      min: 0,     max: 5000 },
    { label: "৳5,000 - ৳10,000",  min: 5000,  max: 10000 },
    { label: "৳10,000 - ৳20,000", min: 10000, max: 20000 },
    { label: "৳20,000 - ৳35,000", min: 20000, max: 35000 },
    { label: "৳35,000 & above",   min: 35000, max: Infinity },
  ];
  const RATINGS = [4, 3, 2];

  /* ---------- State ---------- */
  const state = {
    brands: new Set(),
    priceIdx: new Set(),
    minRating: 0,
    brandSearch: "",
    productSearch: "",
    sort: "best",
    view: "grid",
    page: 1,
  };
  const PAGE_SIZE = 8;

  /* ========================================================================
     SIDEBAR RENDERING
     ======================================================================== */

  const brandCounts = {};
  PRODUCTS.forEach((p) => (brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1));
  const allBrands = Object.keys(brandCounts).sort();

  function renderBrandList() {
    const container = $("brands");
    if (!container) return;
    const q = state.brandSearch.toLowerCase();
    container.innerHTML = allBrands
      .filter((b) => b.toLowerCase().includes(q))
      .map(
        (b) => `
          <label>
            <input type="checkbox" value="${b}" ${state.brands.has(b) ? "checked" : ""}>
            ${b} <span class="count">(${brandCounts[b]})</span>
          </label>`
      )
      .join("");
  }
  renderBrandList();

  const pricesEl = $("prices");
  if (pricesEl) {
    pricesEl.innerHTML = PRICE_RANGES.map(
      (r, i) => `
        <label class="price_opt">
          <input type="checkbox" value="${i}">
          ${r.label}
        </label>`
    ).join("");
  }

  const ratingsEl = $("ratings");
  if (ratingsEl) {
    ratingsEl.innerHTML =
      RATINGS.map(
        (r) => `
          <label class="rating_opt">
            <input type="radio" name="rating" value="${r}">
            <span class="stars">${"★".repeat(r)}${"☆".repeat(5 - r)}</span> &amp; up
          </label>`
      ).join("") +
      `
        <label class="rating_opt">
          <input type="radio" name="rating" value="0" checked>
          <span>Any rating</span>
        </label>`;
  }

  /* ========================================================================
     FILTER EVENTS
     ======================================================================== */

  on("searchInput", "input", (e) => {
    state.productSearch = e.target.value.trim().toLowerCase();
    state.page = 1;
    renderGrid();
  });

  on("bsearch", "input", (e) => {
    state.brandSearch = e.target.value;
    renderBrandList();
  });

  on("brands", "change", (e) => {
    if (e.target.type !== "checkbox") return;
    e.target.checked
      ? state.brands.add(e.target.value)
      : state.brands.delete(e.target.value);
    state.page = 1;
    renderGrid();
  });

  on("prices", "change", (e) => {
    if (e.target.type !== "checkbox") return;
    e.target.checked
      ? state.priceIdx.add(Number(e.target.value))
      : state.priceIdx.delete(Number(e.target.value));
    state.page = 1;
    renderGrid();
  });

  on("ratings", "change", (e) => {
    if (e.target.name !== "rating") return;
    state.minRating = Number(e.target.value);
    state.page = 1;
    renderGrid();
  });

  on("reset", "click", () => {
    state.brands.clear();
    state.priceIdx.clear();
    state.minRating = 0;
    state.brandSearch = "";
    state.productSearch = "";
    state.page = 1;

    const bs = $("bsearch"); if (bs) bs.value = "";
    const si = $("searchInput"); if (si) si.value = "";

    document
      .querySelectorAll('#ratings input[value="0"]')
      .forEach((r) => (r.checked = true));

    renderBrandList();
    renderGrid();
  });

  on("sort", "change", (e) => {
    state.sort = e.target.value;
    state.page = 1;
    renderGrid();
  });

  on("vGrid", "click", () => setView("grid"));
  on("vList", "click", () => setView("list"));

  function setView(v) {
    state.view = v;
    const g = $("vGrid"), l = $("vList"), grid = $("grid");
    if (g) g.classList.toggle("on", v === "grid");
    if (l) l.classList.toggle("on", v === "list");
    if (grid) grid.classList.toggle("list", v === "list");
  }

  /* ========================================================================
     FILTERING + SORTING
     ======================================================================== */

  function getFiltered() {
    return PRODUCTS.filter((p) => {
      if (state.productSearch) {
        const haystack = `${p.name} ${p.brand}`.toLowerCase();
        if (!haystack.includes(state.productSearch)) return false;
      }
      if (state.brands.size && !state.brands.has(p.brand)) return false;
      if (state.priceIdx.size) {
        const inRange = [...state.priceIdx].some(
          (i) => p.price >= PRICE_RANGES[i].min && p.price < PRICE_RANGES[i].max
        );
        if (!inRange) return false;
      }
      if (p.rating < state.minRating) return false;
      return true;
    }).sort((a, b) => {
      if (state.sort === "low")    return a.price - b.price;
      if (state.sort === "high")   return b.price - a.price;
      if (state.sort === "rating") return b.rating - a.rating;
      return b.reviews - a.reviews;
    });
  }

  function stars(r) {
    const full = Math.round(r);
    return '<span class="stars">' + "★".repeat(full) + "☆".repeat(5 - full) + "</span>";
  }

  /* ========================================================================
     GRID RENDER
     ======================================================================== */

  function renderGrid() {
    const grid = $("grid");
    if (!grid) return;

    const list = getFiltered();

    const rc = $("resultCount");
    if (rc) rc.textContent = list.length + " item" + (list.length === 1 ? "" : "s");

    const nr = $("noResults");
    if (nr) nr.hidden = list.length !== 0;

    const totalPages = Math.max(Math.ceil(list.length / PAGE_SIZE), 1);
    if (state.page > totalPages) state.page = totalPages;

    const start = (state.page - 1) * PAGE_SIZE;
    const pageItems = list.slice(start, start + PAGE_SIZE);

    grid.innerHTML = pageItems
      .map(
        (p) => `
        <article class="card brand-${slug(p.brand)}" data-id="${p.id}">
          <div class="card_img">
            ${p.discount ? `<span class="badge_sale">-${p.discount}%</span>` : ""}
            ${p.type !== "dumbbell" ? `<span class="badge_type">${cap(p.type)}</span>` : ""}
            <img class="prod_img" src="${p.img}" alt="${escAttr(p.name)}" loading="lazy">
            <svg class="db-illustration db-fallback" aria-hidden="true">
              <use href="#icon-dumbbell"></use>
            </svg>
            <button type="button" class="cart_icon_btn add_to_cart"
                    aria-label="Add ${escAttr(p.name)} to cart" title="Add to cart">
              <i class="fa-solid fa-cart-plus"></i>
            </button>
          </div>
          <div class="card_body">
            <div class="brand_name">${p.brand}</div>
            <h3>${p.name}</h3>
            <div class="rating">
              ${
                p.reviews
                  ? `${stars(p.rating)} ${p.rating.toFixed(1)} (${p.reviews})`
                  : `<span class="no_rating">No ratings yet</span>`
              }
            </div>
            <div class="price_row">
              <span class="price">${money(p.price)}</span>
              ${p.old ? `<span class="old_price">${money(p.old)}</span>` : ""}
            </div>
          </div>
        </article>`
      )
      .join("");

    wireImageFallbacks();
    renderPagination(list.length, totalPages);
  }

  /* ========================================================================
     PAGINATION
     ======================================================================== */

  function pageList(current, total) {
    const pages = new Set([1, total, current, current - 1, current + 1]);
    return [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  }

  function renderPagination(itemCount, totalPages) {
    const nav = $("pagination");
    if (!nav) return;

    if (itemCount === 0 || totalPages <= 1) {
      nav.hidden = true;
      nav.innerHTML = "";
      return;
    }
    nav.hidden = false;

    const pages = pageList(state.page, totalPages);
    let html = `<button type="button" class="page_btn page_arrow"
                        data-page="${state.page - 1}"
                        ${state.page === 1 ? "disabled" : ""}
                        aria-label="Previous page">&lt;</button>`;

    let prev = 0;
    pages.forEach((n) => {
      if (prev && n - prev > 1) html += `<span class="page_ellipsis">...</span>`;
      html += `<button type="button"
                        class="page_btn ${n === state.page ? "active" : ""}"
                        data-page="${n}"
                        ${n === state.page ? 'aria-current="page"' : ""}>${n}</button>`;
      prev = n;
    });

    html += `<button type="button" class="page_btn page_arrow"
                      data-page="${state.page + 1}"
                      ${state.page === totalPages ? "disabled" : ""}
                      aria-label="Next page">&gt;</button>`;

    nav.innerHTML = html;
  }

  on("pagination", "click", (e) => {
    const btn = e.target.closest(".page_btn");
    if (!btn || btn.disabled) return;

    const page = Number(btn.dataset.page);
    if (!page || page === state.page) return;

    state.page = page;
    renderGrid();

    const main = document.querySelector("main");
    if (main) main.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* ========================================================================
     IMAGE FALLBACK
     ======================================================================== */

  function wireImageFallbacks() {
    document.querySelectorAll(".prod_img").forEach((img) => {
      img.addEventListener(
        "error",
        () => img.closest(".card_img")?.classList.add("img-error"),
        { once: true }
      );
    });
  }

  /* ========================================================================
     CART
     ======================================================================== */

  function loadCart() {
    try {
      const c = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(c) ? c : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {}
  }

  function updateNavBadge() {
    const cart = loadCart();
    const count = cart.reduce((n, i) => n + i.qty, 0);

    const badge = $("cartCount");
    if (badge) badge.textContent = count;
  }
  updateNavBadge();

  /* ========================================================================
     TOAST
     ======================================================================== */

  function showToast(msg) {
    const t = $("toast");
    if (!t) return;
    t.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${msg}`;
    t.classList.add("show");
    clearTimeout(showToast._tid);
    showToast._tid = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ========================================================================
     ADD TO CART  (uses window.KenovaCart sidebar)
     ======================================================================== */

  function addToCart(product, btn) {
    if (window.KenovaCart) {
      window.KenovaCart.add({
        id: product.id,
        name: product.name,
        price: product.price,
        old: product.old || 0,
        discount: product.discount || 0,
        img: product.img,
      });
    } else {
      const cart = loadCart();
      const existing = cart.find((i) => i.id === product.id);
      if (existing) existing.qty += 1;
      else cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        old: product.old || 0,
        discount: product.discount || 0,
        qty: 1,
        img: product.img,
      });
      saveCart(cart);
      updateNavBadge();
      showToast(`Added "${product.name}" to cart`);
    }

    if (btn) {
      btn.classList.add("added");
      btn.innerHTML = '<i class="fa-solid fa-check"></i>';
      setTimeout(() => {
        btn.classList.remove("added");
        btn.innerHTML = '<i class="fa-solid fa-cart-plus"></i>';
      }, 1200);
    }
  }

  on("grid", "click", (e) => {
    const btn = e.target.closest(".add_to_cart");
    if (!btn) return;

    const card = e.target.closest(".card");
    if (!card) return;

    const product = PRODUCTS.find((p) => p.id === Number(card.dataset.id));
    if (product) addToCart(product, btn);
  });

  /* ========================================================================
     INITIAL RENDER
     ======================================================================== */

  renderGrid();
});