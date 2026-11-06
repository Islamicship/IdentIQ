/* =====================================================================
 * IdentIQ — Service Worker (production)
 * LOCATION : site ROOT  ->  /service-worker.js   (js/ folder mein NAHI)
 * RELEASE  : har release par sirf VERSION bump karo; cache name khud
 *            change ho jata hai aur purani caches activate par delete.
 * ===================================================================== */
'use strict';

const VERSION      = '5.1.0';
const CACHE_PREFIX = 'identiq-';
const CACHE_NAME   = `${CACHE_PREFIX}v${VERSION}`;

/* Paths SW ke scope se resolve hote hain, SW file ki location se nahi */
const SCOPE     = self.registration.scope;
const toURL     = path => new URL(path, SCOPE).href;
const INDEX_URL = toURL('./index.html');

/* Atomic precache: agar koi bhi file fail hui to install fail hoga aur
 * purana SW chalta rahega. Console mein exact failing URL dikhega. */
const PRECACHE = [
  './index.html',
  './css/style.css',
  './css/settings.css',
  './css/names.css',
  './css/copy-fx.css',
  './js/ui.js',
  './js/extractor.js',
  './js/generator.js',
  './js/settings.js',
  './js/main.js',
  './js/names-data.js',
  './js/names.js',
  './js/mouse.js',
  './lib/moment.min.js',
  './lib/moment-hijri.min.js',
  './lib/confetti.browser.min.js',
  './manifest.json',
  './assets/logo.png'
].map(toURL);

const TIMEOUT_NAVIGATION = 4000;   // ms
const TIMEOUT_CORE       = 3000;   // ms (JS / CSS)
const CORE_DESTINATIONS  = new Set(['script', 'style', 'worker']);

/* ----------------------------- helpers ------------------------------ */

const isOwnCache = key => key.startsWith(CACHE_PREFIX);

const reply = (event, message) => {
  if (event.source && event.source.postMessage) event.source.postMessage(message);
};

