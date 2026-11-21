// What a debugger knows about one built program (an executable or a DLL), read from its bytes alone: the image,
// and the CodeView that JWlink leaves in it. Addresses here are relative to the image's base.
import { CvSegment, NO_MODULE, SST_ALIGN_SYM, SST_MODULE, SST_PUBLIC_SYM, SST_SEG_MAP, SST_SRC_MODULE, SST_SYMBOLS, SST_TYPES, readDirectory, readModule, readSegmentMap } from "../codeview/directory";
import { CvSourceFile, readSourceModule } from "../codeview/lines";
import { ByteReader, DebugInfoError } from "../codeview/reader";
import { CvSymbol, S_BPREL32, S_END, S_GDATA32, S_GPROC32, S_LABEL32, S_LDATA32, S_LPROC32, S_PUB32, S_UDT, readSymbols } from "../codeview/symbols";
import { CvType, readTypes } from "../codeview/types";
import { PeImage, readPeImage } from "../pe/peImage";

export interface ProgramModule {
  index: number; // CodeView's number, from 1
  name: string; // as recorded: the source's full path, or a library member's name
  shortName: string; // "mod_add": the name `module!symbol` takes
  library: number;
  segments: { segment: number; offset: number; size: number }[];
  files: CvSourceFile[];
  symbols: CvSymbol[];
  types: Map<number, CvType>;
  userTypes: Map<string, number>; // a STRUCT's, UNION's or TYPEDEF's name to its type
}

// a parameter or a LOCAL: `offset` is from EBP
export interface FrameSymbol {
  name: string;
  offset: number;
  type: number;
}

export interface Procedure {
  module: number;
  name: string; // empty for code outside every PROC that no label names
  synthetic: boolean; // code outside every PROC, which JWasm wraps in a procedure of its own ($$$00001)
  rva: number;
  length: number;
  debugStart: number; // from `rva`: the frame is set up between these two
  debugEnd: number;
  type: number;
  global: boolean;
  locals: FrameSymbol[];
}

export interface DataSymbol {
  module: number;
  name: string;
  rva: number;
  type: number;
  global: boolean;
}

export interface CodeLabel {
  module: number;
  name: string;
  rva: number;
}

// a linker-level name, the only kind a library's code has: `name` is as the linker has it (_WriteString@0)
export interface PublicSymbol {
  module: number;
  name: string;
  plainName: string;
  rva: number;
}

export interface ProgramInfo {
  image: PeImage;
  codeView: { signature: string; offset: number; size: number };
  segments: CvSegment[];
  modules: ProgramModule[];
  procedures: Procedure[]; // by address
  data: DataSymbol[];
  labels: CodeLabel[];
  publics: PublicSymbol[]; // by address
  rawPublics: (CvSymbol & { module: number })[];
  rvaOf(segment: number, offset: number): number | null; // a symbol's or a line pair's segment is a section's number
}

// _AddTwo@8 and _total as the source wrote them
export function plainNameOf(linkerName: string): string {
  return linkerName.replace(/^_/, "").replace(/@\d+$/, "");
}

export function shortModuleName(name: string): string {
  const leaf = name.slice(Math.max(name.lastIndexOf("\\"), name.lastIndexOf("/")) + 1);
  const dot = leaf.lastIndexOf(".");
  return dot > 0 ? leaf.slice(0, dot) : leaf;
}

const SYNTHETIC = /^\$\$\$\d+$/;

function collect(info: ProgramInfo, module: ProgramModule): void {
  let open: Procedure | null = null;
  for (const symbol of module.symbols) {
    const rva = symbol.segment === undefined ? null : info.rvaOf(symbol.segment, symbol.offset || 0);
    switch (symbol.kind) {
      case S_GPROC32:
      case S_LPROC32:
        open = null;
        if (rva === null) break;
        open = {
          module: module.index,
          name: SYNTHETIC.test(symbol.name || "") ? "" : symbol.name || "",
          synthetic: SYNTHETIC.test(symbol.name || ""),
          rva,
          length: symbol.length || 0,
          debugStart: symbol.debugStart || 0,
          debugEnd: symbol.debugEnd || 0,
          type: symbol.type || 0,
          global: symbol.kind === S_GPROC32,
          locals: [],
        };
        info.procedures.push(open);
        break;
      case S_END:
        open = null;
        break;
      case S_BPREL32:
        if (open) open.locals.push({ name: symbol.name || "", offset: symbol.offset || 0, type: symbol.type || 0 });
        break;
      case S_GDATA32:
      case S_LDATA32:
        if (rva !== null) info.data.push({ module: module.index, name: symbol.name || "", rva, type: symbol.type || 0, global: symbol.kind === S_GDATA32 });
        break;
      case S_LABEL32:
        if (rva !== null) info.labels.push({ module: module.index, name: symbol.name || "", rva });
        break;
      case S_UDT:
        module.userTypes.set(symbol.name || "", symbol.type || 0);
        break;
    }
  }
}

