// The build plan of a MASM program (openspec change implement-masm-file-linking, design D1 and D13): from the file
// being built and the drawer's files, which modules a program links, found by what each declares and uses, as the
// linker will match them. Pure: the drawer, the toolchain and the libraries' names are passed in, and nothing is
// built or run, so a debugger can ask for a program's files too.
import { baseNames } from "./names";
import { libraryName, makesDll } from "./defFile";
import { ModuleFacts, moduleFacts } from "./module";
import { objectSymbols } from "./coff";
import { DrawerView, Location, Target, ToolchainView, locationOf, resolveInclude, resolveLibrary } from "./resolver";
import { fileName } from "./fileNames";

export interface DrawerFiles extends DrawerView {
  files: string[]; // every drawer file: "folder/name" on D:, "drive:<id>/folder/name" on another drive
  text(path: string): string | null;
  bytes(path: string): Uint8Array | null;
}

export interface PlanInput {
  file: string; // the drawer file being built
  drawer: DrawerFiles;
  toolchain: ToolchainView;
  // the names a library offers (its first linker member), or null when it cannot be read
  libraryNames(target: Target): Promise<string[] | null>;
  // the code page a file name that is not UTF-8 is read in where the build runs: the guest's (the default), or the
  // computer's for a native build (fileNames.ts)
  ansiCodePage?: string;
}

export type ProblemKind = "defined-twice" | "percent" | "dll-name";
export interface Problem {
  kind: ProblemKind;
  name?: string; // defined-twice: the name
  files: string[];
}

export interface Finding {
  file: string;
  line: number;
  argument: string;
  target: Target;
}

export interface Plan {
  file: string;
  program: string | null; // the main module; null when the file is only assembled (several programs link it)
  output: "exe" | "dll" | "obj";
  modules: string[]; // the .asm files assembled, the program (or the file) first
  objects: string[]; // the .obj files linked as they are
  def: string | null; // <program>.def beside the program
  includes: Finding[];
  libraries: Finding[]; // INCLUDELIB lines
  programs: string[]; // building a module: the programs on its drive that link it
  problems: Problem[];
}

// The libraries assemble.bat always links: Irvine's.
export const DEFAULT_LIBRARIES = ["Irvine32.lib", "Kernel32.lib", "User32.lib"];

const isAsm = (path: string) => /\.asm$/i.test(path);
const isObj = (path: string) => /\.obj$/i.test(path);
const folderOf = (path: string) => path.slice(0, Math.max(0, path.lastIndexOf("/")));
const driveOf = (path: string) => (path.indexOf("drive:") === 0 ? path.slice(0, (path + "/").indexOf("/")) : "");
const withoutExt = (path: string) => path.replace(/\.[^./]*$/, "");
// a path in a bin folder: where builds put their outputs
export const inBin = (path: string) => path.split("/").slice(0, -1).some((part) => part.toLowerCase() === "bin");
// a folder and its subfolders ("" or "drive:<id>" is a drive's root: the whole drive)
const within = (path: string, folder: string) => folder === driveOf(path) || path.indexOf(folder + "/") === 0;

interface Provider {
  path: string;
  publics: Set<string>;
}

class Planner {
  private facts = new Map<string, ModuleFacts<Target>>();
  private libraries = new Map<string, Promise<Set<string> | null>>();

  constructor(private input: PlanInput) {}

  // a module's facts, the build running in its program's folder
  factsOf(path: string, cwd: Location): ModuleFacts<Target> {
    const key = path + "\n" + cwd.letter + ":" + cwd.folders.join("/");
    let known = this.facts.get(key);
    if (!known) {
      const { drawer, toolchain } = this.input;
      known = moduleFacts(path, drawer.text(path) || "", (argument, includers) => {
        const target = resolveInclude(argument, includers, cwd, drawer, toolchain);
        return { target, path: target.kind === "drawer" ? target.path : null, text: target.kind === "drawer" ? drawer.text(target.path) : null };
      }, (raw) => fileName(raw, this.input.ansiCodePage));
      this.facts.set(key, known);
    }
    return known;
  }

