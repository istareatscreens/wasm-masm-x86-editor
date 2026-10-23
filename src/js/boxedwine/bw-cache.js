/*
 * bw-cache.js — boot-asset cache for the BoxedWine terminal.
 *
 * Serves the boot assets (guest zip, toolchain zip, wasm, glue) from the Cache API,
 * keyed by the build id, so a repeat visit does not download them again.
 *
 * Chunked guest image (Cloudflare Pages 25 MiB limit): bw-chunk-sw.js answers
 * latest26/<name> with the assembled bytes and keeps them in its own cache
 * "bw-chunks-<version>" (versions injected as BW_GUEST_CHUNKS). This layer
 *   - reads such a file straight from that cache, in a Worker (fetchBuffer), and then
 *     deletes the worker's caches of other versions,
 *   - waits for the worker (window.__swReady) only before fetching such a file,
 *   - does not store worker-assembled responses (X-BW-Assembled) a second time,
 *   - assembles the chunks in-page if the network fails for such a file.
 *
 * Fallback-safe: without `caches` (Electron file://, plain http) or on any cache error,
 * every call degrades to a plain fetch(). Caches of other build ids are deleted.
 */
(function () {
  "use strict";
  var PREFIX = "bw-assets-";
  var CHUNK_PREFIX = "bw-chunks-"; // the chunk worker's caches (bw-chunk-sw.js)
  var ASSET_DIR = "latest26/";
  var MANIFEST = ASSET_DIR + "chunks-manifest.json";
  var MARKER = "X-BW-Assembled";
  var pending = {}; // absolute url -> in-flight Response promise (prefetch)
  var stats = { hits: 0, misses: 0, puts: 0, bypass: 0, assembled: 0, chunkHits: 0, workerReads: 0 };
  var WORKER_READ_TIMEOUT_MS = 30000;

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
  // BW_GUEST_CHUNKS, or null when unknown (a raw src/ copy)
  function chunkList() {
    var m = window.BW_GUEST_CHUNKS;
    return (m && typeof m === "object") ? m : null;
  }
  // manifest version of a chunked file of this build, else null
  function chunkVersion(url) {
    var m = chunkList(), name = chunkedName(url);
    return (m && name && Object.prototype.hasOwnProperty.call(m, name)) ? String(m[name]) : null;
  }
  // may this url be a chunked file (listed, or the list is unknown)?
  function maybeChunked(url) {
    return chunkList() ? !!chunkVersion(url) : !!chunkedName(url);
  }
  // Network fetch with the worker gate and the chunked-asset fallback.
  function netFetch(url, init) {
    var gate = (!chunkList() || chunkVersion(url)) ? swReady() : Promise.resolve();
    return gate.then(function () { return fetch(url, init); }).then(function (resp) {
      if (resp && resp.ok) return resp;
      if (!maybeChunked(url)) return resp;
      return assembleInPage(chunkedName(url)).catch(function (e) { console.warn("[bw-cache] fallback failed: " + (e && e.message)); return resp; });
    }, function (err) {
      if (!maybeChunked(url)) throw err;
      return assembleInPage(chunkedName(url));
    });
  }
  // a chunked file from the worker's cache, or null
  function chunkCacheHit(url) {
    var v = chunkVersion(url);
    if (!v) return Promise.resolve(null);
    return caches.match(abs(url), { cacheName: CHUNK_PREFIX + v }).then(function (hit) {
      if (!hit || !hit.ok) return null;
      stats.chunkHits++;
      purgeOtherChunkVersions(CHUNK_PREFIX + v);
      return hit;
    }).catch(function () { return null; });
  }
  // The same entry read in a Worker and transferred back: reading the 60 MB body on the
  // page would occupy the main thread while the restore needs it. Resolves the
  // ArrayBuffer, or null (the caller then reads on the main thread).
  function cacheReadWorkerMain() { // runs in the worker (serialised with toString)
    self.onmessage = function (e) {
      var m = e.data;
      caches.match(m.url, { cacheName: m.cacheName }).then(function (r) {
        if (!r || !r.ok) { self.postMessage({ hit: false }); return; }
        return r.arrayBuffer().then(function (buf) { self.postMessage({ hit: true, buf: buf }, [buf]); });
      }).catch(function (err) { self.postMessage({ hit: false, error: String((err && err.message) || err) }); });
    };
  }
  function readChunkInWorker(url) {
    var v = chunkVersion(url);
    if (!v || typeof Worker === "undefined" || typeof URL === "undefined" || typeof URL.createObjectURL !== "function") return Promise.resolve(null);
    return new Promise(function (resolve) {
      var w = null, src = null, timer = null, settled = false;
      var finish = function (buf, why) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { if (w) w.terminate(); } catch (_) {}
        try { if (src) URL.revokeObjectURL(src); } catch (_) {}
        if (!buf && why) console.log("[bw-cache] worker read of " + chunkedName(url) + " unavailable (" + why + ") - reading on the main thread");
        resolve(buf);
      };
      try {
        src = URL.createObjectURL(new Blob(["(" + cacheReadWorkerMain.toString() + ")();"], { type: "text/javascript" }));
        w = new Worker(src);
      } catch (e) { finish(null, String((e && e.message) || e)); return; }
      w.onmessage = function (e) {
        var m = e.data || {};
        if (m.hit && m.buf && m.buf.byteLength) {
          stats.chunkHits++; stats.workerReads++;
          purgeOtherChunkVersions(CHUNK_PREFIX + v);
          finish(m.buf);
        } else finish(null, m.error || null);
      };
      w.onerror = function (ev) { try { ev.preventDefault(); } catch (_) {} finish(null, "worker error"); };
      timer = setTimeout(function () { finish(null, "no answer in " + WORKER_READ_TIMEOUT_MS + "ms"); }, WORKER_READ_TIMEOUT_MS);
      w.postMessage({ url: abs(url), cacheName: CHUNK_PREFIX + v });
    });
  }
  var chunkPurged = false;
  function purgeOtherChunkVersions(keep) {
    if (chunkPurged) return;
    chunkPurged = true;
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf(CHUNK_PREFIX) === 0 && k !== keep; })
        .map(function (k) { console.log("[bw-cache] deleting stale guest-image cache " + k); return caches.delete(k); }));
    }).catch(function () {});
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
    return chunkCacheHit(url).then(function (hit) {
      if (hit) return hit;
      return cachedFetchBuild(url, init, key);
    });
  }
  function cachedFetchBuild(url, init, key) {
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

  // { status, buffer } of an asset
  function responseToBuffer(resp) {
    if (!resp || resp.status !== 200) return { status: resp ? resp.status : 0, buffer: null };
    return resp.arrayBuffer().then(function (b) { return { status: 200, buffer: b }; });
  }
  function readBuffer(url, init) {
    return (available() ? readChunkInWorker(url) : Promise.resolve(null)).then(function (buf) {
      if (buf) return { status: 200, buffer: buf };
      return cachedFetch(url, init).then(responseToBuffer);
    });
  }

  // Start fetching now; the matching fetch / fetchBuffer later reuses the result (a chunked
  // file is prefetched as bytes).
  function prefetch(url, init) {
    var key = abs(url);
    if (!pending[key]) pending[key] = chunkVersion(url) ? { bytes: readBuffer(url, init) } : { resp: cachedFetch(url, init) };
    return pending[key].bytes || pending[key].resp;
  }
  function takePending(url) {
    var key = abs(url), e = pending[key];
    if (e) delete pending[key];
    return e || null;
  }
  function fetchAsset(url, init) {
    var e = takePending(url);
    if (e && e.resp) return e.resp;
    if (e && e.bytes) {
      return e.bytes.then(function (r) {
        return r.buffer ? new Response(r.buffer, { status: 200, headers: { "Content-Type": "application/zip", "Content-Length": String(r.buffer.byteLength) } })
                        : new Response(null, { status: r.status >= 200 && r.status <= 599 ? r.status : 502 });
      });
    }
    return cachedFetch(url, init);
  }
  function fetchBuffer(url, init) {
    var e = takePending(url);
    if (e && e.bytes) return e.bytes;
    if (e && e.resp) return e.resp.then(responseToBuffer);
    return readBuffer(url, init);
  }

  window.BWCache = { fetch: fetchAsset, fetchBuffer: fetchBuffer, prefetch: prefetch, purgeOld: purgeOld, name: cacheName, available: available, stats: stats, assemble: assembleInPage };
})();
