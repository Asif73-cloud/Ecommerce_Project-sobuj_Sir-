 /* ==========================================================================
   Kenova - checkout.js
   Reads cart from "kenova-cart" (same key as cart-sidebar.js).
   Uses IDs: ccEmail, ccPhone, sFullName, sCity, sAddress, sPostcode, sNote,
   payMethod, placeOrderBtn, checkoutItems, sumSubtotal, sumDiscount,
   sumShipping, sumTotal, confirmView, orderNumber, orderTotal, orderEta
   ========================================================================== */

const CHECKOUT_API = 'http://localhost:5000/api';
const CART_KEY = 'kenova-cart';

/* ---------- Helpers ---------- */
function getCheckoutToken() {
  return localStorage.getItem('token') || localStorage.getItem('kenova-token');
}

const money = (n) => '৳' + Number(n || 0).toLocaleString('en-BD');
function el(id) { return document.getElementById(id); }
function val(id) { return (el(id)?.value || '').trim(); }

/* ---------- Load cart ---------- */
function loadCheckoutCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(cart) ? cart : [];
  } catch (e) {
    return [];
  }
}

/* ---------- Totals ---------- */
function calculateTotals(cart) {
  const subtotal = cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);
  const discount = 0;
  const shipping = subtotal >= 1000 ? 0 : 60;
  const total = subtotal - discount + shipping;
  return { subtotal, discount, shipping, total };
}

