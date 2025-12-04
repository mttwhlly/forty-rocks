// Service Worker for NYC Birthday Adventure PWA
const CACHE_VERSION = 'v19'; // Increment this with each deploy
const CACHE_NAME = `nyc-birthday-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/app.js',
    '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching app assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error('Cache failed:', err))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName.startsWith('nyc-birthday-') && cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-http requests
    if (!event.request.url.startsWith('http')) {
        return;
    }

    // Network-first for HTML
    if (event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    if (response && response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request).then(r => r || fetch(event.request)))
        );
        return;
    }
    
    // Network-only for API calls (Mapbox, Supabase)
    if (event.request.url.includes('api.mapbox.com') || 
        event.request.url.includes('supabase.co') ||
        event.request.url.includes('supabase.com') ||
        event.request.url.includes('cdn.jsdelivr.net')) {
        event.respondWith(fetch(event.request));
        return;
    }
    
    // Cache-first strategy for static assets
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                
                return fetch(event.request).then((response) => {
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }
                    
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                    
                    return response;
                });
            })
            .catch(() => fetch(event.request))
    );
});