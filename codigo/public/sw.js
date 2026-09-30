/**
 * Service worker mínimo: deixa o app instalável e guarda só o "casco"
 * (ícones, logo, JS/CSS versionado). Páginas e dados vão SEMPRE à rede —
 * nada de contrato fica salvo no aparelho, e o cache não sobrevive a um
 * logout com dado antigo.
 */
const CACHE = "wegg-contratos-v1";
const ESTATICOS = ["/icone-192.png", "/icone-512.png", "/icone-maskable-512.png", "/apple-touch-icon.png", "/logo-wegg-claro.png", "/logo-wegg.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ESTATICOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (!ESTATICOS.includes(url.pathname) && !url.pathname.startsWith("/_next/static/")) return;

  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((resp) => {
          if (resp.ok) {
            const copia = resp.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
          }
          return resp;
        }),
    ),
  );
});
