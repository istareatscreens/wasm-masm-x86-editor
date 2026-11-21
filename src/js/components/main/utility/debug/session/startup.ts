import { Address, DebugEngine } from "../engine/engine";
import { ProgramCache } from "../program/programCache";
import { DebugFailure } from "../report/failure";
import { Modules } from "./modules";

export const NO_DEBUG_INFORMATION = "This program has no debug information. Build it with Debug on.";

const samePath = (a: string, b: string) => a.replace(/\//g, "\\").toLowerCase() === b.replace(/\//g, "\\").toLowerCase();
const folderOf = (path: string) => path.slice(0, Math.max(path.lastIndexOf("\\"), path.lastIndexOf("/")) + 1);

// Reads the program the build left, and every DLL it imports that the build left beside it. Returns the entry
// point's address, or null for a program without debug information.
export async function readModules(engine: DebugEngine, cache: ProgramCache, modules: Modules, programPath: string): Promise<Address | null> {
  const program = cache.read(await engine.readProgram(programPath));
  if (!program.info) return null;
  modules.add(programPath, program, true);
  for (const name of program.info.image.importedDlls) {
    let bytes: Uint8Array;
    try {
      bytes = await engine.readProgram(folderOf(programPath) + name);
    } catch (error) {
      if (error instanceof DebugFailure && error.kind === "lost-contact") throw error;
      continue; // not a file of this build: a DLL of Windows
    }
    let built;
    try {
      built = cache.read(bytes);
    } catch (error) {
      continue; // a DLL this debugger cannot read is debugged as Windows' own are: not at all
    }
    if (built.info) modules.add(folderOf(programPath) + name, built, false);
  }
  return program.info.image.imageBase + program.info.image.entryPoint;
}

// At the entry point: the process must be the program that was built, loaded where it was bound.
export async function confirmProgram(modules: Modules, fsBase: Address, programPath: string): Promise<void> {
  const image = await modules.processImage(fsBase);
  const hex = (value: number) => value.toString(16).toUpperCase() + "h";
  if (!image) throw new DebugFailure("unexpected-address", "the process's own account of itself could not be read");
  if (image.base !== modules.main.base) throw new DebugFailure("unexpected-address", "it is at " + hex(image.base) + ", not at " + hex(modules.main.base));
  if (!samePath(image.path, programPath)) throw new DebugFailure("unexpected-address", "the process that started is not the program that was built");
}
