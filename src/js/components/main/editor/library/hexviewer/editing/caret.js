// The caret: the offset of the first byte of the cell it is on, and the column it is in ("hex" or "ascii").
// In the hex column it moves a cell (`unit` bytes) at a time, in the character column a byte at a time.

// The last offset a caret can be on in a column.
export const lastOffset = (length, step) => Math.max(0, Math.floor((length - 1) / step) * step);

// Where a key takes the caret, or null for a key that does not move it. `pageRows`: the rows on screen.
// Up, down and a page keep the caret's place in its row; past either end a page stops at the first or last row.
export function caretAfterKey(key, { offset, column, length, rowLength, unit, pageRows, ctrl = false }) {
  if (!length) return null;
  const step = column === "hex" ? unit : 1;
  const last = lastOffset(length, step);
  const inRow = offset % rowLength;
  const rowStart = offset - inRow;
  switch (key) {
    case "ArrowLeft":
      return Math.max(0, offset - step);
    case "ArrowRight":
      return Math.min(last, offset + step);
    case "ArrowUp":
      return offset - rowLength >= 0 ? offset - rowLength : offset;
    case "ArrowDown":
      return offset + rowLength <= last ? offset + rowLength : offset;
    case "PageUp": {
      const to = offset - Math.max(1, pageRows) * rowLength;
      return to >= 0 ? to : inRow;
    }
    case "PageDown": {
      const to = offset + Math.max(1, pageRows) * rowLength;
      if (to <= last) return to;
      const sameColumn = last - (last % rowLength) + inRow;
      return sameColumn <= last ? sameColumn : last;
    }
    case "Home":
      return ctrl ? 0 : rowStart;
    case "End":
      return ctrl ? last : Math.min(rowStart + rowLength - step, last);
    default:
      return null;
  }
}
