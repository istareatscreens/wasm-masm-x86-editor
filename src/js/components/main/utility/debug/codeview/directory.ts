// CodeView 4 as JWlink leaves it in an executable (signature NB05, not packed): the directory of subsections,
// the modules and the segment map.
import { ByteReader, DebugInfoError } from "./reader";

export const SST_MODULE = 0x120;
export const SST_TYPES = 0x121;
export const SST_PUBLIC_SYM = 0x123;
export const SST_SYMBOLS = 0x124;
export const SST_ALIGN_SYM = 0x125;
export const SST_SRC_MODULE = 0x127;
export const SST_SEG_MAP = 0x12d;
export const NO_MODULE = 0xffff;

export interface CvSubsection {
  kind: number;
  module: number; // from 1; NO_MODULE for what belongs to the whole program
  offset: number; // in the file
  size: number;
}

export interface CvModule {
  index: number;
  name: string; // the object's source path, or a library member's name
  library: number;
  segments: { segment: number; offset: number; size: number }[];
}

// a logical segment: `frame` is the number of the PE section that holds it
export interface CvSegment {
  flags: number;
  frame: number;
  offset: number;
  size: number;
}

const SEGMENT_SIZE = 20;
const MODULE_SEGMENT_SIZE = 12;

export function readDirectory(reader: ByteReader, base: number): CvSubsection[] {
  const signature = reader.text(base, 4);
  if (signature !== "NB05") throw new DebugInfoError("The program's debug information is not in the form this debugger reads (" + signature + ")", base);
  const directory = base + reader.u32(base + 4);
  const headerSize = reader.u16(directory);
  const entrySize = reader.u16(directory + 2);
  const count = reader.u32(directory + 4);
  if (entrySize < 12) throw new DebugInfoError("The program's debug information has a directory this debugger cannot read", directory);
  reader.slice(directory + headerSize, entrySize * count);
  const subsections: CvSubsection[] = [];
  for (let i = 0; i < count; i++) {
    const at = directory + headerSize + entrySize * i;
    subsections.push({ kind: reader.u16(at), module: reader.u16(at + 2), offset: base + reader.u32(at + 4), size: reader.u32(at + 8) });
  }
  return subsections;
}

export function readModule(reader: ByteReader, subsection: CvSubsection): CvModule {
  const at = subsection.offset;
  const count = reader.u16(at + 4);
  const module: CvModule = { index: subsection.module, name: "", library: reader.u16(at + 2), segments: [] };
  for (let i = 0; i < count; i++) {
    const entry = at + 8 + MODULE_SEGMENT_SIZE * i;
    module.segments.push({ segment: reader.u16(entry), offset: reader.u32(entry + 4), size: reader.u32(entry + 8) });
  }
  module.name = reader.name(at + 8 + MODULE_SEGMENT_SIZE * count).text;
  return module;
}

export function readSegmentMap(reader: ByteReader, subsection: CvSubsection): CvSegment[] {
  const count = reader.u16(subsection.offset);
  const segments: CvSegment[] = [];
  for (let i = 0; i < count; i++) {
    const at = subsection.offset + 4 + SEGMENT_SIZE * i;
    segments.push({ flags: reader.u16(at), frame: reader.u16(at + 6), offset: reader.u32(at + 12), size: reader.u32(at + 16) });
  }
  return segments;
}
