import { getUser } from '@netlify/identity';

export default async function handler(request) {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  const user = await getUser();
  return Response.json({
    authenticated: Boolean(user),
    authorized: Boolean(user?.roles?.includes('admin')),
    email: user?.email || null
  }, { headers: { 'Cache-Control': 'no-store' } });
}
