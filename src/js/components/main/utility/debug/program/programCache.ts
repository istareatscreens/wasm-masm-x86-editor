// A program's information is read once per build: a restart whose rebuild gives the same bytes reuses it.
import { LineTable } from "./lineTable";
import { ProgramInfo, readProgramInfo } from "./programInfo";
import { TypeModel } from "./typeModel";

// everything read from one built program; `info` is null for a program without debug information
export interface Program {
  hash: string;
  info: ProgramInfo | null;
  lines: LineTable | null;
  types: TypeModel | null;
}

const K: number[] = [];
(function primes() {
  for (let candidate = 2; K.length < 64; candidate++) {
    let prime = true;
    for (let d = 2; d * d <= candidate; d++) if (candidate % d === 0) prime = false;
    if (prime) K.push((Math.pow(candidate, 1 / 3) * 4294967296) | 0);
  }
})();

// SHA-256 in plain arithmetic: `crypto.subtle` is missing on a page served over plain HTTP.
export function sha256(bytes: Uint8Array): string {
  const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bytes.length / 0x20000000));
  view.setUint32(padded.length - 4, (bytes.length << 3) >>> 0);
  const w = new Int32Array(64);
  const rotate = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let block = 0; block < padded.length; block += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getInt32(block + 4 * i);
    for (let i = 16; i < 64; i++) {
      const s0 = rotate(w[i - 15], 7) ^ rotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotate(w[i - 2], 17) ^ rotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const t1 = (hh + (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
      const t2 = ((rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    [a, b, c, d, e, f, g, hh].forEach((value, i) => (h[i] = (h[i] + value) | 0));
  }
  return h.map((value) => ("0000000" + (value >>> 0).toString(16)).slice(-8)).join("");
}

export class ProgramCache {
  private readonly programs = new Map<string, Program>();

  constructor(private readonly limit = 8) {}

  // Throws DebugInfoError for a damaged program; that is not remembered.
  read(bytes: Uint8Array): Program {
    const hash = sha256(bytes);
    let program = this.programs.get(hash);
    if (program) {
      this.programs.delete(hash);
    } else {
      const info = readProgramInfo(bytes);
      program = { hash, info, lines: info && new LineTable(info), types: info && new TypeModel(info) };
    }
    this.programs.set(hash, program);
    if (this.programs.size > this.limit) this.programs.delete(this.programs.keys().next().value);
    return program;
  }
}
