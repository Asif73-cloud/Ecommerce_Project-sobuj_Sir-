 /* ==========================================================================
   Kenova - Cart Sidebar (Auto-inject version)
   Uses "kenova-cart" as the single cart storage key.
   ========================================================================== */

(function () {
  const CART_KEY = "kenova-cart";

  /* ---------- Helpers ---------- */
  function loadCart() {
    try {
      const c = JSON.parse(localStorage.getItem(CART_KEY));
      return Array.isArray(c) ? c : [];
    } catch (e) { return []; }
  }

  function saveCart(cart) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  }

  const esc = (v) => String(v == null ? "" : v)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const money = (n) => "৳" + Math.round(n).toLocaleString("en-US") + ".00";

  /* ---------- Inject sidebar HTML if missing ---------- */
  function injectSidebar() {
    if (document.getElementById("cartPanel")) return;

    const panelHTML = `
      <div class="cart-overlay" id="cartOverlay"></div>

      <aside class="cart-panel" id="cartPanel" aria-label="Shopping cart">
        <div class="cart-panel-header">
          <div class="cart-panel-header-left">
            <span class="cart-panel-icon">
              <i class="fa-solid fa-bag-shopping"></i>
            </span>
            <div>
              <h2>Shopping Cart</h2>
              <p class="cart-panel-count"><span id="cartItemCount">0</span> items</p>
            </div>
          </div>
          <button type="button" class="cart-panel-close" id="closeCart" aria-label="Close cart">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="cart-panel-body" id="cartItems"></div>

        <div class="cart-panel-footer">
          <div class="cart-row cart-row-savings">
            <span>Total Savings</span>
            <span id="cartSavings">-৳0.00</span>
          </div>
          <div class="cart-row cart-row-total">
            <span>Total</span>
            <span id="cartTotal">৳0.00</span>
          </div>
          <a href="checkout.html" class="cart-checkout">
            Proceed to Checkout <i class="fa-solid fa-arrow-right"></i>
          </a>
          <a href="#" class="cart-continue" id="continueShopping">Continue Shopping</a>
        </div>
      </aside>
    `;

    const wrapper = document.createElement("div");
    wrapper.innerHTML = panelHTML;
    while (wrapper.firstChild) {
      document.body.appendChild(wrapper.firstChild);
    }
  }

  /* ---------- Main ---------- */
  document.addEventListener("DOMContentLoaded", () => {

    injectSidebar();

    const panel       = document.getElementById("cartPanel");
    const overlay     = document.getElementById("cartOverlay");
    const closeBtn    = document.getElementById("closeCart");
    const continueBtn = document.getElementById("continueShopping");
    const cartIcon    = document.getElementById("cartIcon");
    const itemsList   = document.getElementById("cartItems");
    const countEl     = document.getElementById("cartItemCount");
    const savingsEl   = document.getElementById("cartSavings");
    const totalEl     = document.getElementById("cartTotal");

    if (!panel) return;

    /* ---------- Open / Close ---------- */
    function openCart() {
      panel.classList.add("open");
      overlay?.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeCart() {
      panel.classList.remove("open");
      overlay?.classList.remove("active");
      document.body.style.overflow = "";
    }

    cartIcon?.addEventListener("click", (e) => { e.preventDefault(); openCart(); });
    closeBtn?.addEventListener("click", closeCart);
    overlay?.addEventListener("click", closeCart);
    continueBtn?.addEventListener("click", (e) => { e.preventDefault(); closeCart(); });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeCart();
    });

    /* ---------- Render cart items ---------- */
    function renderCart() {
      const cart = loadCart();

      if (!cart.length) {
        itemsList.innerHTML = `
          <p style="text-align:center;color:#9ca3af;font-size:14px;padding:40px 0;">
            Your cart is empty.
          </p>`;
      } else {
        itemsList.innerHTML = cart.map((item) => `
          <article class="cart-item" data-id="${esc(item.id)}">
            <div class="cart-item-media">
              ${item.discount ? `<span class="cart-item-discount">-${item.discount}%</span>` : ""}
              <img src="${esc(item.img || '')}" alt="${esc(item.name)}"
                   onerror="this.outerHTML='<div style=&quot;width:100%;height:100%;display:grid;place-items:center;background:#fce4ec;color:#c2185b;font-size:28px;&quot;><i class=&quot;fa-solid fa-box&quot;></i></div>'">
            </div>
            <div class="cart-item-info">
              <h3 class="cart-item-title">${esc(item.name)}</h3>
              <p class="cart-item-sku">SKU: WOO-${esc(item.id)}</p>
              <div class="cart-item-price-row">
                <span class="cart-item-price">${money(item.price)}</span>
                ${item.old ? `<span class="cart-item-old">${money(item.old)}</span>` : ""}
              </div>
              <div class="cart-item-controls">
                <div class="qty">
                  <button type="button" class="qty-btn" data-action="dec">−</button>
                  <input type="text" class="qty-value" value="${item.qty}" readonly>
                  <button type="button" class="qty-btn" data-action="inc">+</button>
                </div>
                <button type="button" class="cart-item-remove">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </div>
            <div class="cart-item-total">
              <span class="cart-item-total-price">${money(item.price * item.qty)}</span>
              ${item.old ? `<span class="cart-item-saved">Saved ${money((item.old - item.price) * item.qty)}</span>` : ""}
            </div>
          </article>
        `).join("");
      }

      updateTotals();
      updateBadge();
    }

    function updateTotals() {
      const cart = loadCart();
      let total = 0, savings = 0, qty = 0;

      cart.forEach((i) => {
        total   += i.price * i.qty;
        savings += ((i.old || i.price) - i.price) * i.qty;
        qty     += i.qty;
      });

      if (totalEl)   totalEl.textContent   = money(total);
      if (savingsEl) savingsEl.textContent = "-" + money(savings);
      if (countEl)   countEl.textContent   = qty;
    }

    function updateBadge() {
      const cart = loadCart();
      const qty = cart.reduce((n, i) => n + i.qty, 0);
      document.querySelectorAll(".cart-count, #cartCount").forEach((el) => {
        el.textContent = qty;
      });
    }

    /* ---------- Quantity & Remove ---------- */
    itemsList.addEventListener("click", (e) => {
      const card = e.target.closest(".cart-item");
      if (!card) return;

      const id = Number(card.dataset.id);
      const cart = loadCart();
      const item = cart.find((i) => i.id === id);
      if (!item) return;

      const qtyBtn = e.target.closest(".qty-btn");
      if (qtyBtn) {
        if (qtyBtn.dataset.action === "inc") item.qty += 1;
        else item.qty = Math.max(1, item.qty - 1);
        saveCart(cart);
        renderCart();
        return;
      }

      const removeBtn = e.target.closest(".cart-item-remove");
      if (removeBtn) {
        saveCart(cart.filter((i) => i.id !== id));
        renderCart();
      }
    });

    /* ---------- Public API ---------- */
    window.KenovaCart = {
      open: openCart,
      close: closeCart,
      add(product) {
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
          img: product.img || '',
        });

        saveCart(cart);
        renderCart();
        openCart();
      }
    };

    /* ---------- Sync across tabs ---------- */
    window.addEventListener("storage", (e) => {
      if (e.key === CART_KEY) renderCart();
    });

    renderCart();
  });
})();