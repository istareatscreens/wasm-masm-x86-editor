import { Address } from "../engine/engine";
import { bigOf, bytesOf, character, decimal, fits, hexDigits, masmHex } from "../format/numbers";
import { real10Text, real4Text, real8Text, realBytes, realOf } from "../format/real";
import { ResolvedType, TypeModel, TypeRef } from "../program/typeModel";
import { real10Of } from "./fpu";
import { Target, ValueError, ValueFormat, ValueNode, ValueParser, hex8 } from "./values";

export interface Place {
  address: Address;
  shape: ResolvedType;
  types: TypeModel | null; // with `type`: the debug information's own type, which knows its fields and elements
  type: TypeRef | null;
}

export function placeOf(types: TypeModel, type: TypeRef, address: Address): Place {
  return { address: address >>> 0, shape: types.resolve(type), types, type };
}

const STRING_PREVIEW = 64;
const ARRAY_PREVIEW = 8;
const FIELD_PREVIEW = 4;
const PREVIEW_BYTES = 256; // a structure larger than this shows its name, not its first fields
export const NOT_READABLE = "memory cannot be read";

// What a value of `size` bytes can hold, for the message when one does not fit.
function rangeOf(size: number): string {
  const top = BigInt(1) << BigInt(size * 8);
  return "0 to " + (top - BigInt(1)) + ", or -" + top / BigInt(2) + " to " + (top / BigInt(2) - BigInt(1));
}

export function integerText(value: bigint, size: number, signed: boolean, format: ValueFormat): string {
  const text = format.hex ? masmHex(value, size) : decimal(value, size, signed);
  const shown = size === 1 ? character(Number(BigInt.asUintN(8, value))) : null;
  return shown ? text + " " + shown : text;
}

export function realText(bytes: Uint8Array): string {
  return bytes.length === 10 ? real10Text(bytes) : bytes.length === 4 ? real4Text(realOf(bytes)) : real8Text(realOf(bytes));
}

export function scalarText(type: ResolvedType, bytes: Uint8Array, format: ValueFormat): string {
  switch (type.kind) {
    case "integer":
      return integerText(bigOf(bytes), type.size, !!type.signed, format);
    case "real":
      return realText(bytes);
    case "pointer":
      return hexDigits(bigOf(bytes), type.size) + "h";
    case "bitfield": {
      const field = (bigOf(bytes) >> BigInt(type.position || 0)) & ((BigInt(1) << BigInt(type.bits || 0)) - BigInt(1));
      return format.hex ? masmHex(field, Math.ceil((type.bits || 8) / 8)) : field.toString();
    }
    default:
      return Array.from(bytes.subarray(0, 8), (byte) => ("0" + byte.toString(16).toUpperCase()).slice(-2)).join(" ");
  }
}

function isScalar(type: ResolvedType): boolean {
  return type.kind === "integer" || type.kind === "real" || type.kind === "pointer" || type.kind === "bitfield";
}

// "text" for bytes that read as a string: up to a zero, the end of the bytes, or 64 characters
export function stringPreview(bytes: Uint8Array, unreadable: Uint8Array): string | null {
  let text = "";
  for (let i = 0; i < bytes.length && i < STRING_PREVIEW; i++) {
    if (unreadable[i]) return null;
    if (bytes[i] === 0) return text ? '"' + text + '"' : null;
    if (bytes[i] === 13) text += "\\r";
    else if (bytes[i] === 10) text += "\\n";
    else if (bytes[i] === 9) text += "\\t";
    else if (bytes[i] < 0x20 || bytes[i] >= 0x7f) return null;
    else text += String.fromCharCode(bytes[i]);
  }
  return text ? '"' + text + '"' + (bytes.length > STRING_PREVIEW ? "..." : "") : null;
}

async function bytesAt(target: Target, address: Address, size: number): Promise<Uint8Array | null> {
  if (!size) return new Uint8Array(0);
  const read = await target.read(address, size);
  return read.unreadable.some((u) => u) ? null : read.bytes;
}

async function typedBytes(type: ResolvedType, current: Uint8Array, text: string, parse: ValueParser): Promise<Uint8Array> {
  if (type.kind === "real") {
    if (type.size === 10) return real10Of(text, parse);
    const parsed = await parse(text);
    const value = parsed.real !== null ? parsed.real : parsed.integer !== null ? Number(parsed.integer) : null;
    if (value === null) throw new ValueError("A number is needed here");
    return realBytes(value, type.size);
  }
  const parsed = await parse(text);
  if (parsed.integer === null) throw new ValueError("A whole number is needed here");
  if (type.kind === "bitfield") {
    const bits = type.bits || 0;
    if (parsed.integer < BigInt(0) || parsed.integer >= BigInt(1) << BigInt(bits)) throw new ValueError("The value does not fit " + bits + " bits (0 to " + ((BigInt(1) << BigInt(bits)) - BigInt(1)) + ")");
    const mask = ((BigInt(1) << BigInt(bits)) - BigInt(1)) << BigInt(type.position || 0);
    return bytesOf((bigOf(current) & ~mask) | (parsed.integer << BigInt(type.position || 0)), type.size);
  }
  if (!fits(parsed.integer, type.size)) throw new ValueError("The value does not fit a " + type.name + " (" + rangeOf(type.size) + ")");
  return bytesOf(parsed.integer, type.size);
}

