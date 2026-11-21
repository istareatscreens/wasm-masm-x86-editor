// REAL4, REAL8 and REAL10 values as text and back. REAL4 and REAL8 print the shortest decimal that reads back to
// the same value. REAL10 is worked out exactly, in whole numbers, and printed to 19 digits.
import { bigOf, bytesOf } from "./numbers";

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);
const TEN = BigInt(10);
const INTEGER_BIT = ONE << BigInt(63);
const QUIET_BIT = ONE << BigInt(62);
const TWO_64 = ONE << BigInt(64);
const BIAS = 16383;
const DIGITS = 19;

export type Real10Class = "zero" | "normal" | "denormal" | "pseudo-denormal" | "infinity" | "nan" | "unsupported";

function special(value: number): string | null {
  if (value !== value) return "NaN";
  if (value === Infinity) return "+Infinity";
  if (value === -Infinity) return "-Infinity";
  if (value === 0) return 1 / value < 0 ? "-0" : "0";
  return null;
}

export function real8Text(value: number): string {
  return special(value) || String(value);
}

export function real4Text(value: number): string {
  const named = special(value);
  if (named) return named;
  for (let precision = 1; precision < 9; precision++) {
    const text = value.toPrecision(precision);
    if (Math.fround(Number(text)) === value) return String(Number(text));
  }
  return String(Number(value.toPrecision(9)));
}

// The value of 4 or 8 bytes; a REAL10's nearest double.
export function realOf(bytes: Uint8Array): number {
  if (bytes.length === 10) return real10ToNumber(bytes);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return bytes.length === 4 ? view.getFloat32(0, true) : view.getFloat64(0, true);
}

export function realBytes(value: number, size: number): Uint8Array {
  if (size === 10) return real10FromNumber(value);
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);
  if (size === 4) view.setFloat32(0, value, true);
  else view.setFloat64(0, value, true);
  return bytes;
}

function parts(bytes: Uint8Array): { negative: boolean; exponent: number; significand: bigint } {
  return { negative: (bytes[9] & 0x80) !== 0, exponent: ((bytes[9] & 0x7f) << 8) | bytes[8], significand: bigOf(bytes.subarray(0, 8)) };
}

export function real10Class(bytes: Uint8Array): Real10Class {
  const { exponent, significand } = parts(bytes);
  const integer = (significand & INTEGER_BIT) !== ZERO;
  if (exponent === 0) return significand === ZERO ? "zero" : integer ? "pseudo-denormal" : "denormal";
  if (!integer) return "unsupported"; // unnormals, pseudo-infinities and pseudo-NaNs: the processor rejects them
  if (exponent === 0x7fff) return significand === INTEGER_BIT ? "infinity" : "nan";
  return "normal";
}

function pow(base: bigint, exponent: number): bigint {
  let result = ONE;
  let square = base;
  for (let n = exponent; n > 0; n >>= 1) {
    if (n & 1) result *= square;
    square *= square;
  }
  return result;
}

// numerator / denominator to the nearest whole number, a tie going to the even one
function divideRounded(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  const twice = (numerator % denominator) * TWO;
  return twice > denominator || (twice === denominator && (quotient & ONE) === ONE) ? quotient + ONE : quotient;
}

// 19 digits and the power of ten of the first one, for significand * 2^power
function decimalDigits(significand: bigint, power: number): { digits: string; exponent: number } {
  let exponent = Math.floor((significand.toString(2).length - 1 + power) * Math.LOG10E * Math.LN2);
  for (;;) {
    const scale = DIGITS - 1 - exponent;
    const numerator = significand * pow(TWO, Math.max(power, 0)) * pow(TEN, Math.max(scale, 0));
    const denominator = pow(TWO, Math.max(-power, 0)) * pow(TEN, Math.max(-scale, 0));
    const digits = divideRounded(numerator, denominator).toString();
    if (digits.length === DIGITS) return { digits, exponent };
    exponent += digits.length - DIGITS;
  }
}

function layOut(digits: string, exponent: number): string {
  const trimmed = digits.replace(/0+$/, "") || "0";
  if (exponent >= DIGITS || exponent < -5) return trimmed[0] + (trimmed.length > 1 ? "." + trimmed.slice(1) : "") + "e" + (exponent < 0 ? "-" : "+") + Math.abs(exponent);
  if (exponent < 0) return "0." + "0".repeat(-exponent - 1) + trimmed;
  const whole = (trimmed + "0".repeat(DIGITS)).slice(0, exponent + 1);
  const fraction = trimmed.slice(exponent + 1);
  return whole + (fraction ? "." + fraction : "");
}

