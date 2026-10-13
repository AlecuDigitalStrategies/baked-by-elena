// data.json este sursa publică pentru galerie și produse. Datele vechi rămân
// disponibile doar ca rezervă când pagina este deschisă direct ca file://.
window.MAISON_CONTENT = {
  async load() {
    try {
      const response = await fetch('data.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('data.json indisponibil');
      return await response.json();
    } catch {
      return null;
    }
  },
  products(data) {
    if (!Array.isArray(data?.produse?.articole)) return null;
    const defaults = data.produse.implicite || {};
    return data.produse.articole
      .filter(item => item.vizibil !== false)
      .map(item => ({
        id: item.id,
        category: item.categorie,
        name: item.nume,
        price: item.pret,
        images: Array.isArray(item.imagini) ? item.imagini : [],
        desc: item.descriere ?? defaults.descriere ?? '',
        base: item.blat ?? defaults.blat ?? '',
        creams: item.creme ?? defaults.creme ?? [],
        pairings: item.asocieri ?? defaults.asocieri ?? [],
        allergens: item.alergeni ?? defaults.alergeni ?? [],
        note: item.nota ?? defaults.nota ?? '',
        tag: item.eticheta ?? ''
      }));
  },
  categories(data) {
    return Array.isArray(data?.produse?.categorii) ? data.produse.categorii : [
      { id: 'torturi', titlu: 'Torturi' },
      { id: 'prajituri', titlu: 'Prăjituri' },
      { id: 'cozonaci', titlu: 'Cozonaci' }
    ];
  },
  gallery(data) {
    if (!Array.isArray(data?.galerie?.imagini)) return null;
    return data.galerie.imagini
      .filter(item => item.vizibila !== false)
      .map(item => ({ img: item.src, label: item.titlu, description: item.descriere || '', alt: item.alt || item.titlu, tall: Boolean(item.inalta) }));
  }
};
