// A ByteSource over a 64 KiB window of the address space: the hex viewer cannot hold 4 GiB of rows, so near an edge
// the window moves half its size and the view moves by the same amount, so scrolling goes on without a jump.
import { PAGE, PageCache } from "./pageCache";

export const WINDOW = 0x10000;
const SPACE = 0x100000000;
const EDGE = WINDOW / 8;
const ROW = 16;

const hex8 = (value: number) => ("0000000" + (value >>> 0).toString(16).toUpperCase()).slice(-8);

export class MemoryWindow {
  base = 0;
  readonly length = WINDOW;
  private version = 0;
  private listeners = new Set<() => void>();
  private rows = { start: 0, end: 0 }; // the offsets the rows on screen show

  constructor(private readonly cache: PageCache, private readonly writeMemory: (address: number, bytes: Uint8Array) => Promise<void>) {}

  // ---- the ByteSource contract (editor/library/hexviewer/sources/byteSource.js) ----
  readonly getVersion = (): number => this.version;
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  readonly label = (offset: number): string => hex8(this.base + offset);
  readonly read = (offset: number, into: Int16Array): void => {
    for (let i = 0; i < into.length; i++) into[i] = this.cache.byte(this.base + offset + i);
  };
  readonly marks = (offset: number, into: Uint8Array): void => {
    for (let i = 0; i < into.length; i++) into[i] = this.cache.changed(this.base + offset + i) ? 1 : 0;
  };
  readonly write = (offset: number, bytes: Uint8Array): Promise<void> => this.writeMemory(this.base + offset, bytes);

  changed(): void {
    this.version++;
    this.listeners.forEach((listener) => listener());
  }

  // The window placed so that `address` is a quarter of the way in, with rows above it to scroll to. Returns
  // the address's offset in the window.
  show(address: number): number {
    const at = (address >>> 0) - ((address >>> 0) % ROW);
    this.base = Math.max(0, Math.min(SPACE - WINDOW, at - WINDOW / 4));
    this.changed();
    return (address >>> 0) - this.base;
  }

  visible(start: number, end: number): void {
    this.rows = { start, end };
  }

  pagesShown(): number[] {
    const bases: number[] = [];
    const from = this.base + this.rows.start;
    const to = Math.min(SPACE, this.base + this.rows.end);
    if (to > from) for (let base = from - (from % PAGE); base < to; base += PAGE) bases.push(base);
    return bases;
  }

  // The rows on screen show offsets from `start` to `end`: near an edge with more memory beyond it, the window
  // moves half its size that way. Returns how far the same bytes moved in the window (0: it did not move).
  follow(start: number, end: number): number {
    let next = this.base;
    if (start < EDGE && this.base > 0) next = Math.max(0, this.base - WINDOW / 2);
    else if (end > WINDOW - EDGE && this.base < SPACE - WINDOW) next = Math.min(SPACE - WINDOW, this.base + WINDOW / 2);
    if (next === this.base) return 0;
    const shift = this.base - next;
    this.base = next;
    this.changed();
    return shift;
  }
}
