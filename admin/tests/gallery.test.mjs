import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateItem, validateImage, requireGithubConfig, readRepoData, writeRepoFile, MAX_IMAGE_BYTES } from '../../netlify/lib/gallery.mjs';
import saveGallery from '../../netlify/functions/admin-save.mjs';

const example = {
  id: 'galerie-001', titlu: ' Tort aniversar ', descriere: ' Descriere nouă ',
  alt: ' Tort cu decor floral ', vizibila: true, inalta: false
};

test('data.json conține imaginile actuale și ID-uri unice', async () => {
  const data = JSON.parse(await readFile(new URL('../../data.json', import.meta.url), 'utf8'));
  assert.equal(data.versiune, 1);
  assert.ok(data.galerie.imagini.length >= 8);
  assert.equal(new Set(data.galerie.imagini.map(item => item.id)).size, data.galerie.imagini.length);
  for (const item of data.galerie.imagini) assert.ok(item.src && item.titlu);
});

test('validateItem normalizează doar câmpurile permise', () => {
  assert.deepEqual(validateItem({ ...example, src: 'nepermis.jpg' }), {
    id: 'galerie-001', titlu: 'Tort aniversar', descriere: 'Descriere nouă',
    alt: 'Tort cu decor floral', vizibila: true, inalta: false
  });
  assert.throws(() => validateItem({ ...example, id: '../secret' }));
  assert.throws(() => validateItem({ ...example, alt: '' }));
  assert.throws(() => validateItem({ ...example, titlu: 'x'.repeat(101) }));
  assert.equal(validateItem({ ...example, id: null }, { allowNew: true }).id, null);
  assert.throws(() => validateItem({ ...example, id: null }));
});

test('validateImage acceptă JPEG real și refuză alt conținut', async () => {
  const photo = { size: 4, arrayBuffer: async () => Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]).buffer };
  assert.equal((await validateImage(photo)).extension, 'jpg');
  await assert.rejects(validateImage({ size: 4, arrayBuffer: async () => Uint8Array.from([1, 2, 3, 4]).buffer }));
  await assert.rejects(validateImage({ size: MAX_IMAGE_BYTES + 1, arrayBuffer: photo.arrayBuffer }));
});

test('configurația GitHub cere toate secretele', () => {
  assert.throws(() => requireGithubConfig({}));
  assert.equal(requireGithubConfig({ GITHUB_OWNER: 'owner', GITHUB_REPO: 'repo', GITHUB_BRANCH: 'main', GITHUB_TOKEN: 'secret' }).repo, 'repo');
});

test('citirea și salvarea folosesc API-ul GitHub fără a expune tokenul în URL', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  const config = requireGithubConfig({ GITHUB_OWNER: 'owner', GITHUB_REPO: 'repo', GITHUB_BRANCH: 'main', GITHUB_TOKEN: 'secret' });
  const content = Buffer.from(JSON.stringify({ galerie: { imagini: [] } })).toString('base64');
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    return Response.json(options.method === 'GET'
      ? { type: 'file', sha: 'old-sha', content }
      : { content: { sha: 'new-sha' } });
  };
  try {
    assert.equal((await readRepoData(config)).revision, 'old-sha');
    assert.equal((await writeRepoFile(config, 'data.json', Buffer.from('{}'), 'Update', 'old-sha')).content.sha, 'new-sha');
    assert.match(calls[0].url, /contents\/data\.json\?ref=main$/);
    assert.equal(calls[1].options.headers.Authorization, 'Bearer secret');
    assert.equal(JSON.parse(calls[1].options.body).sha, 'old-sha');
    assert.doesNotMatch(calls[1].url, /secret/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('o fotografie nouă din galerie se adaugă fără a altera produsele', async () => {
  const originalFetch = globalThis.fetch;
  const originalIdentity = globalThis.netlifyIdentityContext;
  const keys = ['GITHUB_OWNER', 'GITHUB_REPO', 'GITHUB_BRANCH', 'GITHUB_TOKEN'];
  const oldEnv = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  Object.assign(process.env, {
    GITHUB_OWNER: 'owner', GITHUB_REPO: 'repo', GITHUB_BRANCH: 'main', GITHUB_TOKEN: 'secret'
  });
  globalThis.netlifyIdentityContext = { user: { sub: 'admin-1', email: 'elena@example.com', app_metadata: { roles: ['admin'] } } };
  const data = JSON.parse(await readFile(new URL('../../data.json', import.meta.url), 'utf8'));
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
    form.append('item', JSON.stringify({
      id: null, titlu: 'Fotografie nouă', descriere: 'Tort decorat', alt: 'Tort decorat manual',
      vizibila: true, inalta: false
    }));
    form.append('image', new Blob([Uint8Array.from([0xff, 0xd8, 0xff, 0xd9])], { type: 'image/jpeg' }), 'foto.jpg');
    const request = new Request('https://exemplu.netlify.app/.netlify/functions/admin-save', {
      method: 'POST', headers: { Origin: 'https://exemplu.netlify.app' }, body: form
    });
    const response = await saveGallery(request);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.match(result.item.src, /^assets\/img\/galerie\//);
    const savedData = JSON.parse(Buffer.from(writes.at(-1).body.content, 'base64').toString('utf8'));
    assert.equal(savedData.galerie.imagini.length, data.galerie.imagini.length + 1);
    assert.deepEqual(savedData.produse, data.produse);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.netlifyIdentityContext = originalIdentity;
    for (const key of keys) {
      if (oldEnv[key] === undefined) delete process.env[key];
      else process.env[key] = oldEnv[key];
    }
  }
});
