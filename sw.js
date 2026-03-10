// ══════════════════════════════
//  SERVICE WORKER — FN3 Nativos PWA
//  Strategy: Cache-First for static assets, Network-First for data
// ══════════════════════════════

const CACHE_NAME   = 'fn3-v1';
const DATA_CACHE   = 'fn3-data-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/index.js',
  '/manifest.json',
  '/image/icon-192x192.png',
  '/image/icon-512x512.png',
  // Google Fonts — cached on first load
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap',
  // html2canvas
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

const DATA_ASSETS = [
  '/database/data.json',
  '/logo_b64.txt'
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(STATIC_ASSETS).catch(err => {
        // External resources may fail; continue anyway
        console.warn('[SW] Some assets not cached:', err);
      })
    ).then(() =>
      caches.open(DATA_CACHE).then(cache =>
        cache.addAll(DATA_ASSETS).catch(err =>
          console.warn('[SW] Data assets not cached:', err)
        )
      )
    )
  );
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== DATA_CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Data files → Network-First (stay up to date), fallback to cache
  if (url.pathname.includes('/database/') || url.pathname.includes('logo_b64')) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  // Static assets → Cache-First, fallback to network
  event.respondWith(cacheFirst(request, CACHE_NAME));
});

// ── Strategies ────────────────────────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline — recurso não disponível', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// ── Background Sync (save offline actions) ────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
