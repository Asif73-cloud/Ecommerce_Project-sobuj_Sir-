 /* ==========================================================================
   Kenova - Mega Menu (interactive)
   - Click a category       → open its panel (ad hides)
   - Click same category    → close the panel (ad returns)   ← the toggle
   - Click different one    → switch panels
   - Click outside / Esc    → close everything (ad returns)
   - Hover a category (desktop) → temporary preview
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const items    = document.querySelectorAll(".category-item");
  const panels   = document.querySelectorAll(".category-content");
  const megaMenu = document.querySelector(".mega-menu");
  const ad       = document.getElementById("megaAd");

  if (!items.length || !panels.length) {
    console.warn("Mega menu: missing .category-item or .category-content");
    return;
  }

  /* ---------------- Helpers ---------------- */

  const isOpen = (panel) => panel && !panel.hidden;

  function hidePanel(panel) {
    if (!panel) return;
    panel.hidden = true;
    panel.style.display = "none";
  }

  function showPanel(panel) {
    if (!panel) return;
    panel.hidden = false;
    panel.style.display = "grid";     /* .mega-content is a grid */
  }

  function showAd() {
    if (!ad) return;
    ad.hidden = false;
    ad.style.display = "flex";        /* .mega-ad is a flex column */
  }

  function hideAd() {
    if (!ad) return;
    ad.hidden = true;
    ad.style.display = "none";
  }

  /** Close all panels + unhighlight items + show the ad. */
  function closeAll() {
    items.forEach((i) => i.classList.remove("active"));
    panels.forEach(hidePanel);
    showAd();
  }

  /** Open a specific item's panel and hide the ad. */
  function openItem(item, panel) {
    closeAll();
    item.classList.add("active");
    showPanel(panel);
    hideAd();
  }

  /* ---------------- Initial state: ad visible, panels closed ---------------- */

  closeAll();

  /* ---------------- Click on a category ---------------- */

  items.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.stopPropagation();

      const target = document.getElementById(item.dataset.category + "-content");
      if (!target) return;

      /* ⬇️ ⬇️  TOGGLE: same category already open? → close + show ad  */
      if (item.classList.contains("active") && isOpen(target)) {
        closeAll();
        return;
      }

      /* Otherwise: open the clicked one */
      openItem(item, target);
    });
  });

  /* ---------------- Hover preview (desktop only) ---------------- */

  const canHover = window.matchMedia("(hover: hover)").matches;

  if (canHover && megaMenu) {
    items.forEach((item) => {
      item.addEventListener("mouseenter", () => {
        /* If a category is actively clicked, don't fight the click */
        if (document.querySelector(".category-item.active")) return;

        const target = document.getElementById(item.dataset.category + "-content");
        if (!target) return;

        panels.forEach(hidePanel);
        showPanel(target);
        hideAd();
      });
    });

    /* When mouse leaves the mega-menu, reset to the ad view */
    megaMenu.addEventListener("mouseleave", () => {
      if (document.querySelector(".category-item.active")) return;
      closeAll();
    });
  }

  /* ---------------- Click outside → close + show ad ---------------- */

  document.addEventListener("click", (e) => {
    if (megaMenu && !megaMenu.contains(e.target)) closeAll();
  });

  /* ---------------- Escape key → close + show ad ---------------- */

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });

  /* ---------------- Keyboard navigation ---------------- */

  items.forEach((item, idx) => {
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    item.setAttribute("aria-expanded", "false");

    item.addEventListener("keydown", (e) => {
      const total = items.length;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(idx + 1) % total].focus();
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(idx - 1 + total) % total].focus();
      }

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        item.click();
      }
    });
  });

  /* ---------------- Keep aria-expanded in sync ---------------- */

  function syncAria() {
    items.forEach((item) => {
      const target = document.getElementById(item.dataset.category + "-content");
      item.setAttribute("aria-expanded", isOpen(target) ? "true" : "false");
    });
  }

  syncAria();
  document.addEventListener("click", syncAria);
  document.addEventListener("keyup", syncAria);
});