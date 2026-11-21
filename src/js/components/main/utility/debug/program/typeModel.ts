// A type index belongs to its module, so a type is always asked for by module and index.
import { CvType, FIRST_TYPE_INDEX, LF_ARRAY, LF_BITFIELD, LF_CLASS, LF_FIELDLIST, LF_MODIFIER, LF_POINTER, LF_PROCEDURE, LF_STRUCTURE, LF_UNION } from "../codeview/types";
import { ProgramInfo } from "./programInfo";

export interface TypeRef {
  module: number;
  index: number;
}

export type TypeKind = "integer" | "real" | "pointer" | "array" | "structure" | "union" | "bitfield" | "procedure" | "void" | "unknown";

export interface TypeField {
  name: string;
  offset: number;
  type: TypeRef;
}

export interface ResolvedType {
  kind: TypeKind;
  name: string; // BYTE, SDWORD, REAL8, POINT, PTR BYTE, DWORD[12]
  size: number; // in bytes; 0 when the debug information does not say
  signed?: boolean; // integers
  fields?: TypeField[]; // structures, unions and records
  element?: TypeRef; // arrays; a bit field's whole value
  count?: number; // an array's elements
  target?: TypeRef | null; // pointers; null for a PTR that names no type
  bits?: number; // bit fields
  position?: number;
}

const UNKNOWN: ResolvedType = { kind: "unknown", name: "?", size: 0 };
const VOID: ResolvedType = { kind: "void", name: "VOID", size: 0 };
const UNSIGNED = ["BYTE", "WORD", "DWORD", "QWORD"];
const SIGNED = ["SBYTE", "SWORD", "SDWORD", "SQWORD"];
const REALS: { [size: number]: [string, number] } = { 0: ["REAL4", 4], 1: ["REAL8", 8], 2: ["REAL10", 10] };
// "really a char, a short, ..." : [bytes, signed]. JWasm gives its last one (77h) to TBYTE, OWORD and XMMWORD
// data, whose own sizes it has no number for: such data shows its first eight bytes.
const REALLY_INT: [number, boolean][] = [[1, true], [2, false], [2, true], [2, false], [4, true], [4, false], [8, true], [8, false]];
const POINTER_SIZE: { [mode: number]: number } = { 1: 2, 2: 4, 3: 4, 4: 4, 5: 6, 6: 8 };

function integer(bytes: number, signed: boolean): ResolvedType {
  const names = signed ? SIGNED : UNSIGNED;
  return { kind: "integer", name: names[[1, 2, 4, 8].indexOf(bytes)], size: bytes, signed };
}

// A type index below 1000h says what it is in its bits: size (0-2), kind (4-7) and pointer mode (8-10).
function primitive(module: number, index: number): ResolvedType {
  const mode = (index >> 8) & 7;
  if (mode) {
    const target = primitive(module, index & 0xff);
    const size = POINTER_SIZE[mode] || 0;
    if (size === 6) return { kind: "pointer", name: "FWORD", size, target: null };
    return { kind: "pointer", name: target.kind === "void" || target.kind === "unknown" ? "PTR" : "PTR " + target.name, size, target: target.kind === "void" || target.kind === "unknown" ? null : { module, index: index & 0xff } };
  }
  const size = index & 7;
  switch ((index >> 4) & 15) {
    case 0:
      return size === 3 ? VOID : UNKNOWN;
    case 1:
      return size < 4 ? integer(1 << size, true) : UNKNOWN;
    case 2:
    case 3:
      return size < 4 ? integer(1 << size, false) : UNKNOWN;
    case 4:
      return REALS[size] ? { kind: "real", name: REALS[size][0], size: REALS[size][1] } : UNKNOWN;
    case 7:
      return integer(REALLY_INT[size][0], REALLY_INT[size][1]);
    default:
      return UNKNOWN;
  }
}

export class TypeModel {
  private readonly resolved = new Map<string, ResolvedType>();

  constructor(private readonly info: ProgramInfo) {}

  resolve(ref: TypeRef): ResolvedType {
    if (ref.index < FIRST_TYPE_INDEX) return primitive(ref.module, ref.index);
    const key = ref.module + ":" + ref.index;
    let type = this.resolved.get(key);
    if (!type) {
      const module = this.info.modules.find((m) => m.index === ref.module);
      const record = module && module.types.get(ref.index);
      this.resolved.set(key, UNKNOWN); // a type that names itself resolves to nothing, not without end
      type = record ? this.build(ref.module, record) : UNKNOWN;
      this.resolved.set(key, type);
    }
    return type;
  }

  // a type by the name the source gave it: a STRUCT, a UNION, a RECORD or a TYPEDEF of the module
  named(module: number, name: string): TypeRef | null {
    const found = this.info.modules.find((m) => m.index === module);
    if (!found) return null;
    let index: number | undefined;
    found.userTypes.forEach((type, typeName) => {
      if (index === undefined && typeName.toLowerCase() === name.toLowerCase()) index = type;
    });
    return index === undefined ? null : { module, index };
  }

  private build(module: number, record: CvType): ResolvedType {
    const ref = (index: number): TypeRef => ({ module, index });
    switch (record.leaf) {
      case LF_MODIFIER:
        return this.resolve(ref(record.type || 0));
      case LF_POINTER: {
        const target = this.resolve(ref(record.type || 0));
        const known = target.kind !== "void" && target.kind !== "unknown";
        return { kind: "pointer", name: known ? "PTR " + target.name : "PTR", size: 4, target: known ? ref(record.type || 0) : null };
      }
      case LF_ARRAY: {
        const element = this.resolve(ref(record.element || 0));
        const count = element.size ? Math.floor((record.size || 0) / element.size) : 0;
        return { kind: "array", name: element.name + "[" + count + "]", size: record.size || 0, element: ref(record.element || 0), count };
      }
      case LF_CLASS:
      case LF_STRUCTURE:
      case LF_UNION: {
        const list = this.info.modules.find((m) => m.index === module).types.get(record.fieldList || 0);
        const members = (list && list.leaf === LF_FIELDLIST && list.members) || [];
        const kind = record.leaf === LF_UNION ? "union" : "structure";
        const name = record.name && record.name !== "__unnamed" ? record.name : kind === "union" ? "UNION" : "STRUCT";
        return { kind, name, size: record.size || 0, fields: members.map((m) => ({ name: m.name, offset: m.offset, type: ref(m.type) })) };
      }
      case LF_BITFIELD: {
        const whole = this.resolve(ref(record.type || 0));
        return { kind: "bitfield", name: whole.name + ":" + (record.bits || 0), size: whole.size, signed: whole.signed, element: ref(record.type || 0), bits: record.bits || 0, position: record.position || 0 };
      }
      case LF_PROCEDURE:
        return { kind: "procedure", name: "PROC", size: 0 };
      default:
        return UNKNOWN;
    }
  }
}
