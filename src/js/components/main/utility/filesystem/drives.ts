// The extra drives: folders of the store the terminal mounts at STORE_GUEST, each with a letter of E: to Y: while it
// has one (past 21 drives, the drives in use get them: FileSystem.useDrive). App paths are "drive:<id>/..."; ":" is
// never part of a D: name, so no D: path can take that form.
export const DRIVE_PREFIX = "drive:";
export const D_GUEST = "/mnt/drive_d";
export const D_NATIVE = "/d_drive";
export const STORE_GUEST = "/mnt/bw_drives";
export const STORE_NATIVE = "/bw_drives";
// C: (Windows and the toolchain), D: and Z: (Wine's root) are taken; A: and B: are floppy letters
export const DRIVE_LETTERS = "efghijklmnopqrstuvwxy".split("");
export const MAX_LABEL = 32; // an NTFS volume label
// Wine reads a drive's label and serial number from these files at its root; they are never drawer files
export const LABEL_FILES = [".windows-label", ".windows-serial"];

export interface Drive {
  id: string;
  label: string;
  letter: string; // lower case, "" while it has none
  createdAt: number;
  usedAt: number; // when it was last created, imported, given a letter, or held a file opened, built or run
}

const ID = /^[0-9a-f]{16}$/;
export const isDriveId = (id: unknown): boolean => typeof id === "string" && ID.test(id);
// 16 hex digits from 8 random bytes
export const newDriveId = (bytes: Uint8Array): string =>
  Array.prototype.map.call(bytes.subarray(0, 8), (b: number) => ("0" + b.toString(16)).slice(-2)).join("");

export const isDrivePath = (path: string): boolean => path.slice(0, DRIVE_PREFIX.length) === DRIVE_PREFIX;
export const driveRoot = (id: string): string => DRIVE_PREFIX + id;

// "drive:<id>/a/b" -> { id, rel: "a/b" }; a D: path -> { id: null, rel: path }
export function splitDrive(path: string): { id: string | null; rel: string } {
  if (!isDrivePath(path)) return { id: null, rel: path };
  const slash = path.indexOf("/");
  return slash < 0 ? { id: path.slice(DRIVE_PREFIX.length), rel: "" } : { id: path.slice(DRIVE_PREFIX.length, slash), rel: path.slice(slash + 1) };
}
export const rootOf = (path: string): string => {
  const { id } = splitDrive(path);
  return id === null ? "" : driveRoot(id);
};
export const isRootPath = (path: string): boolean => path === "" || (isDrivePath(path) && path.indexOf("/") < 0);
export const withRoot = (root: string, rel: string): string => (!root ? rel : rel ? root + "/" + rel : root);

// For the emulator's file functions, which take guest POSIX paths.
export const guestPathOf = (path: string): string => {
  const { id, rel } = splitDrive(path);
  return id === null ? D_GUEST + "/" + rel : STORE_GUEST + "/" + id + (rel ? "/" + rel : "");
};
// For Module.FS reads in the emulator's page.
export const nativePathOf = (path: string): string => {
  const { id, rel } = splitDrive(path);
  return id === null ? D_NATIVE + "/" + rel : STORE_NATIVE + "/" + id + (rel ? "/" + rel : "");
};

// The drives' letters and labels, for display paths (paths.ts guestPath): set whenever the registry is read or
// written.
let known: { [id: string]: { letter: string; label: string } } = {};
export const setDriveLetters = (drives: Drive[]): void => {
  const next: { [id: string]: { letter: string; label: string } } = {};
  drives.forEach((drive) => (next[drive.id] = { letter: drive.letter, label: drive.label }));
  known = next;
};
// "D", a drive's letter (upper case), or "" for a drive without one
export const letterOf = (path: string): string => {
  const { id } = splitDrive(path);
  return id === null ? "D" : known[id] ? known[id].letter.toUpperCase() : "";
};
// How paths name a drive: "D:", "E:", or a drive without a letter by its label ("alice:")
export const driveSpec = (path: string): string => {
  const letter = letterOf(path);
  const drive = known[splitDrive(path).id as string];
  return (letter || (drive ? drive.label : "?")) + ":";
};

// Storage keys, next to D:'s file list.
export const registryKey = (fileListKey: string): string => fileListKey + ":drives";
export const driveListKey = (fileListKey: string, id: string): string => fileListKey + ":drive:" + id;
export const driveFoldersKey = (fileListKey: string, id: string): string => driveListKey(fileListKey, id) + ":folders";

const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
// Windows' order: the drives with a letter by letter, then those without one by label
export const sortDrives = (drives: Drive[]): Drive[] =>
  drives.slice().sort((a, b) =>
    a.letter && b.letter ? compare(a.letter, b.letter) : a.letter ? -1 : b.letter ? 1 : compare(a.label.toLowerCase(), b.label.toLowerCase()) || compare(a.id, b.id),
  );

