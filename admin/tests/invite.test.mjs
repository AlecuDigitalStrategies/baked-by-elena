import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import handler from '../../netlify/functions/admin-accept-invite.mjs';

test('linkul de invitație din pagina principală ajunge în /admin/ cu tokenul intact', async () => {
  const code = await readFile(new URL('../invite-entry.js', import.meta.url), 'utf8');
  let redirectedTo = null;
  const window = {
    location: {
      protocol: 'https:',
      origin: 'https://exemplu.netlify.app',
      hash: '#invite_token=abc%2Fdef',
      replace(url) { redirectedTo = url; }
    }
  };
  runInNewContext(code, { window, URL, URLSearchParams });
  assert.equal(redirectedTo, 'https://exemplu.netlify.app/admin/#invite_token=abc%2Fdef');
});

test('activarea invitației setează o sesiune prin login după alegerea parolei', async () => {
  const originalFetch = globalThis.fetch;
  const originalNetlify = globalThis.Netlify;
  const cookies = [];
  const calls = [];
  const jwt = `x.${Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url')}.x`;
  globalThis.Netlify = {
    context: {
      url: 'https://exemplu.netlify.app',
      cookies: { set(cookie) { cookies.push(cookie); } }
    }
  };
  globalThis.fetch = async (url, options) => {
    const path = new URL(url).pathname;
    calls.push(path);
    if (path.endsWith('/verify')) {
      assert.equal(JSON.parse(options.body).token, 'token-de-test');
      return Response.json({ access_token: jwt, refresh_token: 'refresh-de-test' });
    }
    if (path.endsWith('/token')) {
      assert.equal(new URLSearchParams(options.body).get('username'), 'elena@example.com');
      return Response.json({ access_token: jwt, refresh_token: 'refresh-de-test' });
    }
    if (path.endsWith('/user')) {
      return Response.json({ id: 'user-1', email: 'elena@example.com', app_metadata: { roles: ['admin'] } });
    }
    throw new Error(`Cerere neașteptată: ${path}`);
  };
  try {
    const request = new Request('https://exemplu.netlify.app/.netlify/functions/admin-accept-invite', {
      method: 'POST',
      headers: { Origin: 'https://exemplu.netlify.app', 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'token-de-test', password: 'parola-de-test-123' })
    });
    const response = await handler(request);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true, loginRequired: false });
    assert.deepEqual(calls.map(path => path.split('/').at(-1)), ['verify', 'user', 'token', 'user']);
    assert.deepEqual(cookies.map(cookie => cookie.name), ['nf_jwt', 'nf_refresh']);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.Netlify = originalNetlify;
  }
});
