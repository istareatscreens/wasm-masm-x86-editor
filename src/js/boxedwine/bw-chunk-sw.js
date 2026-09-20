/*
 * bw-chunk-sw.js — service worker that reassembles the chunked BoxedWine guest
 * image for the web build (Cloudflare Pages rejects files over 25 MiB).
 *
 * scripts/chunk-guest.cjs splits src/bw-assets/TinyCore15Wine6.0-preboot-fw-trim.zip into
 * latest26/<name>.<hash>.partN files and writes latest26/chunks-manifest.json:
 *   { version, chunkSize, files: { "<name>": { totalSize, hash, chunks: [...] } } }
 *
 * Lifecycle (ported from the previous deployment's chunk-assembly-sw.js):
 *   install  - fetch the manifest, pre-assemble every listed file into the
 *              Cache API (cache "bw-chunks-<version>"), then skipWaiting()
 *   activate - evict bw-chunks-* caches of other versions, clients.claim()
 *   fetch    - only requests whose path ends with "/latest26/<listed file>" are
 *              answered (GET -> assembled bytes, HEAD -> headers only); every
 *              other request falls through to the network untouched.
 *
 * Answered responses carry "X-BW-Assembled: 1" so bw-cache.js does not store a
 * second 60 MB copy in its own build-keyed cache. Registered at the site root by
 * boxedwine.html (window.__swReady); bw-cache.js waits for the worker before its
 * first network fetch and can assemble in-page if no worker is available.
 */
/* eslint-disable no-restricted-globals */
var ASSET_DIR = "latest26/";
var MANIFEST_URL = ASSET_DIR + "chunks-manifest.json";
var CACHE_PREFIX = "bw-chunks-";
// cache prefix of the previous deployment's worker (chunk-assembly-sw.js, one
// 60 MB boxedwine.zip per version): evicted on activate so returning visitors
// do not keep a stale copy next to ours
var LEGACY_CACHE_PREFIX = "boxedwine-cache-";
var MARKER = "X-BW-Assembled";

function log() { try { console.log.apply(console, ["[bw-chunk-sw]"].concat([].slice.call(arguments))); } catch (e) {} }
function absUrl(rel) { return new URL(rel, self.registration.scope).href; }
function zipResponse(buffer, headOnly) {
  return new Response(headOnly ? null : buffer, {
    status: 200,
    statusText: "OK",
    headers: {
      "Content-Type": "application/zip",
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-store",
      "X-BW-Assembled": "1"
    }
  });
}

/* -- install: pre-assemble everything the manifest lists -------------------- */
self.addEventListener("install", function (event) {
  log("installing - pre-assembling chunked assets");
  event.waitUntil(
    fetchManifest().then(function (manifest) {
      var names = Object.keys(manifest.files || {});
      return names.reduce(function (chain, name) {
        return chain.then(function () { return ensureAssembled(manifest, name); });
      }, Promise.resolve());
    }).catch(function (err) {
      // never block installation: fetch() falls back to on-demand assembly
      log("pre-assembly skipped:", err && err.message);
    }).then(function () { return self.skipWaiting(); })
  );
});

/* -- activate: drop other versions, take over open pages -------------------- */
self.addEventListener("activate", function (event) {
  event.waitUntil(
    fetchManifest().then(function (manifest) { return evictOtherVersions(manifest.version); })
      .catch(function () {})
      .then(function () { log("active - claiming clients"); return self.clients.claim(); })
  );
});

/* -- fetch: answer only the listed latest26/<name> URLs ---------------------- */
self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET" && req.method !== "HEAD") return;
  var url;
  try { url = new URL(req.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;
  var idx = url.pathname.lastIndexOf("/" + ASSET_DIR);
  if (idx < 0) return;
  var name = url.pathname.slice(idx + 1 + ASSET_DIR.length);
  if (!name || name.indexOf("/") >= 0 || name === "chunks-manifest.json" || /\.part\d+$/.test(name)) return;
  event.respondWith(
    getManifest().then(function (manifest) {
      if (!manifest.files || !manifest.files[name]) return fetch(req); // not chunked: plain file
      return ensureAssembled(manifest, name).then(function (cached) {
        if (req.method === "HEAD") {
          return new Response(null, { status: 200, statusText: "OK", headers: cached.headers });
        }
        return cached;
      });
    }).catch(function (err) {
      log("failed for " + name + ":", err && err.message);
      return fetch(req);
    })
  );
});

/* -- helpers ------------------------------------------------------------------ */
var manifestPromise = null;
function fetchManifest() {
  return fetch(absUrl(MANIFEST_URL), { cache: "no-cache" }).then(function (r) {
    if (!r.ok) throw new Error("manifest " + r.status);
    return r.json();
  }).then(function (manifest) {
    manifestPromise = Promise.resolve(manifest);
    return caches.open(CACHE_PREFIX + manifest.version).then(function (cache) {
      return cache.put(absUrl(MANIFEST_URL), new Response(JSON.stringify(manifest), { headers: { "Content-Type": "application/json" } }));
    }).catch(function () {}).then(function () { return manifest; });
  });
}
// network first (a redeploy must be noticed), then any cached copy
function getManifest() {
  return fetchManifest().catch(function () {
    if (manifestPromise) return manifestPromise;
    return caches.keys().then(function (keys) {
      var ours = keys.filter(function (k) { return k.indexOf(CACHE_PREFIX) === 0; }).sort();
      if (!ours.length) throw new Error("no manifest");
      return caches.open(ours[ours.length - 1]).then(function (c) { return c.match(absUrl(MANIFEST_URL)); })
        .then(function (hit) { if (!hit) throw new Error("no cached manifest"); return hit.json(); });
    });
  });
}
// resolves with the cached Response for latest26/<name>, assembling it first if needed
function ensureAssembled(manifest, name) {
  var entry = manifest.files[name];
  var key = absUrl(ASSET_DIR + name);
  return caches.open(CACHE_PREFIX + manifest.version).then(function (cache) {
    return cache.match(key).then(function (hit) {
      if (hit) return hit;
      return concatChunks(entry).then(function (buffer) {
        if (buffer.byteLength !== entry.totalSize) {
          throw new Error(name + ": assembled " + buffer.byteLength + " bytes, expected " + entry.totalSize);
        }
        log("assembled " + name + " from " + entry.chunks.length + " chunks (" + buffer.byteLength + " bytes)");
        return cache.put(key, zipResponse(buffer)).catch(function (e) { log("cache put failed:", e && e.message); })
          .then(function () { return cache.match(key); })
          .then(function (stored) { return stored || zipResponse(buffer); });
      });
    });
  });
}
function concatChunks(entry) {
  return Promise.all(entry.chunks.map(function (chunkName) {
    return fetch(absUrl(ASSET_DIR + chunkName)).then(function (r) {
      if (!r.ok) throw new Error(chunkName + " " + r.status);
      return r.arrayBuffer();
    });
  })).then(function (buffers) {
    var total = buffers.reduce(function (n, b) { return n + b.byteLength; }, 0);
    var out = new Uint8Array(total), offset = 0;
    for (var i = 0; i < buffers.length; i++) { out.set(new Uint8Array(buffers[i]), offset); offset += buffers[i].byteLength; }
    return out.buffer;
  });
}
function evictOtherVersions(version) {
  var keep = CACHE_PREFIX + version;
  return caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) {
      return (k.indexOf(CACHE_PREFIX) === 0 && k !== keep) || k.indexOf(LEGACY_CACHE_PREFIX) === 0;
    })
      .map(function (k) { log("evicting " + k); return caches.delete(k); }));
  });
}
