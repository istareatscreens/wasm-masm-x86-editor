// What the viewer writes in its cells. A byte is 0 to 255, UNREADABLE (shown "??") or NOT_LOADED (blank until
// its source has it).
export const UNREADABLE = -1;
export const NOT_LOADED = -2;

const HEX = [];
for (let value = 0; value < 256; value++) HEX.push((value < 16 ? "0" : "") + value.toString(16).toUpperCase());

// One cell: `unit` bytes from values[at], the most significant first (they are stored least significant
// first), as hex digits.
export function cellText(values, at, unit) {
  let text = "";
  for (let i = unit - 1; i >= 0; i--) {
    const value = values[at + i];
    if (value === NOT_LOADED) return "";
    if (value < 0 || value === undefined) return "??".repeat(unit);
    text += HEX[value];
  }
  return text;
}

// One byte in the character column: printable ASCII as itself, any other byte as a middle dot.
export function charText(value) {
  if (value === NOT_LOADED) return "";
  if (value < 0) return "?";
  return value >= 0x20 && value < 0x7f ? String.fromCharCode(value) : "·";
}

const padded = (text, width) => (text.length >= width ? text : "0".repeat(width - text.length) + text);

// Row headings: eight hexadecimal digits, or decimal digits padded to `width`.
export const hexOffset = (offset) => padded(offset.toString(16).toUpperCase(), 8);
export const decimalOffset = (width) => (offset) => padded(String(offset), width);

// Selected cells as they are copied: "4A 65 6C"
export function copyText(values, unit) {
  const cells = [];
  for (let at = 0; at + unit <= values.length; at += unit) cells.push(cellText(values, at, unit) || "??".repeat(unit));
  return cells.join(" ");
}
