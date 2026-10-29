// Zip import and export plans. Entry names are made safe (no absolute paths, drive
// letters or "..", Windows rules, NFC), matched case-insensitively against the drawer, and
// legacy (non-UTF-8) names are decoded as CP437.
import { joinPath, normalizeName, segmentProblem, pathProblem, nameKey, ancestorsOf, baseOf, splitPath, isWithin } from "./paths";

// Limits against archive bombs, far above a course project.
export const MAX_ARCHIVE_ENTRIES = 2000;
export const MAX_ARCHIVE_BYTES = 64 * 1024 * 1024;

// Code page 437, bytes 0x80-0xFF (Python's cp437 codec): the code page of DOS and legacy
// Windows zip tools, used for names stored without the zip UTF-8 flag.
const CP437_HIGH =
  "\u00c7\u00fc\u00e9\u00e2\u00e4\u00e0\u00e5\u00e7\u00ea\u00eb\u00e8\u00ef\u00ee\u00ec\u00c4\u00c5" +
  "\u00c9\u00e6\u00c6\u00f4\u00f6\u00f2\u00fb\u00f9\u00ff\u00d6\u00dc\u00a2\u00a3\u00a5\u20a7\u0192" +
  "\u00e1\u00ed\u00f3\u00fa\u00f1\u00d1\u00aa\u00ba\u00bf\u2310\u00ac\u00bd\u00bc\u00a1\u00ab\u00bb" +
  "\u2591\u2592\u2593\u2502\u2524\u2561\u2562\u2556\u2555\u2563\u2551\u2557\u255d\u255c\u255b\u2510" +
  "\u2514\u2534\u252c\u251c\u2500\u253c\u255e\u255f\u255a\u2554\u2569\u2566\u2560\u2550\u256c\u2567" +
  "\u2568\u2564\u2565\u2559\u2558\u2552\u2553\u256b\u256a\u2518\u250c\u2588\u2584\u258c\u2590\u2580" +
  "\u03b1\u00df\u0393\u03c0\u03a3\u03c3\u00b5\u03c4\u03a6\u0398\u03a9\u03b4\u221e\u03c6\u03b5\u2229" +
  "\u2261\u00b1\u2265\u2264\u2320\u2321\u00f7\u2248\u00b0\u2219\u00b7\u221a\u207f\u00b2\u25a0\u00a0";

// JSZip's decodeFileName hook (entries without the UTF-8 flag): valid UTF-8 as UTF-8,
// anything else as CP437. JSZip passes the raw name as bytes or as a byte string.
export function decodeEntryName(raw: Uint8Array | number[] | string): string {
  let bytes: Uint8Array;
  if (typeof raw === "string") {
    bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i) & 0xff;
  } else bytes = raw instanceof Uint8Array ? raw : Uint8Array.from(raw);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (e) {
    let text = "";
    for (let i = 0; i < bytes.length; i++) text += bytes[i] < 0x80 ? String.fromCharCode(bytes[i]) : CP437_HIGH.charAt(bytes[i] - 0x80);
    return text;
  }
}

export type SanitizedEntry = { path: string; dir: boolean } | { skip: string } | { ignore: true };

