// Overwrite typing. In the hex column, hex digits fill the cell under the caret, most significant digit first;
// once all its digits are typed, the cell's bytes are written, least significant first (little-endian). In
// the character column a printable ASCII character is one byte.

export const isHexDigit = (key) => typeof key === "string" && /^[0-9a-fA-F]$/.test(key);

// The digits typed so far after one more. `bytes` is set once the cell is complete.
export function typeDigit(pending, digit, unit) {
  const digits = (pending + digit).toUpperCase();
  if (digits.length < unit * 2) return { pending: digits, bytes: null };
  const bytes = new Uint8Array(unit);
  for (let i = 0; i < unit; i++) bytes[i] = parseInt(digits.substr((unit - 1 - i) * 2, 2), 16);
  return { pending: "", bytes };
}

// The byte a key types in the character column; null for anything that is not one printable ASCII character.
export function charByte(key) {
  if (typeof key !== "string" || key.length !== 1) return null;
  const code = key.charCodeAt(0);
  return code >= 0x20 && code < 0x7f ? code : null;
}
