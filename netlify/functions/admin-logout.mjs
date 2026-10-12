import { logout, verifyRequestOrigin } from '@netlify/identity';

export default async function handler(request) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try { verifyRequestOrigin(request); } catch {
    return Response.json({ error: 'Cererea de deconectare a fost respinsă.' }, { status: 403 });
  }
  try {
    await logout();
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Nu am putut deconecta sesiunea.' }, { status: 400 });
  }
}
