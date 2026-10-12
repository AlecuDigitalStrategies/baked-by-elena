/* Denumirile și prețurile sunt preluate din lista furnizată. Rețetele și alergenii se confirmă la comandă. */
const PRESENTATION_PHOTOS = {
  decorated: 'assets/img/WhatsApp Image 2025-01-08 at 19.12.06.jpeg',
  berrySlice: 'assets/img/WhatsApp Image 2025-01-08 at 19.44.00 (4).jpeg',
  fruitSlice: 'assets/img/WhatsApp Image 2025-01-08 at 19.44.00 (5).jpeg',
  chocolateSlice: 'assets/img/WhatsApp Image 2025-01-08 at 19.44.00 (2).jpeg',
  oreoSlice: 'assets/img/WhatsApp Image 2025-01-08 at 19.44.01.jpeg',
  layeredSlice: 'assets/img/WhatsApp Image 2025-01-08 at 19.44.00 (1).jpeg',
  colorfulSlice: 'assets/img/WhatsApp Image 2025-01-08 at 19.44.00.jpeg',
  oreoCake: 'assets/img/chocolate_1.jpeg',
  candyCake: 'assets/img/chocolate_2.jpeg',
  assorted: 'assets/img/cutie_prajituri_3.jpeg',
  assortedMore: 'assets/img/cutie_prajituri_4.jpeg',
  lightCakes: 'assets/img/cutie_prajituri_2.jpeg',
  cozonac: 'assets/img/cozonaci/cozonaci.jpg'
};

const cakeDefaults = {
  desc: 'Pregătit la comandă. Compoziția și decorul se stabilesc împreună.',
  tag: '',
  base: 'Tipul de blat se confirmă pentru rețeta aleasă.',
  creams: ['Cremele și umpluturile se stabilesc împreună la comandă.'],
  pairings: ['Mousse-urile și confiturile de fructe se pot combina după preferință, în funcție de rețetă.'],
  allergens: ['Lista se confirmă pentru rețeta finală.'],
  note: 'Fotografiile sunt de prezentare. Ingredientele, alergenii și prețul final se confirmă înainte de preparare.'
};

window.MAISON_PRODUCTS = [
  { id: 'red-velvet', name: 'Tort Red Velvet', price: '100 lei', images: [PRESENTATION_PHOTOS.colorfulSlice, PRESENTATION_PHOTOS.decorated, PRESENTATION_PHOTOS.berrySlice] },
  { id: 'medovik', name: 'Tort Medovik', price: '100 lei', images: [PRESENTATION_PHOTOS.layeredSlice, PRESENTATION_PHOTOS.lightCakes, PRESENTATION_PHOTOS.decorated] },
  { id: 'morcovi', name: 'Tort de morcovi', price: '100 lei', images: [PRESENTATION_PHOTOS.decorated, PRESENTATION_PHOTOS.layeredSlice, PRESENTATION_PHOTOS.fruitSlice] },
  { id: 'vanila', name: 'Tort Vanila', price: '110 lei', images: [PRESENTATION_PHOTOS.berrySlice, PRESENTATION_PHOTOS.decorated, PRESENTATION_PHOTOS.fruitSlice] },
  { id: 'snikers', name: 'Tort Snikers', price: '110 lei', images: [PRESENTATION_PHOTOS.chocolateSlice, PRESENTATION_PHOTOS.candyCake, PRESENTATION_PHOTOS.layeredSlice] },
  { id: 'ciocolata-visine', name: 'Tort Ciocolata Visine', price: '110 lei', images: [PRESENTATION_PHOTOS.chocolateSlice, PRESENTATION_PHOTOS.oreoCake, PRESENTATION_PHOTOS.candyCake] },
  { id: 'oreo', name: 'Tort Oreo', price: '110 lei', images: [PRESENTATION_PHOTOS.oreoCake, PRESENTATION_PHOTOS.oreoSlice, PRESENTATION_PHOTOS.candyCake] },
  { id: 'fistic-zmeura', name: 'Tort Fistic-Zmeura', price: '130 lei', images: [PRESENTATION_PHOTOS.fruitSlice, PRESENTATION_PHOTOS.berrySlice, PRESENTATION_PHOTOS.decorated] },
  {
    id: 'prajituri-asortate', name: 'Prajituri Asortate', price: '90 lei',
    images: [PRESENTATION_PHOTOS.assorted, PRESENTATION_PHOTOS.assortedMore, PRESENTATION_PHOTOS.lightCakes],
    desc: 'Selecția de prăjituri se stabilește la comandă.',
    base: 'Compoziția diferă în funcție de prăjiturile alese.',
    creams: ['Se confirmă în funcție de selecția dorită.'],
    pairings: ['Poți alege o selecție de gusturi diferite; verificăm opțiunile disponibile.'],
    allergens: ['Lista se confirmă pentru selecția finală.']
  },
  {
    id: 'cozonac', name: 'Cozonac', price: '70 lei / 1 kg',
    images: [PRESENTATION_PHOTOS.cozonac],
    desc: 'Cozonac de 1 kg, pregătit la comandă. Umplutura se confirmă înainte de preparare.',
    base: 'Aluatul și umplutura se confirmă la comandă.',
    creams: ['Umplutura se stabilește în funcție de opțiunile disponibile.'],
    pairings: ['Întreabă-ne ce variante de umplutură sunt disponibile.'],
    allergens: ['Lista se confirmă pentru rețeta aleasă.']
  },
  { id: 'trio-ciocolata', name: 'Tort Trio de Ciocolata', price: '110 lei', images: [PRESENTATION_PHOTOS.chocolateSlice, PRESENTATION_PHOTOS.candyCake, PRESENTATION_PHOTOS.oreoCake] },
  { id: 'rafaello', name: 'Tort Rafaello', price: '110 lei', images: [PRESENTATION_PHOTOS.lightCakes, PRESENTATION_PHOTOS.decorated, PRESENTATION_PHOTOS.berrySlice] },
  { id: 'kinder-bueno', name: 'Tort Kinder-Bueno', price: '110 lei', images: [PRESENTATION_PHOTOS.candyCake, PRESENTATION_PHOTOS.chocolateSlice, PRESENTATION_PHOTOS.oreoCake] },
  { id: 'savoarea-fructelor', name: 'Tort Savoarea-Fructelor', price: '110 lei', images: [PRESENTATION_PHOTOS.fruitSlice, PRESENTATION_PHOTOS.berrySlice, PRESENTATION_PHOTOS.decorated] }
].map(product => ({ ...cakeDefaults, ...product }));
