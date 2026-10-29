// Drawer paths: a file's storage key is its path relative to D:\ with "/" separators
// ("lab1/io/print.inc"); a root file's key is its plain name. "/" and "\" are never part
// of a name (invalidFilenameReason), so the separator is unambiguous.
import { invalidFilenameReason } from "../../../../utility/utilityFunctions";

export const ROOT = "";
// MAX_PATH (260) minus the terminating NUL, counted in UTF-16 code units like Windows.
export const MAX_GUEST_PATH = 259;
// The guest's native file names are UTF-8 on a Linux file system: NAME_MAX bytes.
export const MAX_SEGMENT_BYTES = 255;

const utf8 = new TextEncoder();

export const splitPath = (path: string): string[] => (path ? path.split("/") : []);
export const joinPath = (...parts: string[]): string => parts.filter((part) => part !== "").join("/");
export const parentOf = (path: string): string => path.slice(0, Math.max(path.lastIndexOf("/"), 0));
export const baseOf = (path: string): string => path.slice(path.lastIndexOf("/") + 1);
export const depthOf = (path: string): number => (path ? splitPath(path).length : 0);
export const isAsm = (path: string): boolean => /\.asm$/.test(path);
// path is folder itself or lies anywhere below it; the root contains everything
export const isWithin = (path: string, folder: string): boolean =>
  folder === ROOT || path === folder || path.startsWith(folder + "/");
// every folder above path, outermost first ("a/b/c.asm" -> ["a", "a/b"])
export const ancestorsOf = (path: string): string[] => {
  const parts = splitPath(path);
  const out: string[] = [];
  for (let i = 1; i < parts.length; i++) out.push(parts.slice(0, i).join("/"));
  return out;
};
// where `path` lands when the item `from` (path itself or a folder above it) moves into
// folder `to`: rebase("a/b/c.asm", "a/b", "x") === "x/b/c.asm"
export const rebase = (path: string, from: string, to: string): string =>
  joinPath(to, baseOf(from) + path.slice(from.length));

// Where a build of `source` (an .asm path) puts an output: assemble.bat writes them to a
// bin folder beside the source. outputPath("lab1/main.asm", ".exe") === "lab1/bin/main.exe"
export const BIN = "bin";
export const outputPath = (source: string, ext: string): string =>
  joinPath(parentOf(source), BIN, baseOf(source).replace(/\.asm$/i, "") + ext);

export const normalizeName = (name: string): string => name.normalize("NFC");
// Names compare case-insensitively, as Wine compares them on D:.
export const nameKey = (name: string): string => name.toLowerCase();
export const utf8Length = (text: string): number => utf8.encode(text).length;
export const guestPath = (path: string): string => "D:\\" + splitPath(path).join("\\");
export const folderLabel = (folder: string): string => (folder ? guestPath(folder) : "D:\\");

// First problem with one path segment (a file or folder name), or null.
export function segmentProblem(name: string): string | null {
  const reason = invalidFilenameReason(name);
  if (reason) return reason;
  if (utf8Length(name) > MAX_SEGMENT_BYTES) return "name is too long (at most 255 bytes in UTF-8)";
  return null;
}

// First problem with a whole path, or null.
export function pathProblem(path: string): string | null {
  for (const segment of splitPath(path)) {
    const reason = segmentProblem(segment);
    if (reason) return reason;
  }
  if (guestPath(path).length > MAX_GUEST_PATH) return "the full path is too long (at most 259 characters)";
  return null;
}

// Problem with naming an entry `name` inside `folder`, given every existing file and
// folder path; `self` is the entry being renamed (a case-only rename is allowed).
export function nameProblem(name: string, folder: string, existing: string[], self: string | null = null): string | null {
  const reason = pathProblem(joinPath(folder, name));
  if (reason) return reason;
  const key = nameKey(name);
  for (const path of existing) {
    if (path !== self && parentOf(path) === folder && nameKey(baseOf(path)) === key) {
      return "an item with that name already exists here";
    }
  }
  return null;
}

// JSON whose characters above U+007E are \u escapes: the result is ASCII, so the
// existing btoa encoding of the file list never throws, and earlier builds read it.
export const toAsciiJson = (value: unknown): string =>
  JSON.stringify(value).replace(/[\u007f-\uffff]/g, (c) => "\\u" + ("000" + c.charCodeAt(0).toString(16)).slice(-4));
