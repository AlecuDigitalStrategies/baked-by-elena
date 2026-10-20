import { getUser, verifyRequestOrigin } from '@netlify/identity';
import {
  GalleryError, requireGithubConfig, readRepoData, writeRepoFile,
  validateImage, errorResponse
} from '../lib/gallery.mjs';
import { validateProduct, newProductId, productImagePath } from '../lib/products.mjs';

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
    const rawProduct = form.get('product');
    const revision = form.get('revision');
    if (typeof rawProduct !== 'string' || typeof revision !== 'string') {
      throw new GalleryError('Cererea de salvare nu este completă.');
    }
    let value;
    try { value = JSON.parse(rawProduct); } catch { throw new GalleryError('Datele produsului nu sunt JSON valid.'); }

    const config = requireGithubConfig();
    const current = await readRepoData(config);
    if (current.revision !== revision) {
      throw new GalleryError('Conținutul a fost modificat între timp. Reîncarcă editorul înainte de salvare.', 409);
    }
    const catalog = current.data.produse;
    if (!catalog || !Array.isArray(catalog.categorii) || !Array.isArray(catalog.articole)) {
      throw new GalleryError('data.json nu conține catalogul de produse.', 502);
    }
    const product = validateProduct(value, catalog.categorii);
    const index = product.id === null ? -1 : catalog.articole.findIndex(item => item.id === product.id);
    if (product.id !== null && index < 0) throw new GalleryError('Produsul selectat nu mai există.', 404);
    const id = product.id || newProductId();
    const existing = index >= 0 ? catalog.articole[index] : null;
    let removedPositions = [];
    try {
      removedPositions = JSON.parse(form.get('removeImages') || '[]');
    } catch {
      throw new GalleryError('Lista fotografiilor eliminate nu este validă.');
    }
    if (!Array.isArray(removedPositions) || removedPositions.length > 3 ||
        removedPositions.some(position => !Number.isInteger(position) || position < 1 || position > 3) ||
        new Set(removedPositions).size !== removedPositions.length) {
      throw new GalleryError('Lista fotografiilor eliminate nu este validă.');
    }
    if (removedPositions.some(position => !existing?.imagini?.[position - 1])) {
      throw new GalleryError('Fotografia aleasă pentru eliminare nu mai există. Reîncarcă produsul.');
    }
    const uploads = [];
    let totalBytes = 0;
    for (let position = 1; position <= 3; position += 1) {
      const file = form.get(`image${position}`);
      const image = await validateImage(file);
      if (image) {
        totalBytes += image.bytes.length;
        uploads.push({ position, ...image });
      }
    }
    if (totalBytes > 4_000_000) throw new GalleryError('Fotografiile noi trebuie să aibă împreună maximum 4 MB.');
    const images = Array.isArray(existing?.imagini) ? [...existing.imagini] : [];
    if (removedPositions.some(position => uploads.some(upload => upload.position === position))) {
      throw new GalleryError('O fotografie nu poate fi eliminată și înlocuită în aceeași poziție.');
    }
    for (const position of removedPositions) images[position - 1] = null;
    if (!images.some(Boolean) && !uploads.length) {
      throw new GalleryError('Produsul trebuie să aibă cel puțin o fotografie.');
    }

    for (const upload of uploads) {
      const path = productImagePath(id, upload.extension, upload.position);
      await writeRepoFile(config, path, upload.bytes, `Produse: fotografie nouă pentru ${id}`);
      images[upload.position - 1] = path;
    }
    const updated = { ...existing, ...product, id, imagini: images.filter(Boolean) };
    if (index >= 0) catalog.articole[index] = updated;
    else catalog.articole.push(updated);
    const content = Buffer.from(`${JSON.stringify(current.data, null, 2)}\n`, 'utf8');
    const saved = await writeRepoFile(config, 'data.json', content, `Produse: actualizare ${id}`, current.revision);
    if (!saved.content?.sha) throw new GalleryError('GitHub nu a confirmat versiunea nouă a fișierului.', 502);
    return Response.json({ product: updated, revision: saved.content.sha }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return errorResponse(error);
  }
}
