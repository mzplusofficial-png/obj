// Importer les scripts Firebase pour le service worker (v9 compat)
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Ces valeurs DOIVENT correspondre exactement à votre projet Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAaHLKDOeDvHogKY22PCjA8XfzRv-HXLqw",
  authDomain: "gen-lang-client-0260821538.firebaseapp.com",
  projectId: "gen-lang-client-0260821538",
  storageBucket: "gen-lang-client-0260821538.firebasestorage.app",
  messagingSenderId: "627912091228",
  appId: "1:627912091228:web:5662acb38029ac349b6899"
};

// Initialisation
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// ✅ CORRECTION : Amélioration de la gestion des messages en arrière-plan
// Cela garantit que les notifications sont affichées même si l'app est fermée
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Message en arrière-plan reçu :', payload);
  
  try {
    const icon = payload.data?.icon || payload.notification?.icon || '/icon.png';
    const title = payload.notification?.title || payload.data?.title || 'Elite MZ+ Alert';
    const body = payload.notification?.body || payload.data?.body || 'Nouvelle notification reçue de l\'Elite System.';
    
    const notificationOptions = {
      body: body,
      icon: icon,
      badge: icon,
      tag: 'mz-plus-push',
      renotify: true,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200],
      data: {
        url: payload.data?.url || '/'
      }
    };

    console.log('[SW] Affichage de la notification:', { title, body });
    return self.registration.showNotification(title, notificationOptions);
  } catch (error) {
    console.error('[SW] Erreur lors de l\'affichage de la notification:', error);
    // Fallback : afficher une notification générique
    return self.registration.showNotification('Elite MZ+ System', {
      body: 'Une nouvelle notification a été reçue',
      icon: '/icon.png',
      tag: 'mz-plus-push-fallback'
    });
  }
});

// ✅ CORRECTION : Version du cache incrémentée pour forcer la mise à jour
const CACHE_NAME = 'mz-elite-v6';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ✅ CORRECTION : Événement d'installation avec meilleure gestion d'erreur
self.addEventListener('install', (event) => {
  console.log('[SW] Installation du Service Worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Mise en cache des ressources critiques');
      return cache.addAll(ASSETS_TO_CACHE).catch((error) => {
        console.warn('[SW] Certaines ressources n\'ont pas pu être mises en cache:', error);
        // Ne pas échouer l'installation si certaines ressources ne sont pas disponibles
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// ✅ CORRECTION : Événement d'activation avec meilleure gestion
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation du Service Worker...');
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Nettoyage rigoureux des anciens caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              console.log('[SW] Suppression du vieux cache:', name);
              return caches.delete(name);
            }
          })
        );
      })
    ])
  );
  console.log('[SW] Service Worker activé avec succès');
});

// ✅ CORRECTION : Amélioration de l'interception des requêtes avec gestion d'erreur
self.addEventListener('fetch', (event) => {
  // On ne met pas en cache les requêtes Firebase ou externes (API)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Si la réponse est valide, on met à jour le cache
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((error) => {
        console.warn('[SW] Fetch failed, using cache:', event.request.url, error);
        return cachedResponse;
      });

      // Stratégie : Réseau d'abord pour le HTML/Manifest, Cache d'abord pour le reste
      const isCritical = event.request.url.endsWith('index.html') || 
                       event.request.url.endsWith('manifest.json') || 
                       event.request.url === self.location.origin + '/';

      if (isCritical) {
        return fetchPromise.then(res => res || cachedResponse);
      }

      return cachedResponse || fetchPromise;
    }).catch((error) => {
      console.error('[SW] Cache match failed:', error);
      return new Response('Offline', { status: 503 });
    })
  );
});

// Gestion du clic
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si le site est déjà ouvert, on lui donne le focus
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon on ouvre un nouvel onglet
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
