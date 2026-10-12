import { acceptInvite, login, verifyRequestOrigin } from '@netlify/identity';

export default async function handler(request) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try { verifyRequestOrigin(request); } catch {
    return Response.json({ error: 'Cererea de activare a fost respinsă.' }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (typeof body.token !== 'string' || body.token.length < 1 || body.token.length > 4096 ||
        typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 500) {
      return Response.json({ error: 'Introdu o parolă de cel puțin 8 caractere.' }, { status: 400 });
    }
    const user = await acceptInvite(body.token, body.password);
    // acceptInvite() confirmă contul, dar pe server nu setează cookie-ul sesiunii.
    // login() îl setează pentru următoarea cerere către /admin/.
    try {
      await login(user.email, body.password);
      return Response.json({ ok: true, loginRequired: false }, { headers: { 'Cache-Control': 'no-store' } });
    } catch {
      return Response.json({ ok: true, loginRequired: true }, { headers: { 'Cache-Control': 'no-store' } });
    }
  } catch {
    return Response.json({ error: 'Nu am putut activa contul. Verifică parola și linkul de invitație.' }, { status: 400 });
  }
}
