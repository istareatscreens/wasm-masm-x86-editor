// A selection runs from an anchor to a focus offset, and covers both ends' cells whole. Null when nothing is
// selected; one cell alone (the caret's) is copied when nothing is.
export function selectionRange(anchor, focus, unit, length) {
  if (anchor === null || anchor === undefined || focus === null || focus === undefined) return null;
  const start = Math.min(anchor, focus) - (Math.min(anchor, focus) % unit);
  const lastCell = Math.max(anchor, focus) - (Math.max(anchor, focus) % unit);
  return { start: Math.max(0, start), end: Math.min(length, lastCell + unit) };
}

export const isSelected = (range, offset) => !!range && offset >= range.start && offset < range.end;
