self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("app-shell-v1").then((cache) => {
      return cache.addAll(["/faceeonline/", "/faceeonline/index.html"]);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // network-first simples, sem cache
  event.respondWith(fetch(event.request));
});
