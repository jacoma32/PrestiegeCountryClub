const toggle = document.getElementById('filterToggle');
const filters = document.getElementById('merchFilters');
const cards = document.querySelectorAll('.merch-grid [data-category]');
const count = document.getElementById('productCount');

toggle.addEventListener('click', () => {
  filters.hidden = !filters.hidden;
  toggle.setAttribute('aria-expanded', String(!filters.hidden));
});

function filterProducts() {
  const category = filters.querySelector('input:checked').value;
  let visible = 0;
  for (const card of cards) {
    card.hidden = category !== 'all' && card.dataset.category !== category;
    if (!card.hidden) visible++;
  }
  count.textContent = visible + ' products';
}

filters.addEventListener('change', filterProducts);
window.addEventListener('pageshow', filterProducts);
filterProducts();