// The value at a place, read now. `name` is what the row is called; `expression` reaches the value again.
export async function placeNode(target: Target, parse: ValueParser, name: string, place: Place, expression?: string): Promise<ValueNode> {
  const type = place.shape;
  const memory = { address: place.address, size: type.size };
  const base: ValueNode = { name, type: type.name, memory, expression, text: () => "" };
  if (isScalar(type)) {
    const bytes = await bytesAt(target, place.address, type.size);
    base.text = (format) => (bytes ? scalarText(type, bytes, format) : NOT_READABLE);
    base.assign = async (typed) => {
      if (!bytes) throw new ValueError("Memory at " + hex8(place.address) + "h cannot be read");
      await target.write(place.address, await typedBytes(type, bytes, typed, parse));
    };
    if (type.kind === "pointer" && type.target && bytes && place.types) {
      const pointee = placeOf(place.types, type.target, Number(bigOf(bytes)));
      base.named = 1;
      // what it points at is reached again by its address: MASM has no way to write "what p points at"
      base.children = async () => [await placeNode(target, parse, "[" + name + "]", pointee, pointee.shape.name + " PTR [" + hex8(pointee.address) + "h]")];
      if (pointee.shape.size === 1) {
        const text = await target.read(pointee.address, STRING_PREVIEW + 1);
        const preview = stringPreview(text.bytes, text.unreadable);
        if (preview) base.text = (format) => scalarText(type, bytes, format) + " " + preview;
      }
    }
    return base;
  }
  if (type.kind === "array" && place.types) {
    const element = place.types.resolve(type.element);
    const count = type.count || 0;
    base.indexed = count;
    base.children = async (start = 0, wanted = count) => {
      const rows: Promise<ValueNode>[] = [];
      for (let i = start; i < Math.min(count, start + wanted); i++) {
        rows.push(placeNode(target, parse, "[" + i + "]", placeOf(place.types, type.element, place.address + i * element.size), expression ? expression + "[" + i * element.size + "]" : undefined));
      }
      return Promise.all(rows);
    };
    const shown = Math.min(count, element.size === 1 ? STRING_PREVIEW + 1 : ARRAY_PREVIEW);
    const head = await target.read(place.address, shown * element.size);
    const text = element.size === 1 && element.kind === "integer" ? stringPreview(count > STRING_PREVIEW ? head.bytes : head.bytes.subarray(0, count), head.unreadable) : null;
    base.text = (format) => {
      if (text) return text;
      if (!isScalar(element) || head.unreadable.some((u) => u)) return type.name;
      const parts: string[] = [];
      for (let i = 0; i < Math.min(count, ARRAY_PREVIEW); i++) parts.push(scalarText(element, head.bytes.subarray(i * element.size, (i + 1) * element.size), format));
      return "{" + parts.join(", ") + (count > ARRAY_PREVIEW ? ", ..." : "") + "}";
    };
    return base;
  }
  if ((type.kind === "structure" || type.kind === "union") && place.types) {
    const fields = type.fields || [];
    const fieldPlace = (offset: number, fieldType: TypeRef): Place => placeOf(place.types, fieldType, place.address + offset);
    base.named = fields.length;
    base.children = async () => Promise.all(fields.map((field) => placeNode(target, parse, field.name, fieldPlace(field.offset, field.type), expression ? expression + "." + field.name : undefined)));
    const scalars = fields.filter((field) => isScalar(place.types.resolve(field.type))).slice(0, FIELD_PREVIEW);
    const whole = await target.read(place.address, Math.min(type.size, PREVIEW_BYTES));
    base.text = (format) => {
      if (!scalars.length || type.size > PREVIEW_BYTES || whole.unreadable.some((u) => u)) return type.name;
      const parts = scalars.map((field) => {
        const fieldType = place.types.resolve(field.type);
        return field.name + "=" + scalarText(fieldType, whole.bytes.subarray(field.offset, field.offset + fieldType.size), format);
      });
      return "{" + parts.join(", ") + (fields.length > scalars.length ? ", ..." : "") + "}";
    };
    return base;
  }
  base.text = () => type.name;
  return base;
}
