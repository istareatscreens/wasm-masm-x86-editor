import { Procedure, ProgramInfo, ProgramModule } from "./programInfo";

export interface FoundSymbol {
  kind: "procedure" | "data" | "label" | "public";
  name: string;
  module: number;
  rva: number;
  type: number; // a data symbol's type; 0 for code
  global: boolean;
  procedure?: Procedure;
}

export type SymbolResult = { found: FoundSymbol } | { unknown: true } | { ambiguous: string[] }; // the modules that have one

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export function moduleNamed(info: ProgramInfo, shortName: string): ProgramModule | null {
  return info.modules.find((module) => same(module.shortName, shortName)) || null;
}

// Every definition of the name: MASM names are compared without regard to case.
export function findSymbols(info: ProgramInfo, name: string): FoundSymbol[] {
  const found: FoundSymbol[] = [];
  const add = (symbol: FoundSymbol) => {
    if (!found.some((other) => other.rva === symbol.rva)) found.push(symbol);
  };
  for (const procedure of info.procedures) {
    if (procedure.name && same(procedure.name, name)) add({ kind: "procedure", name: procedure.name, module: procedure.module, rva: procedure.rva, type: 0, global: procedure.global, procedure });
  }
  for (const data of info.data) if (same(data.name, name)) add({ kind: "data", name: data.name, module: data.module, rva: data.rva, type: data.type, global: data.global });
  for (const label of info.labels) if (same(label.name, name)) add({ kind: "label", name: label.name, module: label.module, rva: label.rva, type: 0, global: false });
  // a public names what has no record of its own: a library's routines, another module's PUBLIC data
  for (const symbol of info.publics) if (same(symbol.plainName, name)) add({ kind: "public", name: symbol.plainName, module: symbol.module, rva: symbol.rva, type: 0, global: true });
  return found;
}

// The definition a name means from inside `module`: that module's own, else a global one, else the only one
// there is. `module!name` is asked for with `inModule`.
export function resolveSymbol(info: ProgramInfo, name: string, module: number | null, inModule?: string): SymbolResult {
  let candidates = findSymbols(info, name);
  if (inModule !== undefined) {
    const wanted = moduleNamed(info, inModule);
    candidates = wanted ? candidates.filter((symbol) => symbol.module === wanted.index) : [];
  } else {
    const own = candidates.filter((symbol) => symbol.module === module);
    const global = candidates.filter((symbol) => symbol.global);
    candidates = own.length ? own : global.length ? global : candidates;
  }
  if (!candidates.length) return { unknown: true };
  if (candidates.length === 1) return { found: candidates[0] };
  const names = candidates.map((symbol) => {
    const owner = info.modules.find((m) => m.index === symbol.module);
    return owner ? owner.shortName : "?";
  });
  return { ambiguous: names.filter((entry, i) => names.indexOf(entry) === i) };
}
