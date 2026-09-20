/*
 * bw-cache.js — boot-asset cache for the BoxedWine terminal.
 *
 * Serves the big boot assets (guest zip ~60MB, toolchain zip, wasm, glue) from
 * the window Cache API, keyed by the deployed build id, so a repeat visit does
 * NOT re-download them even on servers without ETags. The Cache API is usable
 * directly from the page in any secure context (https / localhost).
 *
 * CHUNKED GUEST IMAGE (Cloudflare Pages 25 MiB limit): the web build ships any
 * oversize guest zip as latest26/<name>.<hash>.partN + chunks-manifest.json and a
 * service worker (bw-chunk-sw.js, registered by boxedwine.html as window.__swReady)
 * answers the original latest26/<name> URL with the assembled bytes. This layer
 *   - awaits window.__swReady before its first network fetch (first visit: the
 *     worker must control the page before latest26/<name> is requested),
 *   - does NOT re-store worker-assembled responses (X-BW-Assembled header) — the
 *     worker's own cache already holds the 60MB,
 *   - assembles the chunks in-page when the network answers with an error for a
 *     manifest-listed file (worker unsupported/blocked): fetch the manifest, fetch
 *     the parts, concatenate. Electron (file://) ships whole zips and never hits this.
 *
 * FALLBACK-SAFE: when `caches` is unavailable (Electron file://, plain LAN http,
 * private-mode quirks) or any cache operation throws, every call degrades to a
 * plain fetch(). Cache writes are best-effort (quota/eviction just means a
 * network fetch next time). Caches from other build ids are deleted on first
 * use so a new deploy can never serve a stale glue/wasm pair.
 */
(function () {
  "use strict";
  var PREFIX = "bw-assets-";
  var ASSET_DIR = "latest26/";
  var MANIFEST = ASSET_DIR + "chunks-manifest.json";
  var MARKER = "X-BW-Assembled";
  var pending = {}; // absolute url -> in-flight Response promise (prefetch)
  var stats = { hits: 0, misses: 0, puts: 0, bypass: 0, assembled: 0 };

  // resolves once the chunk-assembly service worker controls the page (or never will)
  function swReady() {
    var p = window.__swReady;
    return (p && typeof p.then === "function") ? p.catch(function () {}) : Promise.resolve();
  }
  // "latest26/<name>" -> "<name>" for a same-origin url under the asset dir, else null
  function chunkedName(url) {
    var path; try { path = new URL(url, location.href).pathname; } catch (e) { return null; }
    var i = path.lastIndexOf("/" + ASSET_DIR);
    if (i < 0) return null;
    var name = path.slice(i + 1 + ASSET_DIR.length);
    return (name && name.indexOf("/") < 0) ? name : null;
  }
  var manifestPromise = null;
  function loadManifest() {
    if (!manifestPromise) {
      manifestPromise = fetch(MANIFEST, { cache: "no-cache" }).then(function (r) {
        if (!r.ok) throw new Error("manifest " + r.status);
        return r.json();
      }).catch(function (e) { manifestPromise = null; throw e; });
    }
    return manifestPromise;
  }
  // In-page fallback: build the Response for latest26/<name> from its chunks.
  function assembleInPage(name) {
    return loadManifest().then(function (manifest) {
      var entry = manifest.files && manifest.files[name];
      if (!entry) throw new Error(name + " is not a chunked asset");
      console.log("[bw-cache] assembling " + name + " in-page from " + entry.chunks.length + " chunks (no service worker)");
      return Promise.all(entry.chunks.map(function (c) {
        return fetch(ASSET_DIR + c).then(function (r) { if (!r.ok) throw new Error(c + " " + r.status); return r.arrayBuffer(); });
      })).then(function (buffers) {
        var total = buffers.reduce(function (n, b) { return n + b.byteLength; }, 0);
        if (total !== entry.totalSize) throw new Error(name + ": got " + total + " bytes, expected " + entry.totalSize);
        var out = new Uint8Array(total), off = 0;
        for (var i = 0; i < buffers.length; i++) { out.set(new Uint8Array(buffers[i]), off); off += buffers[i].byteLength; }
        stats.assembled++;
        return new Response(out.buffer, { status: 200, statusText: "OK",
          headers: { "Content-Type": "application/zip", "Content-Length": String(total) } });
      });
    });
  }
  // Network fetch with the worker gate and the chunked-asset fallback.
  function netFetch(url, init) {
    return swReady().then(function () { return fetch(url, init); }).then(function (resp) {
      var name = chunkedName(url);
      if (resp && resp.ok) return resp;
      if (!name) return resp;
      return assembleInPage(name).catch(function (e) { console.warn("[bw-cache] fallback failed: " + (e && e.message)); return resp; });
    }, function (err) {
      var name = chunkedName(url);
      if (!name) throw err;
      return assembleInPage(name);
    });
  }

  function cacheName() { return PREFIX + (window.BW_BUILD_ID || "dev"); }
  function available() {
    try {
      return typeof caches !== "undefined" && !!caches && typeof caches.open === "function" &&
             window.isSecureContext !== false && location.protocol !== "file:";
    } catch (e) { return false; }
  }
  function abs(url) { try { return new URL(url, location.href).href; } catch (e) { return url; } }

  var purged = null;
  function purgeOld() {
    if (purged) return purged;
    if (!available()) return (purged = Promise.resolve());
    purged = caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf(PREFIX) === 0 && k !== cacheName(); })
        .map(function (k) { console.log("[bw-cache] deleting stale cache " + k); return caches.delete(k); }));
    }).catch(function () {});
    return purged;
  }

  // Cache-first fetch. Returns a Response (from the cache or the network).
  function cachedFetch(url, init) {
    if (!available()) { stats.bypass++; return netFetch(url, init); }
    var key = abs(url);
    return purgeOld().then(function () { return caches.open(cacheName()); }).then(function (cache) {
      return cache.match(key).then(function (hit) {
        if (hit) { stats.hits++; return hit; }
        stats.misses++;
        return netFetch(url, init).then(function (resp) {
          // worker-assembled responses already live in the worker's cache: no second copy
          if (resp && resp.ok && resp.status === 200 && !resp.headers.get(MARKER)) {
            // clone() tees the body: one branch goes to disk, the other to the caller
            try { cache.put(key, resp.clone()).then(function () { stats.puts++; }).catch(function () {}); } catch (e) {}
          }
          return resp;
        });
      });
    }).catch(function () { stats.bypass++; return netFetch(url, init); });
  }

  // Start fetching now; the matching BWCache.fetch(url) later reuses the result.
  function prefetch(url, init) {
    var key = abs(url);
    if (!pending[key]) pending[key] = cachedFetch(url, init);
    return pending[key];
  }
  function fetchAsset(url, init) {
    var key = abs(url);
    if (pending[key]) { var p = pending[key]; delete pending[key]; return p; }
    return cachedFetch(url, init);
  }

  window.BWCache = { fetch: fetchAsset, prefetch: prefetch, purgeOld: purgeOld, name: cacheName, available: available, stats: stats, assemble: assembleInPage };
})();
