/* =====================================================================
 * IdentIQ — Service Worker (production)
 * LOCATION : site ROOT  ->  /service-worker.js
 * VERSION  : 6.1.0 (Architecture Refactor & Centralized Contracts)
 * ===================================================================== */
"use strict";

const VERSION = "6.1.1";
const CACHE_PREFIX = "identiq-";
const CACHE_NAME = `${CACHE_PREFIX}v${VERSION}`;
const CACHE_AUDIO = `${CACHE_PREFIX}audio-v1`;

const SCOPE = self.registration.scope;

/**
 * Resolves a relative path to an absolute URL against the service worker scope.
 * @param {string} path - Relative path to resolve.
 * @returns {string} Absolute URL string.
 */
const toURL = (path) => new URL(path, SCOPE).href;
const INDEX_URL = toURL("./index.html");

const PRECACHE = [
  "./index.html",
  "./css/style.css",
  "./css/settings.css",
  "./css/names.css",
  "./css/copy-fx.css",
  "./js/config.js",
  "./js/ui.js",
  "./js/extractor.js",
  "./js/generator.js",
  "./js/settings.js",
  "./js/main.js",
  "./js/names-data.js",
  "./js/names.js",
  "./lib/moment.min.js",
  "./lib/moment-hijri.min.js",
  "./lib/confetti.browser.min.js",
  "./manifest.json",
  "./assets/logo.png",
].map(toURL);

const TIMEOUT_NAVIGATION = 4000;
const TIMEOUT_CORE = 3000;
const CORE_DESTINATIONS = new Set(["script", "style", "worker"]);

/**
 * Determines whether a cache key belongs to this application's cache namespace.
 * @param {string} key - Cache storage key name.
 * @returns {boolean} True if the key starts with the app cache prefix.
 */
const isOwnCache = (key) => key.startsWith(CACHE_PREFIX);

/**
 * Sends a message back to the client that originated the given event.
 * @param {ExtendableMessageEvent} event - Message event carrying the source client.
 * @param {Object} message - Payload to post to the source client.
 * @returns {void}
 */
const reply = (event, message) => {
  if (event.source && event.source.postMessage)
    event.source.postMessage(message);
};

/**
 * Builds the fallback HTML page shown when a navigation fails while offline.
 * @returns {Response} A 503 HTML response with an offline notice.
 */
const offlineResponse = () =>
  new Response(
    '<!doctype html><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      "<title>Offline</title>" +
      '<body style="margin:0;height:100vh;display:grid;place-items:center;' +
      'font-family:system-ui,sans-serif;background:#080a0d;color:#fff">' +
      "<p>Aap offline hain. Connection check karke dobara try karein.</p></body>",
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

/**
 * Checks whether a response is a successful same-origin response that may be stored in cache.
 * @param {Response} res - Response to evaluate.
 * @returns {boolean} True if the response has status 200 and a basic or default type.
 */
const isCacheable = (res) =>
  !!res &&
  res.status === 200 &&
  (res.type === "basic" || res.type === "default");

/**
 * Rebuilds a redirected response into a clean response so it can be safely cached and served.
 * @param {Response} response - Response that may have been redirected.
 * @returns {Promise<Response>} The original response, or a new non-redirected copy if it was redirected.
 */
async function cleanResponse(response) {
  if (!response.redirected) return response;
  const body = await response.blob();
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

/**
 * Stores a cleaned copy of a response in the app shell cache, logging a warning on failure.
 * @param {Request|string} key - Request or URL used as the cache key.
 * @param {Response} response - Response to clean and store.
 * @returns {Promise<void>} Resolves once the cache write completes or the error is logged.
 */
function safePut(key, response) {
  return cleanResponse(response)
    .then((res) => caches.open(CACHE_NAME).then((cache) => cache.put(key, res)))
    .catch((err) => console.warn("[SW] cache.put failed:", err));
}

/**
 * Rejects a promise with a timeout error if it does not settle within the given time.
 * @param {Promise<any>} promise - Promise to race against the timeout.
 * @param {number} ms - Timeout duration in milliseconds.
 * @returns {Promise<any>} The original promise result, or a rejection with "Network timeout".
 */
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("Network timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Downloads every core app shell asset fresh from the network and stores it in the current cache, failing if any asset is invalid.
 * @returns {Promise<void>} Resolves when all precache assets are stored, rejects on any failure.
 */
async function precache() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    PRECACHE.map(async (url) => {
      const res = await fetch(new Request(url, { cache: "reload" }));
      if (!res.ok) throw new Error(`Precache failed (${res.status}): ${url}`);

      const type = res.headers.get("Content-Type") || "";
      if (!url.endsWith(".html") && type.includes("text/html")) {
        throw new Error(`Precache got HTML instead of an asset: ${url}`);
      }

      await cache.put(url, await cleanResponse(res));
    }),
  );
}

/**
 * Serves a request from the network within a time limit, refreshing the cache in the background and falling back to the cached copy on failure.
 * @param {FetchEvent} event - The fetch event being handled.
 * @param {Request|string} cacheKey - Key used to read and write the cached response.
 * @param {number} timeoutMs - Maximum time in milliseconds to wait for the network.
 * @param {boolean} isNavigation - Whether the request is a page navigation, enabling the offline page fallback.
 * @returns {Promise<Response>} Network response, cached response, offline page, or an error response.
 */
async function networkFirst(event, cacheKey, timeoutMs, isNavigation) {
  const network = (async () =>
    (await event.preloadResponse) || fetch(event.request))();

  event.waitUntil(
    network
      .then((res) =>
        isCacheable(res) ? safePut(cacheKey, res.clone()) : undefined,
      )
      .catch(() => {}),
  );

  try {
    const res = await withTimeout(network, timeoutMs);
    if (res.status >= 500) throw new Error(`Server error ${res.status}`);
    return res;
  } catch (err) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(cacheKey, { ignoreSearch: true });
    if (cached) return cached;
    return isNavigation ? offlineResponse() : Response.error();
  }
}

