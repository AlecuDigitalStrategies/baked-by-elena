window.createProductEditor = function createProductEditor({ $, api, setStatus, imageUrl, state }) {
  let selectedId = null;
  let creating = false;
  let dirty = false;
  let previewUrls = [];

  const fieldNames = {
    categorie: 'productCategory', nume: 'productName', pret: 'productPrice',
    descriere: 'productDescription', blat: 'productBase', creme: 'productCreams',
    asocieri: 'productPairings', alergeni: 'productAllergens', nota: 'productNote',
    eticheta: 'productTag', vizibil: 'productVisible'
  };
  const fields = Object.fromEntries(Object.entries(fieldNames).map(([key, id]) => [key, $(id)]));
  const photoInputs = [1, 2, 3].map(position => $(`productImage${position}`));
  const photoPreviews = [1, 2, 3].map(position => $(`productImagePreview${position}`));

  function products() { return state.data?.produse?.articole || []; }
  function current() { return products().find(item => item.id === selectedId); }
  function defaults() { return state.data?.produse?.implicite || {}; }
  function markDirty(value) {
    dirty = value;
    $('productDirtyMark').hidden = !value;
  }
  function clearPreviews() {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    previewUrls = [];
    photoInputs.forEach(input => { input.value = ''; });
  }
  function renderPhotoPreviews() {
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    previewUrls = [];
    photoPreviews.forEach((preview, index) => {
      const file = photoInputs[index].files?.[0];
      const oldSource = current()?.imagini?.[index];
      if (file) {
        const url = URL.createObjectURL(file);
        previewUrls.push(url);
        preview.src = url;
        preview.hidden = false;
      } else if (oldSource) {
        preview.src = imageUrl(oldSource);
        preview.hidden = false;
      } else {
        preview.removeAttribute('src');
        preview.hidden = true;
      }
    });
  }
  function renderList() {
    const list = $('productList');
    list.replaceChildren();
    $('productCount').textContent = `(${products().length})`;
    const categories = state.data?.produse?.categorii || [];
    for (const item of products()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `gallery-card${!creating && item.id === selectedId ? ' active' : ''}`;
      button.setAttribute('aria-pressed', !creating && item.id === selectedId ? 'true' : 'false');
      if (item.imagini?.[0]) {
        const img = document.createElement('img');
        img.src = imageUrl(item.imagini[0]);
        img.alt = '';
        img.loading = 'lazy';
        button.append(img);
      }
      const body = document.createElement('span');
      body.className = 'gallery-card-body';
      const name = document.createElement('strong');
      name.textContent = item.nume;
      const detail = document.createElement('small');
      detail.textContent = `${categories.find(category => category.id === item.categorie)?.titlu || item.categorie} · ${item.pret}`;
      body.append(name, detail);
      if (item.vizibil === false) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = 'Ascuns';
        body.append(badge);
      }
      button.append(body);
      button.addEventListener('click', () => select(item.id));
      list.append(button);
    }
  }
  function fill(item) {
    clearPreviews();
    const basis = defaults();
    fields.categorie.value = item?.categorie || state.data.produse.categorii[0]?.id || '';
    fields.nume.value = item?.nume || '';
    fields.pret.value = item?.pret || '';
    fields.descriere.value = item?.descriere ?? basis.descriere ?? '';
    fields.blat.value = item?.blat ?? basis.blat ?? '';
    fields.creme.value = (item?.creme ?? basis.creme ?? []).join('\n');
    fields.asocieri.value = (item?.asocieri ?? basis.asocieri ?? []).join('\n');
    fields.alergeni.value = (item?.alergeni ?? basis.alergeni ?? []).join('\n');
    fields.nota.value = item?.nota ?? basis.nota ?? '';
    fields.eticheta.value = item?.eticheta || '';
    fields.vizibil.checked = item?.vizibil !== false;
    $('productSelectedNumber').textContent = item ? `#${products().findIndex(entry => entry.id === item.id) + 1}` : 'Nou';
    markDirty(false);
    renderPhotoPreviews();
    renderList();
  }
  function confirmChange() {
    return !dirty || window.confirm('Modificările nesalvate ale produsului se vor pierde. Continui?');
  }
  function select(id) {
    if (!creating && id === selectedId) return;
    if (!confirmChange()) return;
    selectedId = id;
    creating = false;
    fill(current());
  }
  function startNew() {
    if (!confirmChange()) return;
    selectedId = null;
    creating = true;
    fill(null);
    fields.nume.focus();
    setStatus('Produs nou: completează detaliile și încarcă cel puțin o fotografie.');
  }
  function load() {
    const catalog = state.data?.produse;
    if (!catalog || !Array.isArray(catalog.categorii) || !Array.isArray(catalog.articole)) {
      $('productsTab').disabled = true;
      return;
    }
    $('productsTab').disabled = false;
    fields.categorie.replaceChildren();
    for (const category of catalog.categorii) {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.titlu;
      fields.categorie.append(option);
    }
    $('saveProductButton').disabled = !state.authorized;
    selectedId = catalog.articole[0]?.id || null;
    creating = !selectedId;
    fill(current());
  }
  function lines(value) { return value.split(/\r?\n/).map(line => line.trim()).filter(Boolean); }

  $('newProductButton').addEventListener('click', startNew);
  Object.values(fields).forEach(field => field.addEventListener('input', () => markDirty(true)));
  photoInputs.forEach(input => input.addEventListener('change', () => {
    markDirty(true);
    renderPhotoPreviews();
  }));

  $('productForm').addEventListener('submit', async event => {
    event.preventDefault();
    if (!state.authorized) {
      setStatus('Salvarea produselor necesită autentificare ca administrator pe Netlify.', 'error');
      return;
    }
    if (!dirty && !creating) {
      setStatus('Nu există modificări de salvat.');
      return;
    }
    const files = photoInputs.map(input => input.files?.[0] || null);
    if (creating && !files.some(Boolean)) {
      setStatus('Încarcă cel puțin o fotografie pentru produsul nou.', 'error');
      return;
    }
    const totalBytes = files.reduce((total, file) => total + (file?.size || 0), 0);
    if (files.some(file => file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3_000_000)) || totalBytes > 4_000_000) {
      setStatus('Alege fotografii JPEG, PNG sau WebP de max. 3 MB fiecare și 4 MB împreună.', 'error');
      return;
    }
    const product = {
      id: creating ? null : selectedId,
      categorie: fields.categorie.value,
      nume: fields.nume.value.trim(),
      pret: fields.pret.value.trim(),
      descriere: fields.descriere.value.trim(),
      blat: fields.blat.value.trim(),
      creme: lines(fields.creme.value),
      asocieri: lines(fields.asocieri.value),
      alergeni: lines(fields.alergeni.value),
      nota: fields.nota.value.trim(),
      eticheta: fields.eticheta.value.trim(),
      vizibil: fields.vizibil.checked
    };
    const form = new FormData();
    form.append('product', JSON.stringify(product));
    form.append('revision', state.revision);
    files.forEach((file, index) => { if (file) form.append(`image${index + 1}`, file); });
    $('saveProductButton').disabled = true;
    setStatus('Se salvează produsul și fotografiile în GitHub…');
    try {
      const result = await api('admin-save-product', { method: 'POST', body: form });
      const index = products().findIndex(item => item.id === result.product.id);
      if (index >= 0) products()[index] = result.product;
      else products().push(result.product);
      state.revision = result.revision;
      selectedId = result.product.id;
      creating = false;
      fill(result.product);
      setStatus('Produsul a fost salvat. Va apărea pe site după publicarea automată pe Netlify.', 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      $('saveProductButton').disabled = !state.authorized;
    }
  });

  return { load, hasUnsaved: () => dirty, clearPreviews };
};
