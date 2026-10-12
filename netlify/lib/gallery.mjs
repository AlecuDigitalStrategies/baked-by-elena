import { randomUUID } from 'node:crypto';

export const MAX_IMAGE_BYTES = 3_000_000;

export class GalleryError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function requireGithubConfig(env = process.env) {
  const config = {
    owner: env.GITHUB_OWNER,
    repo: env.GITHUB_REPO,
    branch: env.GITHUB_BRANCH,
    token: env.GITHUB_TOKEN
  };
  if (!config.owner || !config.repo || !config.branch || !config.token) {
    throw new GalleryError('Salvarea nu este configurată. Lipsesc variabilele GitHub din Netlify.', 503);
  }
  if (![config.owner, config.repo].every(value => /^[a-zA-Z0-9_.-]+$/.test(value))) {
    throw new GalleryError('Configurația repository-ului nu este validă.', 503);
  }
  return config;
}

function githubUrl(config, path) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodedPath}`;
}

async function githubRequest(config, path, method, body) {
  const url = new URL(githubUrl(config, path));
  if (method === 'GET') url.searchParams.set('ref', config.branch);
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${config.token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    const status = response.status === 409 || response.status === 422 ? 409 : response.status === 404 ? 404 : 502;
    throw new GalleryError(
      status === 409 ? 'Fișierul a fost modificat între timp. Reîncarcă galeria și încearcă din nou.' :
      status === 404 ? 'Nu am găsit fișierul sau repository-ul GitHub configurat.' :
      'GitHub nu a acceptat modificarea. Verifică permisiunile și configurarea.',
      status
    );
  }
  return response.json();
}

export async function readRepoData(config) {
  const file = await githubRequest(config, 'data.json', 'GET');
  if (file.type !== 'file' || !file.sha || !file.content) {
    throw new GalleryError('data.json din GitHub nu poate fi citit.', 502);
  }
  let data;
  try {
    data = JSON.parse(Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8'));
  } catch {
    throw new GalleryError('data.json din GitHub nu este valid.', 502);
  }
  if (!data.galerie || !Array.isArray(data.galerie.imagini)) {
    throw new GalleryError('data.json nu conține nodul galerie.imagini.', 502);
  }
  return { data, revision: file.sha };
}

export async function writeRepoFile(config, path, bytes, message, sha) {
  const body = {
    message,
    branch: config.branch,
    content: Buffer.from(bytes).toString('base64'),
    ...(sha ? { sha } : {})
  };
  return githubRequest(config, path, 'PUT', body);
}

export function validateItem(value) {
  if (!value || typeof value !== 'object' || !/^[a-z0-9-]{1,80}$/.test(value.id || '')) {
    throw new GalleryError('Identificatorul imaginii nu este valid.');
  }
  const textFields = [
    ['titlu', 100, true],
    ['descriere', 500, false],
    ['alt', 180, true]
  ];
  const item = { id: value.id };
  for (const [field, max, required] of textFields) {
    if (typeof value[field] !== 'string') throw new GalleryError(`Câmpul ${field} nu este valid.`);
    const text = value[field].trim();
    if ((required && !text) || text.length > max) throw new GalleryError(`Câmpul ${field} este gol sau prea lung.`);
    item[field] = text;
  }
  if (typeof value.vizibila !== 'boolean' || typeof value.inalta !== 'boolean') {
    throw new GalleryError('Opțiunile de afișare nu sunt valide.');
  }
  item.vizibila = value.vizibila;
  item.inalta = value.inalta;
  return item;
}

export async function validateImage(file) {
  if (!file) return null;
  if (typeof file.arrayBuffer !== 'function' || file.size < 1 || file.size > MAX_IMAGE_BYTES) {
    throw new GalleryError('Fotografia trebuie să aibă maximum 3 MB.');
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp = bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  const extension = jpeg ? 'jpg' : png ? 'png' : webp ? 'webp' : null;
  if (!extension) throw new GalleryError('Fotografia trebuie să fie JPEG, PNG sau WebP.');
  return { bytes, extension };
}

export function imagePath(id, extension) {
  return `assets/img/galerie/${id}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
}

export function errorResponse(error) {
  return Response.json(
    { error: error instanceof GalleryError ? error.message : 'A apărut o eroare la salvare. Încearcă din nou.' },
    { status: error instanceof GalleryError ? error.status : 500, headers: { 'Cache-Control': 'no-store' } }
  );
}
