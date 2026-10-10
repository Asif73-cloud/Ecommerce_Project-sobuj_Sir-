 /* ==========================================================================
   Kenova - search.js (Enhanced v4 — safe version)
   Live suggestions, keyboard nav, recent searches history,
   highlight matched term, "See all results".
   Works even if api.js fails to load.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  const searchInput = document.getElementById("searchInput");
  const searchForm = document.getElementById("searchForm");
  const searchClear = document.getElementById("searchClear");
  const suggestions = document.getElementById("searchSuggestions");
  const productSection = document.getElementById("productSection");
  const productList = document.getElementById("productList");
  const noResults = document.getElementById("noResults");
  const noResultsTerm = document.getElementById("noResultsTerm");

  if (!searchInput || !suggestions) {
    console.warn("[Search] searchInput or searchSuggestions not found");
    return;
  }

  let allProducts = [];
  let activeIndex = -1;
  let isLoaded = false;
  let debounceTimer = null;
  let searchHistory = loadHistory();

  /* ==========================================================
     HISTORY
     ========================================================== */
  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem("kenova-search-history") || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveHistory(term) {
    if (!term) return;
    const trimmed = String(term).trim();
    if (!trimmed || trimmed.length < 2) return;

    searchHistory = [trimmed, ...searchHistory.filter(t => t !== trimmed)].slice(0, 6);
    try {
      localStorage.setItem("kenova-search-history", JSON.stringify(searchHistory));
    } catch (e) { /* ignore */ }
  }

  function removeHistoryItem(term) {
    searchHistory = searchHistory.filter(t => t !== term);
    try {
      localStorage.setItem("kenova-search-history", JSON.stringify(searchHistory));
    } catch (e) { /* ignore */ }

    if (searchHistory.length) {
      renderRecentSearches();
    } else {
      hideSuggestions();
    }
  }

  function clearHistory() {
    searchHistory = [];
    try {
      localStorage.removeItem("kenova-search-history");
    } catch (e) { /* ignore */ }
    hideSuggestions();
  }

  /* ==========================================================
     LOAD PRODUCTS — safe version (no await, no crash)
     ========================================================== */
  function loadProductsForSearch() {
    // 1. Try cache from home.js
    if (window.__kenovaProducts && Array.isArray(window.__kenovaProducts) && window.__kenovaProducts.length) {
      allProducts = window.__kenovaProducts;
      isLoaded = true;
      console.log("[Search] Loaded from cache:", allProducts.length);
      return;
    }

    // 2. Try localStorage cache
    try {
      const cached = JSON.parse(localStorage.getItem("kenova-products-cache") || "[]");
      if (cached.length) {
        allProducts = cached;
        isLoaded = true;
        console.log("[Search] Loaded from localStorage:", allProducts.length);
      }
    } catch (e) { /* ignore */ }

    // 3. Try API if available (non-blocking, non-crashing)
    if (typeof api === "function") {
      try {
        api("/products?limit=2000")
          .then(data => {
            if (data && Array.isArray(data.products) && data.products.length) {
              allProducts = data.products.map(p => ({
                id: p.id,
                name: p.name || "",
                brand: p.brand_name || p.brand || "",
                category: p.category || "",
                price: Number(p.discount_price || p.price) || 0,
                image: p.image || "",
              }));
              isLoaded = true;
              try {
                localStorage.setItem("kenova-products-cache", JSON.stringify(allProducts.slice(0, 500)));
              } catch (e) {}
              console.log("[Search] Loaded from API:", allProducts.length);
            }
          })
          .catch(err => console.warn("[Search] API failed:", err.message));
      } catch (e) {
        console.warn("[Search] API call error:", e.message);
      }
    } else {
      console.warn("[Search] api() function not available — using fallback");
    }

    // 4. Fallback demo data (always available)
    if (!allProducts.length) {
      allProducts = [
        { id: 1,  name: "Xiaomi Mi Colorful Mini Backpack", brand: "Xiaomi", category: "mens-fashion", price: 750,   image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100" },
        { id: 2,  name: "WIWU Alpha Tech Pouch",             brand: "WIWU",   category: "mens-fashion", price: 1050,  image: "https://images.unsplash.com/photo-1605733513597-a8c9c9b1b6c6?w=100" },
        { id: 3,  name: "Xiaomi Business Backpack 2",         brand: "Xiaomi", category: "mens-fashion", price: 2380,  image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100" },
        { id: 4,  name: "Xiaomi Mi Urban Backpack",           brand: "Xiaomi", category: "mens-fashion", price: 3350,  image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100" },
        { id: 5,  name: "Arctic Hunter Tough Backpack",       brand: "Arctic Hunter", category: "mens-fashion", price: 4200, image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100" },
        { id: 111, name: "Xiaomi Redmi Note 13",              brand: "Xiaomi", category: "electronics", price: 22500, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100" },
        { id: 115, name: "Gaming Laptop RTX 4060",            brand: "Lenovo", category: "electronics", price: 125000,image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100" },
        { id: 116, name: "Business Laptop i5 12th Gen",       brand: "HP",     category: "electronics", price: 75000, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=100" },
      ];
      isLoaded = true;
      console.log("[Search] Loaded fallback demo:", allProducts.length);
    }
  }

  // Load immediately
  loadProductsForSearch();

  /* ==========================================================
     FIND PRODUCTS
     ========================================================== */
  function findProducts(term) {
    if (!term || term.length < 1) return [];

    const lower = term.toLowerCase().trim();
    const words = lower.split(/\s+/).filter(Boolean);

    const scored = allProducts.map((p) => {
      const name = (p.name || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const category = (p.category || "").toLowerCase();
      const combined = `${name} ${brand} ${category}`;

      const allWordsMatch = words.every((w) => combined.includes(w));
      if (!allWordsMatch) return null;

      let score = 0;
      if (name.startsWith(lower)) score += 100;
      if (new RegExp(`\\b${escapeRegex(lower)}`, "i").test(name)) score += 50;
      if (name.includes(lower)) score += 30;
      if (brand.includes(lower)) score += 20;
      if (category.includes(lower)) score += 10;
      score += Math.max(0, 20 - name.length / 10);

      return { ...p, _score: score };
    }).filter(Boolean);

    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, 8);
  }

  /* ==========================================================
     RENDER PRODUCT SUGGESTIONS
     ========================================================== */
  function renderProducts(products, term) {
    const historySection = document.getElementById("historySection");
    if (historySection) historySection.hidden = true;

    if (!products.length) {
      productSection.hidden = true;
      noResults.hidden = false;
      if (noResultsTerm) noResultsTerm.textContent = term;
      showSuggestions();
      return;
    }

    productSection.hidden = false;
    noResults.hidden = true;

    const html = products.map((p) => `
      <li class="suggestion-item" data-id="${p.id}" role="option" tabindex="-1">
        <div class="suggestion-thumb">
          <img src="${p.image || 'images/kanovalogo.png'}"
               alt=""
               loading="lazy"
               onerror="this.src='images/kanovalogo.png'">
        </div>
        <div class="suggestion-info">
          <div class="suggestion-text">${highlightTerm(p.name, term)}</div>
          <div class="suggestion-meta">
            ${p.brand ? `<span class="suggestion-brand">${highlightTerm(p.brand, term)}</span>` : ""}
            ${p.category ? `<span class="suggestion-cat">${highlightTerm(p.category, term)}</span>` : ""}
          </div>
        </div>
        <div class="suggestion-price">৳${p.price.toLocaleString("en-BD")}</div>
        <i class="fa-solid fa-arrow-right suggestion-arrow" aria-hidden="true"></i>
      </li>
    `).join("");

    const footer = `
      <li class="suggestion-see-all" data-see-all="1" role="option" tabindex="-1">
        <i class="fa-solid fa-magnifying-glass"></i>
        See all results for "<strong>${escapeHtml(term)}</strong>"
        <i class="fa-solid fa-arrow-right"></i>
      </li>
    `;

    productList.innerHTML = html + footer;

    productList.querySelectorAll(".suggestion-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = item.dataset.id;
        if (id) {
          saveHistory(term);
          window.location.href = `product-details.html?id=${id}`;
        }
      });

      item.addEventListener("mouseenter", () => {
        productList.querySelectorAll(".suggestion-item, .suggestion-see-all")
          .forEach((el) => el.classList.remove("active"));
        item.classList.add("active");
        activeIndex = Array.from(productList.children).indexOf(item);
      });
    });

    const seeAll = productList.querySelector(".suggestion-see-all");
    if (seeAll) {
      seeAll.addEventListener("click", (e) => {
        e.preventDefault();
        saveHistory(term);
        hideSuggestions();
        submitSearch();
      });
    }

    showSuggestions();
  }

  /* ==========================================================
     RENDER RECENT SEARCHES
     ========================================================== */
  function renderRecentSearches() {
    if (!searchHistory.length) {
      hideSuggestions();
      return;
    }

    productSection.hidden = true;
    noResults.hidden = true;

    let historySection = document.getElementById("historySection");
    if (!historySection) {
      historySection = document.createElement("div");
      historySection.className = "suggestions-section";
      historySection.id = "historySection";
      historySection.innerHTML = `<ul class="suggestions-list" id="historyList"></ul>`;
      suggestions.insertBefore(historySection, suggestions.firstChild);
    }
    historySection.hidden = false;

    const historyList = document.getElementById("historyList");
    historyList.innerHTML = `
      <li class="suggestion-history-header">
        <span>Recent searches</span>
        <button type="button" class="history-clear-all" id="historyClearAll">
          Clear all
        </button>
      </li>
      ${searchHistory.map(term => `
        <li class="suggestion-item suggestion-history" data-term="${escapeHtml(term)}" role="option" tabindex="-1">
          <div class="suggestion-history-icon">
            <i class="fas fa-history"></i>
          </div>
          <div class="suggestion-info">
            <div class="suggestion-text">${escapeHtml(term)}</div>
          </div>
          <button type="button" class="history-remove" data-remove-term="${escapeHtml(term)}" aria-label="Remove">
            <i class="fas fa-times"></i>
          </button>
          <i class="fa-solid fa-arrow-right suggestion-arrow"></i>
        </li>
      `).join("")}
    `;

    historyList.querySelectorAll(".suggestion-history").forEach(item => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        if (e.target.closest(".history-remove")) return;

        const term = item.dataset.term;
        searchInput.value = term;
        if (searchClear) searchClear.hidden = false;

        const products = findProducts(term);
        renderProducts(products, term);
        activeIndex = -1;
      });

      item.addEventListener("mouseenter", () => {
        historyList.querySelectorAll(".suggestion-item").forEach(el => el.classList.remove("active"));
        item.classList.add("active");
      });
    });

    historyList.querySelectorAll(".history-remove").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeHistoryItem(btn.dataset.removeTerm);
      });
    });

    document.getElementById("historyClearAll")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      clearHistory();
    });

    showSuggestions();
  }

  /* ==========================================================
     HIGHLIGHT
     ========================================================== */
  function highlightTerm(text, term) {
    const escaped = escapeHtml(text);
    if (!term) return escaped;

    const words = term.split(/\s+/).filter(Boolean);
    let result = escaped;

    words.forEach((word) => {
      const regex = new RegExp(`(${escapeRegex(word)})`, "gi");
      result = result.replace(regex, "<strong>$1</strong>");
    });

    return result;
  }

  /* ==========================================================
     HELPERS
     ========================================================== */
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function showSuggestions() {
    suggestions.hidden = false;
    searchInput.setAttribute("aria-expanded", "true");
  }

  function hideSuggestions() {
    suggestions.hidden = true;
    activeIndex = -1;
    searchInput.setAttribute("aria-expanded", "false");
    productList?.querySelectorAll(".suggestion-item, .suggestion-see-all")
      .forEach((el) => el.classList.remove("active"));
  }

  /* ==========================================================
     INPUT
     ========================================================== */
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.trim();
    if (searchClear) searchClear.hidden = term.length === 0;

    if (!isLoaded) loadProductsForSearch();

    if (term.length < 1) {
      renderRecentSearches();
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const products = findProducts(term);
      renderProducts(products, term);
      activeIndex = -1;
    }, 150);
  });

  /* ==========================================================
     CLEAR
     ========================================================== */
  searchClear?.addEventListener("click", (e) => {
    e.preventDefault();
    searchInput.value = "";
    searchClear.hidden = true;
    renderRecentSearches();
    searchInput.focus();
  });

  /* ==========================================================
     FOCUS
     ========================================================== */
  searchInput.addEventListener("focus", () => {
    const term = searchInput.value.trim();

    if (term.length >= 1) {
      const products = findProducts(term);
      renderProducts(products, term);
    } else {
      renderRecentSearches();
    }
  });

  /* ==========================================================
     BLUR
     ========================================================== */
  searchInput.addEventListener("blur", () => {
    setTimeout(() => hideSuggestions(), 220);
  });

  /* ==========================================================
     KEYBOARD NAVIGATION
     ========================================================== */
  searchInput.addEventListener("keydown", (e) => {
    const historyItems = Array.from(
      document.querySelectorAll("#historyList .suggestion-history") || []
    );
    const isHistoryVisible =
      document.getElementById("historySection")?.hidden === false;

    const productItems = Array.from(
      productList?.querySelectorAll(".suggestion-item, .suggestion-see-all") || []
    );

    const activeList = isHistoryVisible && !searchInput.value.trim()
      ? historyItems
      : productItems;

    if (!activeList.length) {
      if (e.key === "Enter") {
        e.preventDefault();
        submitSearch();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % activeList.length;
      updateActive(activeList);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + activeList.length) % activeList.length;
      updateActive(activeList);
    } else if (e.key === "Enter") {
      e.preventDefault();

      if (activeIndex >= 0 && activeList[activeIndex]) {
        const el = activeList[activeIndex];
        const id = el.dataset.id;
        const histTerm = el.dataset.term;

        if (id) {
          saveHistory(searchInput.value.trim());
          window.location.href = `product-details.html?id=${id}`;
        } else if (histTerm) {
          searchInput.value = histTerm;
          if (searchClear) searchClear.hidden = false;
          const products = findProducts(histTerm);
          renderProducts(products, histTerm);
          activeIndex = -1;
        } else {
          saveHistory(searchInput.value.trim());
          submitSearch();
        }
      } else {
        saveHistory(searchInput.value.trim());
        submitSearch();
      }
    } else if (e.key === "Escape") {
      hideSuggestions();
      searchInput.blur();
    }
  });

  function updateActive(items) {
    items.forEach((item, i) => {
      item.classList.toggle("active", i === activeIndex);
      if (i === activeIndex) {
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  }

  /* ==========================================================
     CLICK OUTSIDE
     ========================================================== */
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".search-wrapper")) {
      hideSuggestions();
    }
  });

  /* ==========================================================
     FORM SUBMIT
     ========================================================== */
  searchForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    saveHistory(searchInput.value.trim());
    submitSearch();
  });

  function submitSearch() {
    const term = searchInput.value.trim();
    if (!term) return;

    hideSuggestions();
    searchInput.dispatchEvent(new Event("input"));

    const productsArea = document.querySelector(".products-area, .products-section, .shop-main");
    if (productsArea) {
      productsArea.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /* ==========================================================
     ARIA
     ========================================================== */
  searchInput.setAttribute("role", "combobox");
  searchInput.setAttribute("aria-autocomplete", "list");
  searchInput.setAttribute("aria-expanded", "false");
  searchInput.setAttribute("aria-controls", "searchSuggestions");
  suggestions.setAttribute("role", "listbox");
});