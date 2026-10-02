const productId = new URLSearchParams(window.location.search).get('id');
const product = window.MAISON_PRODUCTS.find(item => item.id === productId);
document.getElementById('detailYear').textContent = new Date().getFullYear();

if (!product) {
  document.getElementById('productNotFound').hidden = false;
} else {
  document.getElementById('productDetail').hidden = false;
  document.title = `${product.name} — Maison Dulce`;
  document.getElementById('breadcrumbName').textContent = product.name;
  document.getElementById('detailName').textContent = product.name;
  document.getElementById('detailDescription').textContent = product.desc;
  document.getElementById('detailPrice').textContent = product.price;
  document.getElementById('detailBase').textContent = product.base;
  document.getElementById('detailNote').textContent = product.note;
  document.getElementById('orderProductName').textContent = product.name;
  document.getElementById('orderComposition').textContent = product.desc;
  document.getElementById('orderBase').textContent = product.base;
  document.getElementById('orderPrice').textContent = product.price;
  document.getElementById('orderPossibleAllergens').textContent = product.allergens.join(', ');

  const mainImage = document.getElementById('detailMainImage');
  const thumbnails = document.getElementById('detailThumbnails');
  product.images.forEach((src, index) => {
    const button = document.createElement('button');
    const image = document.createElement('img');
    button.type = 'button';
    button.className = 'detail-thumbnail' + (index === 0 ? ' active' : '');
    button.setAttribute('aria-label', `Arată fotografia ${index + 1} pentru ${product.name}`);
    button.setAttribute('aria-pressed', index === 0 ? 'true' : 'false');
    image.src = src;
    image.alt = '';
    image.loading = 'lazy';
    button.appendChild(image);
    button.addEventListener('click', () => {
      mainImage.src = src;
      mainImage.alt = `Fotografie de prezentare ${index + 1} pentru ${product.name}`;
      thumbnails.querySelectorAll('button').forEach(item => {
        item.classList.remove('active');
        item.setAttribute('aria-pressed', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
    });
    thumbnails.appendChild(button);
  });
  mainImage.src = product.images[0];
  mainImage.alt = `Fotografie de prezentare pentru ${product.name}`;

  function addListItems(id, values) {
    const list = document.getElementById(id);
    values.forEach(value => {
      const item = document.createElement('li');
      item.textContent = value;
      list.appendChild(item);
    });
  }
  addListItems('detailCreams', product.creams);
  addListItems('detailPairings', product.pairings);
  addListItems('detailAllergens', product.allergens);

  const creamSelect = document.getElementById('orderCream');
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Aș vrea o recomandare';
  creamSelect.appendChild(defaultOption);
  product.creams.forEach(cream => {
    const option = document.createElement('option');
    option.value = cream;
    option.textContent = cream;
    creamSelect.appendChild(option);
  });

  const dateInput = document.getElementById('orderDate');
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000);
  dateInput.min = localToday.toISOString().slice(0, 10);

  document.getElementById('detailOrderForm').addEventListener('submit', event => {
    event.preventDefault();
    const text = [
      `Bună! Aș dori detalii pentru ${product.name}.`,
      `Compoziție prezentată: ${product.desc}`,
      `Blat / bază: ${product.base}`,
      `Cremă preferată: ${creamSelect.value || 'aș dori o recomandare'}`,
      `Preț orientativ afișat: ${product.price}`,
      `Alergeni posibili afișați: ${product.allergens.join(', ')}`,
      `Pentru aproximativ: ${document.getElementById('orderPortions').value || 'de discutat'} persoane`,
      `Data dorită pentru ridicare: ${dateInput.value || 'de stabilit'}`,
      `Alergii/intoleranțe de verificat: ${document.getElementById('orderAllergies').value.trim() || 'nu am completat'}`,
      `Alte detalii: ${document.getElementById('orderNotes').value.trim() || 'de discutat'}`,
      'Vă rog să confirmați rețeta și alergenii finali, prețul și disponibilitatea pentru data dorită.'
    ].join('\n');
    window.open(`https://wa.me/40762396862?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  });
}