/**
 * Serves a cached response immediately when available while refreshing the cache from the network in the background.
 * @param {FetchEvent} event - The fetch event being handled.
 * @returns {Promise<Response>} Cached response, fresh network response, or an error response.
 */
async function staleWhileRevalidate(event) {
  const { request } = event;
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const update = fetch(request)
    .then(async (res) => {
      if (isCacheable(res)) await safePut(request, res.clone());
      return res;
    })
    .catch(() => undefined);

  event.waitUntil(update);
  return cached || (await update) || Response.error();
}

/**
 * Serves audio from a persistent audio cache, downloading on demand, and answers Range requests with HTTP 206 partial content.
 * @param {FetchEvent} event - The fetch event for the audio request.
 * @returns {Promise<Response>} Full audio response, a 206 partial response for range requests, or an error response.
 */
async function audioCacheFirst(event) {
  const { request } = event;
  const cleanUrl = request.url.split("?")[0];
  const cache = await caches.open(CACHE_AUDIO);

  let response = await cache.match(cleanUrl);

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

  const rangeHeader = request.headers.get("range");
  if (!rangeHeader) return response;

  const arrayBuffer = await response.arrayBuffer();
  const bytes = /^bytes=(\d+)-(\d+)?$/.exec(rangeHeader);
  if (!bytes) return response;

  const start = Number(bytes[1]);
  const end = bytes[2] ? Number(bytes[2]) : arrayBuffer.byteLength - 1;
  const chunk = arrayBuffer.slice(start, end + 1);

  return new Response(chunk, {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
      "Content-Range": `bytes ${start}-${end}/${arrayBuffer.byteLength}`,
      "Content-Length": String(chunk.byteLength),
    },
  });
}

/**
 * Handles the install event by precaching the full app shell and failing installation if any asset cannot be cached.
 * @param {ExtendableEvent} event - The service worker install event.
 * @returns {void}
 */
self.addEventListener("install", (event) => {
  event.waitUntil(
    precache()
      .then(() => console.log(`[SW v${VERSION}] Precache complete`))
      .catch((err) => {
        console.error(`[SW v${VERSION}] Install failed:`, err);
        throw err;
      }),
  );
});

/**
 * Handles the activate event by enabling navigation preload, deleting outdated shell caches while keeping the audio cache, claiming clients, and notifying them of the update.
 * @param {ExtendableEvent} event - The service worker activate event.
 * @returns {void}
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) {
        try {
          await self.registration.navigationPreload.enable();
        } catch (err) {}
      }

      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              isOwnCache(key) && key !== CACHE_NAME && key !== CACHE_AUDIO,
          )
          .map((key) => {
            console.log(`[SW] Deleting old cache: ${key}`);
            return caches.delete(key);
          }),
      );

      await self.clients.claim();

      const clients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      clients.forEach((client) =>
        client.postMessage({
          type: "SW_UPDATED",
          version: VERSION,
          cache: CACHE_NAME,
        }),
      );
    })().catch((err) =>
      console.error(`[SW v${VERSION}] Activate failed:`, err),
    ),
  );
});

/**
 * Routes same-origin GET requests to the audio, navigation, core asset, or static asset caching strategy.
 * @param {FetchEvent} event - The service worker fetch event.
 * @returns {void}
 */
self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;
  if (request.cache === "only-if-cached" && request.mode !== "same-origin")
    return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.destination === "audio" || url.pathname.includes("/audio/")) {
    event.respondWith(audioCacheFirst(event));
    return;
  }

  if (request.headers.has("range")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(event, INDEX_URL, TIMEOUT_NAVIGATION, true));
    return;
  }

  if (CORE_DESTINATIONS.has(request.destination)) {
    event.respondWith(networkFirst(event, request, TIMEOUT_CORE, false));
    return;
  }

  event.respondWith(staleWhileRevalidate(event).catch(() => fetch(request)));
});

/**
 * Handles client messages to skip waiting, report the worker version, or clear and rebuild the app caches.
 * @param {ExtendableMessageEvent} event - The service worker message event carrying a string or object with a type.
 * @returns {void}
 */
self.addEventListener("message", (event) => {
  const data = event.data;
  const type = typeof data === "string" ? data : data && data.type;

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;

    case "GET_VERSION":
      reply(event, { type: "SW_VERSION", version: VERSION, cache: CACHE_NAME });
      break;

    case "CLEAR_CACHE":
      event.waitUntil(
        caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys.filter(isOwnCache).map((key) => caches.delete(key)),
            ),
          )
          .then(precache)
          .then(() => reply(event, { type: "CACHE_CLEARED" }))
          .catch((err) => {
            console.error("[SW] CLEAR_CACHE failed:", err);
            reply(event, { type: "CACHE_CLEAR_FAILED" });
          }),
      );
      break;
  }
});
