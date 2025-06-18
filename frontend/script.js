const form = document.getElementById('form');
const message = document.getElementById('message');
// Update API base URL:
const API_BASE =
  window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://ratings-review-system-rn1e.onrender.com';

function showForm(productId) {
  document.getElementById('productId').value = productId;
  document.getElementById('review-form').style.display = 'block';
  message.innerText = '';
}

function hideForm() {
  form.reset();
  document.getElementById('review-form').style.display = 'none';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const productId = document.getElementById('productId').value;
  const email = document.getElementById('email').value;
  const rating = document.getElementById('rating').value;
  const reviewText = document.getElementById('reviewText').value;
  const photo = document.getElementById('photo').files[0];

  const formData = new FormData();
  formData.append('email', email);
  formData.append('productId', productId);
  if (rating) formData.append('rating', rating);
  if (reviewText) formData.append('reviewText', reviewText);
  if (photo) formData.append('photo', photo);

  try {
    const res = await fetch('${API_BASE}/api/reviews', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    message.innerText = data.message;
    if (res.ok) {
      hideForm();
      loadReviews(productId);
    }
  } catch (err) {
    console.error(err);
    message.innerText = 'Error submitting review';
  }
});

async function loadReviews(productId) {
  const res = await fetch(`${API_BASE}/api/reviews/${productId}`);
  const reviews = await res.json();
  const container = document.getElementById(`reviews-${productId}`);
  container.innerHTML = '<h4>Reviews:</h4>';

  reviews.forEach((r) => {
    const div = document.createElement('div');
    div.className = 'review-box';
    div.innerHTML = `
      <strong>${r.email}</strong> - ${r.rating || ''} ⭐<br>
      <em>${r.review_text || ''}</em><br>
      ${r.photo_path ? `<img src="${r.photo_path}" alt="photo" />` : ''}
      <small>${new Date(r.created_at).toLocaleString()}</small>
    `;
    container.appendChild(div);
  });
}

window.onload = () => {
  loadReviews(1);
  loadReviews(2);
};
