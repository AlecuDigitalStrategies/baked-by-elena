const API = '/.netlify/functions/';
const MAX_IMAGE_BYTES = 3_000_000;
const state = { data: null, revision: null, selectedId: null, pendingFile: null, previewUrl: null, authorized: false, local: false, dirty: false, inviteToken: null, addingGallery: false };

const $ = id => document.getElementById(id);
const fields = {
  title: $('imageTitle'), description: $('imageDescription'), alt: $('imageAlt'),
  visible: $('imageVisible'), tall: $('imageTall'), file: $('imageFile')
};

function setStatus(message, kind = '') {
  const status = $('status');
  status.textContent = message;
  status.className = `status ${kind}`.trim();
}

function imageUrl(src) {
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/')) return src;
  return new URL(`../${src}`, window.location.href).href;
}

function selectedItem() {
  return state.data?.galerie?.imagini.find(item => item.id === state.selectedId);
}

function markDirty(value) {
  state.dirty = value;
  $('dirtyMark').hidden = !value;
}

function clearPreviewUrl(resetInput = true) {
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.previewUrl = null;
  state.pendingFile = null;
  if (resetInput) fields.file.value = '';
}

function updatePreview() {
  const item = selectedItem();
  if (!item && !state.addingGallery) return;
  const source = state.previewUrl || (item ? imageUrl(item.src) : null);
  $('imagePreview').hidden = !source;
  if (source) $('imagePreview').src = source;
  else $('imagePreview').removeAttribute('src');
  $('imagePreview').alt = fields.alt.value.trim() || 'Previzualizarea fotografiei';
  $('titlePreview').textContent = fields.title.value.trim() || 'Titlu fotografie';
  $('descriptionPreview').textContent = fields.description.value.trim() || 'Descrierea fotografiei va apărea aici.';
}

function renderCards() {
  const list = $('galleryList');
  list.replaceChildren();
  const images = state.data.galerie.imagini;
  $('imageCount').textContent = `(${images.length})`;
  images.forEach((item, index) => {
    const button = document.createElement('button');
    const image = document.createElement('img');
    const body = document.createElement('span');
    const title = document.createElement('strong');
    const description = document.createElement('small');
    button.type = 'button';
    button.className = `gallery-card${!state.addingGallery && item.id === state.selectedId ? ' active' : ''}`;
    button.setAttribute('aria-label', `Editează fotografia ${index + 1}: ${item.titlu}`);
    button.setAttribute('aria-pressed', !state.addingGallery && item.id === state.selectedId ? 'true' : 'false');
    image.src = item.id === state.selectedId && state.previewUrl ? state.previewUrl : imageUrl(item.src);
    image.alt = item.alt || item.titlu;
    image.loading = 'lazy';
    body.className = 'gallery-card-body';
    title.textContent = item.titlu || 'Fără titlu';
    description.textContent = item.descriere || 'Descriere necompletată';
    body.append(title, description);
    if (!item.vizibila) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'Ascunsă';
      body.append(badge);
    }
    button.append(image, body);
    button.addEventListener('click', () => selectItem(item.id));
    list.append(button);
  });
}

function selectItem(id) {
  if (id === state.selectedId && state.data && !state.addingGallery) return;
  if (state.dirty && !window.confirm('Modificările nesalvate se vor pierde. Continui?')) return;
  clearPreviewUrl();
  state.addingGallery = false;
  state.selectedId = id;
  const item = selectedItem();
  if (!item) return;
  fields.title.value = item.titlu || '';
  fields.description.value = item.descriere || '';
  fields.alt.value = item.alt || '';
  fields.visible.checked = Boolean(item.vizibila);
  fields.tall.checked = Boolean(item.inalta);
  $('selectedNumber').textContent = `#${state.data.galerie.imagini.findIndex(entry => entry.id === id) + 1}`;
  markDirty(false);
  updatePreview();
  renderCards();
}

$('newGalleryButton').addEventListener('click', () => {
  if (state.dirty && !window.confirm('Modificările nesalvate se vor pierde. Continui?')) return;
  clearPreviewUrl();
  state.addingGallery = true;
  state.selectedId = null;
  fields.title.value = '';
  fields.description.value = '';
  fields.alt.value = '';
  fields.visible.checked = true;
  fields.tall.checked = false;
  $('selectedNumber').textContent = 'Nou';
  markDirty(false);
  updatePreview();
  renderCards();
  fields.title.focus();
  setStatus('Fotografie nouă: completează titlul și textul alternativ, apoi alege fișierul.');
});

