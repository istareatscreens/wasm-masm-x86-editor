import { FC } from "react";

/** One cell: a byte, word or dword of the hex column ("cell"), or one byte of the character column ("char") */
export declare const Item: FC<{
  kind: "cell" | "char";
  id: string;
  offset: number;
  text: string;
  /** the cell's state classes */
  states: string;
  changed: boolean;
  onHover: (() => void) | null;
}>;
