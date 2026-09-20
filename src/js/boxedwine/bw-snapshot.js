/*
 * bw-snapshot.js — instant startup for BoxedWine via a WASM linear-memory
 * snapshot. The whole guest (RAM, CPU, kernel objects, X11, framebuffer) lives
 * in the 512MB linear memory, so a cold boot's end state can be captured once
 * and restored on later loads in ~1s instead of the ~13s Wine boot.
 *
 * DESIGN PRINCIPLE: fallback-safe. Every failure path (unsupported browser,
 * missing/invalid/corrupt snapshot, quota exceeded, restore throw) falls through
 * to a normal cold boot. This must NEVER break the app on anyone's system.
 *
 * The snapshot is version-locked to a key derived from BW_BUILD_ID (gulp-injected
 * hash of the deployed wasm pair, shell/snapshot scripts and guest zips) + a
 * schema constant + the boot configuration. If any of those change, the key
 * changes, the old snapshot is ignored, and the app cold-boots and re-captures.
 * Bump SCHEMA whenever the guest zip CONTENT changes under the same filename+size.
 *
 * Watchdog: a restore that resumes but never yields a usable console
 * (canvas rendered + guest instructions retiring) is discarded within 8s of
 * visible-page time and the page cold-boots; a runtime that never boots records a
 * per-build failure so the runtime policy (boxedwine.html) falls back to ST. No
 * path ends blank. Hidden-page time never counts: the loop does not run then.
 */