  objectOf(path: string): { publics: Set<string>; externals: Set<string> } {
    const bytes = this.input.drawer.bytes(path);
    const symbols = bytes && objectSymbols(bytes);
    return { publics: baseNames(symbols ? symbols.publics : []), externals: baseNames(symbols ? symbols.externals : []) };
  }

  libraryOf(target: Target): Promise<Set<string> | null> {
    const key = JSON.stringify(target);
    let names = this.libraries.get(key);
    if (!names) {
      names = this.input.libraryNames(target).then((list) => (list ? baseNames(list) : null));
      this.libraries.set(key, names);
    }
    return names;
  }

  // A DLL is a program whatever its END says (LINK makes it without an entry point too).
  isProgram(path: string): boolean {
    if (this.factsOf(path, locationOf(this.input.drawer, path)).entry) return true;
    const def = this.input.drawer.find(withoutExt(path) + ".def");
    const bytes = def ? this.input.drawer.bytes(def) : null;
    return !!bytes && makesDll(bytes);
  }

  // The modules a program links: it, then by name every module (or object) in scope that defines what the plan
  // needs and its libraries do not.
  async programPlan(program: string): Promise<Plan> {
    const { drawer, toolchain } = this.input;
    const cwd = locationOf(drawer, program);
    const plan: Plan = { file: program, program, output: "exe", modules: [program], objects: [], def: null, includes: [], libraries: [], programs: [], problems: [] };
    plan.def = drawer.find(withoutExt(program) + ".def");
    const defBytes = plan.def ? drawer.bytes(plan.def) : null;
    if (defBytes && makesDll(defBytes)) plan.output = "dll";

    const libraryNames = new Set<string>();
    const read = new Set<string>();
    const addLibrary = async (target: Target) => {
      if (read.has(JSON.stringify(target))) return;
      read.add(JSON.stringify(target));
      const names = await this.libraryOf(target);
      if (names) names.forEach((name) => libraryNames.add(name));
    };
    for (const name of DEFAULT_LIBRARIES) await addLibrary(resolveLibrary(name, cwd, drawer, toolchain));

    const included = new Set<string>(); // files the plan INCLUDEs: never modules of their own
    const scopes = new Set<string>(); // the folders of the user include files it reaches
    const defined = new Set<string>();
    const needs = new Set<string>();
    const seen = new Set<string>();
    const take = async (file: string) => {
      seen.add(file);
      if (isObj(file)) {
        const object = this.objectOf(file);
        object.publics.forEach((name) => defined.add(name));
        object.externals.forEach((name) => needs.add(name));
        return;
      }
      const facts = this.factsOf(file, cwd);
      for (const found of facts.includes) {
        plan.includes.push({ file: found.file, line: found.line, argument: found.argument, target: found.target });
        if (found.target.kind === "drawer") {
          included.add(found.target.path);
          scopes.add(folderOf(found.target.path));
        }
      }
      for (const lib of facts.includeLibs) {
        const target = resolveLibrary(lib.argument, cwd, drawer, toolchain);
        plan.libraries.push({ file: lib.file, line: lib.line, argument: lib.argument, target });
        await addLibrary(target);
      }
      facts.publics.forEach((name) => defined.add(name));
      facts.externals.forEach((name) => needs.add(name));
    };
    await take(program);
    for (;;) {
      // libraries first: a name a library offers is never looked up in the user's files
      const missing = Array.from(needs).filter((name) => !defined.has(name) && !libraryNames.has(name));
      if (!missing.length) break;
      const providers = this.providers(program, scopes, included, seen);
      let added: string | null = null;
      for (const name of missing) {
        const offering = providers.filter((p) => p.publics.has(name));
        if (offering.length === 1) {
          added = offering[0].path;
          break;
        }
        if (offering.length > 1 && !plan.problems.some((p) => p.name === name))
          plan.problems.push({ kind: "defined-twice", name, files: offering.map((p) => p.path) });
      }
      if (!added) break; // the rest are the linker's to report
      if (isObj(added)) plan.objects.push(added);
      else plan.modules.push(added);
      await take(added);
    }
    this.checkNames(plan);
    return plan;
  }

