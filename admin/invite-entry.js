// Netlify trimite implicit invitația către pagina principală cu tokenul în fragment.
if (window.location.protocol === 'https:') {
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (params.has('invite_token')) {
    const adminUrl = new URL('/admin/', window.location.origin);
    adminUrl.hash = window.location.hash;
    window.location.replace(adminUrl.href);
  }
}
