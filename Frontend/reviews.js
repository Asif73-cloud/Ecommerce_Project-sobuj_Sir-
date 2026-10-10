/* ==========================================================================
   Kenova - reviews.js
   Loads user's reviews from localStorage (and API if available)
   ========================================================================== */

const REVIEWS_API = 'http://localhost:5000/api';

/* ---------- Helpers ---------- */
function getReviewsToken() {
  return localStorage.getItem('token')
      || localStorage.getItem('kenova-token');
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('kenova-user') || 'null');
  } catch (e) {
    return null;
  }
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(d) {
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
}

function starsHTML(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let out = '';
  for (let i = 0; i < 5; i++) {
    if (i < full) out += '<i class="fas fa-star"></i>';
    else if (i === full && half) out += '<i class="fas fa-star-half-alt"></i>';
    else out += '<i class="far fa-star"></i>';
  }
  return out;
}

/* ---------- State ---------- */
let allReviews = [];
let currentFilter = '';
let editingReviewId = null;
let editingRating = 0;

/* ---------- Load all reviews ---------- */
async function loadAllReviews() {
  const list = document.getElementById('reviewsList');
  const empty = document.getElementById('emptyState');
  const summary = document.getElementById('reviewsSummary');

  if (list) {
    list.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading reviews...</p>
      </div>`;
  }

  let reviews = [];

  // Read from localStorage
  try {
    reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    if (!Array.isArray(reviews)) reviews = [];
  } catch (e) {
    reviews = [];
  }

  // Sort by newest first
  reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  allReviews = reviews;

  if (!reviews.length) {
    if (list) list.hidden = true;
    if (empty) empty.hidden = false;
    if (summary) summary.textContent = 'You have no reviews yet';
    return;
  }

  if (list) list.hidden = false;
  if (empty) empty.hidden = true;

  applyFilter();
}

/* ---------- Apply filter ---------- */
function applyFilter() {
  const summary = document.getElementById('reviewsSummary');
  const filtered = currentFilter
    ? allReviews.filter(r => Number(r.rating) === Number(currentFilter))
    : allReviews;

  if (summary) {
    summary.textContent = filtered.length
      ? `You have ${filtered.length} review${filtered.length !== 1 ? 's' : ''}`
      : 'No reviews match this filter';
  }

  renderReviews(filtered);
}

/* ---------- Render reviews ---------- */
function renderReviews(reviews) {
  const list = document.getElementById('reviewsList');

  if (!reviews.length) {
    list.innerHTML = `
      <div class="empty-state" style="display:block">
        <i class="fas fa-star"></i>
        <h3>No reviews in this category</h3>
        <p>Try selecting a different rating filter.</p>
      </div>`;
    return;
  }

  list.innerHTML = reviews.map(r => {
    // Try to get the product image
    const img = r.product_image || r.image || '';
    const productName = r.product_name || r.name || 'Product';
    const productId = r.product_id || r.id;

    const hasComment = r.comment && r.comment.trim().length > 0;
    const commentText = hasComment
      ? esc(r.comment)
      : 'No comment provided';

    return `
      <div class="review-card" data-id="${r.id}">

        <div class="review-product">
          <div class="review-product-img">
            ${img
              ? `<img src="${esc(img)}" alt="${esc(productName)}"
                     onerror="this.outerHTML='<i class=\\'fas fa-box\\'></i>'">`
              : '<i class="fas fa-box"></i>'}
          </div>
          <p class="review-product-name">
            <a href="product-details.html?id=${productId}">
              ${esc(productName)}
            </a>
          </p>
        </div>

        <div class="review-content">
          <div class="review-content-top">
            <div class="review-info">
              <div class="review-stars">${starsHTML(Number(r.rating) || 0)}</div>
              <div class="review-rating-text">${(Number(r.rating) || 0).toFixed(1)} out of 5</div>
            </div>
            <span class="review-date">
              <i class="far fa-calendar"></i> ${formatDate(r.created_at || new Date())}
            </span>
          </div>

          <p class="review-comment ${hasComment ? '' : 'no-text'}">
            ${commentText}
          </p>

          <div class="review-actions">
            <a href="product-details.html?id=${productId}" class="btn-view-product">
              <i class="fas fa-eye"></i> View Product
            </a>
            <button class="btn-edit-review" onclick="window.__editReview(${r.id})">
              <i class="fas fa-pen"></i> Edit
            </button>
            <button class="btn-delete-review" onclick="window.__deleteReview(${r.id})">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>

      </div>
    `;
  }).join('');
}

/* ---------- Edit review ---------- */
window.__editReview = function (reviewId) {
  const review = allReviews.find(r => r.id === reviewId);
  if (!review) return;

  editingReviewId = reviewId;
  editingRating = Number(review.rating) || 0;

  openEditModal(review);
};

/* ---------- Delete review ---------- */
window.__deleteReview = async function (reviewId) {
  if (!confirm('Delete this review?')) return;

  // Remove from localStorage
  try {
    let reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    reviews = reviews.filter(r => r.id !== reviewId);
    localStorage.setItem('reviews', JSON.stringify(reviews));
  } catch (e) { /* ignore */ }

  // Try API
  const token = getReviewsToken();
  if (token) {
    try {
      await fetch(`${REVIEWS_API}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) { /* ignore */ }
  }

  loadAllReviews();
};

