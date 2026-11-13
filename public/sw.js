/* Cache only public application assets. Auth/API data never enter Cache Storage. */
const CACHE = "study-island-shell-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      await c.addAll([
        "/",
        "/manifest.webmanifest",
        "/icon-192.png",
        "/icon-512.png",
      ]);
      const page = await c.match("/");
      const html = await page.text();
      const assets = [
        ...new Set(
          [
            ...html.matchAll(/(?:src|href)="([^" ]*\/_next\/static\/[^" ]+)"/g),
          ].map((m) => m[1].replaceAll("&amp;", "&")),
        ),
      ];
      await Promise.all(assets.map((url) => c.add(url)));
    })(),
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const req = event.request,
    u = new URL(req.url);
  if (
    req.method !== "GET" ||
    u.origin !== location.origin ||
    u.pathname.startsWith("/api/") ||
    req.headers.has("authorization")
  )
    return;
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            void caches.open(CACHE).then((c) => c.put("/", copy));
          }
          return res;
        })
        .catch(() => caches.match("/")),
    );
    return;
  }
  if (
    u.pathname.startsWith("/_next/static/") ||
    /\.(png|svg|woff2|webmanifest)$/.test(u.pathname)
  ) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              void caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
