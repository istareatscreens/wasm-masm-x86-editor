import React, { useEffect, useState } from "react";
import { createMessageListner } from "../../utility/utilityFunctions.ts";
import { outputPath } from "../main/utility/filesystem/paths";
import { guestPathOf, nativePathOf, splitDrive, driveRoot, D_GUEST, D_NATIVE, LABEL_FILES } from "../main/utility/filesystem/drives";
import LoadingScreen from "./LoadingScreen.jsx";
import { createDebugBridge } from "./debug/pageBridge.js";
import { nativeFileOf } from "./debug/terminalPath.js";

// The canvas is static in boxedwine.html (the shell captures #canvas at script load); this component wires the
// app's controls to the emulator's embind calls. guestPathOf gives a drawer path's guest path (D: is /mnt/drive_d,
// other drives are under /mnt/bw_drives), nativePathOf its Module.FS path (/d_drive, /bw_drives).
// The toolchain archive mounted at C:\files (getAppZipFile): the shell writes it to this page's file system before
// the mount, and a restore keeps it.
const TOOLCHAIN_ZIP = "/assembler-dp0.zip";
// The Irvine library's archive, mounted at C:\files\irvine and C:\Irvine (boxedwine.html: getMountedZips).
const IRVINE_ZIP = "/irvine.zip";
// Build artifacts to read back into the app after an assemble (skip any not produced).
const OUTPUT_EXTS = [".obj", ".exe", ".lst", ".map"];
// Guest -> drawer import (importScan): every IMPORT_EVERY_MS and after each build; larger files are reported once and
// left in the session.
const IMPORT_EVERY_MS = 5000;
const IMPORT_MAX_BYTES = 4 * 1024 * 1024;
const IMPORT_MAX_DEPTH = 16;
const IMPORT_MAX_ENTRIES = 4096;
// Harness sentinel files (`__bw_*`) are never imported.
const isSentinel = (name) => /^__bw_/i.test(name);
// Files the parent treats as text (same rule as its reconciliation).
const isTextName = (name) => /\.(asm|inc|txt|text|bat|lst|map)$/i.test(name);

const quoteForCmd = (text) => (/[\s&()^;,=|<>]/.test(text) ? '"' + text + '"' : text);

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