/* ---------- Edit Modal ---------- */
function openEditModal(review) {
  // Remove existing modal
  document.getElementById('editModalOverlay')?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'edit-modal-overlay';
  overlay.id = 'editModalOverlay';

  overlay.innerHTML = `
    <div class="edit-modal">
      <h3>Edit Your Review</h3>

      <form id="editReviewForm">
        <div class="form-group">
          <label>Your Rating <span class="required">*</span></label>
          <div class="star-picker" id="editStarPicker">
            <i class="${editingRating >= 1 ? 'fas' : 'far'} fa-star" data-value="1"></i>
            <i class="${editingRating >= 2 ? 'fas' : 'far'} fa-star" data-value="2"></i>
            <i class="${editingRating >= 3 ? 'fas' : 'far'} fa-star" data-value="3"></i>
            <i class="${editingRating >= 4 ? 'fas' : 'far'} fa-star" data-value="4"></i>
            <i class="${editingRating >= 5 ? 'fas' : 'far'} fa-star" data-value="5"></i>
          </div>
          <input type="hidden" id="editRatingInput" value="${editingRating}">
        </div>

        <div class="form-group">
          <label for="editComment">Your Review <span class="required">*</span></label>
          <textarea id="editComment" rows="5"
            placeholder="Share your experience...">${esc(review.comment || '')}</textarea>
        </div>

        <div class="modal-actions">
          <button type="submit" class="btn-save">
            <i class="fas fa-check"></i> Save Changes
          </button>
          <button type="button" class="btn-cancel" id="cancelEdit">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(overlay);

  // Show animation
  requestAnimationFrame(() => overlay.classList.add('show'));

  // Star picker for edit modal
  const picker = overlay.querySelector('#editStarPicker');
  const stars = picker.querySelectorAll('i');
  const ratingInput = overlay.querySelector('#editRatingInput');

  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const val = Number(star.dataset.value);
      stars.forEach((s, i) => {
        s.className = i < val ? 'fas fa-star' : 'far fa-star';
      });
    });

    star.addEventListener('click', () => {
      const val = Number(star.dataset.value);
      editingRating = val;
      ratingInput.value = val;
      stars.forEach((s, i) => {
        s.className = i < val ? 'fas fa-star' : 'far fa-star';
      });
    });
  });

  picker.addEventListener('mouseleave', () => {
    stars.forEach((s, i) => {
      s.className = i < editingRating ? 'fas fa-star' : 'far fa-star';
    });
  });

  // Cancel
  overlay.querySelector('#cancelEdit').addEventListener('click', closeEditModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeEditModal();
  });

  // Submit
  overlay.querySelector('#editReviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveEditReview();
  });
}

function closeEditModal() {
  const overlay = document.getElementById('editModalOverlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  setTimeout(() => overlay.remove(), 250);
  editingReviewId = null;
  editingRating = 0;
}

async function saveEditReview() {
  const rating = Number(document.getElementById('editRatingInput').value);
  const comment = document.getElementById('editComment').value.trim();

  if (!rating || rating < 1) {
    alert('Please select a rating');
    return;
  }
  if (!comment || comment.length < 3) {
    alert('Please write a review (min 3 characters)');
    return;
  }

  // Update localStorage
  try {
    let reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    const idx = reviews.findIndex(r => r.id === editingReviewId);
    if (idx !== -1) {
      reviews[idx].rating = rating;
      reviews[idx].comment = comment;
      reviews[idx].updated_at = new Date().toISOString();
      localStorage.setItem('reviews', JSON.stringify(reviews));
    }
  } catch (e) {
    console.error('Failed to update review:', e);
  }

  // Try API
  const token = getReviewsToken();
  if (token) {
    try {
      await fetch(`${REVIEWS_API}/reviews/${editingReviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });
    } catch (e) {
      console.warn('API update failed');
    }
  }

  closeEditModal();
  loadAllReviews();
  showToast('Review updated successfully');
}

/* ---------- Toast ---------- */
function showToast(message) {
  let toast = document.getElementById('reviewsToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'reviewsToast';
    toast.style.cssText = `
      position: fixed; bottom: 30px; left: 50%;
      transform: translateX(-50%) translateY(120%);
      background: #1a1a2e; color: #fff; padding: 14px 24px;
      border-radius: 10px; font-weight: 600; font-size: 14px;
      box-shadow: 0 10px 30px rgba(0,0,0,.25);
      z-index: 10000; transition: transform .3s ease;
      font-family: inherit;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(120%)';
  }, 2400);
}

/* ---------- Filter tabs ---------- */
document.getElementById('reviewTabs')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  currentFilter = btn.dataset.status || '';
  applyFilter();
});

/* ---------- Logout ---------- */
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  localStorage.removeItem('token');
  localStorage.removeItem('kenova-token');
  localStorage.removeItem('user');
  localStorage.removeItem('kenova-user');
  window.location.href = 'login.html';
});

/* ---------- Update cart/wishlist badges ---------- */
function updateBadges() {
  try {
    const cart = JSON.parse(localStorage.getItem('kenova-cart') || '[]');
    const cartCount = cart.reduce((s, i) => s + (i.qty || 1), 0);
    document.querySelectorAll('.cart-count, #cartCount').forEach(el => {
      el.textContent = cartCount;
    });
  } catch (e) { /* ignore */ }

  try {
    let wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    if (!wishlist.length) {
      wishlist = JSON.parse(localStorage.getItem('kenova-wishlist') || '[]');
    }
    document.querySelectorAll('#wishlistCount, .wishlist-count').forEach(el => {
      el.textContent = wishlist.length;
    });
  } catch (e) { /* ignore */ }
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  loadAllReviews();
  updateBadges();

  // Header scroll shadow
  const header = document.querySelector('.shopz-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) header?.classList.add('scrolled');
    else header?.classList.remove('scrolled');
  });
});