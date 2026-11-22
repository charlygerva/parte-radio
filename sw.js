// Service worker de Telecom Partes (v46)
// La app abre al instante con lo guardado en el celular (no espera a internet).
// Cuando hay versión nueva, se bajan solo los archivos que cambiaron.
const CACHE = "telecom-partes";
const FUENTES = "telecom-fuentes";
const FILES = {
 "escudo-antenista.png": "3f8a888be1",
 "escudo-cba.png": "e5b00f6364",
 "escudo-dgtiae.png": "c313d0d747",
 "escudo-tyt2.png": "39a6a6b9b3",
 "icono-192.png": "699a198c9b",
 "icono-512.png": "39c939ade6",
 "icono-apple-180.png": "8798d83abb",
 "icono-maskable-512.png": "03ed13b75c",
 "index.html": "a0688c69c2",
 "manifest.webmanifest": "a13ebf069f",
 "parte-depto-blanco.jpg": "c4cc9cbb19",
 "parte-depto.jpg": "ccbe381f45",
 "parte-radio-blanco.jpg": "c43f1ccd25",
 "parte-radio.jpg": "cbc1edb87b",
 "parte-telefonia-blanco.jpg": "b3b993a21b",
 "parte-telefonia.jpg": "1ff2dfefe0",
 "parte-troncalizado-blanco.jpg": "a7e0c92466",
 "parte-troncalizado.jpg": "5cea639ca5"
};
const key = f => f + "?h=" + FILES[f];
self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(Object.keys(FILES).map(async f => {
    if (await c.match(key(f))) return;                       // no cambió: se reutiliza
    const r = await fetch(f, { cache: "reload" });
    if (!r.ok) throw new Error(f + " " + r.status);
    await c.put(key(f), r);
  }))));
});
self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k !== FUENTES) await caches.delete(k);   // cachés viejas
    const c = await caches.open(CACHE), ok = new Set(Object.keys(FILES).map(f => new URL(key(f), self.registration.scope).href));
    for (const r of await c.keys()) if (!ok.has(r.url)) await c.delete(r);                      // archivos viejos
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url), scope = self.registration.scope;
  const full = url.origin + url.pathname;
  if (full.startsWith(scope)) {
    let f = full.slice(scope.length);
    if (f === "" || f.endsWith("/")) f = "index.html";
    if (FILES[f]) {
      e.respondWith(caches.open(CACHE).then(c => c.match(key(f))).then(r => r || fetch(req)));
      return;
    }
  }
  // Letra del título (Google Fonts): se guarda la primera vez y después se usa sin internet
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(caches.open(FUENTES).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const r = await fetch(req);
      if (r.ok || r.type === "opaque") c.put(req, r.clone());
      return r;
    }));
  }
});
