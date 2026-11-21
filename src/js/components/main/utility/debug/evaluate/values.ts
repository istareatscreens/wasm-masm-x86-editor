import { fits } from "../format/numbers";
import { Place } from "../inspect/variables";
import { ExpressionError } from "./lexer";

export type Value =
  | { kind: "integer"; value: bigint; size: number; signed: boolean; place?: Place; register?: string; code?: boolean; truth?: boolean }
  | { kind: "real"; value: number; size: number; bytes?: Uint8Array; place?: Place; register?: string; empty?: boolean }
  | { kind: "aggregate"; place: Place } // an array, a structure or a union: read by whoever shows it
  | { kind: "vector"; bytes: Uint8Array; register: string };

export type IntegerValue = Extract<Value, { kind: "integer" }>;

export const ZERO = BigInt(0);
export const ONE = BigInt(1);

export const integer = (value: bigint, size = 4, signed = false): IntegerValue => ({ kind: "integer", value: signed ? BigInt.asIntN(size * 8, value) : BigInt.asUintN(size * 8, value), size, signed });
// a number as written: signed while it fits, so that -1 is minus one and 0FFFFFFFFh is not
export const literal = (value: bigint): Value => integer(value, fits(value, 4) ? 4 : 8, value < ONE << BigInt(31));
// what a comparison gives: 1 or 0, which NOT turns over (MASM's own -1 and 0 would read oddly in a watch)
export const truth = (holds: boolean): Value => ({ ...integer(holds ? ONE : ZERO), truth: true });

// the whole number a value is; `at` places the error in the expression
export function whole(value: Value, at: number): bigint {
  if (value.kind === "integer") return value.value;
  if (value.kind === "real") throw new ExpressionError("A whole number is needed here", at);
  throw new ExpressionError(value.kind === "vector" ? "An XMM register is not a number: open it in Registers" : value.place.shape.name + " is not a number: name one of its parts", at);
}
