import { Drive, DRIVE_LETTERS, driveRoot, rootOf, sortDrives } from "./drives";
import { depthOf } from "./paths";

// Tabs of the app share one store, and lists are written whole. A tab writing a list another tab changed since
// this tab read it merges: its own changes (base -> next) are applied to what is stored.

export type FileMap = { [path: string]: string };

export function mergeFileMap(base: FileMap | null, next: FileMap, stored: FileMap | null): FileMap {
  const was = base || {};
  const out: FileMap = Object.assign({}, stored || {});
  for (const path of Object.keys(was)) if (!Object.prototype.hasOwnProperty.call(next, path) && out[path] === was[path]) delete out[path];
  for (const path of Object.keys(next)) if (was[path] !== next[path]) out[path] = next[path];
  return out;
}

export function mergeNames(base: string[] | null, next: string[], stored: string[] | null): string[] {
  const was = new Set(base || []), now = new Set(next);
  const out = (stored || []).filter((name) => !(was.has(name) && !now.has(name)));
  for (const name of next) if (!was.has(name) && out.indexOf(name) < 0) out.push(name);
  return out.sort();
}

// A drive deleted here stays deleted, and one deleted elsewhere is not brought back by a change made here. A drive's
// fields this tab changed are this tab's, the others the store's. A letter two drives claim (two tabs gave it out
// at once) stays with the drive the store has it for; the drive this tab gave it to takes the first free letter, or
// none.
export function mergeDrives(base: Drive[] | null, next: Drive[], stored: Drive[] | null): Drive[] {
  const was = new Map((base || []).map((drive) => [drive.id, drive] as [string, Drive]));
  const now = new Set(next.map((drive) => drive.id));
  const out = new Map((stored || []).filter((drive) => !(was.has(drive.id) && !now.has(drive.id))).map((drive) => [drive.id, drive] as [string, Drive]));
  const mine: string[] = [];
  for (const drive of next) {
    const before = was.get(drive.id);
    if (!before) {
      out.set(drive.id, drive);
      mine.push(drive.id);
    } else if (out.has(drive.id)) {
      const merged = Object.assign({}, out.get(drive.id)) as Drive;
      let changed = false;
      (Object.keys(drive) as (keyof Drive)[]).forEach((key) => {
        if (before[key] !== drive[key]) {
          (merged as any)[key] = drive[key];
          changed = true;
        }
      });
      if (changed) {
        out.set(drive.id, merged);
        if (merged.letter !== (stored || []).filter((other) => other.id === drive.id).map((other) => other.letter)[0]) mine.push(drive.id);
      }
    }
  }
  for (const id of mine) {
    const drive = out.get(id) as Drive;
    const others = Array.from(out.values()).filter((other) => other.id !== id);
    if (!drive.letter || !others.some((other) => other.letter === drive.letter)) continue;
    const taken = new Set(others.map((other) => other.letter));
    out.set(id, Object.assign({}, drive, { letter: DRIVE_LETTERS.filter((letter) => !taken.has(letter))[0] || "" }));
  }
  return sortDrives(Array.from(out.values()));
}

// A tab's view of the store: each file's metadata key with the stored metadata and bytes, every folder, the drives.
export interface StoreFile {
  key: string;
  meta: string | null;
  data: string | null;
}
export interface StoreView {
  files: { [path: string]: StoreFile };
  folders: string[];
  drives: Drive[];
}
export interface SyncDelta {
  drivesRemoved: Drive[];
  drivesMapped: Drive[]; // new, relabelled or on another letter
  filesDeleted: string[];
  filesWritten: string[]; // new or changed
  foldersRemoved: string[]; // deepest first
  foldersMade: string[]; // shallowest first
  moved: { [from: string]: string }; // a deleted path whose file (its metadata key) is now at another path
  changed: boolean;
}

// What changed between two views, as the terminal and the drawer apply it. A deleted drive's files and folders
// go with the drive.
export function diffViews(before: StoreView, after: StoreView): SyncDelta {
  const was = new Map(before.drives.map((drive) => [drive.id, drive] as [string, Drive]));
  const now = new Map(after.drives.map((drive) => [drive.id, drive] as [string, Drive]));
  const drivesRemoved = before.drives.filter((drive) => !now.has(drive.id));
  const drivesMapped = after.drives.filter((drive) => {
    const old = was.get(drive.id);
    return !old || old.letter !== drive.letter || old.label !== drive.label;
  });
  const gone = new Set(drivesRemoved.map((drive) => driveRoot(drive.id)));
  const kept = (path: string) => !gone.has(rootOf(path));
  const filesDeleted = Object.keys(before.files).filter((path) => !Object.prototype.hasOwnProperty.call(after.files, path) && kept(path));
  const filesWritten = Object.keys(after.files).filter((path) => {
    const old = before.files[path], file = after.files[path];
    return !old || old.key !== file.key || old.meta !== file.meta || old.data !== file.data;
  });
  const oldFolders = new Set(before.folders), newFolders = new Set(after.folders);
  const foldersRemoved = before.folders.filter((path) => !newFolders.has(path) && kept(path)).sort((a, b) => depthOf(b) - depthOf(a));
  const foldersMade = after.folders.filter((path) => !oldFolders.has(path)).sort((a, b) => depthOf(a) - depthOf(b));
  const moved: { [from: string]: string } = {};
  for (const path of filesDeleted) {
    const key = before.files[path].key;
    const to = filesWritten.filter((other) => after.files[other].key === key)[0];
    if (to) moved[path] = to;
  }
  const changed = !!(drivesRemoved.length || drivesMapped.length || filesDeleted.length || filesWritten.length || foldersRemoved.length || foldersMade.length);
  return { drivesRemoved, drivesMapped, filesDeleted, filesWritten, foldersRemoved, foldersMade, moved, changed };
}
