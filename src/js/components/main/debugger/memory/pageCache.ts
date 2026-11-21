// Memory at one stop: 4 KiB pages read through readMemory when a row on screen needs them. A byte has changed when it
// differs from the previous stop's or from this stop's first read (a user edit). Nothing is read while running.
import { fromBase64 } from "../../utility/debug/format/base64";
import { memoryReference } from "../../utility/debug/adapter/references";

export const PAGE = 0x1000;
export const UNREADABLE = -1;
export const NOT_LOADED = -2;
const SPACE = 0x100000000;

export interface Page {
  bytes: Uint8Array;
  readable: Uint8Array; // 1 for each byte that could be read
}

export type ReadMemory = (args: { memoryReference: string; count: number }) => Promise<{ data?: string; unreadableBytes?: number }>;

// A page through the protocol's rules: the bytes up to the first unreadable one, how many unreadable ones follow,
// and from there another read; no bytes and no unreadable count is the end of what can be read.
export async function readPage(read: ReadMemory, base: number, count: number): Promise<Page> {
  const page: Page = { bytes: new Uint8Array(count), readable: new Uint8Array(count) };
  for (let at = 0; at < count; ) {
    const body = await read({ memoryReference: memoryReference(base + at), count: count - at });
    const data = (body.data && fromBase64(body.data)) || new Uint8Array(0);
    const taken = Math.min(data.length, count - at);
    page.bytes.set(data.subarray(0, taken), at);
    page.readable.fill(1, at, at + taken);
    const skip = body.unreadableBytes || 0;
    if (!taken && !skip) break;
    at += taken + skip;
  }
  return page;
}

export class PageCache {
  private pages = new Map<number, Page | null>(); // null: being read
  private previous = new Map<number, Page>();
  private first = new Map<number, Page>(); // each page as this stop first read it
  private shownBefore = new Map<number, Page>(); // the pages before they were read again, shown until they come
  private reading = new Map<number, Promise<void>>();
  private quiet = 0; // pages read for prepare(): told as one arrival
  private generation = 0;
  private live = false;

  constructor(private readonly read: ReadMemory, private readonly arrived: () => void) {}

  // A new stop: this stop's pages become the ones the next are compared with.
  stopped(): void {
    const kept = this.loaded();
    if (kept.size) this.previous = kept;
    this.again(kept);
    this.first = new Map();
    this.live = true;
  }

  running(): void {
    this.live = false;
  }

  // Memory was written at this stop: read it again, still compared with the previous stop's.
  refresh(): void {
    if (this.live) this.again(this.loaded());
  }

  clear(): void {
    this.again(new Map());
    this.previous = new Map();
    this.first = new Map();
    this.live = false;
  }

  // The pages with these bases, read before the view draws them: `arrived` is told once, when all have come.
  async prepare(bases: number[]): Promise<void> {
    this.quiet++;
    try {
      await Promise.all(bases.map((base) => this.load(base)));
    } finally {
      this.quiet--;
    }
    this.arrived();
  }

  byte(address: number): number {
    if (address < 0 || address >= SPACE) return UNREADABLE;
    const base = address - (address % PAGE);
    const at = address - base;
    let page = this.pages.get(base);
    if (!page) {
      if (page === undefined) void this.load(base);
      page = this.live ? this.shownBefore.get(base) : undefined;
      if (!page) return NOT_LOADED;
    }
    return page.readable[at] ? page.bytes[at] : UNREADABLE;
  }

  changed(address: number): boolean {
    const base = address - (address % PAGE);
    const page = this.pages.get(base);
    if (!page) return false;
    const at = address - base;
    const differs = (other: Page | undefined) => !!other && !!page.readable[at] && !!other.readable[at] && page.bytes[at] !== other.bytes[at];
    return differs(this.previous.get(base)) || differs(this.first.get(base));
  }

  private loaded(): Map<number, Page> {
    const kept = new Map<number, Page>();
    this.pages.forEach((page, base) => page && kept.set(base, page));
    return kept;
  }

  // every page is to be read again; `shown` is what the view goes on showing meanwhile
  private again(shown: Map<number, Page>): void {
    this.shownBefore = shown;
    this.pages = new Map();
    this.reading = new Map();
    this.generation++;
  }

  private load(base: number): Promise<void> {
    const reading = this.reading.get(base);
    if (reading) return reading;
    if (!this.live || this.pages.has(base)) return Promise.resolve();
    this.pages.set(base, null);
    const generation = this.generation;
    const done = (page: Page) => {
      if (generation !== this.generation) return;
      this.pages.set(base, page);
      this.reading.delete(base);
      if (!this.first.has(base)) this.first.set(base, page);
      if (!this.quiet) this.arrived();
    };
    const promise = readPage(this.read, base, Math.min(PAGE, SPACE - base)).then(done, () => done({ bytes: new Uint8Array(PAGE), readable: new Uint8Array(PAGE) }));
    this.reading.set(base, promise);
    return promise;
  }
}
