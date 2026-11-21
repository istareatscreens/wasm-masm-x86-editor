// How many bytes a row shows when that follows the view's width: 16 or 8 when they fit, else 4. Two measured
// rows, of 8 and of 16 bytes, decide: their widths differ by what 8 bytes add (cells, gaps between groups,
// characters). A row of 4 is the narrowest there is, whatever its width.
export const ROW_LENGTHS = [16, 8, 4];

export function fitRowLength(available, widthOf8, widthOf16) {
  if (!(available > 0) || !(widthOf8 > 0) || !(widthOf16 > widthOf8)) return 16;
  if (widthOf16 <= available + 0.5) return 16;
  return widthOf8 <= available + 0.5 ? 8 : 4;
}
