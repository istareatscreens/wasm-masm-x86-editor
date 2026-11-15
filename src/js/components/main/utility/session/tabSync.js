// Tabs of the app share the drawer's store, and each has its own terminal. What the user does is written at
// once, and a tab the user leaves writes its editor's pending save. A tab the user comes back to (focus,
// shown again, back from the back-forward cache), and a shown tab another tab wrote under, reads the store
// again and applies what changed to its terminal and, through onSynced, to its drawer and editor. The editor
// settings follow the storage event (onSettings).
import FileSystem from "../FileSystem.js";
import hf, { VERSION_KEY } from "../FileSystemAdapter.js";
import {
  syncFileToEmulator,
  deleteFileFromEmulator,
  makeDirInEmulator,
  removeDirFromEmulator,
  mapDriveInEmulator,
  removeDriveFromEmulator,
} from "../../../../utility/utilityFunctions.ts";

const SETTLE_MS = 150; // the storage events of one burst of writes are answered once

export function startTabSync({ onSynced, onSettings }) {
  let running = false,
    again = false,
    timer = null;
  const sync = async () => {
    if (running) {
      again = true;
      return;
    }
    running = true;
    try {
      do {
        again = false;
        FileSystem.flushPendingSaves();
        const delta = await FileSystem.sync();
        if (delta.changed) {
          toTerminal(delta);
          onSynced(delta);
        }
      } while (again && hf.isBehind());
    } catch (error) {
      console.warn("[tabSync] the store could not be read again", error);
    } finally {
      running = false;
    }
  };
  const check = () => {
    clearTimeout(timer);
    if (document.visibilityState === "visible" && hf.isBehind()) sync();
  };
  const settle = () => {
    clearTimeout(timer);
    timer = setTimeout(check, SETTLE_MS);
  };
  const leave = () => FileSystem.flushPendingSaves();
  const onVisibility = () => (document.visibilityState === "visible" ? check() : leave());
  const onShow = (event) => {
    if (!event.persisted) return;
    onSettings(readSettings());
    check();
  };
  const onStorage = (event) => {
    if (event.key === VERSION_KEY || event.key === null) {
      hf.markBehind();
      settle();
    } else if (event.key === "settings") onSettings(event.newValue);
  };
  hf.onBehind(settle);
  window.addEventListener("focus", check);
  window.addEventListener("blur", leave);
  window.addEventListener("pagehide", leave);
  window.addEventListener("pageshow", onShow);
  window.addEventListener("storage", onStorage);
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    clearTimeout(timer);
    hf.onBehind(null);
    window.removeEventListener("focus", check);
    window.removeEventListener("blur", leave);
    window.removeEventListener("pagehide", leave);
    window.removeEventListener("pageshow", onShow);
    window.removeEventListener("storage", onStorage);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

const readSettings = () => {
  try {
    return window.localStorage.getItem("settings");
  } catch (error) {
    return null;
  }
};

// The terminal: drives first (a removed drive takes its files and folders along), then deletions, deepest
// folders first, then new folders and the files written.
function toTerminal(delta) {
  delta.drivesRemoved.forEach((drive) => removeDriveFromEmulator(drive));
  delta.drivesMapped.forEach((drive) => mapDriveInEmulator(drive));
  delta.filesDeleted.forEach((path) => deleteFileFromEmulator(path));
  delta.foldersRemoved.forEach((path) => removeDirFromEmulator(path));
  delta.foldersMade.forEach((path) => makeDirInEmulator(path));
  delta.filesWritten.forEach((path) => syncFileToEmulator(path, FileSystem.getRawFileData(path) || "", true));
}
