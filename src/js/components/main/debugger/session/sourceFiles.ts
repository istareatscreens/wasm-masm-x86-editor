// The paths in a program's debug information (D:\lab1\main.asm) as drawer files, matched as the build matched them
// (fileNames.ts). Toolchain files, and files renamed or removed since the build, resolve to nothing.
import FileSystem from "../../utility/FileSystem.js";
import { nameKey } from "../../utility/build/fileNames";
import { driveRoot, withRoot } from "../../utility/filesystem/drives";
import { baseOf } from "../../utility/filesystem/paths";
import { ResolvedSource, SourceResolver } from "../../utility/debug/program/sourcePaths";

// "D:\lab1\..\io\print.inc" -> "io/print.inc"; null for a path that leaves its drive
function relativePath(rest: string): string | null {
  const parts: string[] = [];
  for (const part of rest.split(/[\\/]+/)) {
    if (!part || part === ".") continue;
    if (part !== "..") parts.push(part);
    else if (!parts.length) return null;
    else parts.pop();
  }
  return parts.join("/");
}

// The drawer path a terminal path names, whether or not a file is there; null for a drive the drawer has not.
export function drawerPathOf(terminalPath: string): string | null {
  const match = /^([a-z]):[\\/]*(.*)$/i.exec(terminalPath || "");
  if (!match) return null;
  const letter = match[1].toLowerCase();
  const drive = letter === "d" ? null : (FileSystem.getDrives() as { id: string; letter: string }[]).find((entry) => entry.letter === letter);
  if (letter !== "d" && !drive) return null;
  const rel = relativePath(match[2]);
  return rel === null ? null : withRoot(drive ? driveRoot(drive.id) : "", rel);
}

export const drawerSources: SourceResolver = {
  resolve(builtPath: string): ResolvedSource | null {
    const path = drawerPathOf(builtPath);
    if (path === null) return null;
    const key = nameKey(path);
    const found = (FileSystem.getFileList() as string[]).find((file) => nameKey(file) === key);
    return found ? { id: found, name: baseOf(found) } : null;
  },
};
