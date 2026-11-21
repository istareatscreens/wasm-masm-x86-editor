// The program and the DLLs built with it have debug information; everything Windows added is named from its
// export table. Kept true by walking the process's own loader list.
import { ExportTable, exportAt, exportNamed, readExportTable } from "../pe/exports";
import { Statement } from "../program/lineTable";
import { Program } from "../program/programCache";
import { Procedure, PublicSymbol } from "../program/programInfo";
import { SourcePaths, SourceResolver, leafName } from "../program/sourcePaths";
import { Address, MemoryRead } from "../engine/engine";

export interface LoadedModule {
  name: string; // main.exe, mathdll.dll, KERNEL32.dll
  path: string;
  base: Address;
  size: number;
  program: Program | null; // read from the file that was built here
  sources: SourcePaths | null; // which of the host's files its source files are
  own: boolean; // has debug information: the program's own code, and Irvine32 linked into it
  loaded: boolean; // seen in the loader list; an own DLL is bound at its preferred base before that
}

export interface CodeLocation {
  module: LoadedModule;
  rva: number;
  statement: Statement | null;
  procedure: Procedure | null;
}

type Read = (address: Address, length: number) => Promise<MemoryRead>;

const MAX_MODULES = 512;
const samePath = (a: string, b: string) => a.replace(/\//g, "\\").toLowerCase() === b.replace(/\//g, "\\").toLowerCase();

// the last entry at or below `value`, or -1
function lastAtOrBelow<T>(list: T[], value: number, key: (entry: T) => number): number {
  let low = 0;
  let high = list.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (key(list[middle]) <= value) low = middle + 1;
    else high = middle;
  }
  return low - 1;
}

export class Modules {
  list: LoadedModule[] = [];
  main: LoadedModule | null = null;
  private listHead = "";
  private index: { of: LoadedModule[]; byBase: LoadedModule[] } | null = null; // the loaded images by base, for moduleAt
  private readonly exportTables = new Map<LoadedModule, Promise<ExportTable>>();

  constructor(private readonly read: Read, private readonly resolver: SourceResolver) {}

  // A file built here, expected at its preferred base until the loader says otherwise.
  add(path: string, program: Program, main: boolean): LoadedModule {
    const image = program.info ? program.info.image : null;
    const sources = program.lines ? new SourcePaths(program.lines, this.resolver) : null;
    const module: LoadedModule = { name: leafName(path), path, base: image ? image.imageBase : 0, size: image ? image.sizeOfImage : 0, program, sources, own: !!program.info, loaded: false };
    this.list.push(module);
    this.index = null;
    if (main) this.main = module;
    return module;
  }

  moduleAt(address: Address): LoadedModule | null {
    // a loaded image wins over one that is only expected there: two DLLs can ask for the same base. Loaded images
    // do not overlap, so the one with the nearest base below is the only one that can hold the address.
    if (!this.index || this.index.of !== this.list) this.index = { of: this.list, byBase: this.list.filter((module) => module.loaded).sort((a, b) => a.base - b.base) };
    const byBase = this.index.byBase;
    const nearest = byBase[lastAtOrBelow(byBase, address, (module) => module.base)];
    if (nearest && address < nearest.base + nearest.size) return nearest;
    for (const module of this.list) if (!module.loaded && address >= module.base && address < module.base + module.size) return module;
    return null;
  }

  // Where a module's code is; null while another image is where this one expects to be loaded.
  addressOf(module: LoadedModule, rva: number): Address | null {
    const address = module.base + rva;
    return this.moduleAt(address) === module ? address : null;
  }

  // Where an address is in the program's own code; null for code without debug information.
  locate(address: Address): CodeLocation | null {
    const module = this.moduleAt(address);
    if (!module || !module.program || !module.program.lines) return null;
    const rva = address - module.base;
    return { module, rva, statement: module.program.lines.statementAt(rva), procedure: module.program.lines.procedureAt(rva) };
  }

  hasLines(address: Address): boolean {
    const location = this.locate(address);
    return !!location && !!location.statement;
  }

  private async u32(address: Address): Promise<number | null> {
    const read = await this.read(address, 4);
    if (read.unreadable[0] || read.unreadable[3]) return null;
    return (read.bytes[0] | (read.bytes[1] << 8) | (read.bytes[2] << 16) | (read.bytes[3] << 24)) >>> 0;
  }

  // a UNICODE_STRING: its length, then where its text is
  private async text(address: Address): Promise<string> {
    const head = await this.read(address, 8);
    if (head.unreadable[0] || head.unreadable[7]) return "";
    const length = Math.min(head.bytes[0] | (head.bytes[1] << 8), 1024);
    const at = (head.bytes[4] | (head.bytes[5] << 8) | (head.bytes[6] << 16) | (head.bytes[7] << 24)) >>> 0;
    const body = await this.read(at, length);
    let text = "";
    for (let i = 0; i + 1 < length && !body.unreadable[i]; i += 2) text += String.fromCharCode(body.bytes[i] | (body.bytes[i + 1] << 8));
    return text;
  }

  // The process's own account of itself: where the program was loaded and from which file. Null when the
  // process's data cannot be read.
  async processImage(fsBase: Address): Promise<{ base: Address; path: string } | null> {
    const peb = await this.u32(fsBase + 0x30);
    const base = peb === null ? null : await this.u32(peb + 0x08);
    const parameters = peb === null ? null : await this.u32(peb + 0x10);
    if (base === null || parameters === null) return null;
    return { base, path: await this.text(parameters + 0x38) };
  }

