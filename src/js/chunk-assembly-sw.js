var MANIFEST_URL = "boxedwine-manifest.json";
var CACHE_PREFIX = "boxedwine-cache-";
var ZIP_FILENAME = "boxedwine.zip";

/* ── Install: pre-assemble zip into Cache API ── */

self.addEventListener("install", function (event) {
  console.log("[chunk-sw] Installing — pre-assembling zip");
  event.waitUntil(
    preAssemble().then(function () {
      console.log("[chunk-sw] Pre-assembly complete");
      return self.skipWaiting();
    })
  );
});

/* ── Activate: clean old caches, claim clients ── */

self.addEventListener("activate", function (event) {
  console.log("[chunk-sw] Activating — claiming clients");
  event.waitUntil(
    getManifestFromNetwork().then(function (manifest) {
      return evictOldCaches(manifest.version);
    }).catch(function () {
      return Promise.resolve();
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: serve boxedwine.zip from cache only ── */

self.addEventListener("fetch", function (event) {
  var url;
  try { url = new URL(event.request.url); } catch (e) { return; }

  if (!url.pathname.endsWith("/" + ZIP_FILENAME)) { return; }

  console.log("[chunk-sw] Intercept " + event.request.method + " " + url.pathname);

  if (event.request.method === "HEAD") {
    event.respondWith(handleHead());
    return;
  }

  event.respondWith(handleGet(event.request.url));
});

/* ── HEAD: return size from manifest without touching assembled data ── */

function handleHead() {
  return getManifestFromNetwork().catch(function () {
    return getManifestFromCache();
  }).then(function (manifest) {
    console.log("[chunk-sw] HEAD → " + manifest.totalSize + " bytes");
    return new Response(null, {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(manifest.totalSize)
      }
    });
  }).catch(function (err) {
    console.error("[chunk-sw] HEAD failed:", err);
    return new Response(null, { status: 500, statusText: "SW error" });
  });
}

/* ── GET: serve from cache; fallback to on-demand assembly ── */

function handleGet(requestUrl) {
  return findCachedZip(requestUrl).then(function (hit) {
    if (hit) {
      console.log("[chunk-sw] Serving from cache (" +
        hit.headers.get("Content-Length") + " bytes)");
      return hit;
    }
    console.log("[chunk-sw] Cache miss — assembling on demand");
    return assembleAndCache(requestUrl);
  }).catch(function (err) {
    console.error("[chunk-sw] GET failed:", err);
    return new Response("Service worker assembly error", { status: 500 });
  });
}

/* ── Pre-assemble during install ── */

function preAssemble() {
  return getManifestFromNetwork().then(function (manifest) {
    var cacheName = CACHE_PREFIX + manifest.version;
    var zipUrl = new URL(ZIP_FILENAME, self.registration.scope).href;

    return caches.open(cacheName).then(function (cache) {
      return cache.match(zipUrl).then(function (existing) {
        if (existing) {
          console.log("[chunk-sw] Already cached (v" + manifest.version + ")");
          return;
        }
        return fetchAndConcatChunks(manifest).then(function (arrayBuffer) {
          var response = new Response(arrayBuffer, {
            status: 200,
            statusText: "OK",
            headers: {
              "Content-Type": "application/zip",
              "Content-Length": String(arrayBuffer.byteLength)
            }
          });
          return cache.put(zipUrl, response).then(function () {
            console.log("[chunk-sw] Cached " + arrayBuffer.byteLength +
              " bytes as " + zipUrl);
          });
        });
      });
    });
  });
}

/* ── On-demand assembly (fallback if cache was evicted) ── */

function assembleAndCache(requestUrl) {
  return getManifestFromNetwork().catch(function () {
    return getManifestFromCache();
  }).then(function (manifest) {
    var cacheName = CACHE_PREFIX + manifest.version;
    return fetchAndConcatChunks(manifest).then(function (arrayBuffer) {
      var response = new Response(arrayBuffer, {
        status: 200,
        statusText: "OK",
        headers: {
          "Content-Type": "application/zip",
          "Content-Length": String(arrayBuffer.byteLength)
        }
      });
      return caches.open(cacheName).then(function (cache) {
        return cache.put(requestUrl, response.clone());
      }).then(function () {
        return response;
      });
    });
  });
}

/* ── Fetch chunks and concatenate into a single ArrayBuffer ── */

function fetchAndConcatChunks(manifest) {
  var baseUrl = self.registration.scope;

  var fetches = manifest.chunks.map(function (name) {
    var chunkUrl = new URL(name, baseUrl).href;
    console.log("[chunk-sw] Fetching chunk: " + name);
    return fetch(chunkUrl).then(function (r) {
      if (!r.ok) { throw new Error("Chunk " + name + " → " + r.status); }
      return r.arrayBuffer();
    });
  });

  return Promise.all(fetches).then(function (buffers) {
    var totalLen = buffers.reduce(function (s, b) { return s + b.byteLength; }, 0);
    var combined = new Uint8Array(totalLen);
    var offset = 0;
    for (var i = 0; i < buffers.length; i++) {
      combined.set(new Uint8Array(buffers[i]), offset);
      offset += buffers[i].byteLength;
    }
    console.log("[chunk-sw] Concatenated " + buffers.length +
      " chunks → " + totalLen + " bytes");
    return combined.buffer;
  });
}

/* ── Find cached zip across all version caches ── */

function findCachedZip(requestUrl) {
  return caches.keys().then(function (names) {
    var bwCaches = names.filter(function (n) {
      return n.startsWith(CACHE_PREFIX);
    });
    if (!bwCaches.length) { return null; }

    return bwCaches.reduce(function (chain, cacheName) {
      return chain.then(function (found) {
        if (found) { return found; }
        return caches.open(cacheName).then(function (cache) {
          return cache.match(requestUrl);
        });
      });
    }, Promise.resolve(null));
  });
}

/* ── Manifest helpers ── */

function getManifestFromNetwork() {
  var manifestUrl = new URL(MANIFEST_URL, self.registration.scope).href;
  return fetch(manifestUrl, { cache: "no-cache" }).then(function (r) {
    if (!r.ok) { throw new Error("Manifest " + r.status); }
    return r.json().then(function (manifest) {
      var cn = CACHE_PREFIX + manifest.version;
      return caches.open(cn).then(function (c) {
        return c.put(manifestUrl, new Response(JSON.stringify(manifest), {
          headers: { "Content-Type": "application/json" }
        }));
      }).then(function () { return manifest; });
    });
  });
}

function getManifestFromCache() {
  var manifestUrl = new URL(MANIFEST_URL, self.registration.scope).href;
  return caches.keys().then(function (names) {
    var bw = names.filter(function (n) { return n.startsWith(CACHE_PREFIX); }).sort();
    if (!bw.length) { throw new Error("No cached manifest"); }
    return caches.open(bw[bw.length - 1]).then(function (c) {
      return c.match(manifestUrl).then(function (hit) {
        if (!hit) { throw new Error("Manifest not in cache"); }
        return hit.json();
      });
    });
  });
}

/* ── Cache management ── */

function evictOldCaches(currentVersion) {
  var keep = CACHE_PREFIX + currentVersion;
  return caches.keys().then(function (names) {
    return Promise.all(
      names.filter(function (n) {
        return n.startsWith(CACHE_PREFIX) && n !== keep;
      }).map(function (n) {
        console.log("[chunk-sw] Evicting old cache: " + n);
        return caches.delete(n);
      })
    );
  });
}
