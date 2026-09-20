import React, { useEffect, useState } from "react";
import { createMessageListner } from "../../utility/utilityFunctions.ts";
import LoadingScreen from "./LoadingScreen.jsx";

// The emulator canvas is a static element in boxedwine.html (the stock 26R1
// shell captures #canvas at script load). This component owns the app-side
// event wiring (all terminal I/O goes through direct BoxedWine embind calls —
// no synthetic KeyboardEvents, no echo file hacks) and the click overlay.
const D_DRIVE = "/mnt/drive_d/"; // guest D:\  (writable workspace, write path via bwWriteFile)
const NATIVE_D = "/d_drive/"; // same drive, native emscripten path for readback via Module.FS
// Build artifacts to read back into the app after an assemble (skip any not produced).
const OUTPUT_EXTS = [".obj", ".exe", ".lst", ".map"];
// Guest -> drawer import: files the guest creates on D: that the drawer
// does not have are offered to the parent every IMPORT_EVERY_MS (and after each build
// readback); larger files are reported once and left in the session.
const IMPORT_EVERY_MS = 5000;
const IMPORT_MAX_BYTES = 4 * 1024 * 1024;
// Harness sentinel files (`__bw_*`) are never imported.
const isSentinel = (name) => /^__bw_/i.test(name);
// Files the parent treats as text (same rule as its reconciliation).
const isTextName = (name) => /\.(asm|inc|txt|text|bat|lst|map)$/i.test(name);

// Encode a Uint8Array to base64 without blowing the call stack on large buffers.
const uint8ToBase64 = (u8) => {
  let s = "";
  const CH = 0x8000;
  for (let i = 0; i < u8.length; i += CH) {
    s += String.fromCharCode.apply(
      null,
      u8.subarray(i, Math.min(i + CH, u8.length)),
    );
  }
  return btoa(s);
};

const postToParent = (eventName, payload) => {
  try {
    window.parent.postMessage(
      JSON.stringify({ eventName, data: { data: payload } }),
      "/",
    );
  } catch (e) {}
};

// After an assemble, the guest produces .obj/.exe(/.lst) on D: asynchronously.
// Poll (via Module.FS on the native path) until the linker's .exe appears — it's
// the LAST artifact (asm->obj->exe) — then read every produced artifact, base64
// them, and post to the parent so it can store them (drawer non-.asm view + hex
// viewer). On a failed build (no .exe) we still return whatever exists (e.g. .obj)
// after a timeout so the user can inspect partial output.
const readBackBuildOutputs = (name, onDone) => {
  let tries = 0,
    lastSize = -1;
  const maxTries = 44; // ~22s ceiling (assemble+link is typically < 12s)
  const timer = setInterval(() => {
    tries++;
    // The .exe is complete when it is non-empty and its size did not change since
    // the previous poll: under MT the guest's linker writes it in parallel with this
    // poll, and reading it the moment it appears returned a 0-byte (or partial) file.
    let exeReady = false;
    try {
      const sz = Module.FS.stat(NATIVE_D + name + ".exe").size;
      exeReady = sz > 0 && sz === lastSize;
      lastSize = sz;
    } catch (e) {
      lastSize = -1;
    }
    if (!exeReady && tries < maxTries) return;
    clearInterval(timer);
    const outputs = [];
    for (const ext of OUTPUT_EXTS) {
      try {
        const bytes = Module.FS.readFile(NATIVE_D + name + ext); // Uint8Array
        // a 0-byte artifact (JWasm truncates the .obj on an assemble error) is not an output
        if (bytes.length)
          outputs.push({
            filename: name + ext,
            base64: uint8ToBase64(bytes),
            size: bytes.length,
          });
      } catch (e) {
        /* not produced by this build */
      }
    }
    postToParent("build-outputs", { name, outputs, ok: exeReady });
    if (onDone) onDone(exeReady);
  }, 500);
};

