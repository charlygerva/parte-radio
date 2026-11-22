// Service worker: guarda la app para que abra rápido y sin señal
const CACHE = "parte-radio-v20";
const FILES = ["./", "index.html", "parte-radio-blanco.jpg", "parte-radio.jpg", "parte-troncalizado-blanco.jpg", "parte-troncalizado.jpg", "parte-telefonia-blanco.jpg", "parte-telefonia.jpg", "manifest.webmanifest", "escudo-192.png", "escudo-512.png", "escudo-maskable-512.png", "escudo-apple-180.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Red primero y sin usar copias viejas (para recibir siempre la última versión); sin señal, lo guardado
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request.url, { cache: "no-cache", credentials: "same-origin" }).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
  );
});
