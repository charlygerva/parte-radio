// Service worker de Telecom Partes (v48)
// La app abre al instante con lo guardado en el celular (no espera a internet).
// Cuando hay versión nueva, se bajan solo los archivos que cambiaron.
const CACHE = "telecom-partes";
const FUENTES = "telecom-fuentes";
const FILES = {
 "icono-192.png": "699a198c9b",
 "icono-512.png": "39c939ade6",
 "icono-apple-180.png": "8798d83abb",
 "icono-maskable-512.png": "03ed13b75c",
 "index.html": "482049b2bd",
 "manifest.webmanifest": "a13ebf069f",
 "recursos.bin": "05fef21ca3"
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
