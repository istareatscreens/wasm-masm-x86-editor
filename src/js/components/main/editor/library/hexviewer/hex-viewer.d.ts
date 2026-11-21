/// <reference types="node" />
import { CSSProperties, ForwardRefExoticComponent, ReactNode, RefAttributes } from "react";
import { ByteSource } from "./index";

/** The theme's tokens in camelCase: each sets the custom property --hexviewer-<token> (README.md). */
export interface ThemeTokens {
  fontFamily?: string;
  fontSize?: string;
  cellWidth?: string;
  setGap?: string;
  background?: string;
  color?: string;
  frameShadow?: string;
  border?: string;
  headingColor?: string;
  headingBackground?: string;
  asciiColor?: string;
  headerBackground?: string;
  headerColor?: string;
  headerShadow?: string;
  hoverBackground?: string;
  hoverColor?: string;
  setHoverColor?: string;
  selectionBackground?: string;
  selectionColor?: string;
  selectionInactiveBackground?: string;
  selectionInactiveColor?: string;
  caretOutline?: string;
  caretMirrorBackground?: string;
  changedColor?: string;
  unreadableColor?: string;
  disabledBackground?: string;
  disabledColor?: string;
}

/** A preset's name ("light", "dark", or one a page defines), or token values, which may start from a preset */
export type Theme = string | (ThemeTokens & { preset?: string });

/** The offset column's header cell: its text, its tooltip, and what a press does (a button when given) */
export interface OffsetHeader {
  text: string;
  title?: string;
  onClick?: () => void;
}

/** The bytes the rows on screen show: offsets from `start` up to `end` */
export interface VisibleRange {
  start: number;
  end: number;
}

export interface HexViewerProps {
  /** where the bytes come from; or give the data as children */
  source?: ByteSource;
  /** the data, when there is no `source`: base64 or hex text, bytes, or an array of numbers */
  children?: string | Buffer | Uint8Array | ArrayBuffer | number[];
  /** the text children are hexadecimal digits */
  hex?: boolean;
  /** the text children are base64 */
  base64?: boolean;
  /** shown when there are no bytes */
  noData?: ReactNode;
  /** shown when the data cannot be read */
  errorData?: ReactNode;
  /** bytes per row, or "auto": the most of 16, 8 and 4 that fit (16 by default) */
  rowLength?: number | "auto";
  /** bytes per group of cells (4 by default) */
  setLength?: number;
  /** bytes per cell: 1, 2 or 4, shown little-endian as one number (1 by default) */
  unit?: 1 | 2 | 4;
  /** a row's height in pixels (25 by default) */
  rowHeight?: number;
  /** the header row (on by default) */
  showHeader?: boolean;
  /** the offset column's header cell */
  offsetHeader?: OffsetHeader;
  /** the character column (on by default) */
  showAscii?: boolean;
  /** the offset column (on by default) */
  showOffsets?: boolean;
  /** the cell under the pointer is highlighted (on by default) */
  highlightOnHover?: boolean;
  /** greyed, and no edits */
  disabled?: boolean;
  /** when it changes, the edits Ctrl+Z can take back are forgotten */
  historyKey?: unknown;
  /** called when the rows on screen change */
  onVisibleRangeChange?: (range: VisibleRange) => void;
  /** called with the message of a write the source refused */
  onEditError?: (message: string) => void;
  /** draws scrollbars of the page's own on `surface` inside `host`; the browser's are used without it */
  attachScrollbars?: (surface: HTMLElement, host: HTMLElement) => { destroy(): void };
  /** the grid's accessible name */
  label?: string;
  theme?: Theme;
  className?: string;
  style?: CSSProperties;
}

/** The viewer's handle (its ref) */
export interface HexViewerHandle {
  /** scrolls so that the row holding `offset` is at the top ("start"), or as `align` says */
  scrollToOffset(offset: number, align?: "auto" | "center" | "end" | "smart" | "start"): void;
  /** puts the caret on the cell holding `offset`, and scrolls to it */
  setCaret(offset: number, column?: "hex" | "ascii"): void;
  /** where the caret is, or null */
  getCaret(): { offset: number; column: "hex" | "ascii" } | null;
  /** the bytes a row shows: rowLength, or what "auto" chose */
  readonly rowLength: number;
  /** gives the grid the keyboard focus */
  focus(): void;
  /** the grid's element */
  readonly element: HTMLElement | null;
}

export declare const HexViewer: ForwardRefExoticComponent<HexViewerProps & RefAttributes<HexViewerHandle>>;
