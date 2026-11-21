import { ForwardRefExoticComponent, RefAttributes } from "react";
import { HexViewerHandle, HexViewerProps } from "./hex-viewer";

export { HexViewerHandle, HexViewerProps, ThemeTokens, Theme, OffsetHeader, VisibleRange } from "./hex-viewer";

/** Where the viewer's bytes come from. Any object with these members will do. */
export interface ByteSource {
  /** the number of bytes shown */
  readonly length: number;
  /** changes whenever bytes, marks or the length may have changed */
  getVersion(): number;
  /** calls `onChange` after each such change; returns what stops it */
  subscribe(onChange: () => void): () => void;
  /** the heading of the row that starts at `offset` */
  label(offset: number): string;
  /** fills `into` with the bytes from `offset`: 0 to 255, -1 unreadable ("??"), -2 not loaded yet (blank) */
  read(offset: number, into: Int16Array): void;
  /** fills `into` with 1 for each byte that changed (drawn in the changed colour), 0 otherwise */
  marks?(offset: number, into: Uint8Array): void;
  /** writes bytes; absent when the source is read-only; rejects with a message for the user */
  write?(offset: number, bytes: Uint8Array): Promise<void>;
}

export declare const HexViewer: ForwardRefExoticComponent<HexViewerProps & RefAttributes<HexViewerHandle>>;

/** A read-only source over bytes held in memory; rows are labelled with eight hex digits unless `label` says otherwise. */
export declare function byteSource(bytes: Uint8Array | ArrayLike<number>, options?: { label?: (offset: number) => string }): ByteSource;

/** The viewer's children as bytes; null for data it cannot read. */
export declare function decodeData(data: string | Uint8Array | ArrayBuffer | number[] | null | undefined, options?: { base64?: boolean; hex?: boolean }): Uint8Array | null;

/** Row headings: eight hexadecimal digits */
export declare function hexOffset(offset: number): string;
/** Row headings: decimal digits padded with zeros to `width` */
export declare function decimalOffset(width: number): (offset: number) => string;

/** The theme's tokens, as their custom properties name them (--hexviewer-<token>) */
export declare const TOKENS: string[];
/** The presets the stylesheet defines */
export declare const PRESETS: string[];