function Boxedwine() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    createEventListeners();
    return () => removeEventListeners();
  }, []);

  const createEventListeners = () => {
    createMessageListner(); // parent -> iframe postMessage bridge -> re-dispatched events (FALLBACK)
    createClickListener();
    // Terminal I/O handlers. Each is reachable two ways with IDENTICAL behaviour:
    //  (1) DIRECT — window.bwApp.* called cross-frame by the parent (same-origin).
    //      This is the primary, more reliable path: a plain function call, no JSON
    //      serialize/parse, no CustomEvent hop, and no entanglement with BoxedWine's
    //      own internal postMessage traffic (which the message bridge has to filter).
    //  (2) FALLBACK — the "write-command"/"sync-file"/"rename-file"/"build-file"/
    //      "delete-file"/"reset" CustomEvents (fed by the parent's postMessage bridge) for any
    //      caller that runs before window.bwApp is published, or if direct access is
    //      unavailable. Both routes converge on the same do* functions below.
    [
      "write-command",
      "sync-file",
      "rename-file",
      "build-file",
      "delete-file",
      "reset",
      "reconcile-files",
      "interrupt",
    ].forEach((evt) => window.addEventListener(evt, onFallbackEvent));
    window.addEventListener("boxedwine-input-open", onInputOpen);
    exposeDirectApi();
    createBoxedwineLoadedListener();
    startFreezeDetector();
  };

  const removeEventListeners = () => {
    [
      "editor-selected",
      "reset",
      "write-command",
      "sync-file",
      "rename-file",
      "build-file",
      "delete-file",
      "reconcile-files",
      "interrupt",
      "boxedwine-fully-loaded",
    ].forEach((e) => window.removeEventListener(e, onFallbackEvent));
    window.removeEventListener("boxedwine-input-open", onInputOpen);
    stopFreezeDetector();
    stopImportScan();
    try {
      if (window.bwApp && window.bwApp.__owner === Boxedwine)
        delete window.bwApp;
    } catch (e) {}
  };

  // --- Input gate -------------------------------------------------------
  // Nothing reaches the guest before the environment is ready AND the drawer has been
  // reconciled into D:: boxedwine.html drops keyboard events while BW_INPUT_OPEN is
  // false; here every direct-API/fallback control is queued until the gate opens.
  // The gate opens in doReconcile (normal path) or, when no parent ever reconciles
  // (standalone iframe, harness on the iframe page), NO_PARENT_MS after ready.
  const NO_PARENT_MS = 5000;
  const gateState = { queue: [], reconciled: false, fallbackTimer: null };
  const inputOpen = () => window.BW_INPUT_OPEN === true;
  const gated = (fn) => {
    if (inputOpen()) return fn();
    gateState.queue.push(fn);
  };
  const openInput = (why) => {
    if (typeof window.bwOpenInput === "function") window.bwOpenInput(why);
    else {
      window.BW_INPUT_OPEN = true;
      onInputOpen({ detail: { why } });
    }
  };
  const onInputOpen = () => {
    if (gateState.fallbackTimer) {
      clearTimeout(gateState.fallbackTimer);
      gateState.fallbackTimer = null;
    }
    setIsLoading(false);
    const q = gateState.queue.splice(0);
    for (const fn of q) {
      try {
        fn();
      } catch (e) {
        console.warn("[Boxedwine] queued control failed", e);
      }
    }
    startImportScan();
  };

  // Wait until Module exposes the given functions, then run fn. Makes every path
  // safe to invoke before boot completes (queues until the embind API is live).
  const whenModuleReady = (names, fn) => {
    const ready = () =>
      typeof Module !== "undefined" &&
      names.every((n) => typeof Module[n] === "function");
    if (ready()) return fn();
    const timer = setInterval(() => {
      if (ready()) {
        clearInterval(timer);
        fn();
      }
    }, 100);
  };

  // Legacy key-array payload -> plain string (back-compat for old senders).
  const legacyKeysToString = (keys) => {
    const map = { spacebar: " ", enter: "\r", period: ".", dash: "-" };
    return keys
      .filter((k) => k !== "shift" && k !== "/shift")
      .map((k) => (map[k] !== undefined ? map[k] : k))
      .join("");
  };

  // --- Single source of truth for every emulator control (direct wasm calls) ---

  // Terminal input via the emulator's direct-input API (no DOM KeyboardEvents).
  const doWriteCommand = (detail) => {
    const command = Array.isArray(detail)
      ? legacyKeysToString(detail)
      : String(detail) + "\r";
    gated(() => whenModuleReady(["sendText"], () => Module.sendText(command)));
  };

  // Ctrl+C into the console: the key transitions go down the emulator's
  // direct-input queue (XServer::key -> focused window -> Wine), exactly like the
  // keyboard; conhost raises CTRL_C_EVENT for the console's process group. Bypasses
  // the input gate on purpose - it must work while a build/program is running.
  const XK_Control_L = 0xffe3,
    XK_c = 0x63;
  const doInterrupt = () => {
    whenModuleReady(["sendKey"], () => {
      Module.sendKey(XK_Control_L, true);
      Module.sendKey(XK_c, true);
      Module.sendKey(XK_c, false);
      Module.sendKey(XK_Control_L, false);
      freezeState.buildInFlight = false; // whatever was running is being stopped
    });
  };

  // --- Guest-tree sync verification -----------------------------------
  // Every file op is followed by a readback of the guest D: through Module.FS (the
  // native /d_drive path the guest writes). A mismatch retries the op once, then
  // warns (production-visible) and reports ok:false to the parent.
  const guestStat = (filename) => {
    try {
      const st = Module.FS.stat(NATIVE_D + filename);
      return { exists: true, size: st.size };
    } catch (e) {
      return { exists: false, size: -1 };
    }
  };
  const verifyGuest = (op, filename, expect) => {
    const st = guestStat(filename);
    let ok = expect.present ? st.exists : !st.exists;
    if (
      ok &&
      expect.present &&
      typeof expect.size === "number" &&
      expect.size >= 0 &&
      st.size !== expect.size
    )
      ok = false;
    return {
      op,
      filename,
      ok,
      exists: st.exists,
      size: st.size,
      expected: expect,
    };
  };
  const reportSync = (result) => {
    if (!result.ok)
      console.warn(
        "[Boxedwine] guest sync verification FAILED: " + JSON.stringify(result),
      );
    try {
      window.parent.postMessage(
        JSON.stringify({ eventName: "file-synced", data: { data: result } }),
        "/",
      );
    } catch (e) {}
    return result;
  };
  // Run an op, verify, retry once on mismatch.
  const withVerify = (op, filename, expect, run) => {
    let rc = run();
    let res = verifyGuest(op, filename, expect);
    if (!res.ok) {
      rc = run();
      res = verifyGuest(op, filename, expect);
      res.retried = true;
    }
    res.rc = rc;
    return reportSync(res);
  };
  // Encoded (binary) content -> bytes; plain text -> string. bwWriteFileBytes is
  // binary-safe (embind UTF-8-encodes JS strings, which corrupts bytes >= 0x80).
  const writeGuestFile = (filename, content, isBinary) => {
    if (isBinary && typeof Module.bwWriteFileBytes === "function") {
      const bin = atob(content || "");
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      return {
        rc: Module.bwWriteFileBytes(D_DRIVE + filename, u8),
        size: u8.length,
      };
    }
    const text = isBinary ? atob(content || "") : content || "";
    // embind writes the string UTF-8 encoded: verify against the UTF-8 byte length
    const size =
      typeof TextEncoder !== "undefined"
        ? new TextEncoder().encode(text).length
        : text.length;
    return { rc: Module.bwWriteFile(D_DRIVE + filename, text), size };
  };

  // Direct file sync: write a file into the guest FS so cmd sees it (no echo).
  // content is plain text, or base64 when isBinary (uploads of non-text files).
  const doSyncFile = (filename, content, isBinary) => {
    if (!filename) return;
    gated(() =>
      whenModuleReady(["bwWriteFile"], () => {
        let size = -1;
        importState.drawer.add(filename);
        withVerify(
          "write",
          filename,
          {
            present: true,
            get size() {
              return size;
            },
          },
          () => {
            const r = writeGuestFile(filename, content, isBinary);
            size = r.size;
            return r.rc;
          },
        );
      }),
    );
  };

  // Direct rename inside the guest tree (bwRenameFile = the node's own rename, so
  // the running cmd sees the new name and not the old one). Falls back to
  // delete+write with the app's copy of the content when the vendor call fails.
  const doRenameFile = (oldName, newName, content, isBinary) => {
    if (!oldName || !newName) return;
    gated(() =>
      whenModuleReady(["bwWriteFile", "bwDeleteFile"], () => {
        importState.drawer.delete(oldName);
        importState.drawer.add(newName);
        const run = () => {
          let rc =
            typeof Module.bwRenameFile === "function"
              ? Module.bwRenameFile(D_DRIVE + oldName, D_DRIVE + newName)
              : -99;
          if (rc !== 0) {
            console.warn(
              "[Boxedwine] bwRenameFile rc=" +
                rc +
                " for " +
                oldName +
                " -> " +
                newName +
                "; falling back to delete+write",
            );
            Module.bwDeleteFile(D_DRIVE + oldName);
            rc = writeGuestFile(newName, content, isBinary).rc;
          }
          return rc;
        };
        const res = withVerify("rename", newName, { present: true }, run);
        const old = verifyGuest("rename-old-gone", oldName, { present: false });
        if (!old.ok) reportSync(old);
        return res;
      }),
    );
  };

  // Atomically sync a .asm to D: then assemble->link->run it (no write/run race,
  // no echo). Toolchain is read-only at C:\files (drive-agnostic %~dp0 batch);
  // cwd is D: so outputs land next to the source. The readback runs here in the
  // iframe where Module.FS is local.
  const doBuild = (filename, content) => {
    if (!filename) return;
    gated(() =>
      whenModuleReady(["bwWriteFile", "sendText"], () => {
        const name = filename.replace(/\.asm$/i, "");
        importState.drawer.add(filename);
        const rc = Module.bwWriteFile(D_DRIVE + filename, content || "");
        if (rc !== 0) {
          console.error("[Boxedwine] build sync failed rc=" + rc);
          return;
        }
        // Remove the PREVIOUS build's artifacts first: assemble.bat does not, so a
        // failed assemble would leave the old .exe on D: and the readback below would
        // re-import it as if this build had succeeded (stale binary, ok:true).
        if (typeof Module.bwDeleteFile === "function") {
          for (const ext of OUTPUT_EXTS) {
            try {
              Module.bwDeleteFile(D_DRIVE + name + ext);
            } catch (e) {}
          }
        }
        freezeState.buildInFlight = true; // guest progress is now expected (freeze detector)
        // The source is at D:\<name>.asm whatever directory the user's prompt is in:
        // assemble FROM D:\ (pushd/popd restores the prompt's own directory afterwards;
        // `call` returns control to this line when the batch ends). Without this, a
        // prompt that had left D:\ got `Cannot open file "<name>.asm" [ENOENT]`.
        // A name with spaces (or cmd-special characters) is quoted: assemble.bat's %1
        // then expands to "my program", i.e. "my program".asm / .obj / .exe, which
        // JWasm, JWlink, FL and cmd all take as one name (harness scenario `spaces`).
        const quoted = /[\s&()^;,=|<>]/.test(name) ? '"' + name + '"' : name;
        Module.sendText(
          "pushd D:\\ & call C:\\files\\assemble " + quoted + " & popd\r",
        );
        readBackBuildOutputs(name, () => {
          freezeState.buildInFlight = false;
          importScan();
        });
      }),
    );
  };

  // Direct file delete: remove a file from the guest FS so cmd's `dir` no longer
  // shows it — WITHOUT typing a `del` command (more efficient + reliable, stays
  // cmd-synced because bwDeleteFile removes the FsNode from the parent tree).
  const doDeleteFile = (filename) => {
    if (!filename) return;
    gated(() =>
      whenModuleReady(["bwDeleteFile"], () => {
        importState.drawer.delete(filename);
        importState.posted.delete(filename);
        withVerify("delete", filename, { present: false }, () =>
          Module.bwDeleteFile(D_DRIVE + filename),
        );
      }),
    );
  };

  // --- Reconcile --------------------------------------------------------
  // The parent hands over the WHOLE drawer once the environment is ready; D: is
  // rebuilt from it (text via bwWriteFile, base64 binaries via bwWriteFileBytes),
  // the tree is verified, and only then does the input gate open. Runs on every
  // start (cold or restored) — the factory image holds no user file — and is
  // idempotent (identical bytes rewrite to the same result).
  const doReconcile = (files) => {
    const list = Array.isArray(files) ? files : [];
    whenModuleReady(["bwWriteFile"], () => {
      const t0 = performance.now();
      let written = 0,
        failed = [];
      importState.drawer = new Set();
      for (const f of list) {
        if (!f || !f.filename) continue;
        importState.drawer.add(f.filename);
        let size = -1;
        try {
          const res = withVerify(
            "reconcile",
            f.filename,
            {
              present: true,
              get size() {
                return size;
              },
            },
            () => {
              const r = writeGuestFile(f.filename, f.content, !!f.isBinary);
              size = r.size;
              return r.rc;
            },
          );
          if (res.ok) written++;
          else failed.push(f.filename);
        } catch (e) {
          // one bad entry (e.g. undecodable content) must not block the others or the gate
          failed.push(f.filename);
          console.warn("[Boxedwine] reconcile of " + f.filename + " threw", e);
        }
      }
      gateState.reconciled = true;
      const summary = {
        files: list.length,
        written,
        failed,
        ms: Math.round(performance.now() - t0),
        tree: verifyTree(),
      };
      console.log(
        "[Boxedwine] drawer reconciled into D: " +
          written +
          "/" +
          list.length +
          " files in " +
          summary.ms +
          "ms" +
          (failed.length ? " FAILED: " + failed.join(", ") : ""),
      ); // boot milestone
      postToParent("reconciled", summary);
      openInput("reconciled");
      offerLegacyGuestFiles();
    });
  };

  // --- Guest -> drawer import -------------------------------------------
  // D: is MEMFS: a file the guest created (program output, `copy con`, a redirected
  // echo) would vanish at the next reload unless the drawer gets it. Every
  // IMPORT_EVERY_MS (and after a build readback) list D: and post the files the
  // drawer does not have. Nothing is ever deleted from the drawer here.
  const importState = { drawer: new Set(), posted: new Map(), timer: null };
  const importScan = () => {
    if (!inputOpen() || typeof Module === "undefined" || !Module.FS) return;
    if (window.BWSnapshot && window.BWSnapshot.busy) return;
    const found = [];
    let names;
    try {
      names = Module.FS.readdir(NATIVE_D);
    } catch (e) {
      return;
    }
    for (const n of names) {
      if (n === "." || n === ".." || isSentinel(n) || importState.drawer.has(n))
        continue;
      let st;
      try {
        st = Module.FS.stat(NATIVE_D + n);
      } catch (e) {
        continue;
      }
      if (!Module.FS.isFile(st.mode)) continue;
      if (importState.posted.get(n) === st.size) continue; // already offered at this size
      if (st.size > IMPORT_MAX_BYTES) {
        if (!importState.posted.has(n))
          console.warn(
            "[Boxedwine] " +
              n +
              " (" +
              st.size +
              " bytes) is larger than the " +
              IMPORT_MAX_BYTES +
              "-byte import limit — left on D: for this session only",
          );
        importState.posted.set(n, st.size);
        continue;
      }
      try {
        const bytes = Module.FS.readFile(NATIVE_D + n);
        if (bytes.length !== st.size) continue; // still being written: next scan
        found.push({
          filename: n,
          base64: uint8ToBase64(bytes),
          size: bytes.length,
          isText: isTextName(n),
        });
        importState.posted.set(n, st.size);
      } catch (e) {}
    }
    if (found.length)
      postToParent("guest-files", { files: found, source: "guest" });
  };
  const startImportScan = () => {
    if (!importState.timer)
      importState.timer = setInterval(importScan, IMPORT_EVERY_MS);
  };
  const stopImportScan = () => {
    if (importState.timer) {
      clearInterval(importState.timer);
      importState.timer = null;
    }
  };
  // Files from the legacy IDBFS /d_drive store (boxedwine-shell.js migration) are
  // offered once, right after the first reconcile.
  const offerLegacyGuestFiles = () => {
    const legacy = window.BW_LEGACY_GUEST_FILES;
    if (!Array.isArray(legacy) || !legacy.length) return;
    window.BW_LEGACY_GUEST_FILES = null;
    const files = legacy
      .filter(
        (f) =>
          f && f.filename && f.bytes && !importState.drawer.has(f.filename),
      )
      .map((f) => ({
        filename: f.filename,
        base64: uint8ToBase64(f.bytes),
        size: f.bytes.length,
        isText: isTextName(f.filename),
      }));
    console.log(
      "[Boxedwine] legacy guest store: " +
        files.length +
        " file(s) offered to the drawer",
    ); // boot milestone
    if (files.length) postToParent("guest-files", { files, source: "legacy" });
  };

  // Guest D: listing for tests / the drawer: [{name, size}] (Module.FS on /d_drive).
  const verifyTree = () => {
    try {
      return Module.FS.readdir(NATIVE_D)
        .filter((n) => n !== "." && n !== "..")
        .map((n) => {
          try {
            const st = Module.FS.stat(NATIVE_D + n);
            return { name: n, size: st.size, dir: Module.FS.isDir(st.mode) };
          } catch (e) {
            return { name: n, size: -1 };
          }
        });
    } catch (e) {
      return null;
    }
  };

  // Reset = reload this iframe. ONE implementation for ST and MT: the
  // browser tears down the wasm instance (works even when the emulator JS is
  // wedged), the reload lands on the watchdog-protected restore/cold-boot path, and
  // it is data-safe — the user's files live in the PARENT app's IndexedDB. The old
  // Module.restartBW()+callMain() path is gone: callMain deadlocks thread 0 under
  // PROXY_TO_PTHREAD (MT), and restartBW alone left the console unusable.
  const doReset = () => {
    try {
      location.reload();
    } catch (e) {
      try {
        window.location.href = window.location.href;
      } catch (_) {}
    }
  };

  // FALLBACK dispatcher: map the parent's postMessage-bridged CustomEvents onto the
  // same do* functions the direct API uses (so both routes behave identically).
  const onFallbackEvent = (event) => {
    switch (event.type) {
      case "write-command":
        return doWriteCommand(event.detail);
      case "sync-file": {
        const d = event.detail || {};
        return doSyncFile(d.filename, d.content, !!d.isBinary);
      }
      case "rename-file": {
        const d = event.detail || {};
        return doRenameFile(d.oldName, d.newName, d.content, !!d.isBinary);
      }
      case "build-file": {
        const d = event.detail || {};
        return doBuild(d.filename, d.content);
      }
      case "delete-file":
        return doDeleteFile(
          typeof event.detail === "string"
            ? event.detail
            : (event.detail || {}).filename,
        );
      case "reconcile-files": {
        const d = event.detail || {};
        return doReconcile(d.files || d);
      }
      case "reset":
        return doReset();
      case "interrupt":
        return doInterrupt();
    }
  };

  // Publish the DIRECT control API on the iframe window so the parent app can call
  // it cross-frame (iframe.contentWindow.bwApp.*) instead of posting messages.
  const exposeDirectApi = () => {
    window.bwApp = {
      __owner: Boxedwine,
      writeCommand: (cmd) => doWriteCommand(cmd),
      syncFile: (filename, content, isBinary) =>
        doSyncFile(filename, content, !!isBinary),
      renameFile: (oldName, newName, content, isBinary) =>
        doRenameFile(oldName, newName, content, !!isBinary),
      build: (filename, content) => doBuild(filename, content),
      deleteFile: (filename) => doDeleteFile(filename),
      reconcile: (files) => doReconcile(files),
      inputOpen: () => inputOpen(),
      verifyTree: () => verifyTree(),
      reset: () => doReset(),
      interrupt: () => doInterrupt(),
      // liveness (see startFreezeDetector): last observed heartbeat + frozen flag.
      isFrozen: () => freezeState.frozen,
      heartbeat: () =>
        typeof Module !== "undefined" && Module.bwGetHeartbeat
          ? Module.bwGetHeartbeat()
          : -1,
    };
  };

  // --- Emulator freeze detection --------------------------------------------------
  // Users run arbitrary assembled code that can hardlock the wasm "system". Two
  // signals, polled once a second, ONLY after the console is usable (arming before
  // that fired false "FROZEN" banners during every normal MT cold boot):
  //   (1) host liveness  — bwGetHeartbeat (bumped every main-loop tick). Stalled for
  //       FREEZE_MS => the emulator's event loop is dead (crash/deadlock).
  //   (2) guest liveness — bwGetGuestProgress (retired instructions, ST+MT; falls back
  //       to getMips()>0 on ST). Stalled for FREEZE_MS WHILE we are waiting on the
  //       guest (typed input still queued, or a build in flight) => the guest is
  //       wedged even though the host loop ticks (what the blank MT restore looked
  //       like). A guest program merely spinning keeps progress advancing and is NOT
  //       a freeze — the user can Ctrl+C it.
  // Surfaced ONCE as a critical warning + "emulator-frozen" (cleared by
  // "emulator-recovered" when either signal resumes). Critical logs stay in production.
  //
  // False-positive guards (a freeze banner during a normal page load is worse than
  // a late one), all measured causes:
  //   - GRACE_MS after arming: the console is lit before cmd is fully up, and the
  //     first seconds on a slow machine (wasm tiering, snapshot capture) are noisy.
  //   - hidden tab: browsers throttle timers in background tabs (1/s, and 1/min
  //     after 5 min) so the host loop legitimately "stalls"; suspend while hidden
  //     and give a grace window when the tab becomes visible again.
  //   - snapshot capture/restore (BWSnapshot.busy): the whole-heap copy/gunzip
  //     runs on the loop's thread; not a freeze.
  //   - the hardlock rule needs BOTH signals stalled (host loop AND guest): a
  //     guest that keeps retiring instructions is by definition not hardlocked.
  //   - the detector is armed only once the terminal ACCEPTS INPUT
  //     (environment ready + drawer reconciled — never while loading),
  //     it must have SEEN the guest alive after arming, a suspected freeze
  //     must persist for CONFIRM_POLLS further consecutive polls before it is
  //     reported, and a poll that itself arrived late (timer throttling: background
  //     window, laptop sleep, a modal dialog) discards the stall it would have seen.
  const freezeState = {
    hb: -1,
    hbAt: 0,
    pg: null,
    pgAt: 0,
    pgRawAt: 0,
    frozen: false,
    timer: null,
    armed: false,
    buildInFlight: false,
    graceUntil: 0,
    seenAlive: false,
    suspect: 0,
    lastPoll: 0,
  };
  const FREEZE_MS = 6000; // both signals stalled this long => suspect
  const WAIT_FREEZE_MS = 10000; // guest stalled while a build is in flight / input is queued => suspect
  const CONFIRM_POLLS = 3; // ...and still stalled on this many further polls => frozen (>= 9 s)
  const POLL_MS = 1000;
  const GRACE_MS = 12000;
  const guestProgress = () => {
    try {
      if (typeof Module === "undefined") return null;
      if (typeof Module.bwGetGuestProgress === "function")
        return { kind: "progress", v: Module.bwGetGuestProgress() };
      if (typeof Module.getMips === "function")
        return { kind: "mips", v: Module.getMips() };
    } catch (e) {}
    return null;
  };
  const waitingOnGuest = () => {
    if (freezeState.buildInFlight) return true;
    try {
      return (
        typeof Module !== "undefined" &&
        typeof Module.getPendingInputCount === "function" &&
        Module.getPendingInputCount() > 0
      );
    } catch (e) {
      return false;
    }
  };
  const setFrozen = (frozen, detail) => {
    if (freezeState.frozen === frozen) return;
    freezeState.frozen = frozen;
    const name = frozen ? "emulator-frozen" : "emulator-recovered";
    if (frozen)
      console.warn(
        "[Boxedwine] emulator appears FROZEN — " +
          detail.why +
          " for " +
          detail.stalledMs +
          "ms (hardlock?)",
      );
    else console.warn("[Boxedwine] emulator liveness resumed — recovered");
    window.dispatchEvent(new CustomEvent(name, { detail }));
    try {
      window.parent.postMessage(
        JSON.stringify({ eventName: name, data: { data: detail } }),
        "/",
      );
    } catch (e) {}
  };
  const resetStalls = (graceMs) => {
    const now = performance.now();
    freezeState.hbAt = freezeState.pgAt = freezeState.pgRawAt = now;
    freezeState.suspect = 0;
    if (graceMs)
      freezeState.graceUntil = Math.max(freezeState.graceUntil, now + graceMs);
  };
  const onVisibility = () => {
    if (document.visibilityState === "visible") resetStalls(5000);
  };
  const startFreezeDetector = () => {
    if (freezeState.timer) return;
    // Armed only once the environment is ready AND the drawer is reconciled (the
    // input gate opened): the factory capture's heap copy and the reconcile writes
    // all happen before this point, so none of them can ever look like a stall.
    const arm = () => {
      freezeState.armed = true;
      freezeState.seenAlive = false;
      freezeState.lastPoll = performance.now();
      resetStalls(GRACE_MS);
    };
    if (window.BW_INPUT_OPEN === true) arm();
    else window.addEventListener("boxedwine-input-open", arm, { once: true });
    document.addEventListener("visibilitychange", onVisibility);
    freezeState.timer = setInterval(() => {
      if (
        !freezeState.armed ||
        typeof Module === "undefined" ||
        window.BW_INPUT_OPEN !== true
      )
        return;
      const now = performance.now();
      // a poll that arrived late was throttled (background window, sleep, modal):
      // the emulator loop was throttled with it — not a freeze; start over
      const sincePoll = now - freezeState.lastPoll;
      freezeState.lastPoll = now;
      if (sincePoll > POLL_MS * 2.5) {
        resetStalls(0);
        return;
      }
      // suspended states: never accumulate a stall through them
      if (
        document.visibilityState === "hidden" ||
        (window.BWSnapshot && window.BWSnapshot.busy)
      ) {
        resetStalls(0);
        return;
      }
      // host loop
      if (typeof Module.bwGetHeartbeat === "function") {
        const hb = Module.bwGetHeartbeat();
        if (hb !== freezeState.hb) {
          freezeState.hb = hb;
          freezeState.hbAt = now;
        }
      }
      // guest execution: pgRawAt = last time progress advanced (hardlock rule);
      // pgAt = the same but reset while idle (waiting-on-guest rule)
      let guestAdvanced = true; // unknown => assume alive
      const p = guestProgress();
      if (p) {
        guestAdvanced =
          p.kind === "progress"
            ? freezeState.pg === null || p.v !== freezeState.pg
            : p.v > 0;
        if (guestAdvanced) {
          freezeState.pgAt = freezeState.pgRawAt = now;
          if (freezeState.pg !== null) freezeState.seenAlive = true;
        }
        if (p.kind === "progress") freezeState.pg = p.v;
        else freezeState.pg = p.v > 0 ? 1 : 0;
      } else {
        freezeState.pgRawAt = now;
      }
      if (!waitingOnGuest()) freezeState.pgAt = now; // idle prompt: guest progress is not expected
      const hbStall = now - freezeState.hbAt,
        pgStall = now - freezeState.pgAt,
        pgStallRaw = now - freezeState.pgRawAt;
      if (now < freezeState.graceUntil || !freezeState.seenAlive) return; // never before the guest was seen running
      let why = null;
      if (hbStall > FREEZE_MS && pgStallRaw > FREEZE_MS)
        why = "no main-loop heartbeat and no guest progress";
      else if (pgStall > WAIT_FREEZE_MS)
        why = "no guest progress while waiting on it";
      if (why) {
        // confirm: the same condition on CONFIRM_POLLS further consecutive polls
        if (++freezeState.suspect > CONFIRM_POLLS)
          setFrozen(true, {
            why,
            stalledMs: Math.round(Math.max(hbStall, pgStall)),
            confirmedPolls: freezeState.suspect,
            heartbeat: freezeState.hb,
            progress: freezeState.pg,
          });
      } else {
        freezeState.suspect = 0;
        if (freezeState.frozen) setFrozen(false, {});
      }
    }, POLL_MS);
  };
  const stopFreezeDetector = () => {
    if (freezeState.timer) {
      clearInterval(freezeState.timer);
      freezeState.timer = null;
    }
    document.removeEventListener("visibilitychange", onVisibility);
  };

  const createBoxedwineLoadedListener = () => {
    window.addEventListener("boxedwine-fully-loaded", (event) => {
      const { timestamp, totalLoadTime, how } = event.detail || {};
      console.log(
        "Boxedwine environment ready (" +
          how +
          ") after " +
          Math.round(totalLoadTime || 0) +
          " ms",
      ); // boot milestone
      window.dispatchEvent(
        new CustomEvent("emulator-ready", {
          detail: { timestamp, totalLoadTime, how },
        }),
      );
      // Tell the parent app: it answers with bwApp.reconcile(<whole drawer>) — D: is
      // rebuilt from the drawer, then the input gate opens and the loading screen
      // goes. If nobody reconciles (standalone iframe), open after NO_PARENT_MS.
      postToParent("emulator-ready", { totalLoadTime, how });
      if (window.bwBootStage) window.bwBootStage("Loading your files");
      gateState.fallbackTimer = setTimeout(() => {
        if (!inputOpen()) openInput("no-parent");
      }, NO_PARENT_MS);
    });
  };

  // SDL takes keyboard events on the window
  // and a mouse press inside the iframe focuses it natively - so the overlay is kept
  // only as an inert element (styles/ids referenced elsewhere) and never blocks input.
  const createClickListener = () => {
    window.addEventListener("editor-selected", (event) => {
      event.preventDefault();
      const overlay = document.getElementById("emscripten-overlay");
      if (overlay) overlay.style.pointerEvents = "none";
    });
  };

  const handleClick = (event) => {
    event.preventDefault();
    event.target.style.pointerEvents = "none";
  };

  return (
    <>
      {isLoading && <LoadingScreen />}
      <div
        onClick={(event) => handleClick(event)}
        onContextMenu={(event) => handleClick(event)}
        id={"emscripten-overlay"}
        className={"emscripten-overlay"}
        style={{ pointerEvents: "none" }}
      />
    </>
  );
}

export default Boxedwine;
