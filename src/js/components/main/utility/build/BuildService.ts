// Build plans in the app: what the banner and the share window call. The plan itself is pure (plan.ts and the
// files it uses, which the VS Code extension vendors); this file reads the drawer (FileSystem.js) and, through the
// emulator page, the toolchain's archives.
import FileSystem from "../FileSystem.js";
import { driveRoot, letterOf } from "../filesystem/drives";
import { latin1, libraryNames as archiveNames } from "./coff";
import { nameKey } from "./fileNames";
import { DrawerFiles, Plan, buildPlan } from "./plan";
import type { Target, ToolchainView } from "./resolver";
import { listToolchain, readToolchainFiles } from "../../../../utility/utilityFunctions";

// The drawer as a plan reads it: its files, their stored bytes (text byte for byte, as the assembler reads it),
// and the drives' letters. Each file is read once.
export function drawerFiles(): DrawerFiles {
  const files: string[] = FileSystem.getFileList();
  const byName = new Map<string, string>(files.map((path) => [nameKey(path), path] as [string, string]));
  const drives: { id: string; letter: string }[] = FileSystem.getDrives();
  const read = new Map<string, Uint8Array>();
  const bytes = (path: string): Uint8Array | null => {
    const stored = byName.get(nameKey(path));
    if (!stored) return null;
    if (!read.has(stored)) read.set(stored, FileSystem.getBytes(stored));
    return read.get(stored) as Uint8Array;
  };
  return {
    files,
    find: (path) => byName.get(nameKey(path)) || null,
    rootOf: (letter) => {
      if (letter === "D") return "";
      const drive = drives.find((entry) => entry.letter.toUpperCase() === letter);
      return drive ? driveRoot(drive.id) : null;
    },
    letterOf,
    bytes,
    text: (path) => {
      const found = bytes(path);
      return found ? latin1(found) : null;
    },
  };
}

// What the emulator page answered is kept (its archives never change while the app runs); a question is asked
// again until it is answered, so one lost with a reloaded terminal page never holds up a later build.
let folders: ToolchainView | null = null;
const libraries = new Map<string, string[] | null>();

// The toolchain's folders, C:\files\irvine (and C:\Irvine) and C:\files\lib.
export async function toolchainView(): Promise<ToolchainView> {
  if (!folders) folders = await listToolchain();
  return folders;
}

// The names a library of a plan offers: a toolchain library's from its archive, a drawer library's (the import
// library of a DLL built here, say) as it is now; null when they cannot be read.
export async function libraryNames(target: Target): Promise<string[] | null> {
  if (target.kind === "drawer") return archiveNames(FileSystem.getBytes(target.path));
  if (target.kind !== "toolchain") return null;
  const key = target.folder + "/" + target.name;
  if (!libraries.has(key)) {
    const entry = target.folder === "irvine" ? target.name : "lib/" + target.name;
    try {
      const files = await readToolchainFiles([entry], target.folder === "irvine" ? "/irvine.zip" : undefined);
      libraries.set(key, archiveNames(files[entry]));
    } catch {
      return null;
    }
  }
  return libraries.get(key) || null;
}

// The build plan of a drawer file; rejects while the emulator page cannot tell the toolchain's folders.
export async function planFile(file: string): Promise<Plan> {
  return buildPlan({ file, drawer: drawerFiles(), toolchain: await toolchainView(), libraryNames });
}
