import { login, verifyRequestOrigin } from '@netlify/identity';

export default async function handler(request) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try { verifyRequestOrigin(request); } catch {
    return Response.json({ error: 'Cererea de conectare a fost respinsă.' }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (typeof body.email !== 'string' || typeof body.password !== 'string' || body.email.length > 254 || body.password.length > 500) {
      return Response.json({ error: 'Introdu e-mailul și parola.' }, { status: 400 });
    }
    await login(body.email.trim(), body.password);
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Autentificarea a eșuat. Verifică datele și încearcă din nou.' }, { status: 401 });
  }
}
