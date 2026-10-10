 /* ==========================================================================
   Kenova - login.js (Backend Connected)
   Works with api.js — POST http://localhost:5000/api/users/login
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {

  /* ============================================================
     ELEMENT REFERENCES
     ============================================================ */
  const form          = document.getElementById("loginForm");
  const emailInput    = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const togglePwBtn   = document.querySelector(".toggle-pw");
  const loginBtn      = document.getElementById("loginBtn");
  const rememberMe    = document.getElementById("rememberMe");

  console.log("[Login] Page loaded");
  console.log("[Login] Form found:", !!form);
  console.log("[Login] Email input found:", !!emailInput);
  console.log("[Login] Password input found:", !!passwordInput);
  console.log("[Login] Login button found:", !!loginBtn);

  /* ============================================================
     PASSWORD VISIBILITY TOGGLE
     ============================================================ */
  if (togglePwBtn && passwordInput) {
    togglePwBtn.addEventListener("click", () => {
      const isPw = passwordInput.type === "password";
      passwordInput.type = isPw ? "text" : "password";

      const icon = togglePwBtn.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-eye", !isPw);
        icon.classList.toggle("fa-eye-slash", isPw);
      }
    });
  }

  /* ============================================================
     PRE-FILL REMEMBERED EMAIL
     ============================================================ */
  const remembered = localStorage.getItem("kenova-remember");
  if (remembered && emailInput) {
    emailInput.value = remembered;
    if (rememberMe) rememberMe.checked = true;
  }

  /* ============================================================
     LOGIN FORM SUBMIT
     ============================================================ */
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearErrors();

      const emailOrPhone = emailInput.value.trim();
      const password     = passwordInput.value;

      console.log("[Login] Submit:", emailOrPhone);

      /* ---------- Validate ---------- */
      let isValid = true;

      if (!emailOrPhone) {
        showError(emailInput, "Email or phone is required");
        isValid = false;
      }

      if (!password) {
        showError(passwordInput, "Password is required");
        isValid = false;
      }

      if (!isValid) return;

      /* ---------- Disable button ---------- */
      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';
      }

      /* ---------- Call Backend API ---------- */
      try {
        const data = await api("/users/login", {
          method: "POST",
          body: JSON.stringify({
            emailOrPhone: emailOrPhone,
            password: password
          })
        });

        console.log("[Login] API response:", data);

        /* ---------- Handle Success ---------- */
        if (data.success) {
          const user = {
            ...data.user,
            isLoggedIn: true,
            lastLogin: new Date().toISOString()
          };

          localStorage.setItem("kenova-user", JSON.stringify(user));
          localStorage.setItem("kenova-token", data.token);

          if (rememberMe && rememberMe.checked) {
            localStorage.setItem("kenova-remember", emailOrPhone);
          } else {
            localStorage.removeItem("kenova-remember");
          }

          showToast("Login successful! Redirecting...", "success");

          setTimeout(() => {
            window.location.href = "profile.html";
          }, 1200);
        } else {
          showToast(data.error || "Login failed", "error");

          if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.innerHTML = "Sign In";
          }
        }
      } catch (err) {
        console.error("[Login] Error:", err);
        showToast(err.message || "Cannot connect to server", "error");

        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.innerHTML = "Sign In";
        }
      }
    });
  } else {
    console.error("[Login] #loginForm not found in HTML");
  }

  /* ============================================================
     HELPER FUNCTIONS
     ============================================================ */

  function showError(input, message) {
    if (!input) return;

    input.style.borderColor = "var(--danger)";
    input.style.boxShadow = "0 0 0 3px rgba(220, 38, 38, 0.10)";

    const errorEl = document.createElement("p");
    errorEl.className = "error-msg";
    errorEl.textContent = message;
    errorEl.style.color = "var(--danger)";
    errorEl.style.fontSize = "0.78rem";
    errorEl.style.marginTop = "4px";

    const wrapper = input.closest(".input-wrap");
    if (wrapper && wrapper.parentNode) {
      wrapper.parentNode.appendChild(errorEl);
    }

    input.addEventListener(
      "input",
      () => {
        input.style.borderColor = "";
        input.style.boxShadow = "";
        if (errorEl.parentNode) errorEl.remove();
      },
      { once: true }
    );
  }

  function clearErrors() {
    document.querySelectorAll(".error-msg").forEach((el) => el.remove());
    document.querySelectorAll(".input-wrap input").forEach((input) => {
      input.style.borderColor = "";
      input.style.boxShadow = "";
    });
  }

  function showToast(message, type = "success") {
    const existing = document.querySelector(".toast-msg");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast-msg";
    toast.innerHTML = `<i class="fa-solid ${type === "success" ? "fa-circle-check" : "fa-circle-exclamation"}"></i> <span>${message}</span>`;

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%) translateY(20px)",
      background: type === "success" ? "#16a34a" : "#dc2626",
      color: "#fff",
      padding: "12px 20px",
      borderRadius: "8px",
      fontSize: "0.88rem",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
      zIndex: "9999",
      opacity: "0",
      transition: "opacity 0.25s, transform 0.25s",
      fontFamily: "var(--font, sans-serif)",
      maxWidth: "90vw"
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
    }, 2400);
  }
});