(function () {
  "use strict";

  var DB_NAME = "bw-snapshot";
  var STORE = "snap";
  // SCHEMA 2 (2026-09-17): the record is {heap, overlay, meta} — the
  // guest's writable overlay (/root, MEMFS) is serialized at the same instant as
  // the heap and restored before the heap is resumed, and the image is the FACTORY
  // state only (captured under the loading screen before any input / user file).
  var SCHEMA = 2; // bump to invalidate all snapshots (e.g. guest zip content change)

  // No crypto.subtle dependency any more: the version key comes from the build id
  // gulp injects (BW_BUILD_ID), so instant startup also works on insecure origins
  // (plain LAN http) where SubtleCrypto is undefined.
  function supported() {
    return (
      typeof indexedDB !== "undefined" &&
      typeof CompressionStream !== "undefined" &&
      typeof DecompressionStream !== "undefined" &&
      typeof Response !== "undefined"
    );
  }

  function openDB() {
    return new Promise(function (res, rej) {
      var r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = function (e) {
        e.target.result.createObjectStore(STORE);
      };
      r.onsuccess = function (e) { res(e.target.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  // gzip a (non-shared) Uint8Array entirely inside the page: the input is streamed
  // from the array and the output is collected as an ArrayBuffer, then wrapped in a
  // Blob for IndexedDB. Deliberately NOT `new Response(blob.stream()...).blob()`:
  // a Blob that Chrome builds from a stream is spilled to disk after 5MB
  // (BlobBuilderFromStream), and Chrome refuses blob disk paging when the profile
  // drive has less than ~4.3GB free (BlobMemoryController: avail_disk <=
  // 2 * (2GiB - 5MB)) — the persist then failed with "TypeError: Failed to fetch"
  // on every visit and the app never got its snapshot. A Blob made from bytes is
  // kept in memory (2GiB quota) and is unaffected (verified 2026-09-19, Chrome 153).
  function gzipBytes(bytes) {
    var CHUNK = 4 * 1024 * 1024, off = 0;
    var src = new ReadableStream({
      pull: function (c) {
        if (off >= bytes.length) { c.close(); return; }
        var end = Math.min(off + CHUNK, bytes.length);
        c.enqueue(bytes.subarray(off, end));
        off = end;
      },
    });
    return new Response(src.pipeThrough(new CompressionStream("gzip"))).arrayBuffer().then(function (buf) {
      return new Blob([buf]);
    });
  }

  function idbGet(k) {
    return openDB().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(STORE, "readonly").objectStore(STORE).get(k);
        t.onsuccess = function () { res(t.result); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  function idbPut(k, v) {
    return openDB().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(v, k);
        tx.oncomplete = function () { res(); };
        tx.onerror = function () { rej(tx.error); };
        tx.onabort = function () { rej(tx.error || new Error("aborted")); };
      });
    });
  }
  function idbDel(k) {
    return openDB()
      .then(function (db) {
        return new Promise(function (res) {
          var tx = db.transaction(STORE, "readwrite");
          tx.objectStore(STORE).delete(k);
          tx.oncomplete = function () { res(); };
          tx.onerror = function () { res(); };
        });
      })
      .catch(function () {});
  }

  var BW = {
    mode: "cold", // "cold" | "restore"
    version: null,
    _stream: null, // streaming gunzip state (see _startStream) while a restore is pending
    _heapLen: 0,
    _ready: null,
    _didColdBoot: false,

    // Kick off snapshot detection ASAP. cfg: { wasmUrl, identity, markerKey,
    // captureAllowed, buildId, runtime }.
    // Resolves (never rejects) once mode is decided and, if restoring, the
    // snapshot is decompressed and ready.
    begin: function (cfg) {
      var self = this;
      // Synchronous "a snapshot probably exists" marker (localStorage), keyed by the
      // cheap config identity (no wasm hash). boxedwine.html reads it BEFORE the glue
      // loads to decide Module.noInitialRun: present => restore path (no auto-main),
      // absent => let emscripten auto-boot (cold). This avoids ever calling callMain
      // manually, which deadlocks thread 0 under PROXY_TO_PTHREAD (MT).
      this._markerKey = (cfg && cfg.markerKey) || null;
      this._captureAllowed = !cfg || cfg.captureAllowed !== false;
      this._buildId = (cfg && cfg.buildId) || "dev";
      this._runtime = (cfg && cfg.runtime) || null;
      // A build whose restore already failed the watchdog twice stops capturing:
      // it cold-boots every visit (slower, but always a working terminal).
      try {
        var f = JSON.parse(localStorage.getItem("bw-snapshot-fail") || "null");
        if (f && f.buildId === this._buildId && f.count >= 2) {
          this._captureAllowed = false;
          console.warn("[bw-snapshot] restore failed " + f.count + "x under this build — snapshot disabled, cold boot every visit");
        }
      } catch (e) {}
      this._ready = (async function () {
        try {
          if (!supported()) {
            console.log("[bw-snapshot] browser lacks IndexedDB/CompressionStream/SubtleCrypto — cold boot only");
            return;
          }
          // Version key = schema + BW_BUILD_ID (hash of the deployed wasm pair, shell,
          // snapshot script and guest zips, injected by gulp) + boot identity. No
          // second wasm fetch: the old SHA-256-of-a-refetch cost 2.3MB per load and
          // could hash a cached wasm that differed from the one emscripten loaded.
          self.version = "v" + SCHEMA + "|" + self._buildId + "|" + ((cfg && cfg.identity) || "");
          console.log("[bw-snapshot] version key:", self.version);

          var meta = await idbGet("meta").catch(function () { return null; });
          if (!meta || meta.version !== self.version || !meta.heapLen) {
            if (meta) {
              console.log("[bw-snapshot] stored snapshot is for a different build/config — discarding");
              await self.discard();
            } else {
              console.log("[bw-snapshot] no snapshot yet — cold boot, will capture");
            }
            return;
          }
          var blob = await idbGet("heap").catch(function () { return null; });
          if (!blob) { await self.discard(); return; }
          // the /root overlay captured with the heap (schema 2): without it the
          // restored directory cache would point at files that do not exist
          var ov = await idbGet("overlay").catch(function () { return null; });
          if (!ov) { console.log("[bw-snapshot] snapshot has no overlay record — discarding"); await self.discard(); return; }
          self._overlayBlob = ov;
          self._heapLen = meta.heapLen;
          self.mode = "restore";
          self._startStream(blob);
          console.log("[bw-snapshot] snapshot found (" + blob.size + " bytes gzip) — streaming into the heap at restore");
        } catch (e) {
          console.log("[bw-snapshot] detection failed — cold boot", e);
          self.mode = "cold";
          self._stream = null;
        }
      })();
      return this._ready;
    },

    willRestore: function () {
      return this.mode === "restore" && !!this._stream;
    },

    // Streaming decompression. The heap may only be written AFTER the
    // runtime initialised (postRun): emscripten runs the C++ static constructors in
    // initRuntime and they would re-initialise globals inside a restored image. So
    // the gunzip stream starts immediately (overlapping the zip download + wasm
    // compile) but chunks are only pre-buffered up to PREBUF_BYTES; beyond that the
    // stream back-pressures until doRestore() hands it the live HEAPU8, and every
    // further chunk is written straight into the heap. Peak memory: heap + PREBUF
    // (was heap + a full 512MB private copy).
    _startStream: function (blob) {
      var self = this;
      var PREBUF_BYTES = 96 * 1024 * 1024;
      var st = { reader: null, pre: [], preBytes: 0, heap: null, offset: 0, done: null, error: null, t0: performance.now(), t1: 0 };
      st.heapReady = new Promise(function (res) { st.resolveHeap = res; });
      this._stream = st;
      st.done = (async function () {
        st.reader = blob.stream().pipeThrough(new DecompressionStream("gzip")).getReader();
        while (true) {
          var r = await st.reader.read();
          if (r.done) break;
          var chunk = r.value;
          if (!st.heap) {
            if (st.preBytes + chunk.length <= PREBUF_BYTES) { st.pre.push(chunk); st.preBytes += chunk.length; continue; }
            await st.heapReady; // back-pressure: wait for the live heap
          }
          if (st.offset + chunk.length > st.heap.length) throw new Error("snapshot larger than heap");
          st.heap.set(chunk, st.offset); st.offset += chunk.length;
        }
        st.t1 = performance.now();
        return st.offset;
      })().catch(function (e) { st.error = e; throw e; });
    },

    // In-place restore. Call once the Module runtime is initialized AND the shell
    // has mounted the same zips as cold boot (so FD reconnect can re-open them).
    // Resolves true on success. On failure, discards the snapshot and reloads so
    // the next load cold-boots cleanly.
    doRestore: function (Module) {
      var self = this, st = this._stream;
      self.busy = true;
      return (async function () {
        if (!st) throw new Error("no snapshot stream");
        if (!Module.HEAPU8) throw new Error("HEAPU8 unavailable");
        if (Module.HEAPU8.length !== self._heapLen) {
          throw new Error("heap size mismatch: live " + Module.HEAPU8.length + " vs snapshot " + self._heapLen);
        }
        if (typeof Module.bwResumeFromSnapshot !== "function") throw new Error("bwResumeFromSnapshot not exported");
        var t0 = performance.now();
        // /root must equal the captured overlay BEFORE the heap (with its cached
        // directory listings and open file descriptors) is resumed
        var ovStats = await self._restoreOverlay(Module);
        // hand the live heap to the stream: flush the pre-buffer, then let it write directly
        st.heap = Module.HEAPU8;
        for (var i = 0; i < st.pre.length; i++) { st.heap.set(st.pre[i], st.offset); st.offset += st.pre[i].length; }
        st.pre = []; st.preBytes = 0;
        st.resolveHeap();
        var total = await st.done;
        if (total !== self._heapLen) throw new Error("decompressed length mismatch: " + total + " vs " + self._heapLen);
        var t1 = performance.now();
        try {
          Module.bwResumeFromSnapshot();
        } catch (u) {
          /* emscripten simulate_infinite_loop 'unwind' — expected, not an error */
        }
        console.log("[bw-snapshot] restored + resumed in " + Math.round(performance.now() - t0) + "ms (overlay " + ovStats.files +
                    " files/" + ovStats.bytes + " B in " + ovStats.ms + "ms; heap fill " + Math.round(t1 - t0) +
                    "ms after runtime init; gunzip total " + Math.round(st.t1 - st.t0) + "ms)");
        self._stream = null;
        self.busy = false;
        return true;
      })().catch(function (e) {
        console.error("[bw-snapshot] RESTORE FAILED — discarding snapshot and cold-booting", e);
        self._stream = null;
        self.busy = false;
        self.discard().then(function () {
          try { location.reload(); } catch (_) {}
        });
        return false;
      });
    },

    // ------------------------------------------------------------ overlay
    // The guest's writable root (/root) is plain MEMFS (no IDBFS since schema 2).
    // Serialize the whole tree — dirs, files, symlinks — into one Uint8Array:
    // [u32 manifest length][manifest JSON][file bytes in manifest order]. Called
    // at the SAME instant as the heap copy (ST: synchronous JS on the loop's
    // thread; MT: inside the stop-the-world pause), so heap and overlay agree.
    _serializeOverlay: function (Module) {
      var FS = Module.FS, entries = [], chunks = [], total = 0;
      var walk = function (dir) {
        var names; try { names = FS.readdir(dir); } catch (e) { return; }
        for (var i = 0; i < names.length; i++) {
          var n = names[i]; if (n === "." || n === "..") continue;
          var p = dir + "/" + n, st; try { st = FS.lstat(p); } catch (e) { continue; }
          if (FS.isLink(st.mode)) { entries.push({ p: p, t: "l", m: st.mode, target: FS.readlink(p) }); }
          else if (FS.isDir(st.mode)) { entries.push({ p: p, t: "d", m: st.mode }); walk(p); }
          else if (FS.isFile(st.mode)) { var b = FS.readFile(p); entries.push({ p: p, t: "f", m: st.mode, s: b.length }); chunks.push(b); total += b.length; }
        }
      };
      walk("/root");
      var manifest = new TextEncoder().encode(JSON.stringify({ root: "/root", entries: entries }));
      var out = new Uint8Array(4 + manifest.length + total), dv = new DataView(out.buffer);
      dv.setUint32(0, manifest.length, true); out.set(manifest, 4);
      var off = 4 + manifest.length;
      for (var k = 0; k < chunks.length; k++) { out.set(chunks[k], off); off += chunks[k].length; }
      return { bytes: out, files: chunks.length, entries: entries.length, dataBytes: total };
    },
    _clearTree: function (FS, dir) {
      var names; try { names = FS.readdir(dir); } catch (e) { return; }
      for (var i = 0; i < names.length; i++) {
        var n = names[i]; if (n === "." || n === "..") continue;
        var p = dir + "/" + n, st; try { st = FS.lstat(p); } catch (e) { continue; }
        try {
          if (FS.isDir(st.mode) && !FS.isLink(st.mode)) { this._clearTree(FS, p); FS.rmdir(p); } else { FS.unlink(p); }
        } catch (e) {}
      }
    },
    // Repopulate /root from the captured overlay (gunzip + parse + MEMFS writes).
    // Anything already under /root (e.g. the console-geometry user.reg written by
    // boxedwine.html before start) is replaced so the tree equals the capture.
    _restoreOverlay: async function (Module) {
      var t0 = performance.now(), FS = Module.FS;
      if (!this._overlayBlob) throw new Error("no overlay record");
      var raw = new Uint8Array(await new Response(this._overlayBlob.stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
      var mlen = new DataView(raw.buffer).getUint32(0, true);
      var manifest = JSON.parse(new TextDecoder().decode(raw.subarray(4, 4 + mlen)));
      var off = 4 + mlen, files = 0, bytes = 0;
      this._clearTree(FS, "/root");
      try { FS.mkdirTree("/root"); } catch (e) {}
      for (var i = 0; i < manifest.entries.length; i++) {
        var e = manifest.entries[i];
        if (e.t === "d") { try { FS.mkdirTree(e.p); } catch (_) {} }
        else if (e.t === "f") { FS.writeFile(e.p, raw.subarray(off, off + e.s)); off += e.s; files++; bytes += e.s; }
        else if (e.t === "l") { try { FS.symlink(e.target, e.p); } catch (_) {} }
      }
      this._overlayBlob = null;
      return { files: files, bytes: bytes, entries: manifest.entries.length, ms: Math.round(performance.now() - t0) };
    },

    // Capture the FACTORY state: called by the shell once the cold-
    // booted console is usable and idle, while the loading screen is still up and
    // the input gate is closed. Two phases:
    //   1. ATOMIC (synchronous w.r.t. the guest): copy the heap and serialize the
    //      /root overlay at the same instant — resolves the returned promise, so
    //      the shell can open the terminal immediately afterwards;
    //   2. PERSIST (background): gzip both, store them and the meta record, set the
    //      marker. Non-fatal on any error (quota, OOM): the next visit cold-boots
    //      and captures again. Never called after a restore.
    // Resolves { copied, persisted } where persisted is the phase-2 promise.
    capture: async function (Module, info) {
      // busy: the freeze detector (Boxedwine.jsx) suspends while the heap is being
      // copied/compressed on the loop's thread — a normal capture is not a freeze.
      var self = this, stableCopy = null, overlay = null, heap = null, t0 = performance.now();
      if (!supported() || !this.version || !this._didColdBoot) return { copied: false, reason: "not-cold" };
      if (!this._captureAllowed) { console.log("[bw-snapshot] capture not allowed for this runtime/build — skipping"); return { copied: false, reason: "not-allowed" }; }
      heap = Module && Module.HEAPU8;
      if (!heap) return { copied: false, reason: "no-heap" };
      this.busy = true;
      try {
        console.log("[bw-snapshot] capturing factory state: " + heap.length + " bytes...");
        // The whole-heap read must be ATOMIC w.r.t. the guest: the emulator keeps
        // mutating memory, so an async/chunked read of the live heap would tear (an
        // inconsistent image that resumes blank / skips FD reconnect). We snapshot it
        // synchronously into a private Uint8Array, then stream that stable copy
        // through gzip (mostly-zero 512MB -> ~37MB) with gzipBytes(). A tight-memory
        // failure throws and is caught below (non-fatal).
        //
        // MT: HEAPU8 is backed by a SharedArrayBuffer (cross-origin isolation), which
        // (a) other guest pthreads mutate in true parallel and (b) CompressionStream
        // REJECTS ("the ArrayBufferView value must not be shared"). So for MT we
        // freeze the whole guest via the stop-the-world barrier, copy the shared heap
        // into a PRIVATE ArrayBuffer while frozen (the atomic read), then release the
        // world and gzip the private copy. ST is single-threaded with a regular
        // ArrayBuffer, so a synchronous copy is already atomic + accepted.
        var isShared = (typeof SharedArrayBuffer !== "undefined") &&
                       heap.buffer instanceof SharedArrayBuffer;
        if (isShared) {
          var mtPaused = window.BW_USE_MT && Module.bwBeginSnapshotPause
                         ? Module.bwBeginSnapshotPause() : false;
          if (!mtPaused) {
            console.log("[bw-snapshot] MT: could not stop the world; skipping capture");
            this.busy = false;
            return { copied: false, reason: "mt-pause-failed" };
          }
          try {
            stableCopy = new Uint8Array(heap.length); // private (non-shared) ArrayBuffer
            stableCopy.set(heap);                     // atomic copy while the guest is frozen
            overlay = this._serializeOverlay(Module); // same instant, guest still frozen
          } finally {
            Module.bwEndSnapshotPause();
          }
        } else {
          stableCopy = new Uint8Array(heap); // ST: synchronous copy, atomic on one thread
          overlay = this._serializeOverlay(Module);
        }
      } catch (e) {
        console.log("[bw-snapshot] capture failed (non-fatal, will cold boot next time)", e);
        this.busy = false;
        return { copied: false, reason: String(e) };
      }
      if (!stableCopy) { this.busy = false; return { copied: false, reason: "no-copy" }; }
      var copyMs = Math.round(performance.now() - t0);
      console.log("[bw-snapshot] factory state copied in " + copyMs + "ms (overlay " + overlay.files + " files, " + overlay.dataBytes + " B)");
      var persisted = (async function () {
        try {
          var blob = await gzipBytes(stableCopy);
          stableCopy = null; // release the 512MB copy before the IndexedDB writes
          var ovBlob = await gzipBytes(overlay.bytes);
          await idbPut("heap", blob);
          await idbPut("overlay", ovBlob);
          await idbPut("meta", {
            version: self.version,
            heapLen: heap.length,
            compressed: blob.size,
            overlayCompressed: ovBlob.size,
            overlayFiles: overlay.files,
            copyMs: copyMs,
            info: info || null, // shell-provided: when the copy happened relative to the console, input state
            ts: Date.now(),
          });
          // Set the sync marker so the NEXT load takes the restore path (noInitialRun).
          try { if (self._markerKey) localStorage.setItem(self._markerKey, "1"); } catch (_) {}
          console.log(
            "[bw-snapshot] captured " + heap.length + " -> " + blob.size + " bytes gzip (+ overlay " + ovBlob.size +
            " bytes) in " + Math.round(performance.now() - t0) + "ms"
          );
          return true;
        } catch (e) {
          // Typically the IndexedDB write (disk nearly full: Chrome refuses the blob
          // write). Tell the app so the user learns why every start is a cold boot.
          console.warn("[bw-snapshot] the instant-start state could not be saved (non-fatal, will cold boot next time)", e);
          try { await self.discard(); } catch (_) {}
          try { window.parent.postMessage(JSON.stringify({ eventName: "snapshot-not-saved", data: { data: { reason: String((e && e.message) || e) } } }), "/"); } catch (_) {}
          return false;
        } finally {
          self.busy = false;
        }
      })();
      return { copied: true, copyMs: copyMs, overlayFiles: overlay.files, persisted: persisted };
    },

    markColdBoot: function () { this._didColdBoot = true; },

    // Resolve once the guest is IDLE: after `settleMs`, sample every 1 s and require
    // two consecutive windows with no queued input and < 2M retired instructions
    // (an idle prompt only runs caret/timer handlers; Wine's boot services and a
    // build run 50-100 MIPS). Resolves { idle: true, waitedMs } or, after
    // `maxWaitMs`, { idle: false } (the shell then opens the terminal without a
    // capture; the next visit cold-boots and retries).
    waitIdle: function (Module, settleMs, maxWaitMs) {
      var t0 = performance.now(), lastP = null, quietWindows = 0;
      var progress = function () {
        try { if (typeof Module.bwGetGuestProgress === "function") return Module.bwGetGuestProgress(); } catch (e) {}
        return null;
      };
      var pending = function () { try { return Module.getPendingInputCount ? Module.getPendingInputCount() : 0; } catch (e) { return 0; } };
      lastP = progress(); // first window starts now, not at the first poll
      var lastAt = performance.now();
      return new Promise(function (resolve) {
        setTimeout(function poll() {
          var p = progress(), now = performance.now(), dt = Math.max(now - lastAt, 1);
          // idle = under 2M retired instructions per second over this window
          var idle = pending() === 0 && (p === null || (lastP !== null && (p - lastP) < 2000000 * (dt / 1000)));
          lastP = p; lastAt = now;
          quietWindows = idle ? quietWindows + 1 : 0;
          if (quietWindows >= 2) { resolve({ idle: true, waitedMs: Math.round(performance.now() - t0) }); return; }
          if (performance.now() - t0 > maxWaitMs) { console.log("[bw-snapshot] guest never idle — skipping capture this visit"); resolve({ idle: false, waitedMs: Math.round(performance.now() - t0) }); return; }
          setTimeout(poll, 1000);
        }, settleMs);
      });
    },
    // Wait for idle, then capture. Resolves the capture() result (see there).
    captureWhenIdle: async function (Module, settleMs, maxWaitMs, info) {
      var w = await this.waitIdle(Module, settleMs, maxWaitMs);
      if (!w.idle) return { copied: false, reason: "never-idle", waitedMs: w.waitedMs };
      var lit = window.BW_CONSOLE_VISIBLE_AT || 0;
      var r = await this.capture(Module, Object.assign({ idleAfterMs: w.waitedMs, sinceLitMs: lit ? Math.round(performance.now() - lit) : null }, info || {}));
      r.waitedMs = w.waitedMs;
      return r;
    },

    // ------------------------------------------------------------------ watchdog
    // "Usable console" = the console canvas is visibly rendered AND the
    // GUEST is executing. Guest execution is read from bwGetGuestProgress() (retired
    // instructions across guest threads, ST+MT) when the wasm exports it; otherwise
    // getMips()>0 (ST). The host main-loop heartbeat is deliberately NOT accepted: it
    // kept advancing throughout the blank MT restore measured 2026-09-16.
    _progress: function (Module) {
      try {
        if (Module && typeof Module.bwGetGuestProgress === "function") return { kind: "progress", v: Module.bwGetGuestProgress() };
        if (Module && typeof Module.getMips === "function") return { kind: "mips", v: Module.getMips() };
      } catch (e) {}
      return null;
    },
    _lit: function () {
      try { return typeof window.bwConsoleLit === "function" ? window.bwConsoleLit() : -1; } catch (e) { return -1; }
    },
    // Resolve true when usable, false when maxMs of VISIBLE time elapses. Polls every
    // 250ms. Time while the document is hidden (background tab, window occluded on
    // Windows) is not counted: the emulator loop runs on requestAnimationFrame, which
    // the browser stops for a hidden page, so neither the canvas nor the guest can
    // advance then and a wall-clock deadline would discard a good restore (measured:
    // reset, switch away for 8 s => "NO usable console", snapshot discarded).
    _waitUsable: function (Module, maxMs) {
      var self = this;
      return new Promise(function (resolve) {
        var t0 = performance.now(), last = t0, hiddenMs = 0, litHits = 0, lastP = null;
        var timer = setInterval(function () {
          var now = performance.now();
          if (document.visibilityState === "hidden") { hiddenMs += now - last; t0 += now - last; last = now; return; }
          last = now;
          var lit = self._lit() > 20;
          litHits = lit ? litHits + 1 : 0;
          var p = self._progress(Module), progressOk;
          if (!p) progressOk = true; // no signal exported (MT before bwGetGuestProgress): lit alone
          else if (p.kind === "progress") { progressOk = lastP !== null && p.v !== lastP; lastP = p.v; }
          else progressOk = p.v > 0;
          if (litHits >= 2 && progressOk) { clearInterval(timer); resolve(true); }
          else if (now - t0 > maxMs) {
            clearInterval(timer);
            if (hiddenMs > 0) console.log("[bw-watchdog] " + Math.round(hiddenMs) + "ms of hidden-page time were not counted");
            resolve(false);
          }
        }, 250);
      });
    },
    _bumpFailCount: function (key) {
      var n = 1;
      try {
        var f = JSON.parse(localStorage.getItem(key) || "null");
        if (f && f.buildId === this._buildId) n = (f.count || 0) + 1;
        localStorage.setItem(key, JSON.stringify({ buildId: this._buildId, count: n, ts: Date.now() }));
      } catch (e) {}
      return n;
    },
    // Runtime this page selected ("mt"|"st"): from begin()'s cfg, else the page flag
    // (begin() is skipped under ?bwnosnap=1 but the shell still arms the watchdog).
    _rt: function () { return this._runtime || (window.BW_USE_MT === true ? "mt" : "st"); },
    recordRuntimeFailure: function (reason) {
      try {
        localStorage.setItem("bw-runtime-fail", JSON.stringify({ runtime: this._rt(), reason: reason, buildId: this._buildId, ts: Date.now() }));
      } catch (e) {}
    },
    // Reload for a runtime fallback. Strips a ?bw= override so a forced runtime
    // that cannot boot can never reload-loop (the policy then applies the failure
    // record => ST).
    _reloadWithoutOverride: function () {
      try {
        var u = new URL(location.href);
        if (u.searchParams.has("bw")) { u.searchParams.delete("bw"); location.replace(u.href); return; }
      } catch (e) {}
      try { location.reload(); } catch (_) {}
    },
    // Immediate failover when the wasm cannot be instantiated (404, bad MIME,
    // CompileError — reported by the boxedwine.html instantiateWasm hook).
    onWasmFailed: function (reason) {
      if (this._wasmFailed) return;
      this._wasmFailed = true;
      if (this._rt() === "mt") {
        console.error("[bw-watchdog] MT wasm failed to load (" + reason + ") — recording failure for this build and falling back to ST");
        this.recordRuntimeFailure("wasm-load");
        this._reloadWithoutOverride();
      } else {
        console.error("[bw-watchdog] ST wasm failed to load (" + reason + ") — the terminal cannot start");
        try { window.parent.postMessage(JSON.stringify({ eventName: "emulator-slow", data: { data: { runtime: "st", reason: reason } } }), "/"); } catch (e) {}
      }
    },
    // Guard for the window BEFORE the wasm is instantiated (a failed/blocked wasm
    // never runs preRun, so the shell's watchBoot is never armed). Instantiation is
    // tracked by the boxedwine.html instantiateWasm hook (BW_WASM_INSTANTIATED) —
    // NOT by HEAPU8, which pthread builds create in JS before the wasm loads. If
    // nothing instantiated after 45s: MT => failure record + fallback reload; ST =>
    // warn + notify the parent. Once instantiated, watchBoot takes over.
    watchWasmLoad: function () {
      var self = this;
      setTimeout(function () {
        if (window.BW_WASM_INSTANTIATED === true) return;
        if (self._wasmFailed) return; // already handled by onWasmFailed
        self.onWasmFailed("not instantiated after 45s");
      }, 45000);
    },
    // After a restore: require a usable console within 8s, else discard the snapshot
    // (clears the marker => the reload cold-boots via auto-main) and reload. Self-
    // healing and loop-free: the marker is gone, and a build whose restore fails
    // twice stops capturing altogether (see begin()).
    // Resolves true when the restore is verified usable (false when it was not and
    // the page is being discarded + reloaded).
    watchRestore: function (Module) {
      var self = this;
      return this._waitUsable(Module, 8000).then(function (ok) {
        if (ok) { console.log("[bw-watchdog] restore verified: console usable"); return true; }
        var n = self._bumpFailCount("bw-snapshot-fail");
        console.error("[bw-watchdog] restore produced NO usable console in 8s (guest not executing) — discarding snapshot and cold-booting (failure " + n + " for this build)");
        try { window.parent.postMessage(JSON.stringify({ eventName: "restore-fallback", data: { data: { count: n } } }), "/"); } catch (e) {}
        self.discard().then(function () { try { location.reload(); } catch (_) {} });
        return false;
      });
    },
    // After a cold boot starts: MT must reach a usable console within 90s, else the
    // per-build failure record is written and the page reloads (the runtime policy
    // in boxedwine.html then selects ST). ST has no further fallback: warn + notify
    // the parent (slow-machine notice) but keep waiting — never loop reloads.
    // Returns a promise that resolves (true) when the console is usable — after the
    // ST warning it keeps waiting (a slow machine still gets its terminal); on the
    // MT fallback the page reloads and the promise simply never resolves.
    // A slow machine gets NO notice while loading (a notice in the retro chrome
    // reads as "the freeze banner" to the user; the loading screen's stage text is
    // updated instead): ST just keeps waiting. Budgets: ST warns at 60 s, MT falls
    // back to ST after 150 s (measured 4x CPU-throttled ST cold boot: 97 s).
    watchBoot: function (Module) {
      var self = this, isMT = this._rt() === "mt";
      return this._waitUsable(Module, isMT ? 150000 : 60000).then(function (ok) {
        if (ok) { console.log("[bw-watchdog] cold boot verified: console usable"); return true; }
        if (isMT) {
          console.error("[bw-watchdog] MT did not reach a usable console in 150s — recording failure for this build and falling back to ST");
          self.recordRuntimeFailure("boot-timeout");
          self._reloadWithoutOverride();
          return new Promise(function () {}); // reloading
        }
        console.warn("[bw-watchdog] ST has not reached a usable console in 60s — still waiting (slow machine?)");
        if (window.bwBootStage) window.bwBootStage("Booting Windows console (first visit) — this is taking longer on this machine, please wait");
        // keep waiting (a slow machine still gets its terminal), but a console that has
        // not appeared after 4 minutes is a failure the user must hear about instead
        // of a loading screen forever: tell the parent once (it shows the retro notice
        // with the hard-reset advice) and keep polling in case it does come up.
        return (async function () {
          var extra = 0;
          while (!(await self._waitUsable(Module, 30000))) {
            if (++extra === 6) {
              console.error("[bw-watchdog] the console has not started after 4 minutes");
              try { window.parent.postMessage(JSON.stringify({ eventName: "emulator-slow", data: { data: { runtime: "st", reason: "the Windows console did not start within 4 minutes" } } }), "/"); } catch (e) {}
            }
          }
          return true;
        })();
      });
    },
    // Can this load capture at all? (snapshot layer active, allowed for this
    // runtime/build, and this is a cold boot.)
    canCapture: function () {
      return supported() && !!this.version && this._captureAllowed && this._didColdBoot && this.mode === "cold";
    },

    discard: function () {
      this._stream = null;
      // Clear the sync marker so the next load cold-boots (auto-main) instead of
      // taking the restore path with no valid snapshot.
      try { if (this._markerKey) localStorage.removeItem(this._markerKey); } catch (_) {}
      this._overlayBlob = null;
      return Promise.all([idbDel("heap"), idbDel("overlay"), idbDel("meta")]);
    },
  };

  window.BWSnapshot = BW;
})();
