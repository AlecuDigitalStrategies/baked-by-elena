# Administrarea produselor și arhivei foto

Editorul este în `admin/`, iar conținutul public este în `data.json`. În **Produse** poți edita sau adăuga articole în Torturi, Prăjituri și Cozonaci: nume, preț orientativ, descriere, blat/bază, creme, combinații sugerate, alergeni, notă, vizibilitate și până la trei fotografii. Fila **Galerie (arhivă)** păstrează fotografiile și textele vechi, dar acestea nu mai sunt afișate pe site-ul public.

## Activare pe Netlify

1. Publică repository-ul GitHub ca proiect Netlify. Configurația `netlify.toml` construiește doar fișierele publice în `dist/`; sursele funcțiilor și dependențele nu sunt publicate ca fișiere statice.
2. În Netlify, activează **Identity** și setează înregistrarea pe bază de invitație. Invit-o pe Elena, apoi atribuie contului ei rolul `admin` în panoul Identity. Elena deschide linkul primit pe e-mail, care o conduce la `/admin/`, își alege parola și apoi poate intra în editor. Conectarea în `/admin/` nu folosește un cont GitHub al Elenei.
3. Creează în GitHub un **fine-grained personal access token** limitat la acest repository, cu permisiunea **Contents: Read and write**. Păstrează tokenul numai în variabilele de mediu Netlify, niciodată în repository sau în browser.
4. În Netlify setează variabilele de mediu `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` (de exemplu `main`) și `GITHUB_TOKEN`. Secretul trebuie să fie disponibil funcțiilor la runtime. Publică din nou site-ul după configurare.
5. Deschide `https://domeniul-site-ului/admin/`, autentifică-te și editează fila **Produse**. Salvarea încarcă fotografiile noi, dacă există, și actualizează `data.json` în GitHub. Commitul rezultat declanșează publicarea automată pe Netlify.

Fotografiile noi sunt salvate în `assets/img/galerie/` sau `assets/img/produse/`. Cele vechi nu sunt șterse automat, pentru a putea fi recuperate. Editorul verifică versiunea fișierului JSON și refuză suprascrierea unei modificări făcute între timp de altcineva. Dacă încărcarea fotografiei reușește, dar actualizarea JSON-ului eșuează, fotografia nouă poate rămâne nefolosită în repository; reîncarcă editorul și repetă salvarea.

**Important:** site-ul public citește `data.json` pentru produse. Galeria separată a fost scoasă din site, fără a șterge datele și fotografiile arhivate. Modificările produselor devin vizibile după terminarea publicării automate Netlify; dacă o pagină era deja deschisă, reîncarc-o. Fișierul `product-data.js` este doar rezervă pentru previzualizarea locală prin `file://` sau când `data.json` nu se poate încărca.

## Verificare locală

- `npm run check:admin` rulează testele datelor, autentificării și salvării.
- `npm run build` pregătește directorul ignorat `dist/` pentru Netlify.
- Dacă deschizi `admin/index.html` direct de pe calculator, poți alege manual `data.json` pentru a vedea și testa interfața. Salvarea online și autentificarea funcționează numai după configurarea pe Netlify.
- După modificările de autentificare, publică din nou site-ul pe Netlify înainte să folosești linkul de invitație. Linkurile de invitație trimise către pagina principală sunt redirecționate automat către formularul de alegere a parolei din `/admin/`.

`data.json` va putea primi ulterior noduri separate pentru etichetele formularelor și recenziile publicate. Datele personale trimise prin formulare nu trebuie stocate în acest fișier public.
