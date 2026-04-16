// ═══════════════════════════════════════════════════════════
// sw.js — The Word Arcade Service Worker
// Enables offline play and PWA install prompt on Chrome/Safari
// ═══════════════════════════════════════════════════════════

const CACHE_NAME = 'word-arcade-v1';

// All static assets to pre-cache on install
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/styles.css',
    '/manifest.json',
    '/icons/icon-192.jpg',
    '/icons/icon-512.jpg',


    // Scripts
    '/scripts/app.js',
    '/scripts/audio.js',
    '/scripts/effects.js',
    '/scripts/share-manager.js',
    '/scripts/compound-chain.js',
    '/scripts/shiritori-royale.js',
    '/scripts/daily.js',
    '/scripts/achievements.js',
    '/scripts/multiplayer.js',

    // Data
    '/data/dictionary.js',
    '/data/bot-dictionary.js',
    '/data/extra-words.js',
    '/data/compound-levels.js',

    // Fonts (Google Fonts cached via network first)
];

// ── Install: pre-cache all static assets ─────────────────────
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(PRECACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// ── Activate: delete stale caches ─────────────────────────────
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// ── Fetch: cache-first for static, network-first for API ─────
self.addEventListener('fetch', event => {
    // Skip non-GET and cross-origin requests (Supabase, Google Fonts)
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== location.origin) return;

    event.respondWith(
        caches.match(event.request).then(cached => {
            if (cached) return cached;

            return fetch(event.request).then(response => {
                // Only cache successful same-origin responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const toCache = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
                return response;
            }).catch(() => {
                // Offline fallback — serve the cached root
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
