// Where INCLUDE and INCLUDELIB find their files, by Microsoft's rules (ML 14.44 and LINK, measured in
// openspec/changes/implement-masm-file-linking/reference/masm-semantics.py), over the drawer's files, the drives'
// letters and the toolchain's folders: C:\files\irvine (also C:\Irvine) and C:\files\lib.

import { nameKey, sameName } from "./fileNames";

// A drawer file is "folder/name" on D:, "drive:<id>/folder/name" on another drive.
export interface DrawerView {
  // the drawer's path of a file, matched without case (Windows'), or null
  find(path: string): string | null;
  // "" for D:, "drive:<id>" for the drive with that letter (upper case), null when no drive has it
  rootOf(letter: string): string | null;
  // "D", a drive's letter, or "" for a drive without one
  letterOf(path: string): string;
}

// The toolchain's folders: their files' names.
export interface ToolchainView {
  irvine: string[]; // C:\files\irvine and C:\Irvine
  lib: string[]; // C:\files\lib
}

export type Target =
  | { kind: "drawer"; path: string }
  | { kind: "toolchain"; folder: "irvine" | "lib"; name: string }
  | { kind: "outside"; path: string } // a path the build can reach but the plan cannot read (another drive's, C:'s)
  | { kind: "missing" };

// A folder of the guest: a drive letter and its folder names.
export interface Location {
  letter: string;
  folders: string[];
}

const splitWindows = (path: string): string[] => path.split(/[\\/]+/).filter((part) => part !== "");

// ".." and "." applied: never above the drive's root
function resolveFolders(base: string[], parts: string[]): string[] {
  const out = base.slice();
  for (const part of parts) {
    if (part === "..") out.pop();
    else if (part !== ".") out.push(part);
  }
  return out;
}

// The guest folder of a drawer file's folder.
export function locationOf(drawer: DrawerView, path: string): Location {
  const letter = drawer.letterOf(path);
  const parts = path.split("/");
  parts.pop();
  if (parts.length && parts[0].indexOf("drive:") === 0) parts.shift();
  return { letter, folders: parts };
}

// The guest's file at a location and name: a drawer file, a toolchain file, or what the plan cannot see.
export function lookUp(drawer: DrawerView, toolchain: ToolchainView, letter: string, parts: string[]): Target {
  if (!parts.length) return { kind: "missing" };
  const name = parts[parts.length - 1];
  const folders = parts.slice(0, -1).map(nameKey).join("/");
  if (letter.toUpperCase() === "C") {
    const find = (list: string[]) => list.find((file) => sameName(file, name));
    const irvine = folders === "files/irvine" || folders === "irvine" ? find(toolchain.irvine) : undefined;
    if (irvine) return { kind: "toolchain", folder: "irvine", name: irvine };
    const lib = folders === "files/lib" ? find(toolchain.lib) : undefined;
    if (lib) return { kind: "toolchain", folder: "lib", name: lib };
    // the rest of C: is Windows' unless the drawer has C: (the VS Code extension's native builds read the disk)
  }
  const root = letter ? drawer.rootOf(letter.toUpperCase()) : null;
  if (root === null) return { kind: "outside", path: letter + ":\\" + parts.join("\\") };
  const found = drawer.find((root ? root + "/" : "") + parts.join("/"));
  return found ? { kind: "drawer", path: found } : { kind: "missing" };
}

interface Spelled {
  letter: string | null; // null: no drive given
  rooted: boolean; // "\x" or "X:\x"
  dotted: boolean; // ".\x" or "..\x"
  parts: string[];
}

function spell(argument: string): Spelled {
  const drive = /^([a-zA-Z]):(.*)$/.exec(argument);
  const rest = drive ? drive[2] : argument;
  return {
    letter: drive ? drive[1].toUpperCase() : null,
    rooted: /^[\\/]/.test(rest),
    dotted: !drive && /^\.\.?[\\/]/.test(rest),
    parts: splitWindows(rest),
  };
}

// The assembler's include path: assemble.bat's /I (C:\files\irvine); the guest sets no INCLUDE.
export const INCLUDE_PATH: Location[] = [{ letter: "C", folders: ["files", "irvine"] }];

// The file an INCLUDE names. `includers` are the files being included, outermost (the source) first; `cwd` is
// the folder the assembler runs in. As ML 14.44: a name with a drive or a leading slash is taken as written;
// one starting .\ or ..\ in the current folder only; any other in the folder of each including file, innermost
// first, then in each folder of the include path (/I, then INCLUDE=). The current folder itself is never searched.
export function resolveInclude(argument: string, includers: string[], cwd: Location, drawer: DrawerView, toolchain: ToolchainView,
  includePath: Location[] = INCLUDE_PATH): Target {
  const name = spell(argument.trim());
  if (!name.parts.length) return { kind: "missing" };
  if (name.letter !== null) {
    // C:x.inc: the current folder of that drive (the build's own folder on its drive, a root on the others)
    const base = name.rooted ? [] : name.letter === cwd.letter.toUpperCase() ? cwd.folders : [];
    return lookUp(drawer, toolchain, name.letter, resolveFolders(base, name.parts));
  }
  if (name.rooted) return lookUp(drawer, toolchain, cwd.letter, resolveFolders([], name.parts));
  if (name.dotted) return lookUp(drawer, toolchain, cwd.letter, resolveFolders(cwd.folders, name.parts));
  const folders = includers.map((file) => locationOf(drawer, file)).reverse().concat(includePath);
  for (const folder of folders) {
    const found = lookUp(drawer, toolchain, folder.letter, resolveFolders(folder.folders, name.parts));
    if (found.kind === "drawer" || found.kind === "toolchain") return found;
  }
  return { kind: "missing" };
}

// The library an INCLUDELIB (or the link command) names, as LINK finds it: with a drive or a leading slash as
// written; otherwise in the current folder (the program's), then in each LIBPATH folder (C:\files\irvine, then
// C:\files\lib). A name with no extension gets .lib.
export function resolveLibrary(argument: string, cwd: Location, drawer: DrawerView, toolchain: ToolchainView): Target {
  let text = argument.trim();
  if (!/\.[^.\\/]*$/.test(text)) text += ".lib";
  const name = spell(text);
  if (!name.parts.length) return { kind: "missing" };
  if (name.letter !== null) {
    const base = name.rooted ? [] : name.letter === cwd.letter.toUpperCase() ? cwd.folders : [];
    return lookUp(drawer, toolchain, name.letter, resolveFolders(base, name.parts));
  }
  if (name.rooted) return lookUp(drawer, toolchain, cwd.letter, resolveFolders([], name.parts));
  const here = lookUp(drawer, toolchain, cwd.letter, resolveFolders(cwd.folders, name.parts));
  if (here.kind !== "missing" && here.kind !== "outside") return here;
  for (const folder of [["files", "irvine"], ["files", "lib"]]) {
    const found = lookUp(drawer, toolchain, "C", resolveFolders(folder, name.parts));
    if (found.kind === "toolchain") return found;
  }
  return { kind: "missing" };
}