  // The files that can be modules of the program: in its folder and subfolders, or in the folder of a user include
  // file it reaches; .asm files with an END and no entry that the plan does not INCLUDE, and .obj files with no .asm
  // of the same name beside them; never in a bin folder.
  providers(program: string, scopes: Set<string>, included: Set<string>, seen: Set<string>): Provider[] {
    const { drawer } = this.input;
    const cwd = locationOf(drawer, program);
    const out: Provider[] = [];
    for (const path of drawer.files) {
      if (seen.has(path) || included.has(path) || inBin(path) || driveOf(path) !== driveOf(program)) continue;
      if (!within(path, folderOf(program)) && !scopes.has(folderOf(path))) continue;
      if (isAsm(path)) {
        const facts = this.factsOf(path, cwd);
        if (facts.entry === null && !this.isProgram(path)) out.push({ path, publics: new Set(facts.publics) });
      } else if (isObj(path) && !drawer.find(withoutExt(path) + ".asm")) out.push({ path, publics: this.objectOf(path).publics });
    }
    return out;
  }

  // Wine's cmd changes a name holding % on its way into a batch file (assemble.bat). A DLL's name outside ASCII: its
  // import library cannot be written under it (JWlink hands the name to JWlib in UTF-8 bytes, read in the ANSI code
  // page), and Windows reads the name of a DLL a program imports in its ANSI code page, so no program could load it
  // (measured: reference/README.md)
  checkNames(plan: Plan) {
    const named = plan.modules.concat(plan.objects).filter((path) => path.indexOf("%") >= 0);
    if (named.length) plan.problems.push({ kind: "percent", files: named });
    if (plan.output === "dll" && plan.program && plan.def) {
      const defBytes = this.input.drawer.bytes(plan.def);
      const library = defBytes ? libraryName(defBytes) || "" : "";
      const file = plan.program.slice(plan.program.lastIndexOf("/") + 1);
      if (/[^\x20-\x7e]/.test(file + library)) plan.problems.push({ kind: "dll-name", files: [plan.program, plan.def] });
    }
  }
}

// The plan of building `file`: its program's when it is one, or one module of exactly one program on its drive;
// a module that several programs link is only assembled; a file no program links is built alone.
export async function buildPlan(input: PlanInput): Promise<Plan> {
  const planner = new Planner(input);
  const { drawer, file } = input;
  if (planner.isProgram(file)) return planner.programPlan(file);
  const facts = planner.factsOf(file, locationOf(drawer, file));
  const programs: string[] = [];
  if (facts.entry === null) {
    for (const path of drawer.files) {
      if (path === file || !isAsm(path) || inBin(path) || driveOf(path) !== driveOf(file) || !planner.isProgram(path)) continue;
      if ((await planner.programPlan(path)).modules.indexOf(file) >= 0) programs.push(path);
    }
  }
  if (programs.length === 1) return { ...(await planner.programPlan(programs[0])), file, programs };
  const plan: Plan = { file, program: programs.length ? null : file, output: programs.length ? "obj" : "exe", modules: [file], objects: [], def: null,
    includes: facts.includes.map((f) => ({ file: f.file, line: f.line, argument: f.argument, target: f.target })), libraries: [], programs, problems: [] };
  planner.checkNames(plan);
  return plan;
}

// A plan file as assemble.bat takes it in the program's folder: relative to it (modules are on its drive), with
// ..\ when the file is beside it, without .asm unless the name before it ends .asm or .obj.
export function commandName(path: string, program: string): string {
  const name = isAsm(path) && !/\.(asm|obj)$/i.test(withoutExt(path)) ? withoutExt(path) : path;
  const from = folderOf(program).split("/").filter(Boolean);
  const to = name.split("/");
  let common = 0;
  while (common < from.length && common < to.length - 1 && from[common] === to[common]) common++;
  return Array(from.length - common).fill("..").concat(to.slice(common)).join("\\");
}
