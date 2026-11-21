import { FC } from "react";

/** One group of cells of a row */
export declare const Set: FC<{
  values: Int16Array;
  from: number;
  to: number;
  rowOffset: number;
  unit: number;
  hovered: boolean;
  cellState(at: number, kind: "cell" | "char"): string;
  idOf(column: string, offset: number): string;
  changedAt(at: number, length: number): boolean;
  onHover: ((at: number) => void) | null;
}>;