function showEditor(data, revision = null) {
  if (!data || !data.galerie || !Array.isArray(data.galerie.imagini) || !data.galerie.imagini.length) {
    throw new Error('data.json nu conține o galerie validă.');
  }
  state.data = data;
  state.revision = revision;
  state.selectedId = null;
  state.addingGallery = false;
  state.dirty = false;
  $('editor').hidden = false;
  $('saveButton').disabled = !state.authorized;
  selectItem(data.galerie.imagini[0].id);
  productsEditor.load();
}

async function api(name, options = {}) {
  const response = await fetch(`${API}${name}`, { credentials: 'same-origin', cache: 'no-store', ...options });
  let result = null;
  try { result = await response.json(); } catch { /* An unavailable function can return HTML. */ }
  if (!response.ok) throw new Error(result?.error || `Cererea a eșuat (${response.status}).`);
  return result;
}

const productsEditor = window.createProductEditor({ $, api, setStatus, imageUrl, state });

function showTab(name) {
  $('galleryEditor').hidden = name !== 'gallery';
  $('productsEditor').hidden = name !== 'products';
  for (const [buttonId, active] of [['galleryTab', name === 'gallery'], ['productsTab', name === 'products']]) {
    const button = $(buttonId);
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
}

$('galleryTab').addEventListener('click', () => showTab('gallery'));
$('productsTab').addEventListener('click', () => showTab('products'));

async function loadRemote() {
  const result = await api('admin-content');
  showEditor(result.data, result.revision);
  setStatus('Galeria este pregătită pentru editare. Alege o imagine.', 'success');
}

async function loadLocal() {
  state.local = true;
  state.authorized = false;
  $('accountName').textContent = 'Previzualizare locală';
  $('invitePanel').hidden = true;
  $('loginPanel').hidden = true;
  $('localPanel').hidden = false;
  $('saveButton').disabled = true;
  try {
    const response = await fetch('../data.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Fișierul nu poate fi citit.');
    showEditor(await response.json());
    setStatus('Mod previzualizare: poți vedea și testa editorul, dar salvarea online necesită Netlify.', 'success');
  } catch {
    setStatus('Alege fișierul data.json din proiect pentru a vedea galeria. Salvarea online necesită Netlify.');
  }
}

async function checkSession() {
  const session = await api('admin-session');
  state.local = false;
  state.authorized = Boolean(session.authorized);
  $('invitePanel').hidden = true;
  $('localPanel').hidden = true;
  $('accountName').textContent = session.email || 'Neconectat';
  $('logoutButton').hidden = !session.authenticated;
  $('loginPanel').hidden = Boolean(session.authenticated);
  if (session.authorized) {
    await loadRemote();
  } else if (session.authenticated) {
    $('editor').hidden = true;
    setStatus('Contul este conectat, dar nu are rolul „admin”. Atribuie acest rol în Netlify Identity și reconectează-te.', 'error');
  } else {
    $('editor').hidden = true;
    setStatus('Conectează-te pentru a edita și salva galeria.');
  }
}

$('inviteForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!state.inviteToken) return;
  const password = $('newPassword').value;
  if (password !== $('confirmPassword').value) {
    setStatus('Parolele nu coincid. Încearcă din nou.', 'error');
    return;
  }
  const button = $('inviteForm').querySelector('button[type=submit]');
  button.disabled = true;
  setStatus('Se activează contul…');
  try {
    const result = await api('admin-accept-invite', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: state.inviteToken, password })
    });
    state.inviteToken = null;
    $('newPassword').value = '';
    $('confirmPassword').value = '';
    try {
      await checkSession();
    } catch {
      $('invitePanel').hidden = true;
      $('loginPanel').hidden = false;
      $('accountName').textContent = 'Neconectat';
      setStatus('Contul a fost activat, dar sesiunea nu a putut fi verificată. Conectează-te cu parola aleasă.', 'error');
      return;
    }
    if (result.loginRequired) {
      setStatus('Contul a fost activat. Conectează-te cu adresa invitată și parola aleasă.', 'success');
    }
  } catch (error) {
    setStatus(`${error.message} Dacă invitația a expirat, cere o invitație nouă.`, 'error');
  } finally {
    button.disabled = false;
  }
});

$('loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('loginForm').querySelector('button[type=submit]');
  button.disabled = true;
  setStatus('Se verifică datele de conectare…');
  try {
    await api('admin-login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: $('email').value.trim(), password: $('password').value })
    });
    $('password').value = '';
    await checkSession();
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    button.disabled = false;
  }
});

