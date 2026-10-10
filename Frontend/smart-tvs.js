/* ==========================================================================
   Kenova - Smart TVs page logic
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

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

  /* ---------- SMART TV IMAGES ---------- */
  const IMG = {
    1:  "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=600&h=600&fit=crop",
    2:  "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop",
    3:  "https://images.unsplash.com/photo-1571415066777-95ba2b4e3c58?w=600&h=600&fit=crop",
    4:  "https://images.unsplash.com/photo-1522869635100-9f4c5e86b7ca?w=600&h=600&fit=crop",
    5:  "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop",
    6:  "https://images.unsplash.com/photo-1552975084-6e027cd345c2?w=600&h=600&fit=crop",
    7:  "https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=600&h=600&fit=crop",
    8:  "https://images.unsplash.com/photo-1601944177664-b5a5c3a2b4f8?w=600&h=600&fit=crop",
    9:  "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=600&fit=crop",
    10: "https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=600&h=600&fit=crop",
    11: "https://images.unsplash.com/photo-1615986201152-7686a4867f30?w=600&h=600&fit=crop",
    12: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&h=600&fit=crop",
    13: "https://images.unsplash.com/photo-1567690187548-f07b1d7bf5a9?w=600&h=600&fit=crop",
    14: "https://images.unsplash.com/photo-1601944177664-b5a5c3a2b4f8?w=600&h=600&fit=crop",
    15: "https://images.unsplash.com/photo-1552975084-6e027cd345c2?w=600&h=600&fit=crop",
    16: "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=600&h=600&fit=crop",
  };

  /* ---------- DATA ---------- */
  const RAW = [
    { b: "Samsung",   n: 'Samsung 43" Smart LED TV UA43T5400',    p: 42500, o: 48000, d: 11, r: 5, c: 12, t: "smart", img: IMG[1]  },
    { b: "Samsung",   n: 'Samsung 50" Smart LED TV UA50T5300',    p: 55900, o: 62000, d: 10, r: 5, c: 8,  t: "smart", img: IMG[2]  },
    { b: "Samsung",   n: 'Samsung 55" Crystal UHD Smart TV',      p: 79900, o: 92000, d: 13, r: 5, c: 6,  t: "smart", img: IMG[3]  },
    { b: "LG",        n: 'LG 43" Smart LED TV 43LM6300',          p: 38900, o: 45000, d: 14, r: 5, c: 9,  t: "smart", img: IMG[4]  },
    { b: "LG",        n: 'LG 50" 4K UHD Smart LED TV',            p: 62900, o: 75000, d: 16, r: 5, c: 4,  t: "smart", img: IMG[5]  },
    { b: "LG",        n: 'LG 55" NanoCell Smart TV',              p: 89900, o: 105000, d: 14, r: 5, c: 3,  t: "smart", img: IMG[6]  },
    { b: "Sony",      n: 'Sony Bravia 43" Smart LED TV',          p: 58900, o: 68000, d: 13, r: 5, c: 11, t: "smart", img: IMG[7]  },
    { b: "Sony",      n: 'Sony Bravia 50" 4K Smart TV',           p: 84900, o: 95000, d: 11, r: 5, c: 5,  t: "smart", img: IMG[8]  },
    { b: "Xiaomi",    n: 'Xiaomi Mi TV 4A Pro 43" Smart LED',     p: 34500, o: 40000, d: 14, r: 4, c: 10, t: "smart", img: IMG[9]  },
    { b: "Xiaomi",    n: 'Xiaomi Mi TV P1 55" 4K Smart TV',       p: 64900, o: 75000, d: 13, r: 4, c: 7,  t: "smart", img: IMG[10] },
    { b: "TCL",       n: 'TCL 43" Smart LED TV 43P615',           p: 33500, o: 39000, d: 14, r: 4, c: 8,  t: "smart", img: IMG[11] },
    { b: "TCL",       n: 'TCL 50" 4K Smart TV 50P615',            p: 49500, o: 57000, d: 13, r: 4, c: 5,  t: "smart", img: IMG[12] },
    { b: "Walton",    n: 'Walton 43" Full HD Smart LED TV',       p: 32900, o: 38000, d: 13, r: 4, c: 12, t: "smart", img: IMG[13] },
    { b: "Walton",    n: 'Walton 55" 4K Smart LED TV',            p: 69900, o: 79000, d: 12, r: 4, c: 6,  t: "smart", img: IMG[14] },
    { b: "Panasonic", n: 'Panasonic 43" Smart LED TV TH43GX600',  p: 44900, o: 52000, d: 14, r: 4, c: 4,  t: "smart", img: IMG[15] },
    { b: "Panasonic", n: 'Panasonic 55" 4K Smart LED TV',         p: 84900, o: 95000, d: 11, r: 5, c: 3,  t: "smart", img: IMG[16] },
  ];

  const PRODUCTS = RAW.map((x, i) => ({
    id: 5500 + i,
    brand: x.b,
    name: x.n,
    price: x.p,
    old: x.o || 0,
    discount: x.d || (x.o ? Math.round((1 - x.p / x.o) * 100) : 0),
    rating: x.r || 0,
    reviews: x.c || 0,
    type: x.t || "smart",
    img: x.img,
  }));

  /* ---------- Filter configuration ---------- */
  const PRICE_RANGES = [
    { label: "Under ৳40,000",     min: 0,     max: 40000 },
    { label: "৳40,000 - ৳60,000", min: 40000, max: 60000 },
    { label: "৳60,000 - ৳80,000", min: 60000, max: 80000 },
    { label: "৳80,000 - ৳100,000",min: 80000, max: 100000 },
    { label: "৳100,000 & above",  min: 100000, max: Infinity },
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

  /* ---------- Sidebar: brands ---------- */
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

  /* ---------- Filter events ---------- */
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

  /* ---------- Filtering + sorting ---------- */
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

  /* ---------- Grid render ---------- */
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
            ${p.type ? `<span class="badge_type">${cap(p.type)}</span>` : ""}
            <img class="prod_img" src="${p.img}" alt="${escAttr(p.name)}" loading="lazy">
            <svg class="tv-illustration tv-fallback" aria-hidden="true">
              <use href="#icon-ledtv"></use>
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

  /* ---------- Pagination ---------- */
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

  /* ---------- Image fallback ---------- */
  function wireImageFallbacks() {
    document.querySelectorAll(".prod_img").forEach((img) => {
      img.addEventListener(
        "error",
        () => img.closest(".card_img")?.classList.add("img-error"),
        { once: true }
      );
    });
  }

  /* ---------- Cart ---------- */
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

  /* ---------- Toast ---------- */
  function showToast(msg) {
    const t = $("toast");
    if (!t) return;
    t.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${msg}`;
    t.classList.add("show");
    clearTimeout(showToast._tid);
    showToast._tid = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------- Add to cart ---------- */
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
      else
        cart.push({
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

  /* ---------- Initial render ---------- */
  renderGrid();
});