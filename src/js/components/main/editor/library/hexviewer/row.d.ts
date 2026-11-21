import { CSSProperties, FC } from "react";
import { ByteSource } from "./index";

/** One row of the grid: its heading, its groups of cells and its characters, read from the source */
export declare const Row: FC<{
  source: ByteSource;
  version: number;
  index: number;
  offset: number;
  count: number;
  rowLength: number;
  setLength: number;
  unit: number;
  showAscii: boolean;
  showOffsets: boolean;
  headingWidth: number;
  /** the caret's offset in the row, -1 when it is not in it */
  caret: number;
  caretColumn: "hex" | "ascii" | "";
  /** the selection's part of the row, -1 when it has none */
  selStart: number;
  selEnd: number;
  pending: string;
  hoverable: boolean;
  idOf(column: string, offset: number): string;
  style: CSSProperties;
}>;
