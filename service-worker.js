self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("app-shell-v1").then((cache) => {
      return cache.addAll([
        "/",
        "/index.html",
        "/aluno.html",
        "/docente.html",
        "/gestor.html",
        "/manifest.json",
        "/icon-512.png",
        "/favicon.png"
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
