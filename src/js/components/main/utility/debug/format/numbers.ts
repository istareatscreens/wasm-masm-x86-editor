// Integers as a MASM programmer writes and reads them. A value travels as its bytes, least significant first,
// or as a bigint; nothing here loses bits of a QWORD.

const ZERO = BigInt(0);
const EIGHT = BigInt(8);
const BYTE_MASK = BigInt(255);

export function bigOf(bytes: Uint8Array, signed = false): bigint {
  let value = ZERO;
  for (let i = bytes.length - 1; i >= 0; i--) value = (value << EIGHT) | BigInt(bytes[i]);
  return signed ? BigInt.asIntN(bytes.length * 8, value) : value;
}

// the low `size` bytes of a value, two's complement
export function bytesOf(value: bigint, size: number): Uint8Array {
  const bytes = new Uint8Array(size);
  let rest = BigInt.asUintN(size * 8, value);
  for (let i = 0; i < size; i++) {
    bytes[i] = Number(rest & BYTE_MASK);
    rest >>= EIGHT;
  }
  return bytes;
}

// does the value fit `size` bytes, read as signed or as unsigned
export function fits(value: bigint, size: number): boolean {
  return value === BigInt.asUintN(size * 8, value) || value === BigInt.asIntN(size * 8, value);
}

function digits(value: bigint, size: number, radix: number, width: number): string {
  let text = BigInt.asUintN(size * 8, value).toString(radix).toUpperCase();
  while (text.length < width) text = "0" + text;
  return text;
}

// 0000002A: the digits alone, padded to the size
export function hexDigits(value: bigint, size: number): string {
  return digits(value, size, 16, size * 2);
}

// 0000002Ah and 0FFFFFFFFh: padded to the size, with the 0 that MASM wants before a letter
export function masmHex(value: bigint, size: number): string {
  const text = hexDigits(value, size);
  return (/^[A-F]/.test(text) ? "0" : "") + text + "h";
}

export function decimal(value: bigint, size: number, signed: boolean): string {
  return (signed ? BigInt.asIntN(size * 8, value) : BigInt.asUintN(size * 8, value)).toString();
}

export function octal(value: bigint, size: number): string {
  return digits(value, size, 8, 1) + "o";
}

// 0010 1010b: every bit of the size, in groups of four
export function binary(value: bigint, size: number): string {
  return digits(value, size, 2, size * 8).replace(/(.{4})(?=.)/g, "$1 ") + "b";
}

// '*' for a byte that prints; null for the others
export function character(byte: number): string | null {
  return byte >= 0x20 && byte < 0x7f ? "'" + String.fromCharCode(byte) + "'" : null;
}

// an address as the views write it: eight digits and an h
export function address(value: number): string {
  return hexDigits(BigInt(value >>> 0), 4) + "h";
}

const SUFFIX_RADIX: { [suffix: string]: number } = { h: 16, b: 2, y: 2, o: 8, q: 8, d: 10, t: 10 };

// A number as MASM or C writes it: 42, 2Ah, 0FFh, 1010b, 17o, 17q, 42d, 0x2A, 'A'. Null when it is not one.
export function parseNumber(text: string): bigint | null {
  const quoted = /^'(.{1,4})'$/.exec(text) || /^"(.{1,4})"$/.exec(text);
  if (quoted) {
    let value = ZERO;
    for (let i = 0; i < quoted[1].length; i++) value = (value << EIGHT) | BigInt(quoted[1].charCodeAt(i) & 255);
    return value;
  }
  const lower = text.toLowerCase();
  let body = lower;
  let radix = 10;
  if (/^0x[0-9a-f]+$/.test(lower)) {
    body = lower.slice(2);
    radix = 16;
  } else if (/^[0-9][0-9a-f]*h$/.test(lower)) {
    body = lower.slice(0, -1);
    radix = 16;
  } else if (/^[0-9]+[byoqdt]$/.test(lower)) {
    radix = SUFFIX_RADIX[lower.slice(-1)];
    body = lower.slice(0, -1);
  } else if (!/^[0-9]+$/.test(lower)) {
    return null;
  }
  let value = ZERO;
  const big = BigInt(radix);
  for (let i = 0; i < body.length; i++) {
    const digit = parseInt(body[i], 36);
    if (!(digit < radix)) return null;
    value = value * big + BigInt(digit);
  }
  return value;
}
