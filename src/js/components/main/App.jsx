import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";

import FileDrawer from "./filedrawer/FileDrawer.jsx";
import CommandPrompt from "./cmd/CommandPrompt.jsx";
import Editor from "./editor/Editor.jsx";
import Banner from "./banner/Banner.jsx";
import useBannerRows from "./banner/useBannerRows.js";
import AppLayout from "./layout/AppLayout.jsx";
import useViewMode from "./layout/useViewMode.js";
import playSnake from "./snake/playSnake.js";
import { loadX86Decoder } from "./crash/x86Decoder";
import { classifyInvalidOpcode, invalidOpcodeHint } from "./crash/invalidOpcode";
import { CRASH_HINTS } from "./utility/debug/session/exceptionHints";
import { invalidOpcodeIssue, emulatorCrashIssue, terminalResetIssue } from "./crash/bugReport";
import FreezeBanner from "./cmd/FreezeBanner.jsx";
import { recentResets, resetPageInfo, resetTerminal, setResetHooks } from "./cmd/terminalReset";
import RetroNotice from "../common/RetroNotice.jsx";
import ConfirmWindow from "./filedrawer/dialogs/ConfirmWindow.jsx";
import { windowToggle } from "../common/useWindowToggle.js";
import ShareWindow from "./share/ShareWindow.jsx";
import ImportWindow, { resultText } from "./share/ImportWindow.jsx";
import useImportQuestions from "./share/useImportQuestions.jsx";
import { importLink, fragmentLink, clearFragment, openPathOf, isDesktop } from "./utility/share/ShareService.js";
import { preloadDecoder } from "./utility/share/brotli";
import { startTabSync } from "./utility/session/tabSync.js";
import DebugSidebar from "./debugger/DebugSidebar.jsx";
import useDebugController from "./debugger/session/useDebugController.js";
import useDebugKeys from "./debugger/keyboard/useDebugKeys.js";

import FileSystem from "./utility/FileSystem";
import { preloadImages } from "./utility/assets.js";
import { getFromLocalStorage } from "./utility/filesystem/FSHelperFunctions.js";
import { postMessage, createMessageListner, reconcileEmulatorFiles } from "../../utility/utilityFunctions.ts";
import { labelProblem, driveRoot, driveName, rootOf, isDrivePath } from "./utility/filesystem/drives";
import { guestPath } from "./utility/filesystem/paths";
import { DEFAULT_FILE_TYPE, parseFileType } from "./filedrawer/model/fileTypes";
import { themeList as cmThemeList, normalizeThemeId } from "./editor/library/themes";

// the page's cover (#app-splash in the HTML) stays at most this long: a picture or font that
// never loads does not hide the page
const ASSETS_MS = 4000;

