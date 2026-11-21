// The program's memory as the views read it while it is stopped: by pages kept until the program runs again,
// with every read asked for in the same turn sent to the engine as one request. A stop the user is shown reads
// mostly what the last one read (the stack, the code, the thread's block): those pages are asked for at once.
import { Address, DebugEngine, MemoryRange, MemoryRead } from "../engine/engine";

const PAGE = 0x1000;
const SPACE = 0x100000000;
const MAX_RUN = 16; // pages in one range
const PREFETCH_PAGES = 32;

interface Page {
  bytes: Uint8Array;
  unreadable: Uint8Array;
}

export class SessionMemory {
  private pages = new Map<number, Page>();
  private seeds: { address: Address; read: MemoryRead }[] = [];
  private wanted = new Map<number, Promise<void>>();
  private queued: number[] = [];
  private generation = 0;
  private showing = false; // the stop kept is one the user is shown
  private touched = new Set<number>(); // the pages read since the stop
  private shownPages: number[] = []; // the pages the last shown stop read
  requests = 0; // engine reads made: what a test counts

  constructor(private readonly engine: DebugEngine) {}

  // The program ran, or its memory was written: nothing kept is true any more.
  invalidate(): void {
    if (this.showing) this.shownPages = Array.from(this.touched).slice(0, PREFETCH_PAGES);
    this.showing = false;
    this.touched.clear();
    this.generation++;
    this.pages.clear();
    this.seeds = [];
    this.wanted.clear();
    this.queued = [];
  }

  // bytes that came with a stop: its stack and its code
  seed(address: Address, read: MemoryRead): void {
    this.seeds.push({ address, read });
  }

  // The stop kept is shown to the user: the pages the last shown stop read are asked for now, in one request.
  shown(): void {
    if (this.showing) return;
    this.showing = true;
    for (const base of this.shownPages) if (!this.pages.has(base)) this.want(base).catch((): void => undefined);
  }

  async read(address: Address, length: number): Promise<MemoryRead> {
    const known = this.peek(address, length);
    if (known) return known;
    const end = Math.min(address + length, SPACE);
    const generation = this.generation;
    const waits: Promise<void>[] = [];
    for (let base = address - (address % PAGE); base < end; base += PAGE) if (!this.pages.has(base)) waits.push(this.want(base));
    await Promise.all(waits);
    return this.copy(address, length, generation === this.generation);
  }

  // The bytes when every one is at hand, from a seed or from pages kept; null when some must be asked for.
  peek(address: Address, length: number): MemoryRead | null {
    if (length <= 0) return this.copy(address, length, false);
    for (const seed of this.seeds) {
      const offset = address - seed.address;
      if (offset >= 0 && offset + length <= seed.read.bytes.length) {
        return { bytes: seed.read.bytes.slice(offset, offset + length), unreadable: seed.read.unreadable.slice(offset, offset + length) };
      }
    }
    const end = Math.min(address + length, SPACE);
    let missing = false;
    for (let base = address - (address % PAGE); base < end; base += PAGE) {
      this.touched.add(base);
      if (!this.pages.has(base)) missing = true;
    }
    return missing ? null : this.copy(address, length, true);
  }

  // How many bytes were written. Everything kept is dropped first: the write may have changed any view.
  async write(address: Address, bytes: Uint8Array): Promise<number> {
    this.invalidate();
    return this.engine.write(address, bytes);
  }

  // the bytes from the pages kept; all unreadable when `kept` is false (the pages were dropped meanwhile)
  private copy(address: Address, length: number, kept: boolean): MemoryRead {
    const result: MemoryRead = { bytes: new Uint8Array(length), unreadable: new Uint8Array(length).fill(1) };
    if (!kept || length <= 0) return result;
    const end = Math.min(address + length, SPACE);
    for (let base = address - (address % PAGE); base < end; base += PAGE) {
      const page = this.pages.get(base);
      if (!page) continue;
      const from = Math.max(address, base);
      const to = Math.min(end, base + PAGE);
      result.bytes.set(page.bytes.subarray(from - base, to - base), from - address);
      result.unreadable.set(page.unreadable.subarray(from - base, to - base), from - address);
    }
    return result;
  }

  private want(base: number): Promise<void> {
    let waiting = this.wanted.get(base);
    if (!waiting) {
      if (!this.queued.length) waiting = Promise.resolve().then(() => this.flush());
      else waiting = this.wanted.get(this.queued[0]);
      this.queued.push(base);
      this.wanted.set(base, waiting);
    }
    return waiting;
  }

  private async flush(): Promise<void> {
    const bases = this.queued.sort((a, b) => a - b);
    const generation = this.generation;
    this.queued = [];
    const ranges: MemoryRange[] = [];
    for (const base of bases) {
      const last = ranges[ranges.length - 1];
      if (last && last.address + last.length === base && last.length < MAX_RUN * PAGE) last.length += PAGE;
      else ranges.push({ address: base, length: PAGE });
    }
    this.requests++;
    let reads: MemoryRead[];
    try {
      reads = await this.engine.read(ranges);
    } finally {
      if (generation === this.generation) for (const base of bases) this.wanted.delete(base);
    }
    if (generation !== this.generation) return;
    ranges.forEach((range, i) => {
      for (let offset = 0; offset < range.length; offset += PAGE) {
        this.pages.set(range.address + offset, { bytes: reads[i].bytes.slice(offset, offset + PAGE), unreadable: reads[i].unreadable.slice(offset, offset + PAGE) });
      }
    });
  }
}