// JWasm wraps code outside every PROC in a procedure named $$$nnnnn: such code takes its label's name.
function nameUnnamedCode(info: ProgramInfo): void {
  const labelAt = new Map<number, string>();
  for (const label of info.labels) if (!labelAt.has(label.rva)) labelAt.set(label.rva, label.name);
  for (const procedure of info.procedures) if (!procedure.name) procedure.name = labelAt.get(procedure.rva) || "";
}

// JWlink numbers a symbol's segment as the image's section. Its segment map says so too: every segment that
// holds anything is one whole section. A program where that does not hold is refused, not bound wrongly.
function checkSegments(info: ProgramInfo): void {
  for (const segment of info.segments) {
    const section = info.image.sections[segment.frame - 1];
    if (segment.size && (!section || segment.offset !== 0 || segment.size !== section.virtualSize)) {
      throw new DebugInfoError("The program's sections are not where its debug information says they are", info.codeView.offset);
    }
  }
}

function build(bytes: Uint8Array): ProgramInfo | null {
  const reader = new ByteReader(bytes);
  const image = readPeImage(reader);
  if (!image.codeView) return null;
  reader.slice(image.codeView.offset, image.codeView.size);
  const subsections = readDirectory(reader, image.codeView.offset);
  const info: ProgramInfo = {
    image,
    codeView: { signature: "NB05", offset: image.codeView.offset, size: image.codeView.size },
    segments: [],
    modules: [],
    procedures: [],
    data: [],
    labels: [],
    publics: [],
    rawPublics: [],
    rvaOf(segment, offset) {
      const section = image.sections[segment - 1];
      return section ? section.virtualAddress + offset : null;
    },
  };
  const modules = new Map<number, ProgramModule>();
  for (const subsection of subsections) {
    if (subsection.kind === SST_SEG_MAP) info.segments = readSegmentMap(reader, subsection);
    if (subsection.kind !== SST_MODULE) continue;
    const module = readModule(reader, subsection);
    modules.set(module.index, { ...module, shortName: shortModuleName(module.name), files: [], symbols: [], types: new Map(), userTypes: new Map() });
  }
  for (const subsection of subsections) {
    const module = modules.get(subsection.module);
    const end = subsection.offset + subsection.size;
    reader.slice(subsection.offset, subsection.size);
    if (subsection.kind === SST_PUBLIC_SYM) {
      for (const symbol of readSymbols(reader, subsection.offset + 4, end)) info.rawPublics.push({ ...symbol, module: subsection.module });
    } else if (!module || subsection.module === NO_MODULE) {
      continue;
    } else if (subsection.kind === SST_SRC_MODULE) {
      module.files = module.files.concat(readSourceModule(reader, subsection));
    } else if (subsection.kind === SST_SYMBOLS || subsection.kind === SST_ALIGN_SYM) {
      module.symbols = module.symbols.concat(readSymbols(reader, subsection.offset + 4, end));
    } else if (subsection.kind === SST_TYPES) {
      module.types = readTypes(reader, subsection.offset + 4, end);
    }
  }
  checkSegments(info);
  info.modules = Array.from(modules.values()).sort((a, b) => a.index - b.index);
  for (const module of info.modules) collect(info, module);
  nameUnnamedCode(info);
  for (const symbol of info.rawPublics) {
    const rva = symbol.kind === S_PUB32 && symbol.segment !== undefined ? info.rvaOf(symbol.segment, symbol.offset || 0) : null;
    if (rva !== null) info.publics.push({ module: symbol.module, name: symbol.name || "", plainName: plainNameOf(symbol.name || ""), rva });
  }
  info.procedures.sort((a, b) => a.rva - b.rva);
  info.publics.sort((a, b) => a.rva - b.rva);
  return info;
}

// The program's information; null for a program built without debug information. A damaged image gives a
// DebugInfoError, whatever went wrong while reading it.
export function readProgramInfo(bytes: Uint8Array): ProgramInfo | null {
  try {
    return build(bytes);
  } catch (error) {
    if (error instanceof DebugInfoError) throw error;
    throw new DebugInfoError("The program's debug information cannot be read: " + (error instanceof Error ? error.message : String(error)), 0);
  }
}
