/* =====================================================================
 * IdentIQ — Service Worker (production)
 * LOCATION : site ROOT  ->  /service-worker.js
 * VERSION  : 6.0.0 (Audio On-Demand Cache Architecture)
 * ===================================================================== */
'use strict';

const VERSION      = '6.0.0';
const CACHE_PREFIX = 'identiq-';
const CACHE_NAME   = `${CACHE_PREFIX}v${VERSION}`;
const CACHE_AUDIO  = `${CACHE_PREFIX}audio-v1`; // Audio cache app updates par delete nahi hoga

const SCOPE     = self.registration.scope;
const toURL     = path => new URL(path, SCOPE).href;
const INDEX_URL = toURL('./index.html');

/* Core App Shell Precache */
const PRECACHE = [
  './index.html',
  './css/style.css',
  './css/settings.css',
  './css/names.css',
  './css/copy-fx.css',
  './js/config.js',
  './js/ui.js',
  './js/extractor.js',
  './js/generator.js',
  './js/settings.js',
  './js/main.js',
  './js/names-data.js',
  './js/names.js',
  './lib/moment.min.js',
  './lib/moment-hijri.min.js',
  './lib/confetti.browser.min.js',
  './manifest.json',
  './assets/logo.png'
].map(toURL);

const TIMEOUT_NAVIGATION = 4000;   // ms
const TIMEOUT_CORE       = 3000;   // ms
const CORE_DESTINATIONS  = new Set(['script', 'style', 'worker']);

/* ----------------------------- Helpers ------------------------------ */

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

const isCacheable = res =>
  !!res && res.status === 200 && (res.type === 'basic' || res.type === 'default');

async function cleanResponse(response) {
  if (!response.redirected) return response;
  const body = await response.blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

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
    const res = await fetch(new Request(url, { cache: 'reload' }));
    if (!res.ok) throw new Error(`Precache failed (${res.status}): ${url}`);

    const type = res.headers.get('Content-Type') || '';
    if (!url.endsWith('.html') && type.includes('text/html')) {
      throw new Error(`Precache got HTML instead of an asset: ${url}`);
    }

    await cache.put(url, await cleanResponse(res));
  }));
}

/* ------------------------- Strategies ------------------------- */

async function networkFirst(event, cacheKey, timeoutMs, isNavigation) {
  const network = (async () => (await event.preloadResponse) || fetch(event.request))();

  event.waitUntil(
    network
      .then(res => (isCacheable(res) ? safePut(cacheKey, res.clone()) : undefined))
      .catch(() => {})
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

/* AUDIO CACHE-FIRST STRATEGY (With HTTP 206 Partial Content for Safari/Chrome) */
async function audioCacheFirst(event) {
  const { request } = event;
  const cleanUrl = request.url.split('?')[0];
  const cache = await caches.open(CACHE_AUDIO);
  
  let response = await cache.match(cleanUrl);

  // Agar cache mein nahi hai toh download karo aur store karo (On-Demand)
  if (!response) {
    try {
      const netRes = await fetch(cleanUrl);
      if (isCacheable(netRes)) {
        await cache.put(cleanUrl, netRes.clone());
        response = netRes;
      } else {
        return netRes;
      }
    } catch (err) {
      return Response.error();
    }
  }

  // Range Header handling (Seeking & Safari compatibility)
  const rangeHeader = request.headers.get('range');
  if (!rangeHeader) return response;

  const arrayBuffer = await response.arrayBuffer();
  const bytes = /^bytes=(\d+)-(\d+)?$/.exec(rangeHeader);
  if (!bytes) return response;

  const start = Number(bytes[1]);
  const end = bytes[2] ? Number(bytes[2]) : arrayBuffer.byteLength - 1;
  const chunk = arrayBuffer.slice(start, end + 1);

  return new Response(chunk, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Type': 'audio/mpeg',
      'Accept-Ranges': 'bytes',
      'Content-Range': `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
      'Content-Length': String(chunk.byteLength)
    }
  });
}

/* ------------------------------ Install ----------------------------- */

self.addEventListener('install', event => {
  event.waitUntil(
    precache()
      .then(() => console.log(`[SW v${VERSION}] Precache complete`))
      .catch(err => { console.error(`[SW v${VERSION}] Install failed:`, err); throw err; })
  );
});

/* ------------------------------ Activate ---------------------------- */

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); }
      catch (err) {}
    }

    // Sirf purani shell caches delete honi chahiye, CACHE_AUDIO ko safe rakho
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => isOwnCache(key) && key !== CACHE_NAME && key !== CACHE_AUDIO)
        .map(key => { console.log(`[SW] Deleting old cache: ${key}`); return caches.delete(key); })
    );

    await self.clients.claim();

    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach(client => client.postMessage({
      type: 'SW_UPDATED', version: VERSION, cache: CACHE_NAME
    }));
  })().catch(err => console.error(`[SW v${VERSION}] Activate failed:`, err)));
});

/* ------------------------------- Fetch ------------------------------ */

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') return;
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // 1. Audio Handler (Range requests aur bypass se pehle pakro)
  if (request.destination === 'audio' || url.pathname.includes('/audio/')) {
    event.respondWith(audioCacheFirst(event));
    return;
  }

  // 2. Non-audio range requests
  if (request.headers.has('range')) return;

  // 3. Single Page Navigation
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(event, INDEX_URL, TIMEOUT_NAVIGATION, true));
    return;
  }

  // 4. Core Scripts & Styles
  if (CORE_DESTINATIONS.has(request.destination)) {
    event.respondWith(networkFirst(event, request, TIMEOUT_CORE, false));
    return;
  }

  // 5. Static Assets
  event.respondWith(staleWhileRevalidate(event).catch(() => fetch(request)));
});

/* ------------------------------ Messages ---------------------------- */

self.addEventListener('message', event => {
  const data = event.data;
  const type = typeof data === 'string' ? data : data && data.type;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      reply(event, { type: 'SW_VERSION', version: VERSION, cache: CACHE_NAME });
      break;

    case 'CLEAR_CACHE':
      event.waitUntil(
        caches.keys()
          .then(keys => Promise.all(keys.filter(isOwnCache).map(key => caches.delete(key))))
          .then(precache)
          .then(() => reply(event, { type: 'CACHE_CLEARED' }))
          .catch(err => {
            console.error('[SW] CLEAR_CACHE failed:', err);
            reply(event, { type: 'CACHE_CLEAR_FAILED' });
          })
      );
      break;
  }
});