  // Walks the loader's list when it has changed. Returns the own modules whose base moved, for their
  // breakpoints to follow; null when nothing changed.
  async refresh(fsBase: Address): Promise<LoadedModule[] | null> {
    const peb = await this.u32(fsBase + 0x30);
    const loader = peb === null ? null : await this.u32(peb + 0x0c);
    if (loader === null) return null;
    const head = loader + 0x0c;
    const ends = await this.read(head, 8);
    const mark = Array.from(ends.bytes).join(",");
    if (ends.unreadable[0] || mark === this.listHead) return null;
    const seen: { base: Address; size: number; path: string; name: string }[] = [];
    for (let entry = await this.u32(head); entry !== null && entry !== head && seen.length < MAX_MODULES; entry = await this.u32(entry)) {
      const base = await this.u32(entry + 0x18);
      const size = await this.u32(entry + 0x20);
      if (base === null || size === null) break;
      seen.push({ base, size, path: await this.text(entry + 0x24), name: await this.text(entry + 0x2c) });
    }
    this.listHead = mark;
    const moved: LoadedModule[] = [];
    const kept = this.list.filter((module) => module.program);
    for (const module of kept) module.loaded = false;
    for (const image of seen) {
      const built = kept.find((module) => !module.loaded && (samePath(module.path, image.path) || module.name.toLowerCase() === image.name.toLowerCase()));
      if (built) {
        if (built.base !== image.base) moved.push(built);
        built.base = image.base;
        built.size = image.size || built.size;
        built.loaded = true;
      } else {
        const known = this.list.find((module) => !module.program && module.base === image.base && module.name === image.name);
        kept.push(known || { name: image.name || leafName(image.path), path: image.path, base: image.base, size: image.size, program: null, sources: null, own: false, loaded: true });
      }
    }
    this.list = kept;
    this.index = null;
    return moved;
  }

  exportsOf(module: LoadedModule): Promise<ExportTable> {
    let table = this.exportTables.get(module);
    if (!table) {
      table = readExportTable(async (rva, length) => {
        const read = await this.read(module.base + rva, length);
        return read.unreadable[0] || read.unreadable[length - 1] ? null : read.bytes;
      });
      this.exportTables.set(module, table);
    }
    return table;
  }

  // The address of a system routine by its module's name without the extension, and its export's name.
  async exportAddress(moduleName: string, name: string): Promise<Address | null> {
    for (const module of this.list) {
      if (module.program || module.name.toLowerCase().replace(/\.dll$/, "") !== moduleName.toLowerCase()) continue;
      const rva = exportNamed(await this.exportsOf(module), name);
      if (rva !== null) return module.base + rva;
    }
    return null;
  }

  // The variable an address is in: total, or table+8 for a byte inside one. Null outside the program's data.
  dataNameAt(address: Address): string | null {
    const module = this.moduleAt(address);
    const program = module && module.program;
    if (!program || !program.info) return null;
    const rva = address - module.base;
    let name: string | null = null;
    let start = -1;
    for (const symbol of program.info.data) {
      const size = Math.max(1, program.types.resolve({ module: symbol.module, index: symbol.type }).size);
      if (rva >= symbol.rva && rva < symbol.rva + size && symbol.rva > start) {
        start = symbol.rva;
        name = symbol.name + (rva > symbol.rva ? "+" + (rva - symbol.rva) : "");
      }
    }
    return name;
  }

  // Where the "jmp dword ptr [address]" at `address` goes; null when that is not what is there.
  async importAt(address: Address): Promise<Address | null> {
    const code = await this.read(address, 6);
    if (code.unreadable[0] || code.unreadable[5] || code.bytes[0] !== 0xff || code.bytes[1] !== 0x25) return null;
    return this.u32((code.bytes[2] | (code.bytes[3] << 8) | (code.bytes[4] << 16) | (code.bytes[5] << 24)) >>> 0);
  }

  // A name for code: AddTwo, AddTwo+3h, WriteString+12h for a routine linked in, KERNEL32!ExitProcess+5h.
  async symbolFor(address: Address): Promise<string | null> {
    const plus = (name: string, offset: number) => name + (offset ? "+" + offset.toString(16).toUpperCase() + "h" : "");
    const module = this.moduleAt(address);
    if (!module) return null;
    const rva = address - module.base;
    const info = module.program && module.program.info;
    if (info) {
      const procedure = module.program.lines.procedureAt(rva);
      if (procedure && procedure.name) return plus(procedure.name, rva - procedure.rva);
      // an import's "jmp [address]" has no name of its own: it is the routine it jumps to
      const imported = await this.importAt(address);
      if (imported !== null && this.moduleAt(imported) !== module) return this.symbolFor(imported);
      const at = lastAtOrBelow<PublicSymbol>(info.publics, rva, (symbol) => symbol.rva);
      const section = info.image.sections.find((s) => rva >= s.virtualAddress && rva < s.virtualAddress + s.virtualSize);
      // a public names what follows it only inside its own section
      if (at >= 0 && section && info.publics[at].rva >= section.virtualAddress) return plus(info.publics[at].plainName, rva - info.publics[at].rva);
      return null;
    }
    const exported = exportAt(await this.exportsOf(module), rva);
    const short = module.name.replace(/\.(dll|exe)$/i, "");
    return exported ? short + "!" + plus(exported.name, exported.offset) : short + "!" + rva.toString(16).toUpperCase() + "h";
  }
}