// One archive entry name -> a safe relative path, or why it is skipped.
export function sanitizeEntryPath(raw: string): SanitizedEntry {
  const slashed = raw.replace(/\\/g, "/");
  if (/^\//.test(slashed) || /^[a-zA-Z]:/.test(slashed)) return { skip: "absolute path" };
  const dir = /\/$/.test(slashed);
  const parts = slashed.split("/").filter((part) => part !== "" && part !== ".");
  if (!parts.length) return { ignore: true };
  if (parts.indexOf("..") >= 0) return { skip: "points outside the archive" };
  if (parts[0] === "__MACOSX" || parts[parts.length - 1] === ".DS_Store") return { skip: "macOS metadata" };
  const names = parts.map(normalizeName);
  for (const name of names) {
    const reason = segmentProblem(name);
    if (reason) return { skip: reason };
  }
  return { path: names.join("/"), dir };
}

export interface ImportEntry {
  name: string; // decoded entry name as stored in the archive
  dir: boolean;
  size: number; // declared uncompressed size
}

export interface ImportPlan {
  refused: string | null; // the whole archive is refused
  folders: string[]; // to create, shallowest first (existing casing reused)
  files: { index: number; path: string }[]; // archive entry -> storage path
  skipped: { name: string; reason: string }[];
}

// Where each entry goes under `target`. Names match existing files and folders
// case-insensitively (Windows semantics): an existing folder keeps its spelling and an
// existing file is replaced under its key; a file where a folder is (or the reverse) is
// skipped.
export function planImport(entries: ImportEntry[], target: string, files: string[], folders: string[]): ImportPlan {
  const plan: ImportPlan = { refused: null, folders: [], files: [], skipped: [] };
  if (entries.length > MAX_ARCHIVE_ENTRIES) {
    plan.refused = "the archive has " + entries.length + " entries (at most " + MAX_ARCHIVE_ENTRIES + ")";
    return plan;
  }
  const total = entries.reduce((sum, entry) => sum + (entry.dir ? 0 : Math.max(0, entry.size || 0)), 0);
  if (total > MAX_ARCHIVE_BYTES) {
    plan.refused = "the archive unpacks to " + Math.ceil(total / 1048576) + " MiB (at most " + MAX_ARCHIVE_BYTES / 1048576 + " MiB)";
    return plan;
  }
  // lower-cased path -> actual path, for everything that exists or is planned
  const fileAt = new Map<string, string>();
  const folderAt = new Map<string, string>();
  for (const file of files) fileAt.set(nameKey(file), file);
  for (const folder of folders) folderAt.set(nameKey(folder), folder);
  for (const file of files) for (const up of ancestorsOf(file)) folderAt.set(nameKey(up), up);
  const created: string[] = [];
  const claimed = new Set<string>();
  // the real spelling of `parts` (a folder chain) under target, creating as needed
  const resolveFolders = (parts: string[]): string | { skip: string } => {
    let at = target;
    for (const part of parts) {
      const wanted = joinPath(at, part);
      const key = nameKey(wanted);
      if (fileAt.has(key)) return { skip: baseOf(fileAt.get(key)) + " is a file" };
      const known = folderAt.get(key);
      if (known) at = known;
      else {
        folderAt.set(key, wanted);
        created.push(wanted);
        at = wanted;
      }
    }
    return at;
  };
  entries.forEach((entry, index) => {
    const clean = sanitizeEntryPath(entry.name);
    if ("ignore" in clean) return;
    if ("skip" in clean) {
      plan.skipped.push({ name: entry.name, reason: clean.skip });
      return;
    }
    const parts = splitPath(clean.path);
    const isDir = clean.dir || entry.dir;
    const full = joinPath(target, clean.path);
    const reason = pathProblem(full);
    if (reason) {
      plan.skipped.push({ name: entry.name, reason });
      return;
    }
    if (isDir) {
      const at = resolveFolders(parts);
      if (typeof at !== "string") plan.skipped.push({ name: entry.name, reason: at.skip });
      return;
    }
    const parent = resolveFolders(parts.slice(0, -1));
    if (typeof parent !== "string") {
      plan.skipped.push({ name: entry.name, reason: parent.skip });
      return;
    }
    const wanted = joinPath(parent, parts[parts.length - 1]);
    const key = nameKey(wanted);
    if (folderAt.has(key)) {
      plan.skipped.push({ name: entry.name, reason: "a folder with that name exists" });
      return;
    }
    if (claimed.has(key)) {
      plan.skipped.push({ name: entry.name, reason: "duplicate entry" });
      return;
    }
    claimed.add(key);
    const path = fileAt.get(key) || wanted;
    fileAt.set(key, path);
    plan.files.push({ index, path });
  });
  plan.folders = created.sort((a, b) => splitPath(a).length - splitPath(b).length);
  return plan;
}

export interface ExportPlan {
  files: string[];
  folders: string[]; // every exported folder (empty ones need their own entry)
  name: string | null; // the folder's name when exactly one folder is exported alone
}

// What a save of these targets puts in the archive: target files, and target folders
// with everything below them (allFiles/allFolders: every file and folder of the drawer);
// paths stay relative to D:\.
export function planExport(targets: { files: string[]; folders: string[] }, allFiles: string[], allFolders: string[]): ExportPlan {
  const files = new Set(targets.files);
  const folders = new Set<string>();
  for (const folder of targets.folders) {
    folders.add(folder);
    allFiles.forEach((file) => isWithin(file, folder) && files.add(file));
    allFolders.forEach((sub) => isWithin(sub, folder) && folders.add(sub));
  }
  const name = targets.folders.length === 1 && !targets.files.length ? baseOf(targets.folders[0]) : null;
  const sorted = (set: Set<string>) => Array.from(set).sort();
  return { files: sorted(files), folders: sorted(folders), name };
}