const offlineResponse = () => new Response(
  '<!doctype html><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1">' +
  '<title>Offline</title>' +
  '<body style="margin:0;height:100vh;display:grid;place-items:center;' +
  'font-family:system-ui,sans-serif;background:#080a0d;color:#fff">' +
  '<p>Aap offline hain. Connection check karke dobara try karein.</p></body>',
  { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
);

/* Sirf proper same-origin 200 responses cache honge */
const isCacheable = res =>
  !!res && res.status === 200 && (res.type === 'basic' || res.type === 'default');

/* Redirected response ko navigation ke liye serve karna Chrome mein fail
 * hota hai (e.g. /index.html -> / redirect). Body re-wrap karke clean karo. */
async function cleanResponse(response) {
  if (!response.redirected) return response;
  const body = await response.blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

/* Kabhi reject nahi karta: quota / Vary errors log hote hain, crash nahi */
function safePut(key, response) {
  return cleanResponse(response)
    .then(res => caches.open(CACHE_NAME).then(cache => cache.put(key, res)))
    .catch(err => console.warn('[SW] cache.put failed:', err));
}

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Network timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(PRECACHE.map(async url => {
    // cache:'reload' => browser HTTP cache bypass, hamesha fresh copy
    const res = await fetch(new Request(url, { cache: 'reload' }));
    if (!res.ok) throw new Error(`Precache failed (${res.status}): ${url}`);

    // Galat path par agar _redirects ka "/* /index.html 200" fallback ho to
    // 404 ke bajaye HTML wapas aata hai — usay asset samajh kar cache na karo.
    const type = res.headers.get('Content-Type') || '';
    if (!url.endsWith('.html') && type.includes('text/html')) {
      throw new Error(`Precache got HTML instead of an asset (wrong path?): ${url}`);
    }

    await cache.put(url, await cleanResponse(res));
  }));
}

/* ------------------------- fetch strategies ------------------------- */

/* NETWORK-FIRST (timeout ke saath): HTML + JS + CSS.
 * Online = hamesha consistent fresh version. Offline/slow = cache. */
async function networkFirst(event, cacheKey, timeoutMs, isNavigation) {
  // navigationPreload response (agar enabled) warna normal fetch
  const network = (async () => (await event.preloadResponse) || fetch(event.request))();

  // Background cache refresh: timeout ke baad bhi complete hota hai
  event.waitUntil(
    network
      .then(res => (isCacheable(res) ? safePut(cacheKey, res.clone()) : undefined))
      .catch(() => { /* offline: fallback neeche handle hoga */ })
  );

  try {
    const res = await withTimeout(network, timeoutMs);
    if (res.status >= 500) throw new Error(`Server error ${res.status}`);
    return res;
  } catch (err) {
    const cache  = await caches.open(CACHE_NAME);
    const cached = await cache.match(cacheKey, { ignoreSearch: true });
    if (cached) return cached;
    return isNavigation ? offlineResponse() : Response.error();
  }
}

/* STALE-WHILE-REVALIDATE: images, fonts, manifest, baaki static files.
 * Cache se turant, update background mein (waitUntil ke saath). */
async function staleWhileRevalidate(event) {
  const { request } = event;
  const cache  = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const update = fetch(request)
    .then(async res => {
      if (isCacheable(res)) await safePut(request, res.clone());
      return res;
    })
    .catch(() => undefined);

  event.waitUntil(update);

  return cached || (await update) || Response.error();
}

/* ------------------------------ install ----------------------------- */

self.addEventListener('install', event => {
  // NOTE: skipWaiting() yahan jaan-boojh kar nahi hai. Naya SW tab active
  // hoga jab user update accept kare (SKIP_WAITING message).
  event.waitUntil(
    precache()
      .then(() => console.log(`[SW v${VERSION}] Precache complete`))
      .catch(err => { console.error(`[SW v${VERSION}] Install failed:`, err); throw err; })
  );
});

/* ------------------------------ activate ---------------------------- */

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); }
      catch (err) { console.warn('[SW] navigationPreload enable failed:', err); }
    }

    // Sirf apni (identiq-*) purani caches delete — doosri apps ko na chhedo
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => isOwnCache(key) && key !== CACHE_NAME)
        .map(key => { console.log(`[SW] Deleting old cache: ${key}`); return caches.delete(key); })
    );

    await self.clients.claim();

    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(client => client.postMessage({
      type: 'SW_UPDATED', version: VERSION, cache: CACHE_NAME
    }));
  })().catch(err => console.error(`[SW v${VERSION}] Activate failed:`, err)));
});

/* ------------------------------- fetch ------------------------------ */

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;
  if (request.headers.has('range')) return;                      // 206 / media seeking

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;               // cross-origin: browser khud handle kare
  if (request.destination === 'audio' || request.destination === 'video' ||
      url.pathname.includes('/audio/')) return;

  // Single-page app: har navigation = index.html.
  // (Agar kabhi doosre .html pages add karo to yahan restrict karna.)
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(event, INDEX_URL, TIMEOUT_NAVIGATION, true));
    return;
  }

  if (CORE_DESTINATIONS.has(request.destination)) {
    event.respondWith(networkFirst(event, request, TIMEOUT_CORE, false));
    return;
  }

  event.respondWith(staleWhileRevalidate(event).catch(() => fetch(request)));
});

/* ------------------------------ messages ---------------------------- */

self.addEventListener('message', event => {
  const data = event.data;
  const type = typeof data === 'string' ? data : data && data.type;

  switch (type) {
    case 'SKIP_WAITING':
      console.log(`[SW v${VERSION}] SKIP_WAITING received`);
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      reply(event, { type: 'SW_VERSION', version: VERSION, cache: CACHE_NAME });
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys()
          .then(keys => Promise.all(keys.filter(isOwnCache).map(key => caches.delete(key))))
          .then(precache)                                        // offline ho to catch chalega
          .then(() => reply(event, { type: 'CACHE_CLEARED' }))
          .catch(err => {
            console.error('[SW] CLEAR_CACHE failed:', err);
            reply(event, { type: 'CACHE_CLEAR_FAILED' });
          })
      );
      break;
  }
});