/* Calendrier de l'Avent du CRFPE : accès hors connexion.
   La page est toujours demandée au réseau en premier, pour que les corrections arrivent vite ;
   la copie gardée sur le téléphone ne sert que quand il n'y a pas de connexion. */
const VERSION = "avent-crfpe-v1";
const FICHIERS = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "icons/favicon-32.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(cles => Promise.all(cles.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  // Polices Google : une fois téléchargées, on garde la copie.
  if(url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com"){
    e.respondWith(caches.open(VERSION).then(c => c.match(req).then(r => r || fetch(req).then(rep => { c.put(req, rep.clone()); return rep; }))));
    return;
  }
  if(url.origin !== location.origin) return; // vidéos et liens externes : réseau seulement
  // Page et fichiers du site : réseau d'abord, copie locale si hors connexion.
  e.respondWith(
    fetch(req).then(rep => {
      if(rep.ok){ const copie = rep.clone(); caches.open(VERSION).then(c => c.put(req, copie)); }
      return rep;
    }).catch(() => caches.match(req).then(r => r || caches.match("index.html")))
  );
});
