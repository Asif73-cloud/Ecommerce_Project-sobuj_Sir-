 document.addEventListener("DOMContentLoaded", () => {

  /* TAB SWITCHING */
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab);
      });
      tabContents.forEach((c) => {
        c.classList.toggle("active", c.id === `${target}Form`);
      });
    });
  });

  /* PASSWORD TOGGLE */
  document.querySelectorAll(".toggle-pw").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const isPw = input.type === "password";
      input.type = isPw ? "text" : "password";
      const icon = btn.querySelector("i");
      icon.classList.toggle("fa-eye", !isPw);
      icon.classList.toggle("fa-eye-slash", isPw);
    });
  });

  /* OTP INPUT FORMAT */
  const otpInputMobile = document.getElementById("otpInputMobile");
  if (otpInputMobile) {
    otpInputMobile.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/\D/g, "").slice(0, 6);
    });
  }

  /* EMAIL FORM SUBMIT */
  document.getElementById("emailForm").addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors("emailForm");

    const firstName = document.getElementById("emailFirstName").value.trim();
    const lastName  = document.getElementById("emailLastName").value.trim();
    const email     = document.getElementById("emailAddress").value.trim();
    const phone     = document.getElementById("emailPhone").value.trim();
    const password  = document.getElementById("emailPassword").value;
    const confirmPw = document.getElementById("emailConfirmPassword").value;
    const terms     = document.getElementById("emailTerms").checked;

    let isValid = true;
    if (!firstName) { showError(document.getElementById("emailFirstName"), "First name required"); isValid = false; }
    if (!lastName)  { showError(document.getElementById("emailLastName"), "Last name required"); isValid = false; }
    if (!email || !isValidEmail(email)) { showError(document.getElementById("emailAddress"), "Valid email required"); isValid = false; }
    if (!phone || !isValidPhone(phone)) { showError(document.getElementById("emailPhone"), "Valid phone required"); isValid = false; }
    if (!password || password.length < 6) { showError(document.getElementById("emailPassword"), "Min 6 characters"); isValid = false; }
    if (password !== confirmPw) { showError(document.getElementById("emailConfirmPassword"), "Passwords don't match"); isValid = false; }
    if (!terms) { showToast("Please agree to Terms", "error"); isValid = false; }

    if (!isValid) return;

    const newUser = {
      firstName, lastName, email, phone, password,
      isLoggedIn: false,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("kenova-user", JSON.stringify(newUser));

    showToast("Account created! Redirecting to login...", "success");

    const btn = document.getElementById("emailCreateBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating...';

    setTimeout(() => {
      window.location.href = "login.html";
    }, 1500);
  });

  /* MOBILE FORM - SEND OTP */
  document.getElementById("sendOtpMobileBtn").addEventListener("click", () => {
    const firstName = document.getElementById("mobileFirstName").value.trim();
    const lastName  = document.getElementById("mobileLastName").value.trim();
    const phone     = document.getElementById("mobileNumber").value.trim();

    clearErrors("mobileForm");
    let isValid = true;
    if (!firstName) { showError(document.getElementById("mobileFirstName"), "First name required"); isValid = false; }
    if (!lastName)  { showError(document.getElementById("mobileLastName"), "Last name required"); isValid = false; }
    if (!phone || !isValidPhone(phone)) { showError(document.getElementById("mobileNumber"), "Valid phone required"); isValid = false; }
    if (!isValid) return;

    document.getElementById("otpTargetMobile").textContent = phone;
    document.getElementById("otpSectionMobile").classList.add("show");
    document.getElementById("otpInputMobile").focus();
    startTimer("otpTimerMobile", "resendOtpMobile");

    const sendBtn = document.getElementById("sendOtpMobileBtn");
    sendBtn.disabled = true;
    sendBtn.innerHTML = '<i class="fa-solid fa-check"></i> OTP Sent';
    showToast(`OTP sent to ${phone}`, "success");
  });

  /* MOBILE - VERIFY OTP */
  document.getElementById("verifyOtpMobile").addEventListener("click", () => {
    const otp = document.getElementById("otpInputMobile").value.trim();
    if (otp.length !== 6) { showToast("Enter 6-digit OTP", "error"); return; }
    document.getElementById("otpSuccessMobile").classList.add("show");
    const v = document.getElementById("verifyOtpMobile");
    v.disabled = true;
    v.textContent = "Verified";
    showToast("Mobile verified!", "success");
    document.getElementById("mobilePasswordSection").style.display = "block";
  });

  /* MOBILE - RESEND */
  document.getElementById("resendOtpMobile").addEventListener("click", () => {
    startTimer("otpTimerMobile", "resendOtpMobile");
    showToast("OTP resent", "success");
  });

  /* MOBILE - CHANGE NUMBER */
  document.getElementById("changeMobile").addEventListener("click", () => {
    document.getElementById("otpSectionMobile").classList.remove("show");
    document.getElementById("otpSuccessMobile").classList.remove("show");
    document.getElementById("otpInputMobile").value = "";
    const v = document.getElementById("verifyOtpMobile");
    v.disabled = false;
    v.textContent = "Verify";
    const s = document.getElementById("sendOtpMobileBtn");
    s.disabled = false;
    s.textContent = "Send OTP";
    document.getElementById("mobilePasswordSection").style.display = "none";
    document.getElementById("mobileNumber").focus();
  });

  /* MOBILE - CREATE ACCOUNT */
  document.getElementById("mobileForm").addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors("mobileForm");

    const firstName = document.getElementById("mobileFirstName").value.trim();
    const lastName  = document.getElementById("mobileLastName").value.trim();
    const phone     = document.getElementById("mobileNumber").value.trim();
    const password  = document.getElementById("mobilePassword").value;
    const confirmPw = document.getElementById("mobileConfirmPassword").value;
    const terms     = document.getElementById("mobileTerms").checked;

    let isValid = true;
    if (!password || password.length < 6) { showError(document.getElementById("mobilePassword"), "Min 6 chars"); isValid = false; }
    if (password !== confirmPw) { showError(document.getElementById("mobileConfirmPassword"), "Passwords don't match"); isValid = false; }
    if (!terms) { showToast("Please agree to Terms", "error"); isValid = false; }
    if (!isValid) return;

    const newUser = {
      firstName, lastName,
      email: phone + "@kenova.com",
      phone, password,
      isLoggedIn: false,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem("kenova-user", JSON.stringify(newUser));

    showToast("Account created! Redirecting...", "success");
    document.getElementById("mobileCreateBtn").disabled = true;

    setTimeout(() => { window.location.href = "login.html"; }, 1500);
  });

  /* TIMER */
  function startTimer(timerId, resendBtnId) {
    const timerEl = document.getElementById(timerId);
    const resendBtn = document.getElementById(resendBtnId);
    let seconds = 60;
    resendBtn.disabled = true;
    timerEl.textContent = `${seconds}s`;
    if (timerEl._interval) clearInterval(timerEl._interval);
    timerEl._interval = setInterval(() => {
      seconds--;
      timerEl.textContent = `${seconds}s`;
      if (seconds <= 0) {
        clearInterval(timerEl._interval);
        timerEl.textContent = "Expired";
        resendBtn.disabled = false;
      }
    }, 1000);
  }

  /* HELPERS */
  function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
  function isValidPhone(phone) {
    const digits = phone.replace(/\D/g, "");
    return digits.length >= 7 && digits.length <= 15;
  }

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
    if (wrapper && wrapper.parentNode) wrapper.parentNode.appendChild(errorEl);
    input.addEventListener("input", () => {
      input.style.borderColor = "";
      input.style.boxShadow = "";
      if (errorEl.parentNode) errorEl.remove();
    }, { once: true });
  }

  function clearErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    form.querySelectorAll(".error-msg").forEach((el) => el.remove());
    form.querySelectorAll(".input-wrap input").forEach((input) => {
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
      position: "fixed", bottom: "24px", left: "50%",
      transform: "translateX(-50%) translateY(20px)",
      background: type === "success" ? "#16a34a" : "#dc2626",
      color: "#fff", padding: "12px 20px", borderRadius: "8px",
      fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "10px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.15)", zIndex: "9999",
      opacity: "0", transition: "opacity 0.25s, transform 0.25s",
      fontFamily: "var(--font, sans-serif)", maxWidth: "90vw",
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