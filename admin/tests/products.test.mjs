import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { validateProduct, newProductId, productImagePath } from '../../netlify/lib/products.mjs';
import saveProduct from '../../netlify/functions/admin-save-product.mjs';

const data = JSON.parse(await readFile(new URL('../../data.json', import.meta.url), 'utf8'));
const categories = data.produse.categorii;

test('catalogul are cele trei categorii și toate produsele existente', async () => {
  assert.deepEqual(categories.map(item => item.id), ['torturi', 'prajituri', 'cozonaci']);
  assert.ok(data.produse.articole.length >= 14);
  assert.equal(new Set(data.produse.articole.map(item => item.id)).size, data.produse.articole.length);
  const root = fileURLToPath(new URL('../../', import.meta.url));
  for (const product of data.produse.articole) {
    assert.ok(categories.some(category => category.id === product.categorie));
    assert.ok(product.imagini.length >= 1);
    for (const image of product.imagini) {
      if (!image.startsWith('http')) await access(resolve(root, image));
    }
  }
});

test('cititorul public folosește data.json și respectă vizibilitatea', async () => {
  const source = await readFile(new URL('../../site-data.js', import.meta.url), 'utf8');
  const context = { window: {} };
  runInNewContext(source, context);
  const content = context.window.MAISON_CONTENT;
  const products = content.products(data);
  assert.equal(products.length, data.produse.articole.filter(item => item.vizibil !== false).length);
  const withDefaults = structuredClone(data);
  withDefaults.produse.articole[0].vizibil = true;
  delete withDefaults.produse.articole[0].descriere;
  assert.equal(content.products(withDefaults).find(item => item.id === withDefaults.produse.articole[0].id).desc, data.produse.implicite.descriere);
  const hidden = structuredClone(data);
  hidden.produse.articole.find(item => item.vizibil !== false).vizibil = false;
  assert.equal(content.products(hidden).length, products.length - 1);
});

test('galeria rămâne arhivată, fără secțiune sau script pe site-ul public', async () => {
  const page = await readFile(new URL('../../index.html', import.meta.url), 'utf8');
  const script = await readFile(new URL('../../script.js', import.meta.url), 'utf8');
  const admin = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(Array.isArray(data.galerie.imagini) && data.galerie.imagini.length > 0);
  assert.doesNotMatch(page, /id="galerie"|id="galleryGrid"|id="lightbox"/);
  assert.doesNotMatch(script, /galleryGrid|renderGallery|openLightbox/);
  assert.match(admin, /Galerie \(arhivă\)/);
});

test('validarea produselor refuză categorii și câmpuri invalide', () => {
  const valid = {
    id: null, categorie: 'torturi', nume: 'Tort nou', pret: '110 lei',
    descriere: 'Descriere', blat: 'Blat', creme: ['Vanilie'], asocieri: ['Fructe'],
    alergeni: ['Lapte'], nota: '', eticheta: 'Nou', vizibil: true
  };
  assert.equal(validateProduct(valid, categories).nume, 'Tort nou');
  assert.throws(() => validateProduct({ ...valid, categorie: 'altceva' }, categories));
  assert.throws(() => validateProduct({ ...valid, id: '../secret' }, categories));
  assert.throws(() => validateProduct({ ...valid, creme: ['x'.repeat(181)] }, categories));
  assert.throws(() => validateProduct({ ...valid, alergeni: [] }, categories));
  assert.match(newProductId(), /^produs-[a-f0-9-]+$/);
  assert.match(productImagePath('produs-123', 'jpg', 1), /^assets\/img\/produse\/produs-123-1-/);
});

