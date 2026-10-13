import { getUser, verifyRequestOrigin } from '@netlify/identity';
import { randomUUID } from 'node:crypto';
import {
  GalleryError, requireGithubConfig, readRepoData, writeRepoFile,
  validateItem, validateImage, imagePath, errorResponse
} from '../lib/gallery.mjs';

export default async function handler(request) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  try {
    try { verifyRequestOrigin(request); } catch {
      throw new GalleryError('Cererea de salvare a fost respinsă.', 403);
    }
    const user = await getUser();
    if (!user) throw new GalleryError('Conectează-te înainte de salvare.', 401);
    if (!user.roles?.includes('admin')) throw new GalleryError('Contul nu are rolul „admin”.', 403);

    const form = await request.formData();
    const rawItem = form.get('item');
    const revision = form.get('revision');
    if (typeof rawItem !== 'string' || typeof revision !== 'string') {
      throw new GalleryError('Cererea de salvare nu este completă.');
    }
    let value;
    try { value = JSON.parse(rawItem); } catch { throw new GalleryError('Datele imaginii nu sunt JSON valid.'); }
    const item = validateItem(value, { allowNew: true });
    const image = await validateImage(form.get('image'));

    const config = requireGithubConfig();
    const current = await readRepoData(config);
    if (current.revision !== revision) {
      throw new GalleryError('Galeria a fost modificată între timp. Reîncarcă înainte de salvare.', 409);
    }
    const index = item.id === null ? -1 : current.data.galerie.imagini.findIndex(entry => entry.id === item.id);
    if (item.id !== null && index < 0) throw new GalleryError('Imaginea selectată nu mai există în galerie.', 404);
    if (item.id === null && !image) throw new GalleryError('Adaugă o fotografie pentru noua imagine din galerie.');

    const id = item.id || `galerie-${randomUUID().slice(0, 12)}`;
    const updated = { ...(index >= 0 ? current.data.galerie.imagini[index] : {}), ...item, id };
    if (image) {
      const path = imagePath(id, image.extension);
      await writeRepoFile(config, path, image.bytes, `Galerie: fotografie nouă pentru ${id}`);
      updated.src = path;
    }
    if (index >= 0) current.data.galerie.imagini[index] = updated;
    else current.data.galerie.imagini.push(updated);
    const content = Buffer.from(`${JSON.stringify(current.data, null, 2)}\n`, 'utf8');
    const saved = await writeRepoFile(config, 'data.json', content, `Galerie: actualizare ${id}`, current.revision);
    if (!saved.content?.sha) throw new GalleryError('GitHub nu a confirmat versiunea nouă a fișierului.', 502);
    return Response.json({ item: updated, revision: saved.content.sha }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
