
/* ---------- Data ---------- */
const PRODUCTS = window.MAISON_PRODUCTS;

const GALLERY = [
  { img:'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=700&q=80', label:'Torturi aniversare', tall:true },
  { img:'https://images.unsplash.com/photo-1522767131594-6b7e96e5b30a?w=700&q=80', label:'Torturi de nuntă' },
  { img:'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=700&q=80', label:'Candy bar' },
  { img:'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=700&q=80', label:'Macarons' },
  { img:'https://images.unsplash.com/photo-1488477304112-4944851de03d?w=700&q=80', label:'Mini-prăjituri', tall:true },
  { img:'https://images.unsplash.com/photo-1607478900766-efe13248b125?w=700&q=80', label:'Deserturi sezoniere' },
  { img:'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=700&q=80', label:'Torturi aniversare' },
  { img:'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=700&q=80', label:'Candy bar' }
];

const FAQS = [
  { q:'Cu cât timp înainte trebuie să comand un tort?', a:'Pentru torturile din gama standard recomandăm minimum 48 de ore. Pentru torturile personalizate sau comenzile mari (nunți, evenimente corporate), recomandăm o rezervare cu 1-3 săptămâni înainte.' },
  { q:'Pot modifica ingredientele sau aroma?', a:'Da, majoritatea produselor pot fi adaptate. Detaliile legate de arome, decor și cantitate se stabilesc împreună cu echipa noastră, în urma solicitării de ofertă.' },
  { q:'Realizați produse fără zahăr, fără gluten sau fără lactoză?', a:'Oferim variante adaptate pentru anumite restricții alimentare. Te rugăm să confirmi direct cu personalul cofetăriei disponibilitatea și condițiile pentru fiecare tip de restricție.' },
  { q:'Cum se calculează prețul unui tort personalizat?', a:'Prețul depinde de greutate, complexitatea decorului, aroma aleasă și numărul de persoane. Primești o ofertă clară după completarea formularului de comandă personalizată.' },
  { q:'Pot trimite o fotografie ca model?', a:'Da, poți încărca o fotografie de inspirație direct în formularul de comandă personalizată, iar echipa noastră o va folosi ca reper pentru propunere.' },
  { q:'Cum primesc tortul?', a:'Comenzile se ridică personal, la data și ora stabilite împreună. Nu oferim livrare.' },
  { q:'Cum pot plăti?', a:'Modalitatea de plată se confirmă când stabilim detaliile comenzii.' },
  { q:'Pot anula sau modifica o comandă?', a:'Scrie-ne cât mai curând pe WhatsApp sau sună-ne. Posibilitatea modificării depinde de stadiul pregătirii.' }
];

/* ---------- Header scroll state ---------- */
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
});

/* ---------- Mobile menu ---------- */
const mainNav = document.getElementById('mainNav');
function toggleMenu(){ mainNav.classList.toggle('open'); }
mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mainNav.classList.remove('open')));

/* ---------- Toasts ---------- */
function showToast(msg, type){
  const wrap = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'error' ? ' error' : '');
  t.innerHTML = (type === 'error' ? '⚠️ ' : '✓ ') + msg;
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add('is-hiding'); setTimeout(()=>t.remove(), 300); }, 3800);
}

/* ---------- Render products ---------- */
const productGrid = document.getElementById('productGrid');
PRODUCTS.forEach(p => {
  const card = document.createElement('div');
  card.className = 'prod-card reveal';
  card.innerHTML = `
    <div class="prod-img">
      ${p.tag ? `<span class="tag ${p.tag === 'Nou' ? 'new' : ''}">${p.tag}</span>` : ''}
      <img data-src="${p.images[0]}" alt="${p.name}" loading="lazy">
    </div>
    <div class="prod-body">
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="prod-price">${p.price}</div>
      <div class="prod-actions">
        <a href="produs.html?id=${encodeURIComponent(p.id)}" class="btn btn-primary">Vezi detalii</a>
      </div>
    </div>`;
  productGrid.appendChild(card);
});

