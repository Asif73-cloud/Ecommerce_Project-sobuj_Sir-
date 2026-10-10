 /* ==========================================================================
   Kenova - profile.js (Backend Connected + FIXED Wishlist Key)
   Handles: user profile load/update, avatar upload, tabs, stats, orders
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  /* ========================================================================
     1. CHECK AUTHENTICATION
     ======================================================================== */
  const token = localStorage.getItem("kenova-token") || localStorage.getItem("token");
  const localUser = JSON.parse(localStorage.getItem("kenova-user") || "null");

  if (!token || !localUser || !localUser.isLoggedIn) {
    window.location.href = "login.html";
    return;
  }

  /* ========================================================================
     2. LOAD USER DATA FROM BACKEND
     ======================================================================== */
  let user = localUser;

  try {
    const data = await api("/users/profile");
    if (data.success) {
      user = { ...data.user, isLoggedIn: true };
      localStorage.setItem("kenova-user", JSON.stringify(user));
    }
  } catch (err) {
    console.warn("Using cached user data:", err.message);
  }

  /* ========================================================================
     3. FILL PROFILE HERO
     ======================================================================== */
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
  const heroName = document.getElementById("heroName");
  const heroEmail = document.getElementById("heroEmail");
  const heroImg = document.getElementById("heroAvatarImg");

  if (heroName) heroName.textContent = fullName;
  if (heroEmail) heroEmail.textContent = user.email || "";

  const initials = `${(user.firstName || "U")[0] || ""}${(user.lastName || "")[0] || ""}`.toUpperCase();

  if (heroImg) {
    if (user.avatar) {
      heroImg.src = user.avatar;
    } else {
      heroImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=c2185b&color=fff&size=200`;
    }
  }

  /* ========================================================================
     4. AVATAR UPLOAD
     ======================================================================== */
  const avatarEditBtn = document.querySelector(".avatar-edit");
  if (avatarEditBtn && heroImg) {
    avatarEditBtn.addEventListener("click", () => {
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";

      fileInput.addEventListener("change", async (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
          showToast("Image must be smaller than 2MB", "error");
          return;
        }

        const reader = new FileReader();
        reader.onload = async (ev) => {
          const base64 = ev.target.result;
          heroImg.src = base64;

          try {
            await api("/users/profile", {
              method: "PUT",
              body: JSON.stringify({ avatar: base64 })
            });
            user.avatar = base64;
            localStorage.setItem("kenova-user", JSON.stringify(user));
            showToast("Profile picture updated!", "success");
          } catch (err) {
            showToast("Failed to save avatar", "error");
          }
        };
        reader.readAsDataURL(file);
      });

      fileInput.click();
    });
  }

  /* ========================================================================
     5. FILL PERSONAL INFO FORM
     ======================================================================== */
  const setVal = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
  };

  setVal("firstName", user.firstName);
  setVal("lastName", user.lastName);
  setVal("email", user.email);
  setVal("phone", user.phone);
  setVal("dob", user.dateOfBirth ? user.dateOfBirth.substring(0, 10) : "");
  setVal("gender", user.gender);
  setVal("bio", user.bio);

  /* ========================================================================
     6. STATS — Live from localStorage
     ======================================================================== */
  const setStat = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  // ✅ Orders count
  let ordersCount = 0;
  try {
    const localOrders = JSON.parse(localStorage.getItem("orders") || "[]");
    ordersCount = Array.isArray(localOrders) ? localOrders.length : 0;
  } catch (e) {
    ordersCount = 0;
  }
  setStat("statOrders", ordersCount);

  // ✅ Wishlist count — FIXED: uses "kenova-wishlist" key with fallback
  let wishlistCount = 0;
  try {
    let localWishlist = JSON.parse(localStorage.getItem("kenova-wishlist") || "[]");
    // Fallback: check old key too
    if (!Array.isArray(localWishlist) || !localWishlist.length) {
      const oldWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
      if (Array.isArray(oldWishlist) && oldWishlist.length) {
        localWishlist = oldWishlist;
      }
    }
    wishlistCount = Array.isArray(localWishlist) ? localWishlist.length : 0;
  } catch (e) {
    wishlistCount = 0;
  }
  setStat("statWishlist", wishlistCount);

  // ✅ Points
  const points = user.points || (ordersCount * 10);
  setStat("statPoints", points);

  /* ========================================================================
     7. SIDEBAR TABS
     ======================================================================== */
  const sideTabs = document.querySelectorAll(".side-tab[data-tab]");
  const panels = document.querySelectorAll(".panel");

  sideTabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      const target = tab.dataset.tab;

      sideTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      panels.forEach((p) => {
        p.classList.toggle("active", p.id === `panel-${target}`);
      });

      // Render orders when the orders tab is opened
      if (target === "orders") {
        renderMyOrders();
      }

      if (window.innerWidth < 900) {
        const content = document.querySelector(".profile-content");
        if (content) content.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  /* ========================================================================
     8. PERSONAL INFO FORM — SAVE TO BACKEND
     ======================================================================== */
  const infoForm = document.getElementById("infoForm");
  if (infoForm) {
    infoForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const updated = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        email: document.getElementById("email").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        bio: document.getElementById("bio").value.trim(),
        dateOfBirth: document.getElementById("dob").value || null,
        gender: document.getElementById("gender").value || null,
      };

      const saveBtn = infoForm.querySelector(".btn-primary");
      const originalText = saveBtn ? saveBtn.innerHTML : "";

      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
      }

      try {
        const data = await api("/users/profile", {
          method: "PUT",
          body: JSON.stringify(updated)
        });

        if (data.success) {
          const newUser = { ...user, ...updated, isLoggedIn: true };
          localStorage.setItem("kenova-user", JSON.stringify(newUser));

          const newFullName = `${updated.firstName} ${updated.lastName}`.trim();
          if (heroName) heroName.textContent = newFullName;
          if (heroEmail) heroEmail.textContent = updated.email;

          showToast("Profile updated successfully!", "success");
        }
      } catch (err) {
        console.error("Save error:", err);
        showToast(err.message || "Failed to save changes", "error");
      } finally {
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = originalText;
        }
      }
    });
  }

  /* ========================================================================
     9. SECURITY FORM — CHANGE PASSWORD
     ======================================================================== */
  const securityForm = document.getElementById("securityForm");
  if (securityForm) {
    securityForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const currentPw = document.getElementById("currentPw").value;
      const newPw = document.getElementById("newPw").value;
      const confirmPw = document.getElementById("confirmPw").value;

      if (!currentPw) { showToast("Enter current password", "error"); return; }
      if (!newPw || newPw.length < 6) { showToast("Min 6 chars", "error"); return; }
      if (newPw !== confirmPw) { showToast("Passwords do not match", "error"); return; }

      try {
        const data = await api("/users/change-password", {
          method: "POST",
          body: JSON.stringify({
            currentPassword: currentPw,
            newPassword: newPw
          })
        });

        if (data.success) {
          showToast("Password updated successfully!", "success");
          securityForm.reset();
        }
      } catch (err) {
        showToast(err.message || "Failed to update password", "error");
      }
    });
  }

  /* ========================================================================
     10. DELETE ACCOUNT
     ======================================================================== */
  const deleteBtn = document.getElementById("deleteAccountBtn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!confirm("Permanently delete your account?")) return;

      try {
        const data = await api("/users/profile", { method: "DELETE" });
        if (data.success) {
          localStorage.removeItem("kenova-user");
          localStorage.removeItem("kenova-token");
          showToast("Account deleted", "success");
          setTimeout(() => (window.location.href = "register.html"), 1200);
        }
      } catch (err) {
        showToast("Failed to delete account", "error");
      }
    });
  }

  /* ========================================================================
     11. LOGOUT
     ======================================================================== */
  const handleLogout = (e) => {
    e.preventDefault();
    if (confirm("Logout?")) {
      localStorage.removeItem("kenova-user");
      localStorage.removeItem("kenova-token");
      localStorage.removeItem("token");
      showToast("Logged out", "success");
      setTimeout(() => (window.location.href = "login.html"), 1000);
    }
  };

  const logoutBtn = document.getElementById("logoutBtn");
  const sideLogoutBtn = document.getElementById("sideLogoutBtn");
  if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
  if (sideLogoutBtn) sideLogoutBtn.addEventListener("click", handleLogout);

  /* ========================================================================
     12. TOAST
     ======================================================================== */
  function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) return;
    const icon = type === "success" ? "fa-circle-check" : "fa-circle-exclamation";
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> ${message}`;
    const iconEl = toast.querySelector("i");
    if (iconEl) iconEl.style.color = type === "success" ? "#16a34a" : "#fca5a5";
    toast.classList.add("show");
    clearTimeout(showToast._tid);
    showToast._tid = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  /* ========================================================================
     13. CART BADGE
     ======================================================================== */
  const cartCountEl = document.getElementById("cartCount");

  function updateCartBadge() {
    try {
      let cart = JSON.parse(localStorage.getItem("cart") || "[]");
      if (!cart.length) {
        cart = JSON.parse(localStorage.getItem("kenova-cart") || "[]");
      }
      const count = cart.reduce((n, i) => n + (i.qty || 1), 0);
      if (cartCountEl) cartCountEl.textContent = count;
    } catch (e) {
      if (cartCountEl) cartCountEl.textContent = "0";
    }
  }

  updateCartBadge();
  window.addEventListener("storage", (e) => {
    if (e.key === "cart" || e.key === "kenova-cart") updateCartBadge();
  });

  /* ========================================================================
     14. RENDER MY ORDERS
     ======================================================================== */
  function renderMyOrders() {
    const container = document.getElementById("ordersListContainer");
    if (!container) return;

    let orders = [];
    try {
      orders = JSON.parse(localStorage.getItem("orders") || "[]");
    } catch (e) {
      orders = [];
    }

    if (!orders.length) {
      container.innerHTML = `
        <div style="text-align:center; padding:50px 20px; color:#6b7280;">
          <i class="fa-solid fa-box-open" style="font-size:42px; color:#fce4ec; margin-bottom:12px; display:block;"></i>
          <p style="font-size:15px; font-weight:700; color:#1a1a2e; margin:0 0 6px;">No orders yet</p>
          <p style="font-size:13px; margin:0 0 20px;">Start shopping to place your first order</p>
          <a href="home.html" style="display:inline-flex; align-items:center; gap:8px; padding:10px 22px; background:#c2185b; color:#fff; border-radius:8px; font-weight:700; text-decoration:none; font-size:13px;">
            <i class="fa-solid fa-shopping-bag"></i> Start Shopping
          </a>
        </div>`;
      return;
    }

    container.innerHTML = orders.map((order) => {
      const items = order.items || [];
      const status = (order.status || "pending").toLowerCase();
      const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

      const itemNames = items.slice(0, 2)
        .map((it) => `<strong>${it.product_name || it.name || "Product"}</strong> × ${it.quantity || 1}`)
        .join(", ") + (items.length > 2 ? ` and ${items.length - 2} more` : "");

      const date = new Date(order.created_at);
      const formattedDate = date.toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric"
      });

      const statusBg = status === "delivered" ? "#dcfce7" :
                       status === "cancelled" ? "#fee2e2" :
                       status === "shipped"   ? "#e0e7ff" :
                       status === "processing"? "#dbeafe" : "#fef3c7";
      const statusColor = status === "delivered" ? "#166534" :
                          status === "cancelled" ? "#991b1b" :
                          status === "shipped"   ? "#3730a3" :
                          status === "processing"? "#1e40af" : "#92400e";

      return `
        <div style="background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:18px 20px; margin-bottom:14px;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
            <div>
              <p style="font-size:15px; font-weight:800; color:#1a1a2e; margin:0 0 3px;">
                Order #${order.order_number}
              </p>
              <p style="font-size:12px; color:#6b7280; margin:0;">
                <i class="fa-regular fa-calendar"></i> ${formattedDate}
              </p>
            </div>
            <span style="padding:5px 14px; border-radius:999px; font-size:11px; font-weight:700; text-transform:uppercase; background:${statusBg}; color:${statusColor};">
              ${statusLabel}
            </span>
          </div>

          <p style="font-size:14px; color:#4b5563; margin:0 0 14px; line-height:1.5;">
            ${itemNames}
          </p>

          <div style="display:flex; justify-content:space-between; align-items:center; padding-top:12px; border-top:1px dashed #e5e7eb; flex-wrap:wrap; gap:10px;">
            <div>
              <p style="font-size:11px; color:#6b7280; margin:0 0 2px;">Total</p>
              <p style="font-size:18px; font-weight:800; color:#c2185b; margin:0;">
                ৳${Number(order.total || 0).toLocaleString("en-BD")}
              </p>
            </div>
            <a href="orders.html" style="padding:9px 18px; background:#c2185b; color:#fff; border-radius:8px; font-weight:700; font-size:13px; text-decoration:none;">
              <i class="fa-solid fa-eye"></i> View All Orders
            </a>
          </div>
        </div>
      `;
    }).join("");
  }

  /* ========================================================================
     15. FILTER TABS FOR ORDERS PANEL
     ======================================================================== */
  const orderTabs = document.querySelectorAll("#panel-orders .tab-btn");
  if (orderTabs.length) {
    orderTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        orderTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        // Optional: filter logic could be added here
      });
    });
  }

  /* ========================================================================
     16. INITIAL RENDER
     ======================================================================== */
  renderMyOrders();
});