// CodeView 4 symbol records (sstSymbols, sstAlignSym, sstPublicSym). A record of a kind this file does not
// know keeps its kind alone, and is passed over by its length.
import { ByteReader } from "./reader";

export const S_COMPILE = 0x0001;
export const S_REGISTER = 0x0002;
export const S_CONSTANT = 0x0003;
export const S_UDT = 0x0004;
export const S_SSEARCH = 0x0005;
export const S_END = 0x0006;
export const S_OBJNAME = 0x0009;
export const S_BPREL32 = 0x0200;
export const S_LDATA32 = 0x0201;
export const S_GDATA32 = 0x0202;
export const S_PUB32 = 0x0203;
export const S_LPROC32 = 0x0204;
export const S_GPROC32 = 0x0205;
export const S_THUNK32 = 0x0206;
export const S_BLOCK32 = 0x0207;
export const S_LABEL32 = 0x0209;
export const S_REGREL32 = 0x020c;
export const S_LTHREAD32 = 0x020d;
export const S_GTHREAD32 = 0x020e;

export interface CvSymbol {
  kind: number;
  name?: string;
  segment?: number;
  offset?: number; // in the segment; from EBP (S_BPREL32) or from `register` (S_REGREL32), signed
  type?: number;
  length?: number;
  debugStart?: number; // a procedure's first offset after its prologue
  debugEnd?: number;
  flags?: number;
  register?: number;
  value?: number;
}

// A numeric leaf: a value below 8000h is the number itself, otherwise it names the size of what follows.
export function readNumeric(reader: ByteReader, at: number): { value: number; next: number } {
  const leaf = reader.u16(at);
  if (leaf < 0x8000) return { value: leaf, next: at + 2 };
  if (leaf === 0x8000) return { value: reader.i8(at + 2), next: at + 3 };
  if (leaf === 0x8001) return { value: reader.i16(at + 2), next: at + 4 };
  if (leaf === 0x8002) return { value: reader.u16(at + 2), next: at + 4 };
  if (leaf === 0x8003) return { value: reader.i32(at + 2), next: at + 6 };
  if (leaf === 0x8004) return { value: reader.u32(at + 2), next: at + 6 };
  return { value: 0, next: at + 2 };
}

function readSymbol(reader: ByteReader, kind: number, body: number): CvSymbol {
  switch (kind) {
    case S_COMPILE:
      return { kind, flags: reader.u16(body + 2), name: reader.name(body + 4).text };
    case S_REGISTER:
      return { kind, type: reader.u16(body), register: reader.u16(body + 2), name: reader.name(body + 4).text };
    case S_CONSTANT: {
      const value = readNumeric(reader, body + 2);
      return { kind, type: reader.u16(body), value: value.value, name: reader.name(value.next).text };
    }
    case S_UDT:
      return { kind, type: reader.u16(body), name: reader.name(body + 2).text };
    case S_SSEARCH:
      return { kind, segment: reader.u16(body + 4) };
    case S_OBJNAME:
      return { kind, name: reader.name(body + 4).text };
    case S_BPREL32:
      return { kind, offset: reader.i32(body), type: reader.u16(body + 4), name: reader.name(body + 6).text };
    case S_LDATA32:
    case S_GDATA32:
    case S_PUB32:
    case S_LTHREAD32:
    case S_GTHREAD32:
      return { kind, offset: reader.u32(body), segment: reader.u16(body + 4), type: reader.u16(body + 6), name: reader.name(body + 8).text };
    case S_LPROC32:
    case S_GPROC32:
      return {
        kind,
        length: reader.u32(body + 12),
        debugStart: reader.u32(body + 16),
        debugEnd: reader.u32(body + 20),
        offset: reader.u32(body + 24),
        segment: reader.u16(body + 28),
        type: reader.u16(body + 30),
        flags: reader.u8(body + 32),
        name: reader.name(body + 33).text,
      };
    case S_THUNK32:
      return { kind, offset: reader.u32(body + 12), segment: reader.u16(body + 16), length: reader.u16(body + 18), name: reader.name(body + 21).text };
    case S_BLOCK32:
      return { kind, length: reader.u32(body + 8), offset: reader.u32(body + 12), segment: reader.u16(body + 16), name: reader.name(body + 18).text };
    case S_LABEL32:
      return { kind, offset: reader.u32(body), segment: reader.u16(body + 4), flags: reader.u8(body + 6), name: reader.name(body + 7).text };
    case S_REGREL32:
      return { kind, offset: reader.i32(body), register: reader.u16(body + 4), type: reader.u16(body + 6), name: reader.name(body + 8).text };
    default:
      return { kind };
  }
}

// The records between `start` and `end` (after the subsection's four-byte signature).
export function readSymbols(reader: ByteReader, start: number, end: number): CvSymbol[] {
  const symbols: CvSymbol[] = [];
  for (let at = start; at + 4 <= end; ) {
    const length = reader.u16(at);
    if (length < 2) break;
    symbols.push(readSymbol(reader, reader.u16(at + 2), at + 4));
    at += 2 + length;
  }
  return symbols;
}
