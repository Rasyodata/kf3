/* EMG İmar — Service Worker (network-first; güncellemeler anında görünür) */
const CACHE = 'emgimar-v4';
const ASSETS = [
  'index.html', 'css/style.css',
  'js/i18n.js', 'js/store.js', 'js/contracts.js', 'js/app.js',
  'manifest.webmanifest', 'assets/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return; // dış kaynaklar (font) ağdan
  // Network-first: her zaman en güncel dosyayı getir, çevrimdışıysa cache'e düş
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then(c => c || caches.match('index.html')))
  );
});