function App() {
  const [filename, setFilename] = useState("test");
  // the page appears whole: its cover goes once every icon and image is decoded and the fonts
  // are loaded (a short fade, grey to grey)
  useEffect(() => {
    const splash = document.getElementById("app-splash");
    if (!splash) return undefined;
    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      splash.classList.add("app-splash--done");
      setTimeout(() => splash.remove(), 250);
    };
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
    Promise.all([preloadImages(), fonts]).then(show, show);
    const cap = setTimeout(show, ASSETS_MS);
    return () => clearTimeout(cap);
  }, []);
  const [fileList, setFileList] = useState([""]);
  const [drives, setDrives] = useState([]); // the other drives (E: to Y:), by letter
  const [lockEditor, setEditorLock] = useState(false);
  const [emulatorFrozen, setEmulatorFrozen] = useState(false);
  // Emulator notice (runtime downgrade / slow boot): {title, body}
  const [emulatorNotice, setEmulatorNotice] = useState(null);
  // A program the user ran faulted (page fault, stack overflow, ...): the guest ends it
  // at once and Wine's one-line reason is shown here with a hint per kind.
  const [crashNotice, setCrashNotice] = useState(null);
  // The emulator itself stopped (a WebAssembly trap): {message, stack, build, runtime}
  const [emulatorCrash, setEmulatorCrash] = useState(null);
  // a reset whose emulator page did not load, even on its retry
  const [resetFailed, setResetFailed] = useState(false);
  // the file open in the editor, for a bug report
  const filenameRef = useRef(filename);
  filenameRef.current = filename;
  // Share by URL ({files, folders}), Import by URL, an import's result, and a row the drawer shows
  const [shareTargets, setShareTargets] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [linkNotice, setLinkNotice] = useState(null);
  const [reveal, setReveal] = useState(null);
  const questions = useImportQuestions();
  // Import by URL's button toggles its window as the window's close button does: not while it imports
  const importBusy = useRef(false);
  const importLinks = windowToggle(importOpen, () => setImportOpen(true), () => importBusy.current || setImportOpen(false));
  // before a link's files are written: the editor's waiting save first, so it never lands on a file the link wrote
  const beforeImportWrite = () => {
    FileSystem.flushPendingSaves();
    setEditorLock(true);
  };

  //TODO: Change how this is done
  const [refreshFile, setRefreshFile] = useState(true); //value switched to force editor rerender

  // CodeMirror 6 theme catalog (see editor/library/themes.js). Each entry is
  // { id, key, text } where key/text is the CM6 theme id.
  const [themeList] = useState(cmThemeList);

  const [fontList, setFontList] = useState([
    { id: 0, text: "Lucida Console" },
    { id: 1, text: "FiraCode" },
    { id: 2, text: "Consolas" },
    { id: 3, text: "Monoid" },
    { id: 4, text: "Press Start 2P", fontFamily: "Press Start" },
    { id: 5, text: "Roboto Mono" },
    { id: 6, text: "Source Code Pro" },
    { id: 7, text: "Sudo" },
    { id: 8, text: "Ubuntu Mono" },
    { id: 9, text: "Courier" },
  ]);

  // Resolve a theme-list entry by CM6 id, with fallback to the first theme.
  const findThemeByKey = (key) =>
    themeList.find((theme) => theme.key === key) || themeList[0];
  // Migrate a stored theme selection (which may reference a legacy CM5 name or a
  // CM6 id) to a valid catalog entry.
  const migrateThemeSetting = (stored, dark) =>
    findThemeByKey(normalizeThemeId(stored && (stored.key || stored.text), dark));

  //editor settings: the "settings" key of window.localStorage, read synchronously (the first render needs them).
  //The hard reset keeps this key on purpose.
  const settingsDefaults = () => ({
    fontSize: 16,
    selectedFont: fontList[0],
    selectedDayTheme: findThemeByKey("basicLight"),
    selectedNightTheme: findThemeByKey("one-dark"),
    lightMode: false,
    vimMode: false,
    handlesHidden: false,
    debugMode: false, // the banner's Debug switch: RUN debugs, and the debug sidebar and the breakpoint gutter show
    bannerCollapsed: false, // the main toolbar clipped to its first row while its controls need more
    newFileType: DEFAULT_FILE_TYPE, // the type the Create file window chose last (filedrawer/model/fileTypes.ts)
    workspaceName: "", // the name links from D: carry (generated at the first share; D: has no label)
  });
  // Stored JSON -> a valid settings object (null when unusable).
  const settingsFromStored = (stored) => {
    if (typeof stored !== "string") return null;
    let parsed;
    try {
      parsed = JSON.parse(stored);
    } catch (error) {
      return null;
    }
    if (!parsed || typeof parsed !== "object") return null;
    return {
      ...settingsDefaults(),
      ...parsed,
      // CM6 theme ids differ from the old CM5 names; migrate on load so
      // returning users get a valid theme instead of a crash.
      selectedDayTheme: migrateThemeSetting(parsed.selectedDayTheme, false),
      selectedNightTheme: migrateThemeSetting(parsed.selectedNightTheme, true),
      vimMode: !!parsed.vimMode,
      handlesHidden: !!parsed.handlesHidden,
      debugMode: !!parsed.debugMode,
      bannerCollapsed: !!parsed.bannerCollapsed,
      newFileType: parseFileType(parsed.newFileType),
      workspaceName: typeof parsed.workspaceName === "string" && !labelProblem(parsed.workspaceName) ? parsed.workspaceName : "",
    };
  };
  const readStoredSettings = () => {
    try {
      return localStorage.getItem("settings");
    } catch (error) {
      return null;
    }
  };
  // Decided ONCE, before any effect runs: were valid settings stored?
  const [storedAtStart] = useState(() => settingsFromStored(readStoredSettings()));
  const [settings, setSettings] = useState(
    () => storedAtStart || settingsDefaults()
  );

  //state set functions
  const setFontSize = (fontSize) => {
    setSettings({ ...settings, fontSize: fontSize });
  };

  const setSelectedFont = (selectedFont) => {
    setSettings({ ...settings, selectedFont: selectedFont });
  };

  const setSelectedDayTheme = (selectedDayTheme) => {
    setSettings({ ...settings, selectedDayTheme });
  };

  const setSelectedNightTheme = (selectedNightTheme) => {
    setSettings({ ...settings, selectedNightTheme });
  };

  const setLightMode = (lightMode) => {
    setSettings({ ...settings, lightMode: lightMode });
  };

  const setVimMode = (vimMode) => {
    setSettings({ ...settings, vimMode: vimMode });
  };

  const setHandlesHidden = (handlesHidden) => {
    setSettings({ ...settings, handlesHidden });
  };

  const setBannerCollapsed = (bannerCollapsed) => {
    setSettings({ ...settings, bannerCollapsed });
  };

  const setDebugMode = (debugMode) => {
    setSettings({ ...settings, debugMode });
  };

  const setNewFileType = (newFileType) => {
    setSettings({ ...settings, newFileType });
  };

  const setWorkspaceName = useCallback((workspaceName) => {
    setSettings((current) => ({ ...current, workspaceName }));
  }, []);
  // settings another tab saved (session/tabSync.js)
  const takeSettings = (stored) => {
    const next = settingsFromStored(stored);
    if (next) setSettings(next);
  };

  //save user settings to local storage (the store the loader above reads)
  useEffect(() => {
    try {
      localStorage.setItem("settings", JSON.stringify(settings));
    } catch (error) {
      console.warn("[App] could not save the editor settings", error);
    }
  }, [settings]);

  // Settings saved by older versions are in the file store (IndexedDB): used when localStorage has none.
  useEffect(() => {
    if (storedAtStart) return;
    let cancelled = false;
    getFromLocalStorage("settings")
      .then((stored) => {
        const recovered = settingsFromStored(stored);
        if (recovered && !cancelled) setSettings(recovered);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // the open file's drive is in use (FileSystem.useDrive)
  useEffect(() => {
    FileSystem.setOpenFile(filename);
  }, [filename]);

  const refApp = useRef(null);
  useBannerRows(refApp, settings.bannerCollapsed);
  const viewMode = useViewMode();

  // the debugger (debugger/session/debugController.ts), its keys, and the editor's place for them
  const debug = useDebugController({ on: settings.debugMode, filename, switchFile: (file) => switchFile(file), viewMode, terminalDown: !!emulatorCrash || emulatorFrozen });
  const editorPlace = useRef(() => null);
  const debugEditor = useCallback(() => editorPlace.current(), []);
  useDebugKeys(settings.debugMode, debug.controller, debugEditor);

  // the drawer read again; with no .asm left, test.asm is made and opened (unless `create` is false: a link is
  // about to be imported)
  const refreshFileList = useCallback(
    async (initialRun = false, create = true) => {
      let fileList = FileSystem.getFileList();
      const asmFiles = fileList
        .filter((filename) => /.asm$/g.test(filename))
        .map((filename, index) => ({ id: index, filename: filename })); //remove all non .asm files from list
      //set create and set focused file
      if (!fileList || !asmFiles.length) {
        if (!create) {
          setDrives(FileSystem.getDrives());
          setFileList(fileList);
          return;
        }
        const initialFileName = "test.asm";
        FileSystem.createAssemblyFile(initialFileName, true);
        switchFile(initialFileName);
        fileList = FileSystem.getFileList();
      } else if (initialRun) {
        switchFile(asmFiles[0].filename);
      }

      setDrives(FileSystem.getDrives());
      setFileList(fileList);
    },
    [fileList]
  );

  // --- share links ----------------------------------------------------------------------------------------
  // What an import did, in a notice: a new drive offers Remove.
  const showImportResult = (result) => {
    const link = result.link;
    if (result.status === "failed") return setLinkNotice({ title: "Link Not Imported", icon: "error", message: "The link was not imported: " + result.reason });
    if (!["created", "created-new", "merged", "replaced"].includes(result.status)) return;
    const details = [];
    (result.keptBoth || []).forEach((path) => details.push("kept both: the link's copy is " + path.split("/").join("\\")));
    if (link) {
      link.skipped.forEach((skip) => details.push("left out: " + skip.name.split("/").join("\\") + ": " + skip.reason));
      link.warnings.forEach((path) => details.push("warning: " + path.split("/").join("\\") + " has invisible characters that reorder text (it may not read as it runs)"));
    }
    const isNew = result.status === "created" || result.status === "created-new";
    setLinkNotice({
      title: "Link Imported",
      icon: "information",
      message: isNew ? "The link's files are on the new drive " + driveName(result.drive) + ". Nothing was built or run." : "The link was " + resultText(result) + ".",
      details,
      drive: isNew ? result.drive : null,
    });
  };
  // Import one link (ShareService.importLink); the file it opens is opened. Resolves with that path, or "".
  const runLink = async (text) => {
    let result;
    try {
      result = await importLink(text, questions.ui, { before: beforeImportWrite });
    } catch (error) {
      result = { status: "failed", reason: error.message };
    }
    setEditorLock(false);
    let opened = "";
    if (result.drive && ["created", "created-new", "merged", "replaced"].includes(result.status)) {
      opened = openPathOf(result);
      if (opened) switchFile(opened);
      setReveal({ path: opened || driveRoot(result.drive.id) });
      setRefreshFile((value) => !value); // the open file may have been replaced
    }
    refreshFileList(); // test.asm only now, when no .asm exists
    showImportResult(result);
    return opened;
  };
  // Links from the address bar, one at a time; at most 3 wait while one is reviewed.
  const links = useRef({ ready: false, busy: false, waiting: [] });
  const pumpLinks = () => {
    const queue = links.current;
    if (!queue.ready || queue.busy || !queue.waiting.length) return;
    const { text, fromAddress } = queue.waiting.shift();
    queue.busy = true;
    runLinkRef
      .current(text)
      .catch(() => {})
      .then(() => {
        if (fromAddress && fragmentLink() === text) clearFragment();
        queue.busy = false;
        pumpLinks();
      });
  };
  const enqueueLink = (text, fromAddress = false) => {
    const queue = links.current;
    if (queue.waiting.length >= 3) {
      setLinkNotice({ title: "Link Not Imported", icon: "error", message: "A link arrived while three others were waiting to be imported, and was not imported. Open it again once these are done." });
      return;
    }
    queue.waiting.push({ text, fromAddress });
    pumpLinks();
  };
  const runLinkRef = useRef(runLink);
  runLinkRef.current = runLink;
  const enqueueRef = useRef(enqueueLink);
  enqueueRef.current = enqueueLink;
  useEffect(() => {
    const onHash = () => {
      const link = fragmentLink();
      if (link) enqueueRef.current(link, true);
    };
    if (!isDesktop()) window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  // what another tab changed, once this tab reads the store again: the drawer, and the open file (reloaded,
  // followed when it moved, another one when it was deleted)
  const syncedRef = useRef(null);
  syncedRef.current = (delta) => {
    const open = filenameRef.current;
    const moved = delta.moved[open];
    const gone = delta.filesDeleted.indexOf(open) >= 0 || delta.drivesRemoved.some((drive) => rootOf(open) === driveRoot(drive.id));
    if (moved) switchFile(moved);
    refreshFileList(!moved && gone);
    if (!moved && delta.filesWritten.indexOf(open) >= 0) setRefreshFile((value) => !value);
  };
  const takeSettingsRef = useRef(takeSettings);
  takeSettingsRef.current = takeSettings;
  // Remove (the notice of a new drive): the drive goes, and the editor leaves it when it was open there
  const removeImported = (drive) => {
    const wasOpen = rootOf(filenameRef.current) === driveRoot(drive.id);
    FileSystem.deleteDrive(drive.id);
    refreshFileList(wasOpen);
  };
  // Delete Extra Drives (Hard Reset Everything): every drive but D:, and the editor leaves them
  const deleteExtraDrives = () => {
    const wasOpen = isDrivePath(filenameRef.current);
    FileSystem.deleteAllDrives();
    refreshFileList(wasOpen);
  };

  useEffect(() => {
    let unmounted = false,
      stopTabSync = null;

    const init = async () => {
      // a link the page was opened with: its Brotli decoder loads while the rest starts
      if (!isDesktop() && fragmentLink()) preloadDecoder();
      // the store held by another tab (one of an older build, while a "delete all my
      // files" reset waits on it): said, instead of an empty drawer
      let waited = false;
      const slow = setTimeout(() => {
        waited = true;
        setEmulatorNotice({
          title: "File drawer waiting",
          body: "Another tab of this app is holding the file store while a hard reset deletes it. " +
            "Close or reload that tab; this page then continues on its own.",
        });
      }, 5000);
      await FileSystem.init();
      clearTimeout(slow);
      if (waited) setEmulatorNotice(null);
      // the page loads as for any visit (the drawer, the first .asm opened, tab sync); a link it was opened with
      // is then imported like one that arrives later, and test.asm is made afterwards only if no .asm exists
      const startLink = isDesktop() ? null : fragmentLink();
      refreshFileList(true, !startLink);
      if (!unmounted)
        stopTabSync = startTabSync({ onSynced: (delta) => syncedRef.current(delta), onSettings: (stored) => takeSettingsRef.current(stored) });
      links.current.ready = true;
      if (startLink) enqueueRef.current(startLink, true);
      else pumpLinks();
    };

    init();
    return () => {
      unmounted = true;
      if (stopTabSync) stopTabSync();
    };
  }, []);

  // The emulator page's messages arrive as window CustomEvents (createMessageListner); build outputs read back
  // from D: are stored so the drawer and the hex viewer show them.
  useEffect(() => {
    createMessageListner();
    const handleBuildOutputs = (event) => {
      const { name, outputs, ok, removed } = event.detail || {};
      const existing = FileSystem.getFileList();
      const produced = new Set((outputs || []).map((o) => o && o.filename).filter(Boolean));
      // Outputs the build did not (re)produce are stale: the emulator deleted them from D: before building, so the
      // drawer drops them too (a build plan lists them in `removed`).
      if (removed) {
        for (const f of removed) if (!produced.has(f) && existing.includes(f)) FileSystem.deleteFile(f);
      } else if (name) {
        for (const ext of [".obj", ".exe", ".lst", ".map"]) {
          const f = name + ext;
          if (!produced.has(f) && existing.includes(f)) FileSystem.deleteFile(f);
        }
      }
      if (ok === false) console.warn("[App] the build did not produce " + name + ".exe (see the terminal for assembler/linker errors)");
      for (const o of outputs || []) {
        if (!o || !o.filename) continue;
        const isDuplicate = existing.includes(o.filename);
        // shouldWriteCommand=true: no re-sync (the file is already on D:); dataIsEncoded=true: the base64 bytes are
        // stored as they are.
        FileSystem.createFile(o.filename, o.base64 || "", Date.now(), true, true, o.size || 0, isDuplicate);
      }
      refreshFileList();
    };
    window.addEventListener("build-outputs", handleBuildOutputs);

    // Freeze reports (Boxedwine.jsx startFreezeDetector): as a second guard against a banner during loading, one is
    // accepted only while the iframe's input gate is open and the detection was confirmed.
    const handleFrozen = (event) => {
      const d = (event && event.detail) || {};
      let active = false;
      try { const w = document.getElementById("boxedwine").contentWindow; active = w && w.BW_INPUT_OPEN === true; } catch (e) {}
      if (!active || !(d.confirmedPolls > 0)) { console.warn("[App] ignored an unconfirmed freeze report", d); return; }
      setEmulatorFrozen(true);
    };
    const handleRecovered = () => setEmulatorFrozen(false);
    window.addEventListener("emulator-frozen", handleFrozen);
    window.addEventListener("emulator-recovered", handleRecovered);

    // Notices from the emulator page (runtime policy, snapshot watchdog); none touches the user's files. A notice
    // about a self-healed start (runtime downgrade) waits until the terminal is ready, since one shown over the
    // loading screen reads as a failure; only a start that can never finish is shown at once.
    const deferredNotice = { current: null };
    const showWhenReady = (notice) => { deferredNotice.current = notice; };
    const handleDowngraded = (event) => {
      const d = event.detail || {};
      showWhenReady({
        title: "Terminal running in compatibility mode",
        body: "The faster multi-threaded terminal did not start correctly in this browser (" +
          (d.reason || "watchdog") + "), so the standard single-threaded terminal is being used instead. " +
          "Everything works the same; it will be retried automatically after the next update.",
      });
    };
    // A start that could not resume the instant-start state booted from scratch and saved it again: no notice
    // (bw-snapshot.js logs it).
    const handleSlow = (event) => {
      const d = (event && event.detail) || {};
      if (d.reason) {
        setEmulatorNotice({
          title: "Terminal failed to start",
          body: "The terminal could not start (" + d.reason + "). If this was a download problem, check your connection " +
            "and reload the page; if it keeps happening, use the banner's hard reset (your files are kept) to start from a " +
            "clean terminal.",
        });
      }
      // (a merely slow start is reported by the loading screen's stage text, never by a notice)
    };
    // The factory state could not be stored (typically a nearly full disk), so every later start cold-boots until a
    // save succeeds. It arrives after the terminal is ready, so it is shown at once.
    const handleSnapshotNotSaved = (event) => {
      const d = (event && event.detail) || {};
      setEmulatorNotice({
        title: "Instant start could not be saved",
        body: "The terminal is ready, but its instant-start state could not be stored in the browser (" +
          (d.reason || "storage error") + "), so the next start will boot from scratch again. " +
          "This usually means the disk is nearly full.",
      });
    };
    window.addEventListener("runtime-downgraded", handleDowngraded);
    window.addEventListener("snapshot-not-saved", handleSnapshotNotSaved);
    window.addEventListener("emulator-slow", handleSlow);
    let crashCount = 0;
    const handleCrashed = (event) => {
      const d = (event && event.detail) || {};
      const id = ++crashCount;
      setCrashNotice({
        id,
        // Wine's wording minus the noise: "Unhandled page fault on write access to 00000000 at address 0040100C
        // (thread 011c)" -> "page fault on write access to 00000000 at address 0040100C"
        reason: String(d.reason || "unhandled exception").replace(/^Unhandled /, "").replace(/\s*\(thread [0-9a-f]+\)/i, ""),
        hint: CRASH_HINTS[d.kind] || CRASH_HINTS.other,
      });
      if (d.kind !== "illegal" || !d.bytes) return;
      loadX86Decoder()
        .then((iced) => {
          // an illegal instruction: what the bytes at the address are (emulator-bug: Report bug)
          const found = classifyInvalidOpcode(iced, parseInt(d.address, 16), d.bytes);
          setCrashNotice((notice) => notice && notice.id === id ? {
            ...notice,
            hint: invalidOpcodeHint(found),
            report: found.kind === "emulator-bug" ? () => invalidOpcodeIssue(found, d.address, d, filenameRef.current) : null,
          } : notice);
        })
        .catch((e) => console.warn("[App] the x86 decoder did not load", e));
    };
    window.addEventListener("program-crashed", handleCrashed);
    // a build or run the terminal refused: the file's drive has no letter there
    const handleRunRefused = (event) => {
      const name = ((event && event.detail) || {}).filename || "";
      setEmulatorNotice({
        title: "Nothing was built or run",
        body: "The drive of " + guestPath(name) + " has no letter in this terminal. Reset the command prompt, then try again.",
      });
    };
    window.addEventListener("run-refused", handleRunRefused);
    // what a debugging session was doing when the emulator crashed, for the report; the session is then over
    const handleEmulatorCrashed = (event) => {
      setEmulatorCrash({ ...((event && event.detail) || {}), debugger: debug.controller.crashContext() });
      debug.controller.terminalLost();
    };
    window.addEventListener("emulator-crashed", handleEmulatorCrashed);

    // Once the environment is ready, the whole drawer goes to the iframe in one call, as stored bytes; it rebuilds
    // D: from it, then opens its input gate. Every start does this (the factory snapshot holds no user file), so no
    // drift between the drawer and D: survives a reload.
    const handleEmulatorReady = () => {
      const files = [];
      let folders = [];
      try {
        for (const name of FileSystem.getFileList()) {
          if (!name || name === "/") continue;
          files.push({ filename: name, content: FileSystem.getRawFileData(name) || "", isBinary: true });
        }
        folders = FileSystem.getAllFolders();
      } catch (e) { console.warn("[App] drawer listing for reconciliation failed", e); }
      const guestDrives = FileSystem.getDrives().map(({ id, letter, label }) => ({ id, letter, label }));
      reconcileEmulatorFiles(files, folders, guestDrives);
      if (deferredNotice.current) { setEmulatorNotice(deferredNotice.current); deferredNotice.current = null; }
    };
    window.addEventListener("emulator-ready", handleEmulatorReady);
    // Guest -> drawer import: what the drawer lacks is imported under its exact path, text (by extension) as text,
    // the rest as base64. Guest files are already on D: (no re-sync); files from the legacy IDBFS store are not, so
    // they are synced in as they are imported. Nothing is ever deleted from the drawer here.
    const handleGuestFiles = (event) => {
      const { files = [], folders = [], source } = event.detail || {};
      if (!(Array.isArray(files) && files.length) && !(Array.isArray(folders) && folders.length)) return;
      const existing = new Set(FileSystem.getFileList());
      const alreadyOnD = source !== "legacy";
      let imported = 0;
      for (const folder of Array.isArray(folders) ? folders : []) {
        FileSystem.ensureFolder(folder, false);
        imported++;
      }
      for (const f of Array.isArray(files) ? files : []) {
        if (!f || !f.filename || existing.has(f.filename)) continue;
        try {
          if (f.isText) {
            const text = atob(f.base64 || "");
            FileSystem.createFile(f.filename, text, Date.now(), alreadyOnD, false, text.length, false);
          } else {
            FileSystem.createFile(f.filename, f.base64 || "", Date.now(), alreadyOnD, true, f.size || 0, false);
          }
          existing.add(f.filename);
          imported++;
        } catch (e) { console.warn("[App] could not import " + f.filename + " from the guest", e); }
      }
      if (imported) {
        console.log("[App] imported " + imported + " item(s) from the " + (source === "legacy" ? "previous version's guest store" : "terminal") + " into the file drawer");
        refreshFileList();
      }
    };
    window.addEventListener("guest-files", handleGuestFiles);
    // Backup path for the downgrade notice: read the flag directly off the iframe
    // window on load (the postMessage above can race the listener registration).
    const iframe = document.getElementById("boxedwine");
    const onIframeLoad = () => {
      try {
        const d = iframe.contentWindow && iframe.contentWindow.BW_RUNTIME_DOWNGRADED;
        if (d) handleDowngraded({ detail: d });
      } catch (e) {}
    };
    if (iframe) iframe.addEventListener("load", onIframeLoad);
    return () => {
      window.removeEventListener("build-outputs", handleBuildOutputs);
      window.removeEventListener("emulator-frozen", handleFrozen);
      window.removeEventListener("emulator-recovered", handleRecovered);
      window.removeEventListener("runtime-downgraded", handleDowngraded);
      window.removeEventListener("snapshot-not-saved", handleSnapshotNotSaved);
      window.removeEventListener("emulator-slow", handleSlow);
      window.removeEventListener("program-crashed", handleCrashed);
      window.removeEventListener("run-refused", handleRunRefused);
      window.removeEventListener("emulator-crashed", handleEmulatorCrashed);
      window.removeEventListener("emulator-ready", handleEmulatorReady);
      window.removeEventListener("guest-files", handleGuestFiles);
      if (iframe) iframe.removeEventListener("load", onIframeLoad);
    };
  }, [refreshFileList]);

  // About > Snake: the game from C: is copied into a new folder, built and run
  useEffect(() => {
    const handlePlaySnake = () => playSnake({ switchFile, refreshFileList, showOnlyTerminal: viewMode.showOnlyTerminal });
    window.addEventListener("play-snake", handlePlaySnake);
    return () => window.removeEventListener("play-snake", handlePlaySnake);
  }, [refreshFileList, viewMode.showOnlyTerminal]);

  // Every reset control goes through cmd/terminalReset.ts. A debugging session ends without being waited for, and
  // the terminal's notices go with the old page.
  useEffect(() => {
    setResetHooks({
      beforeReset: () => {
        debug.controller.endQuietly("The terminal was reset").catch((error) => console.warn("[reset] the debugging session did not end cleanly", error));
        setEmulatorCrash(null);
        setEmulatorFrozen(false);
        setResetFailed(false);
      },
      onFailed: () => setResetFailed(true),
    });
  }, []);
  const onResetTerminal = useCallback(() => {
    void resetTerminal();
  }, []);

  const handleClick = () => {
    //allow canvas element to know in iframe that editor has been selected so styling can be restored
    postMessage("editor-selected", {});
  };

  const switchFile = (filename) => {
    setFilename(filename);
  };

  const createFile = useCallback(
    (filename) => {
      // createNewFile also writes the file to the guest's D: (bwWriteFile).
      FileSystem.createNewFile(filename);
      switchFile(filename);
      refreshFileList();
    },
    [filename]
  );

  // One terminal notice at a time, rendered inside the terminal panel over the cmd window's top edge; memoised so
  // the (memo) terminal panel does not re-render on unrelated App renders.
  const terminalNotice = useMemo(() => {
    if (emulatorCrash) {
      return (
        <RetroNotice
          id="emulator-crash-notice"
          title="Terminal stopped:"
          onDismiss={() => setEmulatorCrash(null)}
          actions={[
            { label: "Report bug", onClick: () => window.open(emulatorCrashIssue(emulatorCrash, filenameRef.current, emulatorCrash.debugger, recentResets())) },
            { label: "Reset terminal", onClick: onResetTerminal },
          ]}
        >
          <span className="freeze-banner__msg">Emulator error ({String(emulatorCrash.message || "unknown").slice(0, 120)}).</span>
          <span className="freeze-banner__hint">A bug in the emulator, not in your program: please report it, then reset the terminal.</span>
          <span className="freeze-banner__safe">
            <strong>Your files are safe:</strong> resetting only restarts the terminal.
          </span>
        </RetroNotice>
      );
    }
    if (emulatorFrozen) {
      return <FreezeBanner onReset={onResetTerminal} onDismiss={() => setEmulatorFrozen(false)} />;
    }
    if (resetFailed) {
      return (
        <RetroNotice
          id="reset-failed-notice"
          title="Terminal not reloaded:"
          onDismiss={() => setResetFailed(false)}
          actions={[
            { label: "Report bug", onClick: () => window.open(terminalResetIssue(recentResets(), resetPageInfo(), filenameRef.current)) },
            { label: "Reset terminal", onClick: onResetTerminal },
          ]}
        >
          <span className="freeze-banner__msg">The terminal's page did not load, even on a second try.</span>
          <span className="freeze-banner__hint">Reset the terminal again. If it still does not come back, reload this page.</span>
          <span className="freeze-banner__safe">
            <strong>Your files are safe:</strong> resetting only restarts the terminal.
          </span>
        </RetroNotice>
      );
    }
    if (emulatorNotice) {
      return (
        <RetroNotice id="emulator-notice" title={emulatorNotice.title} onDismiss={() => setEmulatorNotice(null)}>
          <span className="freeze-banner__msg">{emulatorNotice.body}</span>
          <span className="freeze-banner__safe">
            <strong>Your files are safe.</strong> This only affects the terminal; your saved files and editor changes are untouched.
          </span>
        </RetroNotice>
      );
    }
    if (crashNotice) {
      return (
        <RetroNotice
          id="program-crash-notice"
          title="Program stopped:"
          onDismiss={() => setCrashNotice(null)}
          actions={crashNotice.report ? [{ label: "Report bug", onClick: () => window.open(crashNotice.report()) }] : []}
        >
          <span className="freeze-banner__msg">{crashNotice.reason}.</span>
          <span className="freeze-banner__hint">{crashNotice.hint}</span>
          <span className="freeze-banner__safe">The terminal is fine.</span>
        </RetroNotice>
      );
    }
    return null;
  }, [emulatorCrash, emulatorFrozen, resetFailed, emulatorNotice, crashNotice, onResetTerminal]);

  //TODO Throw common props in objects
  return (
    <>
      <AppLayout ref={refApp} onClick={handleClick} modifier={viewMode.modifier} handles={!settings.handlesHidden} debug={settings.debugMode}>
        {settings.debugMode && <DebugSidebar controller={debug.controller} lightMode={!settings.lightMode} editor={debugEditor} filename={filename} onResetTerminal={onResetTerminal} />}
        <FileDrawer
          fileList={fileList}
          drives={drives}
          onShare={setShareTargets}
          shareOpen={!!shareTargets}
          closeShare={() => setShareTargets(null)}
          importLinks={importLinks}
          reveal={reveal}
          fileSelected={filename}
          switchFile={switchFile}
          createFile={createFile}
          refreshFileList={refreshFileList}
          setEditorLock={setEditorLock}
          forceUpdate={{ refreshFile, setRefreshFile }}
          lightMode={!settings.lightMode} //flip boolean so light is true, dark is false
          newFileType={settings.newFileType}
          setNewFileType={setNewFileType}
        />
        <Banner
          //theme variables
          themeList={themeList}
          selectedDayTheme={settings.selectedDayTheme}
          selectedNightTheme={settings.selectedNightTheme}
          setSelectedDayTheme={setSelectedDayTheme}
          setSelectedNightTheme={setSelectedNightTheme}
          lightMode={settings.lightMode}
          setLightMode={setLightMode}
          //vim
          vimMode={settings.vimMode}
          setVimMode={setVimMode}
          //resize handles
          handlesHidden={settings.handlesHidden}
          setHandlesHidden={setHandlesHidden}
          //collapsing the toolbar to one row
          bannerCollapsed={settings.bannerCollapsed}
          setBannerCollapsed={setBannerCollapsed}
          //debugging
          debugMode={settings.debugMode}
          setDebugMode={setDebugMode}
          debugController={debug.controller}
          //drives
          drives={drives}
          deleteExtraDrives={deleteExtraDrives}
          //font
          fontList={fontList}
          setSelectedFont={setSelectedFont}
          selectedFont={settings.selectedFont}
          fontSize={settings.fontSize}
          setFontSize={setFontSize}
          //file management
          viewMode={viewMode}
          filename={filename}
          fileList={fileList}
        />
        <Editor
          //set theme
          selectedTheme={
            settings.lightMode
              ? settings.selectedNightTheme.text
              : settings.selectedDayTheme.text
          }
          fontSize={settings.fontSize}
          shouldRefreshFile={refreshFile}
          filename={filename}
          disabled={lockEditor}
          selectedFont={settings.selectedFont}
          lightMode={!settings.lightMode}
          vimMode={settings.vimMode}
          debug={debug.controller}
          debugOn={settings.debugMode}
          debugPlace={editorPlace}
        />
        <CommandPrompt notice={terminalNotice} />
      </AppLayout>
      {shareTargets && (
        <ShareWindow
          targets={shareTargets}
          drives={drives}
          workspaceName={settings.workspaceName}
          setWorkspaceName={setWorkspaceName}
          openFile={filename}
          close={() => setShareTargets(null)}
        />
      )}
      {importOpen && (
        <ImportWindow
          ui={questions.ui}
          before={beforeImportWrite}
          onStart={() => (importBusy.current = true)}
          onImported={(results) => {
            importBusy.current = false;
            setEditorLock(false);
            refreshFileList();
            setRefreshFile((value) => !value);
            const first = results.find((result) => ["created", "created-new", "merged", "replaced"].includes(result.status) && openPathOf(result));
            if (first) switchFile(openPathOf(first));
          }}
          close={() => setImportOpen(false)}
        />
      )}
      {linkNotice && (
        <ConfirmWindow
          title={linkNotice.title}
          icon={linkNotice.icon}
          message={linkNotice.message}
          details={linkNotice.details}
          choices={linkNotice.drive ? [{ label: "OK" }, { label: "Remove", onSelect: () => removeImported(linkNotice.drive) }] : [{ label: "OK" }]}
          close={() => setLinkNotice(null)}
        />
      )}
      {questions.element}
      {debug.element}
    </>
  );
}

export default App;