/* Progressive image loading */
function lazyLoadImages(){
  document.querySelectorAll('img[data-src]').forEach(img => {
    const src = img.getAttribute('data-src');
    const loader = new Image();
    loader.onload = () => { img.src = src; img.classList.add('loaded'); };
    loader.src = src;
  });
}
lazyLoadImages();

/* ---------- Render gallery ---------- */
const galleryGrid = document.getElementById('galleryGrid');
GALLERY.forEach((g, i) => {
  const item = document.createElement('div');
  item.className = 'gallery-item reveal' + (g.tall ? ' tall' : '');
  item.innerHTML = `<img src="${g.img}" alt="${g.label} — Maison Dulce" loading="lazy"><span class="gallery-label">${g.label}</span>`;
  item.addEventListener('click', () => openLightbox(i));
  galleryGrid.appendChild(item);
});

let lbIndex = 0;
function openLightbox(i){
  lbIndex = i;
  document.getElementById('lightboxImg').src = GALLERY[i].img.replace('w=700','w=1400');
  document.getElementById('lightboxImg').alt = GALLERY[i].label;
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox(){ document.getElementById('lightbox').classList.remove('open'); }
function moveLightbox(dir){
  lbIndex = (lbIndex + dir + GALLERY.length) % GALLERY.length;
  document.getElementById('lightboxImg').src = GALLERY[lbIndex].img.replace('w=700','w=1400');
  document.getElementById('lightboxImg').alt = GALLERY[lbIndex].label;
}
document.getElementById('lightbox').addEventListener('click', (e) => { if(e.target.id === 'lightbox') closeLightbox(); });
document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeLightbox(); });

/* ---------- Render FAQ ---------- */
const faqList = document.getElementById('faqList');
FAQS.forEach((f, i) => {
  const item = document.createElement('div');
  item.className = 'faq-item';
  item.innerHTML = `
    <button class="faq-q" aria-expanded="false">
      ${f.q}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 5v14M5 12h14"/></svg>
    </button>
    <div class="faq-a" id="faq-a-${i}"><p>${f.a}</p></div>`;
  item.querySelector('.faq-q').addEventListener('click', () => toggleFaq(i));
  faqList.appendChild(item);
});
function toggleFaq(i){
  const item = faqList.children[i];
  const answer = document.getElementById('faq-a-' + i);
  const isOpen = item.classList.contains('open');
  faqList.querySelectorAll('.faq-item').forEach((el, idx) => {
    el.classList.remove('open');
    el.querySelector('.faq-q').setAttribute('aria-expanded','false');
    document.getElementById('faq-a-' + idx).style.maxHeight = null;
  });
  if(!isOpen){
    item.classList.add('open');
    item.querySelector('.faq-q').setAttribute('aria-expanded','true');
    answer.style.maxHeight = answer.scrollHeight + 'px';
  }
}

/* ---------- Testimonial carousel ---------- */
const testiSlides = document.getElementById('testiSlides');
const slideCount = testiSlides.children.length;
let testiIndex = 0;
const testiDots = document.getElementById('testiDots');
for(let i=0;i<slideCount;i++){
  const d = document.createElement('button');
  d.className = 'dot' + (i===0 ? ' active' : '');
  d.setAttribute('aria-label', 'Recenzia ' + (i+1));
  d.addEventListener('click', () => { testiIndex = i; updateTesti(); });
  testiDots.appendChild(d);
}
function updateTesti(){
  testiSlides.style.transform = `translateX(-${testiIndex * 100}%)`;
  [...testiDots.children].forEach((d,i) => d.classList.toggle('active', i===testiIndex));
}
function moveTesti(dir){
  testiIndex = (testiIndex + dir + slideCount) % slideCount;
  updateTesti();
}
let testiAuto = setInterval(() => moveTesti(1), 6000);
document.querySelector('.testi-wrap').addEventListener('mouseenter', () => clearInterval(testiAuto));
document.querySelector('.testi-wrap').addEventListener('mouseleave', () => testiAuto = setInterval(() => moveTesti(1), 6000));