// The stored registry, checked: entries with a bad id, or a duplicate id, are dropped; a bad label becomes "drive";
// a bad letter, or one an earlier entry has, becomes none.
export function parseRegistry(value: unknown): Drive[] {
  if (!Array.isArray(value)) return [];
  const out: Drive[] = [];
  const ids: { [id: string]: boolean } = {}, used: { [letter: string]: boolean } = {};
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const entry = item as { id?: unknown; label?: unknown; letter?: unknown; createdAt?: unknown; usedAt?: unknown };
    const id = entry.id, stored = typeof entry.letter === "string" ? entry.letter.toLowerCase() : "";
    if (!isDriveId(id) || ids[id as string]) continue;
    const letter = DRIVE_LETTERS.indexOf(stored) >= 0 && !used[stored] ? stored : "";
    const label = typeof entry.label === "string" && !labelProblem(entry.label) ? entry.label : "drive";
    const createdAt = typeof entry.createdAt === "number" ? entry.createdAt : 0;
    out.push({ id: id as string, label, letter, createdAt, usedAt: typeof entry.usedAt === "number" ? entry.usedAt : createdAt });
    ids[id as string] = true;
    if (letter) used[letter] = true;
  }
  return sortDrives(out);
}

export const freeLetter = (drives: Drive[]): string | null => {
  for (const letter of DRIVE_LETTERS) if (!drives.some((drive) => drive.letter === letter)) return letter;
  return null;
};

// The letter a drive without one takes: the first free one, else that of the drive used least recently that is not
// in `keep`, which gives it up (`from`). null when every lettered drive is kept.
export function chooseLetter(drives: Drive[], keep: string[]): { letter: string; from: string | null } | null {
  const free = freeLetter(drives);
  if (free) return { letter: free, from: null };
  const oldest = drives
    .filter((drive) => drive.letter && keep.indexOf(drive.id) < 0)
    .sort((a, b) => a.usedAt - b.usedAt || compare(a.id, b.id))[0];
  return oldest ? { letter: oldest.letter, from: oldest.id } : null;
}

// "alice (E:)", or "alice" for a drive without a letter
export const driveName = (drive: Drive): string => (drive.letter ? drive.label + " (" + drive.letter.toUpperCase() + ":)" : drive.label);
export const NO_LETTER_TIP = "No drive letter: building or running a file on it, or Assign Drive Letter, gives it one";
export const D_NAME = "(D:)"; // D: has no label

// A label (or the workspace name) as typed, pasted or carried by a link: NFC, trimmed, every space an underscore.
export const normalizeLabel = (text: string): string => text.normalize("NFC").trim().replace(/\s/g, "_");
const FORMAT = new RegExp("\\p{Cf}", "u");
export function labelProblem(label: string): string | null {
  if (!label) return "enter a name";
  if (label.length > MAX_LABEL) return "a name has at most " + MAX_LABEL + " characters";
  if (/\s/.test(label)) return "no spaces: use _ instead";
  if (/[\\/:*?"<>|]/.test(label)) return 'a name cannot contain \\ / : * ? " < > |';
  if (/[\x00-\x1f\x7f]/.test(label)) return "a name cannot contain control characters";
  if (FORMAT.test(label)) return "a name cannot contain invisible formatting characters";
  return null;
}
// A label for a link's name: normalised, else `fallback`.
export const labelFor = (name: string, fallback: string): string => {
  const label = normalizeLabel(name || "");
  return labelProblem(label) ? fallback : label;
};

// Create new: "<label>_<YYYY-MM-DD>_<xxxx>", the label shortened so the whole has at most MAX_LABEL characters.
const pad2 = (n: number): string => (n < 10 ? "0" : "") + n;
export function createNewLabel(label: string, now: Date, random: string): string {
  const suffix = "_" + now.getFullYear() + "-" + pad2(now.getMonth() + 1) + "-" + pad2(now.getDate()) + "_" + random;
  let head = label.slice(0, Math.max(0, MAX_LABEL - suffix.length));
  const last = head.charCodeAt(head.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) head = head.slice(0, -1); // never half a surrogate pair
  return head + suffix;
}
const RANDOM_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
// `length` characters of RANDOM_ALPHABET from random bytes (values from 252 up are skipped, so every character is
// equally likely); null when the bytes run out
export function randomSuffix(bytes: Uint8Array, length: number = 4): string | null {
  let out = "";
  for (let i = 0; i < bytes.length && out.length < length; i++) if (bytes[i] < 252) out += RANDOM_ALPHABET.charAt(bytes[i] % 36);
  return out.length === length ? out : null;
}

// The folders of a download that spans drives, by drive root: "D" for D:, else the drive's label, never its letter
// (letters move, and some drives have none). A name taken in any letter case (labels repeat, a drive may be labelled
// D) gets "_2", "_3", ...; drives go in creation order, so the same drives always get the same folders.
export function exportFolders(roots: string[], drives: Drive[]): Map<string, string> {
  const folders = new Map<string, string>();
  const taken = new Set<string>();
  const claim = (root: string, name: string) => {
    let folder = name;
    for (let n = 2; taken.has(folder.toLowerCase()); n++) folder = name + "_" + n;
    taken.add(folder.toLowerCase());
    folders.set(root, folder);
  };
  if (roots.includes("")) claim("", "D");
  const byAge = drives.filter((drive) => roots.includes(driveRoot(drive.id))).sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  byAge.forEach((drive) => claim(driveRoot(drive.id), drive.label));
  // a drive gone from the registry while the download was planned keeps its id
  roots.filter((root) => !folders.has(root)).forEach((root) => claim(root, splitDrive(root).id || "drive"));
  return folders;
}

// A drawer path in a download: from its drive's root, under its drive's folder (exportFolders) when the download
// spans drives.
export const exportPath = (path: string, folders: Map<string, string> | null = null): string => {
  const { rel } = splitDrive(path);
  return folders ? folders.get(rootOf(path)) + (rel ? "/" + rel : "") : rel;
};