$('logoutButton').addEventListener('click', async () => {
  if ((state.dirty || productsEditor.hasUnsaved()) && !window.confirm('Modificările nesalvate se vor pierde. Continui?')) return;
  try {
    await api('admin-logout', { method: 'POST' });
    clearPreviewUrl();
    productsEditor.clearPreviews();
    state.data = null;
    $('editor').hidden = true;
    await checkSession();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

$('localJson').addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    showEditor(JSON.parse(await file.text()));
    setStatus('Fișierul a fost încărcat pentru previzualizare. Salvarea online necesită Netlify.', 'success');
  } catch (error) {
    setStatus(`Nu am putut deschide JSON-ul: ${error.message}`, 'error');
  }
});

for (const field of [fields.title, fields.description, fields.alt, fields.visible, fields.tall]) {
  field.addEventListener('input', () => { markDirty(true); updatePreview(); });
}

fields.file.addEventListener('change', () => {
  const file = fields.file.files?.[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > MAX_IMAGE_BYTES) {
    clearPreviewUrl();
    updatePreview();
    setStatus('Alege o fotografie JPEG, PNG sau WebP de maximum 3 MB.', 'error');
    return;
  }
  clearPreviewUrl(false);
  state.pendingFile = file;
  state.previewUrl = URL.createObjectURL(file);
  markDirty(true);
  updatePreview();
  renderCards();
  setStatus('Fotografia nouă este în previzualizare. Apasă „Salvează” pentru a o publica împreună cu textele.');
});

$('editForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!state.authorized) {
    setStatus('Salvarea online este disponibilă numai după conectarea ca administrator pe Netlify.', 'error');
    return;
  }
  if (!state.dirty && !state.addingGallery) {
    setStatus('Nu există modificări de salvat.');
    return;
  }
  const item = selectedItem();
  const update = {
    id: state.addingGallery ? null : item.id,
    titlu: fields.title.value.trim(),
    descriere: fields.description.value.trim(),
    alt: fields.alt.value.trim(),
    vizibila: fields.visible.checked,
    inalta: fields.tall.checked
  };
  if (!update.titlu || !update.alt) {
    setStatus('Completează titlul și textul alternativ înainte de salvare.', 'error');
    return;
  }
  if (state.addingGallery && !state.pendingFile) {
    setStatus('Alege fotografia pe care vrei să o adaugi în galerie.', 'error');
    return;
  }
  const form = new FormData();
  form.append('item', JSON.stringify(update));
  form.append('revision', state.revision);
  if (state.pendingFile) form.append('image', state.pendingFile);
  $('saveButton').disabled = true;
  setStatus('Se salvează fotografia și textele în GitHub…');
  try {
    const result = await api('admin-save', { method: 'POST', body: form });
    if (state.addingGallery) state.data.galerie.imagini.push(result.item);
    else Object.assign(item, result.item);
    state.addingGallery = false;
    state.selectedId = result.item.id;
    $('selectedNumber').textContent = `#${state.data.galerie.imagini.findIndex(entry => entry.id === result.item.id) + 1}`;
    state.revision = result.revision;
    state.pendingFile = null;
    fields.file.value = '';
    markDirty(false);
    renderCards();
    updatePreview();
    setStatus('Salvat în GitHub. Netlify va publica automat modificarea; poate dura câteva minute.', 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    $('saveButton').disabled = false;
  }
});

$('reloadButton').addEventListener('click', async () => {
  if ((state.dirty || productsEditor.hasUnsaved()) && !window.confirm('Modificările nesalvate se vor pierde. Continui?')) return;
  clearPreviewUrl();
  try {
    if (state.authorized) await loadRemote();
    else await loadLocal();
  } catch (error) {
    setStatus(error.message, 'error');
  }
});

const inviteToken = new URLSearchParams(window.location.hash.slice(1)).get('invite_token');
if (window.location.protocol !== 'file:' && inviteToken) {
  state.inviteToken = inviteToken;
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  $('accountName').textContent = 'Activare cont';
  $('invitePanel').hidden = false;
  $('loginPanel').hidden = true;
  setStatus('Alege o parolă de cel puțin 8 caractere pentru a accepta invitația.');
} else if (window.location.protocol === 'file:') {
  loadLocal();
} else {
  checkSession().catch(() => loadLocal());
}
