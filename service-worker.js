const SW_VERSION   = '4.4.0';
const CACHE_NAME   = 'identiq-v4-4';

const ASSETS = [
    './',
    './index.html',
    './login.html',
    './css/style.css',
    './css/settings.css',
    './css/login.css',
    './js/ui.js',
    './js/extractor.js',
    './js/generator.js',
    './js/settings.js',
    './js/main.js',
    './js/mouse.js',
    './js/login.js',
    './js/firebase-config.js',
    './lib/moment.min.js',
    './lib/moment-hijri.min.js',
    './manifest.json',
    './assets/logo.png'
];

self.addEventListener('install', event => {
    console.log(`[SW v${SW_VERSION}] Installing — cache: ${CACHE_NAME}`);

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            Promise.allSettled(
                ASSETS.map(url =>
                    cache.add(url).catch(err =>
                        console.warn(`[SW] Failed to cache: ${url}`, err)
                    )
                )
            )
        ).then(() => {
            console.log(`[SW v${SW_VERSION}] Pre-cache complete`);
        })
    );
});

self.addEventListener('activate', event => {
    console.log(`[SW v${SW_VERSION}] Activating — cleaning old caches`);

    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log(`[SW] Deleting old cache: ${key}`);
                        return caches.delete(key);
                    })
            ))
            .then(() => self.skipWaiting())
            .then(() => self.clients.claim())
            .then(() => {
                return self.clients.matchAll({ type: 'window' }).then(clients => {
                    clients.forEach(client =>
                        client.postMessage({
                            type: 'SW_UPDATED',
                            version: SW_VERSION,
                            cache: CACHE_NAME
                        })
                    );
                });
            })
    );
});

self.addEventListener('fetch', event => {

    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    if (url.origin !== self.location.origin) {
        event.respondWith(
            fetch(event.request)
                .catch(() => caches.match(event.request))
        );
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache =>
                            cache.put(event.request, clone)
                        );
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match('./index.html');
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) {
                const networkUpdate = fetch(event.request).then(response => {
                    if (response && response.status === 200 && response.type !== 'opaque') {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache =>
                            cache.put(event.request, clone)
                        );
                    }
                    return response;
                }).catch(function(){});

                return cached;
            }

            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type === 'opaque') {
                    return response;
                }
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache =>
                    cache.put(event.request, clone)
                );
                return response;
            }).catch(() => {
                return caches.match(event.request);
            });
        })
    );
});

self.addEventListener('message', event => {
    const data = event.data;

    if (data === 'SKIP_WAITING' || data?.type === 'SKIP_WAITING') {
        console.log(`[SW v${SW_VERSION}] SKIP_WAITING received`);
        self.skipWaiting();
        return;
    }

    if (data?.type === 'CLEAR_CACHE') {
        caches.delete(CACHE_NAME).then(() => {
            console.log(`[SW v${SW_VERSION}] Cache cleared on request`);
            if (event.source && event.source.postMessage) {
                event.source.postMessage({ type: 'CACHE_CLEARED' });
            }
        });
        return;
    }

    if (data?.type === 'GET_VERSION') {
        if (event.source && event.source.postMessage) {
            event.source.postMessage({
                type: 'SW_VERSION',
                version: SW_VERSION,
                cache: CACHE_NAME
            });
        }
        return;
    }
});