// Polls until the .exe (the last output: asm -> obj -> exe) is complete, then posts every output the build left to
// the parent. A failed build (no .exe) still posts what exists at the ceiling, so partial output can be inspected.
const readBackBuildOutputs = (name, onDone) => {
  let tries = 0,
    lastSize = -1;
  const maxTries = 44; // 22 s ceiling
  const timer = setInterval(() => {
    tries++;
    // Complete = non-empty and the same size as at the previous poll: under MT the linker writes it in parallel,
    // so the file can be seen while still empty or partial.
    let exeReady = false;
    try {
      const sz = Module.FS.stat(nativePathOf(name + ".exe")).size;
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
        const bytes = Module.FS.readFile(nativePathOf(name + ext)); // Uint8Array
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

// A plan's build (banner/build/buildRequest.ts): once its last output (the program's .exe or .dll, or the one
// module's .obj) is complete, or at the plan's ceiling, every output it lists that the build left is read back.
const readBackPlanOutputs = (request, onDone) => {
  let tries = 0,
    lastSize = -1;
  const maxTries = Math.ceil(request.ceilingMs / 500);
  const timer = setInterval(() => {
    tries++;
    let ready = false;
    try {
      const size = Module.FS.stat(nativePathOf(request.waitFor)).size;
      ready = size > 0 && size === lastSize; // complete: as above
      lastSize = size;
    } catch (e) {
      lastSize = -1;
    }
    if (!ready && tries < maxTries) return;
    clearInterval(timer);
    const outputs = [];
    for (const path of request.read) {
      try {
        const bytes = Module.FS.readFile(nativePathOf(path));
        if (bytes.length) outputs.push({ filename: path, base64: uint8ToBase64(bytes), size: bytes.length });
      } catch (e) {
        /* not produced by this build */
      }
    }
    postToParent("build-outputs", { name: request.waitFor.replace(/\.[^./]*$/, ""), outputs, ok: ready, removed: request.remove });
    if (onDone) onDone(ready);
  }, 500);
};

// A toolchain archive in this page's file system, loaded with JSZip once: the page never changes it.
const archives = new Map();
const toolchainArchive = (archive) => {
  if (!archives.has(archive)) archives.set(archive, window.JSZip.loadAsync(Module.FS.readFile(archive)));
  return archives.get(archive);
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
    // Each control is reachable two ways that end in the same do* function: window.bwApp.* called cross-frame by the
    // parent (primary), or these CustomEvents from the postMessage bridge, for callers that run before bwApp exists.
    [
      "write-command",
      "sync-file",
      "rename-file",
      "build-file",
      "build-plan",
      "run-file",
      "delete-file",
      "make-dir",
      "remove-dir",
      "reset",
      "reconcile-files",
      "interrupt",
      "map-drive",
      "remove-drive",
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
      "build-plan",
      "run-file",
      "delete-file",
      "make-dir",
      "remove-dir",
      "reconcile-files",
      "interrupt",
      "map-drive",
      "remove-drive",
      "boxedwine-fully-loaded",
    ].forEach((e) => window.removeEventListener(e, onFallbackEvent));
    window.removeEventListener("boxedwine-input-open", onInputOpen);
    stopFreezeDetector();
    stopImportScan();
    debugBridge.close();
    try {
      if (window.bwApp && window.bwApp.__owner === Boxedwine)
        delete window.bwApp;
    } catch (e) {}
  };

  // --- Input gate -------------------------------------------------------
  // Nothing reaches the guest before the environment is ready and the drawer is reconciled into D:. boxedwine.html
  // drops keys while BW_INPUT_OPEN is false, and every control here is queued until the gate opens: in doReconcile,
  // or NO_PARENT_MS after ready when no parent reconciles (a standalone iframe).
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

  // Ctrl+C goes down the emulator's key queue like the keyboard, and conhost raises CTRL_C_EVENT. Not gated on
  // purpose: it must work while a build or program runs.
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
  // Every file op is checked by a Module.FS readback; a mismatch retries the op once, then warns and reports ok:false.
  const guestStat = (filename) => {
    try {
      const st = Module.FS.stat(nativePathOf(filename));
      return { exists: true, size: st.size, dir: Module.FS.isDir(st.mode) };
    } catch (e) {
      return { exists: false, size: -1, dir: false };
    }
  };
  const verifyGuest = (op, filename, expect) => {
    const st = guestStat(filename);
    let ok = expect.present ? st.exists : !st.exists;
    if (ok && expect.present && typeof expect.dir === "boolean" && st.dir !== expect.dir)
      ok = false;
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
        rc: Module.bwWriteFileBytes(guestPathOf(filename), u8),
        size: u8.length,
      };
    }
    const text = isBinary ? atob(content || "") : content || "";
    // embind writes the string UTF-8 encoded: verify against the UTF-8 byte length
    const size =
      typeof TextEncoder !== "undefined"
        ? new TextEncoder().encode(text).length
        : text.length;
    return { rc: Module.bwWriteFile(guestPathOf(filename), text), size };
  };

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

  // bwRenameFile renames the node itself, so the running cmd sees the new name; when it fails, the old file is
  // deleted and the app's copy of the content written.
  const doRenameFile = (oldName, newName, content, isBinary) => {
    if (!oldName || !newName) return;
    gated(() =>
      whenModuleReady(["bwWriteFile", "bwDeleteFile"], () => {
        importState.drawer.delete(oldName);
        importState.drawer.add(newName);
        const run = () => {
          let rc =
            typeof Module.bwRenameFile === "function"
              ? Module.bwRenameFile(guestPathOf(oldName), guestPathOf(newName))
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
            Module.bwDeleteFile(guestPathOf(oldName));
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

  // Writes the .asm to D: and types the build in the same step (no write/run race). The toolchain is read-only at
  // C:\files; outputs land in the source's bin folder. content: the stored bytes as base64 when isBase64, else text.
  const doBuild = (filename, content, isBase64) => {
    if (!filename) return;
    gated(() =>
      whenModuleReady(["bwWriteFile", "sendText"], () => {
        const slash = filename.lastIndexOf("/");
        const folder = slash < 0 ? "" : filename.slice(0, slash);
        const base = filename.slice(slash + 1).replace(/\.asm$/i, "");
        const name = outputPath(filename, ""); // drawer path of the outputs, minus ext
        // A name with spaces (or cmd-special characters) is quoted: assemble.bat's %1 then expands to
        // "my program", i.e. "my program".asm / .obj / .exe, which JWasm, JWlink, FL and cmd all take as one name.
        const command = inFolder(folder, "call C:\\files\\assemble " + quoteForCmd(base));
        if (!command) return postToParent("run-refused", { filename });
        importState.drawer.add(filename);
        if (folder && typeof Module.bwMakeDir === "function") Module.bwMakeDir(guestPathOf(folder));
        const rc = isBase64
          ? writeGuestFile(filename, content, true).rc
          : Module.bwWriteFile(guestPathOf(filename), content || "");
        if (rc !== 0) {
          console.error("[Boxedwine] build sync failed rc=" + rc);
          return;
        }
        // Delete the previous build's outputs first (assemble.bat does not): after a failed assemble the readback
        // would otherwise report the old .exe as this build's.
        if (typeof Module.bwDeleteFile === "function") {
          for (const ext of OUTPUT_EXTS) {
            try {
              Module.bwDeleteFile(guestPathOf(name + ext));
            } catch (e) {}
          }
        }
        freezeState.buildInFlight = true; // guest progress is now expected (freeze detector)
        Module.sendText(command + "\r");
        readBackBuildOutputs(name, () => {
          freezeState.buildInFlight = false;
          importScan();
        });
      }),
    );
  };

  // A program's build plan: every file of the plan written to the guest as stored (a save still on its way
  // cannot race the build), its stale outputs deleted, then `assemble` typed in the program's folder.
  const doBuildPlan = (request) => {
    if (!request || !request.files) return;
    gated(() =>
      whenModuleReady(["bwWriteFile", "sendText"], () => {
        const command = inFolder(request.folder, "call C:\\files\\assemble " + request.args);
        if (!command) return postToParent("run-refused", { filename: request.file });
        for (const file of request.files) {
          importState.drawer.add(file.path);
          const slash = file.path.lastIndexOf("/");
          if (slash > 0 && typeof Module.bwMakeDir === "function") Module.bwMakeDir(guestPathOf(file.path.slice(0, slash)));
          const rc = writeGuestFile(file.path, file.base64, true).rc;
          if (rc !== 0) {
            console.error("[Boxedwine] build sync failed rc=" + rc + ": " + file.path);
            return;
          }
        }
        if (typeof Module.bwDeleteFile === "function") {
          for (const path of request.remove) {
            try {
              Module.bwDeleteFile(guestPathOf(path));
            } catch (e) {}
          }
        }
        freezeState.buildInFlight = true;
        Module.sendText(command + "\r");
        readBackPlanOutputs(request, () => {
          freezeState.buildInFlight = false;
          importScan();
        });
      }),
    );
  };

  // The program a build of `filename` made (bin\<name>.exe), run from the source's folder.
  const doRun = (filename) => {
    if (!filename) return;
    gated(() =>
      whenModuleReady(["sendText"], () => {
        const slash = filename.lastIndexOf("/");
        const exe = "bin\\" + filename.slice(slash + 1).replace(/\.asm$/i, "") + ".exe";
        const command = inFolder(slash < 0 ? "" : filename.slice(0, slash), quoteForCmd(exe));
        if (!command) return postToParent("run-refused", { filename });
        Module.sendText(command + "\r");
      }),
    );
  };

  // The command that runs `body` in `folder` (a drawer path) on the folder's own drive, or null when that drive has
  // no letter here. A failed pushd sets errorlevel 1, so nothing runs and nothing pops; `&&` would not do, because
  // Wine 6.0's cmd runs what follows it whatever the result.
  const inFolder = (folder, body) => {
    const { id, rel } = splitDrive(folder);
    let letter = "D";
    if (id !== null) {
      const mapped = drives.get(id);
      if (!mapped || !mapped.letter || Module.bwDriveLink(mapped.letter) !== guestPathOf(driveRoot(id))) return null;
      letter = mapped.letter.toUpperCase();
    }
    const dir = rel ? quoteForCmd(letter + ":\\" + rel.split("/").join("\\")) : letter + ":\\";
    return "pushd " + dir + " & if not errorlevel 1 (" + body + " & popd)";
  };

  // The named entries of a toolchain archive (the toolchain's, or Irvine's), read with this page's JSZip once
  // input is open; rejects when one is missing.
  const doReadToolchainFiles = (names, archive = TOOLCHAIN_ZIP) =>
    new Promise((resolve, reject) =>
      gated(async () => {
        try {
          const zip = await toolchainArchive(archive);
          const files = {};
          for (const name of names) {
            const entry = zip.file(name);
            if (!entry) throw new Error(name + " is not in " + archive);
            files[name] = await entry.async("uint8array");
          }
          resolve(files);
        } catch (e) {
          reject(e);
        }
      }),
    );
  // The toolchain's folders for the build plan: C:\files\irvine (and C:\Irvine), and C:\files\lib.
  const doListToolchain = () =>
    new Promise((resolve, reject) =>
      gated(async () => {
        try {
          const names = (zip, prefix) => Object.keys(zip.files).filter((n) => !zip.files[n].dir && n.indexOf(prefix) === 0 && n.indexOf("/", prefix.length) < 0).map((n) => n.slice(prefix.length));
          resolve({ irvine: names(await toolchainArchive(IRVINE_ZIP), ""), lib: names(await toolchainArchive(TOOLCHAIN_ZIP), "lib/") });
        } catch (e) {
          reject(e);
        }
      }),
    );

  // bwMakeDir is mkdir -p; bwRemoveDir takes an empty folder (the parent deletes the files first). A build without
  // these calls (mismatched glue/wasm) reports ok:false.
  const doMakeDir = (path) => {
    if (!path) return;
    gated(() => {
      if (typeof Module === "undefined" || typeof Module.bwMakeDir !== "function")
        return reportSync({ op: "mkdir", filename: path, ok: false, error: "bwMakeDir missing" });
      importState.folders.add(path);
      withVerify("mkdir", path, { present: true, dir: true }, () =>
        Module.bwMakeDir(guestPathOf(path)),
      );
    });
  };
  const doRemoveDir = (path) => {
    if (!path) return;
    gated(() => {
      if (typeof Module === "undefined" || typeof Module.bwRemoveDir !== "function")
        return reportSync({ op: "rmdir", filename: path, ok: false, error: "bwRemoveDir missing" });
      importState.folders.delete(path);
      withVerify("rmdir", path, { present: false }, () =>
        Module.bwRemoveDir(guestPathOf(path)),
      );
    });
  };

  // --- Drives -------------------------------------------------------------
  // The other drives: each a folder of the drive store (/mnt/bw_drives/<id>) with its label in .windows-label,
  // mapped to its letter (Module.bwMapDrive) while it has one. Snapshots never hold a mapping: the parent maps
  // every drive at each start (reconcile) and whenever one is made, relabelled, given a letter or left without.
  const drives = new Map(); // id -> { letter ("" for none), label }
  const mapGuestDrive = (drive) => {
    const root = guestPathOf(driveRoot(drive.id));
    const letter = drive.letter || "";
    // the letter the drive had here goes, unless it already links to another drive (which took it meanwhile)
    const old = drives.get(drive.id);
    if (old && old.letter && old.letter !== letter && Module.bwDriveLink(old.letter) === root) Module.bwUnmapDrive(old.letter);
    const made = Module.bwMakeDir(root);
    const labelled = Module.bwWriteFile(root + "/" + LABEL_FILES[0], (drive.label || "") + "\n");
    drives.set(drive.id, { letter, label: drive.label });
    if (!letter) return reportSync({ op: "map-drive", filename: drive.label || drive.id, ok: made === 0 && labelled === 0, made, labelled, letter });
    const rc = Module.bwMapDrive(letter, root);
    const link = Module.bwDriveLink(letter);
    return reportSync({ op: "map-drive", filename: letter.toUpperCase() + ":", ok: made === 0 && labelled === 0 && rc === 0 && link === root, made, labelled, rc, link });
  };
  const doMapDrive = (drive) => {
    if (!drive || !drive.id) return;
    gated(() => whenModuleReady(["bwMapDrive"], () => mapGuestDrive(drive)));
  };
  // a deleted drive: unmapped, then its folder emptied and removed, deepest first
  const doRemoveDrive = (drive) => {
    if (!drive || !drive.id) return;
    gated(() =>
      whenModuleReady(["bwUnmapDrive"], () => {
        const root = driveRoot(drive.id);
        const mapped = drives.get(drive.id);
        const letter = mapped ? mapped.letter : drive.letter;
        drives.delete(drive.id);
        const rc = letter && Module.bwDriveLink(letter) === guestPathOf(root) ? Module.bwUnmapDrive(letter) : 0;
        const dirs = [];
        const walk = (rel) => {
          let names;
          try {
            names = Module.FS.readdir(nativePathOf(root + (rel ? "/" + rel : "")));
          } catch (e) {
            return;
          }
          for (const n of names) {
            if (n === "." || n === "..") continue;
            const sub = (rel ? rel + "/" : "") + n;
            try {
              if (Module.FS.isDir(Module.FS.stat(nativePathOf(root + "/" + sub)).mode)) {
                walk(sub);
                dirs.push(sub);
              } else Module.bwDeleteFile(guestPathOf(root + "/" + sub));
            } catch (e) {}
          }
        };
        walk("");
        dirs.forEach((sub) => Module.bwRemoveDir(guestPathOf(root + "/" + sub)));
        Module.bwRemoveDir(guestPathOf(root));
        for (const set of [importState.drawer, importState.folders]) for (const path of Array.from(set)) if (path.startsWith(root + "/")) set.delete(path);
        for (const path of Array.from(importState.posted.keys())) if (path.startsWith(root + "/")) importState.posted.delete(path);
        reportSync({ op: "remove-drive", filename: letter ? letter.toUpperCase() + ":" : drive.label || drive.id, ok: rc === 0 && !guestStat(root).exists, rc });
      }),
    );
  };
  const isLabelFile = (depth, name) => depth === 0 && LABEL_FILES.indexOf(name) >= 0;

  // bwDeleteFile removes the node from its parent, so cmd's next `dir` no longer shows the file.
  const doDeleteFile = (filename) => {
    if (!filename) return;
    gated(() =>
      whenModuleReady(["bwDeleteFile"], () => {
        importState.drawer.delete(filename);
        importState.posted.delete(filename);
        withVerify("delete", filename, { present: false }, () =>
          Module.bwDeleteFile(guestPathOf(filename)),
        );
      }),
    );
  };

  // --- Reconcile --------------------------------------------------------
  // The parent hands over the whole drawer once the environment is ready: drives, folders (shallowest first), then
  // files are written to D: and verified, and only then does the input gate open. Runs on every start, cold or
  // restored (the factory image holds no user file), and is idempotent.
  const doReconcile = (files, folders, driveList) => {
    const list = Array.isArray(files) ? files : [];
    const dirs = (Array.isArray(folders) ? folders : [])
      .filter(Boolean)
      .sort((a, b) => a.split("/").length - b.split("/").length);
    whenModuleReady(["bwWriteFile"], () => {
      const t0 = performance.now();
      let written = 0,
        madeFolders = 0,
        failed = [];
      importState.drawer = new Set();
      importState.folders = new Set();
      // the drives first (their folders, labels and letters); D: has no label
      for (const drive of Array.isArray(driveList) ? driveList : []) {
        if (!drive || !drive.id) continue;
        const name = drive.letter ? drive.letter.toUpperCase() + ":" : drive.label || drive.id;
        const res =
          typeof Module.bwMapDrive === "function"
            ? mapGuestDrive(drive)
            : reportSync({ op: "map-drive", filename: name, ok: false, error: "bwMapDrive missing" });
        if (!res.ok) failed.push(name);
      }
      Module.bwDeleteFile(D_GUEST + "/" + LABEL_FILES[0]);
      for (const d of dirs) {
        importState.folders.add(d);
        const res =
          typeof Module.bwMakeDir === "function"
            ? withVerify("reconcile-mkdir", d, { present: true, dir: true }, () =>
                Module.bwMakeDir(guestPathOf(d)),
              )
            : reportSync({ op: "reconcile-mkdir", filename: d, ok: false, error: "bwMakeDir missing" });
        if (res.ok) madeFolders++;
        else failed.push(d + "/");
      }
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
        folders: dirs.length,
        madeFolders,
        drives: drives.size,
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
  // D: is MEMFS: what the guest creates (program output, `copy con`, `mkdir`) is lost at the next reload unless the
  // drawer gets it. Each scan posts what the drawer lacks under its exact guest name (a drive's under "drive:<id>/"),
  // never a drive's label files; nothing is ever deleted from the drawer here.
  const importState = {
    drawer: new Set(),
    folders: new Set(),
    posted: new Map(),
    timer: null,
  };
  const importScan = () => {
    if (!inputOpen() || typeof Module === "undefined" || !Module.FS) return;
    if (window.BWSnapshot && window.BWSnapshot.busy) return;
    const found = [],
      folders = [],
      entries = [];
    let seen = 0;
    const walk = (root, dir, depth) => {
      let names;
      try {
        names = Module.FS.readdir(nativePathOf(root ? root + (dir ? "/" + dir : "") : dir));
      } catch (e) {
        return;
      }
      for (const name of names) {
        if (name === "." || name === ".." || isSentinel(name) || isLabelFile(depth, name)) continue;
        if (++seen > IMPORT_MAX_ENTRIES) return;
        const rel = (dir ? dir + "/" : "") + name;
        const path = root ? root + "/" + rel : rel;
        let st;
        try {
          st = Module.FS.stat(nativePathOf(path));
        } catch (e) {
          continue;
        }
        if (Module.FS.isDir(st.mode)) {
          if (!importState.folders.has(path)) folders.push(path);
          if (depth < IMPORT_MAX_DEPTH) walk(root, rel, depth + 1);
        } else if (Module.FS.isFile(st.mode)) entries.push({ n: path, st });
      }
    };
    walk("", "", 0);
    for (const id of Array.from(drives.keys())) walk(driveRoot(id), "", 0);
    for (const { n, st } of entries) {
      if (importState.drawer.has(n)) continue;
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
        const bytes = Module.FS.readFile(nativePathOf(n));
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
    for (const path of folders) importState.folders.add(path);
    if (found.length || folders.length)
      postToParent("guest-files", { files: found, folders, source: "guest" });
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

  // Guest D: listing for tests / the drawer: [{name, size, dir}], recursive, names as
  // "/" paths (Module.FS on /d_drive), D:'s label file left out.
  const verifyTree = () => {
    try {
      const out = [];
      const walk = (dir) => {
        for (const n of Module.FS.readdir(D_NATIVE + "/" + dir)) {
          if (n === "." || n === ".." || isLabelFile(dir ? 1 : 0, n)) continue;
          const path = (dir ? dir + "/" : "") + n;
          try {
            const st = Module.FS.stat(nativePathOf(path));
            const isDir = Module.FS.isDir(st.mode);
            out.push({ name: path, size: st.size, dir: isDir });
            if (isDir) walk(path);
          } catch (e) {
            out.push({ name: path, size: -1 });
          }
        }
      };
      walk("");
      return out;
    } catch (e) {
      return null;
    }
  };

  // Reset reloads the iframe, for ST and MT alike: it works even when the emulator is wedged, and is data-safe
  // because the user's files live in the parent app's IndexedDB. Never callMain here: it deadlocks thread 0 under
  // PROXY_TO_PTHREAD (MT); restartBW alone leaves the console unusable.
  const doReset = () => {
    try {
      location.reload();
    } catch (e) {
      try {
        window.location.href = window.location.href;
      } catch (_) {}
    }
  };

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
        return doBuild(d.filename, d.content, !!d.isBase64);
      }
      case "build-plan":
        return doBuildPlan(event.detail);
      case "run-file":
        return doRun(typeof event.detail === "string" ? event.detail : (event.detail || {}).filename);
      case "delete-file":
        return doDeleteFile(
          typeof event.detail === "string"
            ? event.detail
            : (event.detail || {}).filename,
        );
      case "make-dir":
        return doMakeDir(event.detail);
      case "remove-dir":
        return doRemoveDir(event.detail);
      case "reconcile-files": {
        const d = event.detail || {};
        return doReconcile(d.files || d, d.folders, d.drives);
      }
      case "map-drive":
        return doMapDrive(event.detail);
      case "remove-drive":
        return doRemoveDrive(event.detail);
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
      build: (filename, content, isBase64) => doBuild(filename, content, !!isBase64),
      buildPlan: (request) => doBuildPlan(request),
      run: (filename) => doRun(filename),
      readToolchainFiles: (names, archive) => doReadToolchainFiles(names, archive),
      listToolchain: () => doListToolchain(),
      deleteFile: (filename) => doDeleteFile(filename),
      makeDir: (path) => doMakeDir(path),
      removeDir: (path) => doRemoveDir(path),
      reconcile: (files, folders, driveList) => doReconcile(files, folders, driveList),
      mapDrive: (drive) => doMapDrive(drive),
      removeDrive: (drive) => doRemoveDrive(drive),
      driveLink: (letter) => (typeof Module !== "undefined" && Module.bwDriveLink ? Module.bwDriveLink(letter) : ""),
      inputOpen: () => inputOpen(),
      verifyTree: () => verifyTree(),
      reset: () => doReset(),
      interrupt: () => doInterrupt(),
      // the debugger: one end of the app's message channel (debug/pageBridge.js)
      debugConnect: (port) => debugBridge.connect(port),
      // liveness (see startFreezeDetector): last observed heartbeat + frozen flag.
      isFrozen: () => freezeState.frozen,
      heartbeat: () =>
        typeof Module !== "undefined" && Module.bwGetHeartbeat
          ? Module.bwGetHeartbeat()
          : -1,
    };
  };

  // --- Emulator freeze detection --------------------------------------------------
  // User code can hardlock the emulator. Frozen = main-loop heartbeat and guest progress (retired instructions) both
  // stalled for FREEZE_MS, or no guest progress for WAIT_FREEZE_MS while input or a build waits on the guest; a
  // program that merely spins keeps progressing. A false banner is worse than a late one, so a report needs GRACE_MS
  // since arming (cmd is still starting), a guest seen running and CONFIRM_POLLS further polls.
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
    debugHolding: false,
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
    // a program the debugger holds at a stop makes no progress, whatever was typed for it
    if (freezeState.debugHolding) return false;
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
    // Armed once the input gate opens: the factory capture's heap copy and the reconcile writes all happen before,
    // so none of them can look like a stall.
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
      // a hidden tab (timers throttled) or a snapshot (heap copy on the loop's thread): never a stall
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

  const debugBridge = createDebugBridge({
    nativePath: (path) => nativeFileOf(path, drives, Module.FS),
    onHolding: (held) => {
      freezeState.debugHolding = held;
    },
  });

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
      // The parent answers with bwApp.reconcile(<whole drawer>), which opens the input gate; with no parent
      // (a standalone iframe) the gate opens after NO_PARENT_MS.
      postToParent("emulator-ready", { totalLoadTime, how });
      if (window.bwBootStage) window.bwBootStage("Loading your files");
      gateState.fallbackTimer = setTimeout(() => {
        if (!inputOpen()) openInput("no-parent");
      }, NO_PARENT_MS);
    });
  };

  // SDL takes keyboard events on the window and a click focuses the iframe natively, so the overlay is only an
  // inert element (its id and styles are referenced elsewhere) that never blocks input.
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
