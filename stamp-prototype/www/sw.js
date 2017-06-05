var CACHE_NAME = 'stamp-prototype-v3';
var INITIAL_URLS_TO_CACHE = [];

self.addEventListener('install', function(event) {
  // Perform install steps
  event.waitUntil(
      caches.open(CACHE_NAME)
          .then(function(cache) {
            return cache.addAll(INITIAL_URLS_TO_CACHE);
          })
          .catch(function(error) {
            console.error('Failed to cache all resources.');
          })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
        .then(function(cachedResponse) {
          // Cache hit - return response
          if (cachedResponse) {
            return cachedResponse;
          }

          var fetchRequest = event.request.clone();

          return fetch(fetchRequest)
              .then(function(fetchResponse) {
                // Check if we received a valid response
                if (!fetchResponse || fetchResponse.status !== 200 ||
                    fetchResponse.type !== 'basic') {
                  return fetchResponse;
                }

                var responseToCache = fetchResponse.clone();

                if (!event.request.url.includes('.js') &&
                    !event.request.url.includes('.json') &&
                    !event.request.url.includes('.html') &&
                    !event.request.url.includes('.css')) {
                  caches.open(CACHE_NAME)
                      .then(function(cache) {
                        cache.put(event.request, responseToCache);
                      })
                      .catch(function(error) {
                        console.error('Failed cache resource.');
                      });
                } else {
                  console.log('Skipped caching ', event.request.url);
                }

                return fetchResponse;
              })
              .catch(function(error) {
                console.error('Failed to make fetch: ', fetchRequest);
              });
        })
        .catch(function(error) {
          console.error('Failed to open cache.');
        })
  );
});
