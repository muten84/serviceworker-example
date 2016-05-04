var CACHE_VERSION = 1;
var CURRENT_CACHES = {
  prefetch: 'prefetch-cache-v' + CACHE_VERSION
};

self.addEventListener('install', function(event) {
  var now = Date.now();

  var urlsToPrefetch = [
  './',
  'index.html',
  'sw-register.js',
  'example/4A7901663CE0468A121C10ABBA6F13C1.appcache',
  'example/4A7901663CE0468A121C10ABBA6F13C1.cache.js',
  'example/53DD84326EA48DEBDC49A5819CD5C642.appcache',
  'example/53DD84326EA48DEBDC49A5819CD5C642.cache.js',
  'example/542AF96ADEAAFF4DE432384B32C53A6B.appcache',
  'example/542AF96ADEAAFF4DE432384B32C53A6B.cache.js',
  'example/6A844AFB05C3F104E40BA631F6B874D0.appcache',
  'example/6A844AFB05C3F104E40BA631F6B874D0.cache.js',
  'example/95E7860F0568CBCED3A954A531E20676.appcache',
  'example/95E7860F0568CBCED3A954A531E20676.cache.js',
  'example/awesomize.js',
  'example/bonsai tree.jpg',
  'example/clear.cache.gif',
  'example/compilation-mappings.txt',
  'example/css/bootstrap-responsive.min.css',
  'example/css/bootstrap.min.css',
  'example/css/font-awesome-ie7.css',
  'example/css/font-awesome-ie7.min.css',
  'example/css/font-awesome.css',
  'example/css/font-awesome.min.css',
  'example/css/gwt-bootstrap.css',
  'example/css/prettify.css',
  'example/example.devmode.js',
  'example/example.nocache.js',
  'example/font/fontawesome-webfont.eot',
  'example/font/fontawesome-webfont.svg',
  'example/font/fontawesome-webfont.ttf',
  'example/font/fontawesome-webfont.woff',
  'example/font/FontAwesome.otf',
  'example/img/glyphicons-halflings-white.png',
  'example/img/glyphicons-halflings.png',
  'example/js/bootstrap.min.js',
  'example/js/html5.js',
  'example/js/iconListExtractor.js',
  'example/js/jquery-1.10.1.min.js',
  'example/permutations.xml',
  'example/prettify/lang-apollo.js',
  'example/prettify/lang-clj.js',
  'example/prettify/lang-css.js',
  'example/prettify/lang-go.js',
  'example/prettify/lang-hs.js',
  'example/prettify/lang-lisp.js',
  'example/prettify/lang-lua.js',
  'example/prettify/lang-ml.js',
  'example/prettify/lang-n.js',
  'example/prettify/lang-proto.js',
  'example/prettify/lang-scala.js',
  'example/prettify/lang-sql.js',
  'example/prettify/lang-tex.js',
  'example/prettify/lang-vb.js',
  'example/prettify/lang-vhdl.js',
  'example/prettify/lang-wiki.js',
  'example/prettify/lang-xq.js',
  'example/prettify/lang-yaml.js',
  'example/prettify/prettify.css',
  'example/prettify/prettify.js',
  ];

  // All of these logging statements should be visible via the "Inspect" interface
  // for the relevant SW accessed via chrome://serviceworker-internals
  console.log('Handling install event. Resources to prefetch:', urlsToPrefetch);

  event.waitUntil(
    caches.open(CURRENT_CACHES.prefetch).then(function(cache) {
      var cachePromises = urlsToPrefetch.map(function(urlToPrefetch) {
        
        var url = new URL(urlToPrefetch, location.href);
        // Append a cache-bust=TIMESTAMP URL parameter to each URL's query string.
        // This is particularly important when precaching resources that are later used in the
        // fetch handler as responses directly, without consulting the network (i.e. cache-first).
        // If we were to get back a response from the HTTP browser cache for this precaching request
        // then that stale response would be used indefinitely, or at least until the next time
        // the service worker script changes triggering the install flow.
        url.search += (url.search ? '&' : '?') + 'cache-bust=' + now;

        // It's very important to use {mode: 'no-cors'} if there is any chance that
        // the resources being fetched are served off of a server that doesn't support
        // CORS (http://en.wikipedia.org/wiki/Cross-origin_resource_sharing).
        // In this example, www.chromium.org doesn't support CORS, and the fetch()
        // would fail if the default mode of 'cors' was used for the fetch() request.
        // The drawback of hardcoding {mode: 'no-cors'} is that the response from all
        // cross-origin hosts will always be opaque
        // (https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#cross-origin-resources)
        // and it is not possible to determine whether an opaque response represents a success or failure
        // (https://github.com/whatwg/fetch/issues/14).
        var request = new Request(url, {mode: 'no-cors'});
        return fetch(request).then(function(response) {
          if (response.status >= 400) {
            throw new Error('request for ' + urlToPrefetch +
              ' failed with status ' + response.statusText);
          }

          // Use the original URL without the cache-busting parameter as the key for cache.put().
          return cache.put(urlToPrefetch, response);
        }).catch(function(error) {
          console.error('Not caching ' + urlToPrefetch + ' due to ' + error);
        });
      });

      return Promise.all(cachePromises).then(function() {
        console.log('Pre-fetching complete.');
      });
    }).catch(function(error) {
      console.error('Pre-fetching failed:', error);
    })
  );
});

self.addEventListener('activate', function(event) {
  // Delete all caches that aren't named in CURRENT_CACHES.
  // While there is only one cache in this example, the same logic will handle the case where
  // there are multiple versioned caches.
  var expectedCacheNames = Object.keys(CURRENT_CACHES).map(function(key) {
    return CURRENT_CACHES[key];
  });

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (expectedCacheNames.indexOf(cacheName) === -1) {
            // If this cache name isn't present in the array of "expected" cache names, then delete it.
            console.log('Deleting out of date cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  console.log('Handling fetch event for', event.request.url);

  event.respondWith(
    // caches.match() will look for a cache entry in all of the caches available to the service worker.
    // It's an alternative to first opening a specific named cache and then matching on that.
    caches.match(event.request).then(function(response) {
      if (response) {
        console.log('Found response in cache:', response);

        return response;
      }

      console.log('No response found in cache. About to fetch from network...');

      // event.request will always have the proper mode set ('cors, 'no-cors', etc.) so we don't
      // have to hardcode 'no-cors' like we do when fetch()ing in the install handler.
      return fetch(event.request).then(function(response) {
        console.log('Response from network is:', response);

        return response;
      }).catch(function(error) {
        // This catch() will handle exceptions thrown from the fetch() operation.
        // Note that a HTTP error response (e.g. 404) will NOT trigger an exception.
        // It will return a normal response object that has the appropriate error code set.
        console.error('Fetching failed:', error);

        throw error;
      });
    })
  );
});
