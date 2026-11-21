// CodeView 4 type records (sstTypes of one module). Indices start at 1000h and are the module's own: the same
// number names different types in two modules. A record of an unknown leaf keeps its leaf alone.
import { ByteReader } from "./reader";
import { readNumeric } from "./symbols";

export const FIRST_TYPE_INDEX = 0x1000;
export const LF_MODIFIER = 0x0001;
export const LF_POINTER = 0x0002;
export const LF_ARRAY = 0x0003;
export const LF_CLASS = 0x0004;
export const LF_STRUCTURE = 0x0005;
export const LF_UNION = 0x0006;
export const LF_PROCEDURE = 0x0008;
export const LF_LABEL = 0x000e;
export const LF_ARGLIST = 0x0201;
export const LF_FIELDLIST = 0x0204;
export const LF_BITFIELD = 0x0206;
const LF_MEMBER = 0x0406;

export interface CvMember {
  name: string;
  type: number;
  attributes: number;
  offset: number;
}

export interface CvType {
  leaf: number;
  attributes?: number;
  type?: number; // a pointer's target, a modifier's or a bit field's base type
  element?: number;
  indexType?: number;
  size?: number; // in bytes
  name?: string;
  count?: number; // members of a structure or union
  fieldList?: number;
  property?: number;
  returnType?: number;
  calling?: number;
  parameters?: number;
  argumentList?: number;
  arguments?: number[];
  members?: CvMember[];
  bits?: number;
  position?: number;
  mode?: number;
}

function readFieldList(reader: ByteReader, start: number, end: number): CvMember[] {
  const members: CvMember[] = [];
  for (let at = start; at < end; ) {
    const lead = reader.u8(at);
    if (lead >= 0xf0) {
      at += lead & 15; // padding to the next record
      if (!(lead & 15)) break;
      continue;
    }
    if (reader.u16(at) !== LF_MEMBER) break; // what follows cannot be measured
    const offset = readNumeric(reader, at + 6);
    const name = reader.name(offset.next);
    members.push({ name: name.text, type: reader.u16(at + 2), attributes: reader.u16(at + 4), offset: offset.value });
    at = name.next;
  }
  return members;
}

function readType(reader: ByteReader, leaf: number, body: number, end: number): CvType {
  switch (leaf) {
    case LF_MODIFIER:
      return { leaf, attributes: reader.u16(body), type: reader.u16(body + 2) };
    case LF_POINTER:
      return { leaf, attributes: reader.u16(body), type: reader.u16(body + 2) };
    case LF_ARRAY: {
      const size = readNumeric(reader, body + 4);
      return { leaf, element: reader.u16(body), indexType: reader.u16(body + 2), size: size.value, name: reader.name(size.next).text };
    }
    case LF_CLASS:
    case LF_STRUCTURE: {
      const size = readNumeric(reader, body + 10);
      return { leaf, count: reader.u16(body), fieldList: reader.u16(body + 2), property: reader.u16(body + 4), size: size.value, name: reader.name(size.next).text };
    }
    case LF_UNION: {
      const size = readNumeric(reader, body + 6);
      return { leaf, count: reader.u16(body), fieldList: reader.u16(body + 2), property: reader.u16(body + 4), size: size.value, name: reader.name(size.next).text };
    }
    case LF_PROCEDURE:
      return { leaf, returnType: reader.u16(body), calling: reader.u8(body + 2), parameters: reader.u16(body + 4), argumentList: reader.u16(body + 6) };
    case LF_LABEL:
      return { leaf, mode: reader.u16(body) };
    case LF_ARGLIST: {
      const list: number[] = [];
      const count = reader.u16(body);
      for (let i = 0; i < count; i++) list.push(reader.u16(body + 2 + 2 * i));
      return { leaf, arguments: list };
    }
    case LF_FIELDLIST:
      return { leaf, members: readFieldList(reader, body, end) };
    case LF_BITFIELD:
      return { leaf, bits: reader.u8(body), position: reader.u8(body + 1), type: reader.u16(body + 2) };
    default:
      return { leaf };
  }
}

// The records between `start` and `end` (after the subsection's four-byte signature), by type index.
export function readTypes(reader: ByteReader, start: number, end: number): Map<number, CvType> {
  const types = new Map<number, CvType>();
  let index = FIRST_TYPE_INDEX;
  for (let at = start; at + 4 <= end; index++) {
    const length = reader.u16(at);
    if (length < 2) break;
    types.set(index, readType(reader, reader.u16(at + 2), at + 4, at + 2 + length));
    at += 2 + length;
  }
  return types;
}
