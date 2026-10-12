import { getUser } from '@netlify/identity';
import { GalleryError, requireGithubConfig, readRepoData, errorResponse } from '../lib/gallery.mjs';

export default async function handler(request) {
  if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  try {
    const user = await getUser();
    if (!user) throw new GalleryError('Conectează-te pentru a vedea editorul.', 401);
    if (!user.roles?.includes('admin')) throw new GalleryError('Contul nu are rolul „admin”.', 403);
    const result = await readRepoData(requireGithubConfig());
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