/* ---------- Render Order Summary ---------- */
function renderOrderSummary() {
  const cart = loadCheckoutCart();
  const { subtotal, discount, shipping, total } = calculateTotals(cart);

  const container = el('checkoutItems');
  const elSub = el('sumSubtotal');
  const elDisc = el('sumDiscount');
  const elDiscLine = el('discountLine');
  const elShip = el('sumShipping');
  const elTot = el('sumTotal');

  const checkoutView = el('checkoutView');
  const emptyView = el('emptyView');

  if (!cart.length) {
    if (checkoutView) checkoutView.hidden = true;
    if (emptyView) emptyView.hidden = false;
    return;
  }

  if (checkoutView) checkoutView.hidden = false;
  if (emptyView) emptyView.hidden = true;

  if (container) {
    container.innerHTML = cart.map(item => `
      <div style="display:flex; gap:12px; padding:12px 0; border-bottom:1px dashed #f0f0f0;">
        <div style="width:54px; height:54px; border-radius:10px; background:#fce4ec; overflow:hidden; flex-shrink:0; display:grid; place-items:center; color:#c2185b; font-size:20px;">
          ${item.img
            ? `<img src="${item.img}" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'">`
            : '<i class="fas fa-box"></i>'}
        </div>
        <div style="flex:1; min-width:0;">
          <p style="font-size:13px; font-weight:700; color:#1a1a2e; margin:0 0 4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name || 'Product'}</p>
          <p style="font-size:11px; color:#6b7280; margin:0;">Qty: ${item.qty || 1}</p>
        </div>
        <div style="font-weight:800; color:#c2185b; font-size:13px; white-space:nowrap;">
          ${money((item.price || 0) * (item.qty || 1))}
        </div>
      </div>
    `).join('');
  }

  if (elSub) elSub.textContent = money(subtotal);
  if (elDisc) elDisc.textContent = '−' + money(discount);
  if (elDiscLine) elDiscLine.hidden = discount === 0;
  if (elShip) elShip.textContent = shipping === 0 ? 'FREE' : money(shipping);
  if (elTot) elTot.textContent = money(total);
}

/* ---------- Payment method ---------- */
function getSelectedPaymentMethod() {
  const checked = document.querySelector('input[name="payMethod"]:checked');
  return checked ? checked.value : 'cod';
}

/* ---------- Validate ---------- */
function validateCheckoutForm() {
  const errors = {};

  if (!val('ccEmail'))   errors['ccEmail'] = 'Email is required';
  if (!val('ccPhone'))   errors['ccPhone'] = 'Phone is required';
  if (!val('sFullName')) errors['sFullName'] = 'Full name is required';
  if (!val('sCity'))     errors['sCity'] = 'City is required';
  if (!val('sAddress'))  errors['sAddress'] = 'Address is required';

  // Clear previous errors
  document.querySelectorAll('.field .error').forEach(e => e.textContent = '');
  document.querySelectorAll('.field input, .field textarea').forEach(e => e.classList.remove('invalid'));

  let hasError = false;
  Object.keys(errors).forEach(id => {
    const input = el(id);
    const err = input?.parentElement?.querySelector('.error');
    if (err) err.textContent = errors[id];
    if (input) input.classList.add('invalid');
    hasError = true;
  });

  if (hasError) {
    alert('Please fill in all required fields');
    return false;
  }
  return true;
}

/* ---------- Build order object ---------- */
function buildOrderData(cart, totals) {
  const orderNumber = 'KNV-' + Math.floor(10000000 + Math.random() * 90000000);
  const paymentMethod = getSelectedPaymentMethod();
  const paymentLabel = paymentMethod === 'cod'    ? 'Cash on Delivery'
                     : paymentMethod === 'card'   ? 'Card'
                     : paymentMethod === 'mobile' ? 'Mobile Banking'
                     : 'Cash on Delivery';

  return {
    id: Date.now(),
    order_number: orderNumber,
    created_at: new Date().toISOString(),
    status: 'processing',
    payment_method: paymentLabel,
    payment_status: paymentMethod === 'cod' ? 'Unpaid' : 'Paid',
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping_fee: totals.shipping,
    total: totals.total,
    shipping_address: {
      full_name:    val('sFullName'),
      address_line: val('sAddress'),
      city:         val('sCity'),
      postal_code:  val('sPostcode'),
      phone:        val('ccPhone'),
      email:        val('ccEmail'),
      note:         val('sNote')
    },
    items: cart.map(item => ({
      product_name: item.name || 'Product',
      quantity: item.qty || 1,
      price: item.price || 0
    }))
  };
}

/* ---------- Show Confirmation ---------- */
function showConfirmation(orderNumber, total) {
  const deliveryDateObj = new Date();
  deliveryDateObj.setDate(deliveryDateObj.getDate() + 7);
  const deliveryDate = deliveryDateObj.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });

  const checkoutView = el('checkoutView');
  const confirmView = el('confirmView');
  const steps = document.querySelectorAll('.steps li');

  if (checkoutView) checkoutView.hidden = true;
  if (confirmView) confirmView.hidden = false;

  if (steps.length >= 3) {
    steps[0].classList.remove('active');
    steps[0].classList.add('complete');
    steps[1].classList.remove('active');
    steps[1].classList.add('complete');
    steps[2].classList.add('active');
  }

  const elNum = el('orderNumber');
  const elTot = el('orderTotal');
  const elEta = el('orderEta');

  if (elNum) elNum.textContent = orderNumber;
  if (elTot) elTot.textContent = money(total);
  if (elEta) elEta.textContent = deliveryDate;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Place Order ---------- */
async function placeOrder() {
  if (!validateCheckoutForm()) return;

  const btn = el('placeOrderBtn');
  if (btn) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing order...';
  }

  const cart = loadCheckoutCart();
  const totals = calculateTotals(cart);

  if (!cart.length) {
    alert('Your cart is empty');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalText || 'Place Order';
    }
    return;
  }

  const orderData = buildOrderData(cart, totals);

  // Save to localStorage
  try {
    const existing = JSON.parse(localStorage.getItem('orders') || '[]');
    existing.unshift(orderData);
    localStorage.setItem('orders', JSON.stringify(existing));
    console.log('Order saved:', orderData.order_number);
  } catch (e) {
    console.error('Failed to save order:', e);
  }

  // Optional: send to backend
  const token = getCheckoutToken();
  if (token) {
    try {
      await fetch(`${CHECKOUT_API}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: orderData.items,
          shipping_address: orderData.shipping_address,
          payment_method: orderData.payment_method,
          total: totals.total
        })
      });
    } catch (e) {
      console.warn('API failed, order saved locally only');
    }
  }

  // Clear cart (single key)
  localStorage.removeItem(CART_KEY);
  document.querySelectorAll('.cart-count').forEach(e => e.textContent = '0');

  // Show confirmation
  showConfirmation(orderData.order_number, totals.total);
}

/* ---------- Payment UI ---------- */
function initPaymentMethodSelectors() {
  const options = document.querySelectorAll('.pay_option');
  const cardFields = el('cardFields');
  const mobileFields = el('mobileFields');

  function updatePaymentFields() {
    const method = getSelectedPaymentMethod();
    if (cardFields) cardFields.hidden = method !== 'card';
    if (mobileFields) mobileFields.hidden = method !== 'mobile';
  }

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      updatePaymentFields();
    });
  });

  updatePaymentFields();
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderOrderSummary();
  initPaymentMethodSelectors();

  const form = el('checkoutForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      placeOrder();
    });
  }

  window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY) renderOrderSummary();
  });
});