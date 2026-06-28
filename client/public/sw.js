// Service Worker para Pare Antes do Pix PWA
// Versão: 1.0.0

const CACHE_NAME = 'pare-antes-do-pix-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições para APIs externas
  if (url.origin !== location.origin) {
    return;
  }

  // Para requisições GET, usar network-first strategy
  if (request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache bem-sucedidas
          if (response.ok) {
            const cache = caches.open(CACHE_NAME);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Fallback para cache
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            // Se não estiver em cache, retornar página offline
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
        })
    );
  }
});

// Background Sync (sincronizar dados quando voltar online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      fetch('/api/sync').catch((err) => {
        console.warn('[SW] Sync failed:', err);
      })
    );
  }
});

// Push Notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'Pare Antes do Pix';
  const options = {
    body: data.body || 'Nova notificação de segurança',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%23dc2626" width="192" height="192" rx="45"/><text x="96" y="96" font-size="120" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-weight="bold">⚠️</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%23dc2626" width="192" height="192" rx="45"/><text x="96" y="96" font-size="120" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="Arial" font-weight="bold">⚠️</text></svg>',
    tag: 'pare-antes-do-pix',
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

console.log('[SW] Service Worker loaded');
