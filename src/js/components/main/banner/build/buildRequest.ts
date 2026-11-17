import { Finding, Plan, commandName, inBin } from "../../utility/build/plan";
import { outputPath } from "../../utility/filesystem/paths";
import { quoteForCmd } from "../../../../utility/utilityFunctions";

// What the emulator page does for a build plan (Boxedwine.jsx doBuildPlan; design D8).
export interface BuildRequest {
  file: string; // the file built
  folder: string; // the folder assemble runs in: the program's (or the one module's)
  args: string; // assemble's arguments, quoted for cmd
  files: { path: string; base64: string }[]; // written to the guest before assemble is typed
  remove: string[]; // the outputs a build makes, deleted first (stale ones never look current)
  read: string[]; // read back afterwards, those that exist
  waitFor: string; // the last output: its completion ends the build
  ceilingMs: number; // then the outputs are read back whatever happened
}

// 22 s for one module, as before; each further module's assembling and linking adds about 8 s at worst
export const CEILING_MS = 22000;
export const PER_MODULE_MS = 8000;
// a program's outputs read back; all but the import library are deleted first, as the single-file build deletes
// them (a stale .exe or .dll would look like this build's). A failed DLL build keeps its .lib, as with LINK.
const PROGRAM_OUTPUTS = [".exe", ".dll", ".lib", ".map", ".lst"];
const KEPT = ".lib";

const folderOf = (path: string) => path.slice(0, Math.max(0, path.lastIndexOf("/")));
const unique = (paths: string[]) => paths.filter((path, i) => paths.indexOf(path) === i);
const inDrawer = (found: Finding[]) => found.map((item) => (item.target.kind === "drawer" ? item.target.path : "")).filter((path) => path);

// `base64Of` gives a drawer file's stored bytes (FileSystem.getRawFileData).
export function buildRequest(plan: Plan, base64Of: (path: string) => string): BuildRequest {
  const program = plan.program || plan.file;
  const sources = plan.modules.concat(plan.objects);
  // every file of the plan the drawer holds; but a library in a bin folder is a build's own output, which the
  // terminal may hold newer than the drawer while its readback is on its way
  const libraries = inDrawer(plan.libraries).filter((path) => !inBin(path));
  const written = unique(sources.concat(inDrawer(plan.includes), libraries, plan.def ? [plan.def] : []));
  const objects = plan.modules.map((module) => outputPath(module, ".obj"));
  const outputs = plan.output === "obj" ? [] : PROGRAM_OUTPUTS.map((ext) => outputPath(program, ext));
  const kept = outputPath(program, KEPT);
  return {
    file: plan.file,
    folder: folderOf(program),
    args: (plan.output === "obj" ? ["/c"] : []).concat(sources.map((path) => quoteForCmd(commandName(path, program)))).join(" "),
    files: written.map((path) => ({ path, base64: base64Of(path) })),
    remove: objects.concat(plan.modules.map((module) => outputPath(module, ".err")), outputs.filter((path) => path !== kept)),
    read: objects.concat(outputs),
    waitFor: plan.output === "obj" ? objects[0] : outputPath(program, plan.output === "dll" ? ".dll" : ".exe"),
    ceilingMs: CEILING_MS + PER_MODULE_MS * (sources.length - 1),
  };
}
