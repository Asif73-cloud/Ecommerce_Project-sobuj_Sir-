/* ==========================================================================
   Kenova - Forgot Password logic
   Accepts email OR phone number
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const form  = document.getElementById("forgotForm");
  if (!form) return;

  const idEl  = document.getElementById("identifier");
  const errEl = document.getElementById("forgotError");
  const okEl  = document.getElementById("forgotSuccess");
  const btn   = form.querySelector(".btn");

  /* ---------- Helpers ---------- */
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = (v) => /^\+?\d[\d\s\-()]{6,15}$/.test(v);

  function show(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }

  function hideAll() {
    if (errEl) errEl.hidden = true;
    if (okEl)  okEl.hidden  = true;
  }

  function setLoading(isLoading) {
    if (!btn) return;
    btn.disabled = isLoading;
    btn.textContent = isLoading ? "Sending…" : "Send reset link";
  }

  /* ---------- Submit ---------- */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAll();

    const identifier = idEl.value.trim();

    if (!identifier) {
      show(errEl, "Please enter your email or phone number.");
      idEl.focus();
      return;
    }

    if (!isEmail(identifier) && !isPhone(identifier)) {
      show(errEl, "Enter a valid email address or phone number.");
      idEl.focus();
      return;
    }

    setLoading(true);

    /* ---------- Demo (frontend-only) ---------- */
    setTimeout(() => {
      setLoading(false);
      show(okEl, "Reset link sent! Check your inbox or messages.");
      idEl.value = "";
    }, 1000);

    /* ---------- Later, with .NET backend ----------
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Could not send reset link.");
      }

      show(okEl, "Reset link sent! Check your inbox or messages.");
      idEl.value = "";
    } catch (err) {
      show(errEl, err.message);
    } finally {
      setLoading(false);
    }
    */
  });
});