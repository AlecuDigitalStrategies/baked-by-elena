# Administrarea galeriei — prima versiune

Editorul este în `admin/`, iar datele editabile sunt în `data.json`. El permite corectarea titlului, descrierii și textului alternativ, afișarea/ascunderea imaginii, schimbarea formatului în grilă și înlocuirea fotografiei (JPEG, PNG sau WebP, maximum 3 MB).

## Activare pe Netlify

1. Publică repository-ul GitHub ca proiect Netlify. Configurația `netlify.toml` construiește doar fișierele publice în `dist/`; sursele funcțiilor și dependențele nu sunt publicate ca fișiere statice.
2. În Netlify, activează **Identity** și setează înregistrarea pe bază de invitație. Invit-o pe Elena, apoi atribuie contului ei rolul `admin` în panoul Identity. Elena deschide linkul primit pe e-mail, care o conduce la `/admin/`, își alege parola și apoi poate intra în editor. Conectarea în `/admin/` nu folosește un cont GitHub al Elenei.
3. Creează în GitHub un **fine-grained personal access token** limitat la acest repository, cu permisiunea **Contents: Read and write**. Păstrează tokenul numai în variabilele de mediu Netlify, niciodată în repository sau în browser.
4. În Netlify setează variabilele de mediu `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH` (de exemplu `main`) și `GITHUB_TOKEN`. Secretul trebuie să fie disponibil funcțiilor la runtime. Publică din nou site-ul după configurare.
5. Deschide `https://domeniul-site-ului/admin/`, autentifică-te și editează o fotografie. Butonul **Salvează fotografia și textele** încarcă fotografia nouă, dacă există, și actualizează `data.json` în GitHub. Commitul rezultat declanșează publicarea automată pe Netlify.

Fotografiile noi sunt salvate în `assets/img/galerie/`. Cele vechi nu sunt șterse automat, pentru a putea fi recuperate. Editorul verifică versiunea fișierului JSON și refuză suprascrierea unei modificări făcute între timp de altcineva. Dacă încărcarea fotografiei reușește, dar actualizarea JSON-ului eșuează, fotografia nouă poate rămâne nefolosită în repository; reîncarcă editorul și repetă salvarea.

**Important:** galeria din `index.html` continuă momentan să folosească lista din `script.js`. Această primă versiune construiește editorul și sursa de date, dar nu schimbă încă galeria publică, conform cerinței de a păstra HTML-ul și JavaScript-ul existente. Conectarea galeriei publice la `data.json` este pasul următor.

## Verificare locală

- `npm run check:admin` rulează testele datelor și validării imaginilor.
- `npm run build` pregătește directorul ignorat `dist/` pentru Netlify.
- Dacă deschizi `admin/index.html` direct de pe calculator, poți alege manual `data.json` pentru a vedea și testa interfața. Salvarea online și autentificarea funcționează numai după configurarea pe Netlify.
- După modificările de autentificare, publică din nou site-ul pe Netlify înainte să folosești linkul de invitație. Linkurile de invitație trimise către pagina principală sunt redirecționate automat către formularul de alegere a parolei din `/admin/`.

`data.json` va putea primi ulterior noduri separate pentru etichetele formularelor și recenziile publicate. Datele personale trimise prin formulare nu trebuie stocate în acest fișier public.