export function real10Text(bytes: Uint8Array): string {
  const { negative, exponent, significand } = parts(bytes);
  const sign = negative ? "-" : "";
  const kind = real10Class(bytes);
  switch (kind) {
    case "zero":
      return sign + "0";
    case "infinity":
      return (negative ? "-" : "+") + "Infinity";
    case "nan":
      if ((significand & QUIET_BIT) === ZERO) return sign + "SNaN";
      return negative && significand === (INTEGER_BIT | QUIET_BIT) ? "-NaN (indefinite)" : sign + "QNaN";
    case "unsupported":
      return "unsupported (" + (exponent === 0x7fff ? (significand === ZERO ? "pseudo-infinity" : "pseudo-NaN") : "unnormal") + ")";
    default: {
      const { digits, exponent: ten } = decimalDigits(significand, (exponent || 1) - BIAS - 63);
      return sign + layOut(digits, ten) + (kind === "normal" ? "" : " (" + kind + ")");
    }
  }
}

export function real10ToNumber(bytes: Uint8Array): number {
  const { negative, exponent, significand } = parts(bytes);
  const sign = negative ? -1 : 1;
  const kind = real10Class(bytes);
  if (kind === "zero") return sign * 0;
  if (kind === "infinity") return sign * Infinity;
  if (kind === "nan" || kind === "unsupported") return NaN;
  const high = Number(significand >> BigInt(32));
  const low = Number(significand & BigInt(0xffffffff));
  const power = (exponent || 1) - BIAS - 63;
  // two steps, so that a denormal's power of two does not underflow before it is used
  return sign * (high * 4294967296 + low) * Math.pow(2, Math.max(power, -1000)) * Math.pow(2, Math.min(power + 1000, 0));
}

function pack(negative: boolean, exponent: number, significand: bigint): Uint8Array {
  const bytes = new Uint8Array(10);
  bytes.set(bytesOf(significand, 8));
  bytes[8] = exponent & 255;
  bytes[9] = (exponent >> 8) | (negative ? 0x80 : 0);
  return bytes;
}

// The REAL10 nearest to numerator / denominator.
function nearest(negative: boolean, numerator: bigint, denominator: bigint): Uint8Array {
  if (numerator === ZERO) return pack(negative, 0, ZERO);
  let power = numerator.toString(2).length - denominator.toString(2).length - 64;
  let significand = ZERO;
  for (;;) {
    significand = divideRounded(numerator * pow(TWO, Math.max(-power, 0)), denominator * pow(TWO, Math.max(power, 0)));
    if (significand >= TWO_64) power++;
    else if (significand < INTEGER_BIT) power--;
    else break;
  }
  const exponent = power + BIAS + 63;
  if (exponent >= 0x7fff) return pack(negative, 0x7fff, INTEGER_BIT);
  if (exponent > 0) return pack(negative, exponent, significand);
  // too small for a normal number: a denormal, in units of the smallest one
  const denormal = divideRounded(numerator * pow(TWO, BIAS + 62), denominator);
  return pack(negative, denormal >= INTEGER_BIT ? 1 : 0, denormal);
}

export function real10FromNumber(value: number): Uint8Array {
  const negative = value < 0 || (value === 0 && 1 / value < 0);
  if (value !== value) return pack(true, 0x7fff, INTEGER_BIT | QUIET_BIT);
  if (value === Infinity || value === -Infinity) return pack(negative, 0x7fff, INTEGER_BIT);
  if (value === 0) return pack(negative, 0, ZERO);
  // a double is a whole number times a power of two
  let scaled = Math.abs(value);
  let power = 0;
  while (scaled !== Math.floor(scaled)) {
    scaled *= 2;
    power--;
  }
  while (scaled >= 9007199254740992) {
    scaled /= 2;
    power++;
  }
  return nearest(negative, BigInt(scaled) * pow(TWO, Math.max(power, 0)), pow(TWO, Math.max(-power, 0)));
}

// A REAL10 from decimal text: 1.5, -0.25, 1e-4000, .5, 3.; null when it is not a number.
export function parseReal10(text: string): Uint8Array | null {
  const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(text.trim());
  if (!match || !(match[2] || match[3])) {
    const named = /^([+-]?)(inf(?:inity)?|nan)$/i.exec(text.trim());
    if (!named) return null;
    return /^n/i.test(named[2]) ? pack(named[1] === "-", 0x7fff, INTEGER_BIT | QUIET_BIT) : pack(named[1] === "-", 0x7fff, INTEGER_BIT);
  }
  const fraction = match[3] || "";
  const ten = Number(match[4] || 0) - fraction.length;
  if (Math.abs(ten) > 100000) return ten > 0 ? pack(match[1] === "-", 0x7fff, INTEGER_BIT) : pack(match[1] === "-", 0, ZERO);
  const digits = BigInt((match[2] || "") + fraction || "0");
  return nearest(match[1] === "-", digits * pow(TEN, Math.max(ten, 0)), pow(TEN, Math.max(-ten, 0)));
}