/* ---------- Custom cake form validation ---------- */
const ccForm = document.getElementById('customCakeForm');
ccForm.addEventListener('submit', function(e){
  e.preventDefault();
  let valid = true;
  const required = ['cc-nume','cc-telefon','cc-email','cc-eveniment','cc-data','cc-persoane'];
  required.forEach(id => {
    const input = document.getElementById(id);
    const field = input.closest('.field');
    let ok = input.value.trim() !== '';
    if(id === 'cc-email' && ok) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
    if(id === 'cc-telefon' && ok) ok = /^[0-9+()\s-]{7,}$/.test(input.value);
    field.classList.toggle('invalid', !ok);
    if(!ok) valid = false;
  });
  const gdpr = document.getElementById('cc-gdpr');
  if(!gdpr.checked){ valid = false; showToast('Te rugăm să confirmi acordul privind prelucrarea datelor.', 'error'); }
  if(!valid){
    if(gdpr.checked) showToast('Te rugăm să completezi corect câmpurile marcate.', 'error');
    return;
  }
  const lines = [
    'Bună! Aș dori o ofertă pentru un tort personalizat.',
    `Nume: ${document.getElementById('cc-nume').value.trim()}`,
    `Telefon: ${document.getElementById('cc-telefon').value.trim()}`,
    `E-mail: ${document.getElementById('cc-email').value.trim()}`,
    `Eveniment: ${document.getElementById('cc-eveniment').value}`,
    `Data dorită pentru ridicare: ${document.getElementById('cc-data').value}`,
    `Număr de persoane: ${document.getElementById('cc-persoane').value}`,
    `Aromă: ${document.getElementById('cc-aroma').value || 'de discutat'}`,
    `Buget: ${document.getElementById('cc-buget').value || 'de discutat'}`,
    `Detalii: ${document.getElementById('cc-mesaj').value.trim() || 'de discutat'}`
  ];
  window.open(`https://wa.me/40762396862?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener');
  document.getElementById('ccMsg').classList.add('success');
});

/* ---------- Cookie consent ---------- */
const cookieBanner = document.getElementById('cookieBanner');
setTimeout(() => cookieBanner.classList.add('show'), 1200);
function setCookieConsent(accepted){
  cookieBanner.classList.remove('show');
  showToast(accepted ? 'Ai acceptat toate cookie-urile.' : 'Vor fi folosite doar cookie-urile necesare.');
}

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if(entry.isIntersecting){ entry.target.classList.add('visible'); io.unobserve(entry.target); } });
}, { threshold:0.15 });
revealEls.forEach(el => io.observe(el));

/* ---------- Animated stats counter ---------- */
const statEls = document.querySelectorAll('.stat .num[data-count]');
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(entry.isIntersecting){
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-count'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      let current = 0;
      const step = Math.max(1, Math.ceil(target/60));
      const timer = setInterval(() => {
        current += step;
        if(current >= target){ current = target; clearInterval(timer); }
        el.textContent = (target >= 1000 ? current.toLocaleString('ro-RO') : current) + suffix;
      }, 24);
      statObserver.unobserve(el);
    }
  });
}, { threshold:0.4 });
statEls.forEach(el => statObserver.observe(el));

/* ---------- Footer year ---------- */
document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- Smooth nav (skip default anchor jump quirks on mobile) ---------- */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function(e){
    const id = this.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if(target){
      e.preventDefault();
      window.scrollTo({ top: target.offsetTop - 76, behavior: 'smooth' });
    }
  });
});



/* Controls extracted from inline HTML handlers */
document.getElementById('closePromo').addEventListener('click',()=>document.getElementById('promoBanner').hidden=true);
document.getElementById('menuButton').addEventListener('click',toggleMenu);
document.getElementById('testiPrev').addEventListener('click',()=>moveTesti(-1));
document.getElementById('testiNext').addEventListener('click',()=>moveTesti(1));
document.getElementById('cookieNecessary').addEventListener('click',()=>setCookieConsent(false));
document.getElementById('cookieAccept').addEventListener('click',()=>setCookieConsent(true));
document.getElementById('lightboxClose').addEventListener('click',closeLightbox);
document.getElementById('lightboxPrev').addEventListener('click',()=>moveLightbox(-1));
document.getElementById('lightboxNext').addEventListener('click',()=>moveLightbox(1));
