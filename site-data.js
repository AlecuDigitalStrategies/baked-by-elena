// data.json este sursa publică pentru produse. Catalogul vechi rămâne
// disponibil ca rezervă dacă JSON-ul nu se poate încărca (inclusiv file://).
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
  }
};