test('salvarea unui produs nou păstrează galeria și scrie fotografia plus data.json', async () => {
  const originalFetch = globalThis.fetch;
  const originalIdentity = globalThis.netlifyIdentityContext;
  const keys = ['GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_BRANCH', 'GITHUB_TOKEN'];
  const oldEnv = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  Object.assign(process.env, {
    GITHUB_OWNER: 'owner', GITHUB_REPO: 'repo', GITHUB_BRANCH: 'main', GITHUB_TOKEN: 'secret'
  });
  globalThis.netlifyIdentityContext = { user: { sub: 'admin-1', email: 'elena@example.com', app_metadata: { roles: ['admin'] } } };
  const writes = [];
  globalThis.fetch = async (url, options) => {
    if (options.method === 'GET') {
      return Response.json({ type: 'file', sha: 'old-sha', content: Buffer.from(JSON.stringify(data)).toString('base64') });
    }
    const body = JSON.parse(options.body);
    writes.push({ url: String(url), body });
    return Response.json({ content: { sha: `sha-${writes.length}` } });
  };
  try {
    const form = new FormData();
    form.append('revision', 'old-sha');
    form.append('product', JSON.stringify({
      id: null, categorie: 'prajituri', nume: 'Prăjitură nouă', pret: '90 lei',
      descriere: 'Cu fructe', blat: 'Blat de vanilie', creme: ['Vanilie'],
      asocieri: ['Zmeură'], alergeni: ['Lapte'], nota: '', eticheta: '', vizibil: true
    }));
    form.append('image1', new Blob([Uint8Array.from([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }), 'foto.jpg');
    const request = new Request('https://exemplu.netlify.app/.netlify/functions/admin-save-product', {
      method: 'POST', headers: { Origin: 'https://exemplu.netlify.app' }, body: form
    });
    const response = await saveProduct(request);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.product.nume, 'Prăjitură nouă');
    assert.equal(result.product.imagini.length, 1);
    assert.equal(writes.length, 2);
    assert.match(writes[0].url, /contents\/assets\/img\/produse\//);
    const savedData = JSON.parse(Buffer.from(writes[1].body.content, 'base64').toString('utf8'));
    assert.equal(savedData.produse.articole.length, data.produse.articole.length + 1);
    assert.deepEqual(savedData.galerie, data.galerie);
    assert.equal(writes[1].body.sha, 'old-sha');
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.netlifyIdentityContext = originalIdentity;
    for (const key of keys) {
      if (oldEnv[key] === undefined) delete process.env[key];
      else process.env[key] = oldEnv[key];
    }
  }
});

test('eliminarea unei fotografii actualizează doar produsul și refuză eliminarea tuturor', async () => {
  const originalFetch = globalThis.fetch;
  const originalIdentity = globalThis.netlifyIdentityContext;
  const keys = ['GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_BRANCH', 'GITHUB_TOKEN'];
  const oldEnv = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  Object.assign(process.env, {
    GITHUB_OWNER: 'owner', GITHUB_REPO: 'repo', GITHUB_BRANCH: 'main', GITHUB_TOKEN: 'secret'
  });
  globalThis.netlifyIdentityContext = { user: { sub: 'admin-1', email: 'elena@example.com', app_metadata: { roles: ['admin'] } } };
  const writes = [];
  globalThis.fetch = async (_url, options) => {
    if (options.method === 'GET') {
      return Response.json({ type: 'file', sha: 'old-sha', content: Buffer.from(JSON.stringify(data)).toString('base64') });
    }
    writes.push(JSON.parse(options.body));
    return Response.json({ content: { sha: `sha-${writes.length}` } });
  };
  try {
    const existing = data.produse.articole.find(item => item.imagini.length === 3);
    const requestFor = positions => {
      const form = new FormData();
      form.append('revision', 'old-sha');
      form.append('removeImages', JSON.stringify(positions));
      form.append('product', JSON.stringify({
        id: existing.id, categorie: existing.categorie, nume: existing.nume, pret: existing.pret,
        descriere: '', blat: '', creme: [], asocieri: [], alergeni: ['Se confirmă la comandă'],
        nota: '', eticheta: '', vizibil: true
      }));
      return new Request('https://exemplu.netlify.app/.netlify/functions/admin-save-product', {
        method: 'POST', headers: { Origin: 'https://exemplu.netlify.app' }, body: form
      });
    };
    const response = await saveProduct(requestFor([2]));
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.deepEqual(result.product.imagini, [existing.imagini[0], existing.imagini[2]]);
    assert.equal(writes.length, 1);
    const savedData = JSON.parse(Buffer.from(writes[0].content, 'base64').toString('utf8'));
    assert.deepEqual(savedData.produse.articole.find(item => item.id === existing.id).imagini, result.product.imagini);
    assert.deepEqual(savedData.galerie, data.galerie);

    writes.length = 0;
    const invalid = await saveProduct(requestFor([1, 2, 3]));
    assert.equal(invalid.status, 400);
    assert.match((await invalid.json()).error, /cel puțin o fotografie/);
    assert.equal(writes.length, 0);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.netlifyIdentityContext = originalIdentity;
    for (const key of keys) {
      if (oldEnv[key] === undefined) delete process.env[key];
      else process.env[key] = oldEnv[key];
    }
  }
});
