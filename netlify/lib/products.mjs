import { randomUUID } from 'node:crypto';
import { GalleryError } from './gallery.mjs';

const ID_PATTERN = /^[a-z0-9-]{1,80}$/;

function text(value, name, max, required = false) {
  if (typeof value !== 'string') throw new GalleryError(`Câmpul ${name} nu este valid.`);
  const result = value.trim();
  if ((required && !result) || result.length > max) throw new GalleryError(`Câmpul ${name} este gol sau prea lung.`);
  return result;
}

function list(value, name) {
  if (!Array.isArray(value) || value.length > 12) throw new GalleryError(`Lista ${name} nu este validă.`);
  return value.map(item => text(item, name, 180, true));
}

export function validateProduct(value, categories) {
  if (!value || typeof value !== 'object' ||
      (value.id !== null && (typeof value.id !== 'string' || !ID_PATTERN.test(value.id)))) {
    throw new GalleryError('Identificatorul produsului nu este valid.');
  }
  const category = text(value.categorie, 'categorie', 80, true);
  if (!categories.some(item => item.id === category)) throw new GalleryError('Categoria produsului nu există.');
  if (typeof value.vizibil !== 'boolean') throw new GalleryError('Vizibilitatea produsului nu este validă.');
  const allergens = list(value.alergeni, 'alergeni');
  if (!allergens.length) throw new GalleryError('Completează alergenii sau mențiunea că lista se confirmă la comandă.');
  return {
    id: value.id,
    categorie: category,
    nume: text(value.nume, 'nume', 100, true),
    pret: text(value.pret, 'preț', 80, true),
    descriere: text(value.descriere, 'descriere', 500),
    blat: text(value.blat, 'blat/bază', 350),
    creme: list(value.creme, 'creme'),
    asocieri: list(value.asocieri, 'asocieri'),
    alergeni: allergens,
    nota: text(value.nota, 'notă', 500),
    eticheta: text(value.eticheta, 'etichetă', 30),
    vizibil: value.vizibil
  };
}

export function newProductId() {
  return `produs-${randomUUID().slice(0, 12)}`;
}

export function productImagePath(id, extension, position) {
  if (!ID_PATTERN.test(id) || ![1, 2, 3].includes(position) || !['jpg', 'png', 'webp'].includes(extension)) {
    throw new GalleryError('Calea fotografiei nu este validă.');
  }
  return `assets/img/produse/${id}-${position}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
}
