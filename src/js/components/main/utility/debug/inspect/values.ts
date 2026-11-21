import { ContextRecord } from "../engine/contextRecord";
import { Address, MemoryRead } from "../engine/engine";

export interface ValueFormat {
  hex: boolean; // MASM hexadecimal for integers; decimal otherwise
}

// Something the user asked for that cannot be done or shown: its text is for them, and is never a failure of
// the debugger.
export class ValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValueError";
    Object.setPrototypeOf(this, ValueError.prototype);
  }
}

export interface ValueNode {
  name: string;
  text(format: ValueFormat): string;
  type?: string;
  memory?: { address: Address; size: number }; // where the value is, for the memory view and data breakpoints
  expression?: string; // an expression that gives this value again, for "Add to Watch"
  named?: number; // how many values it opens into
  indexed?: number; // an array's elements, asked for by range
  children?(start?: number, count?: number): Promise<ValueNode[]>;
  assign?(text: string): Promise<void>; // throws ValueError when the text is not a value that fits
  note?: string; // a tooltip: a flag's meaning, a register's parts
}

// What the user typed for a new value, as the evaluator read it: a whole number, a real one, or both.
export interface ParsedValue {
  integer: bigint | null;
  real: number | null;
  text: string;
}

// the evaluator, given to whoever builds values that can be assigned
export type ValueParser = (text: string) => Promise<ParsedValue>;
export type IntegerParser = (text: string) => Promise<bigint>;

export function integerOf(parse: ValueParser): IntegerParser {
  return async (text) => {
    const parsed = await parse(text);
    if (parsed.integer === null) throw new ValueError("A whole number is needed here");
    return parsed.integer;
  };
}

// The stopped program as the views and the evaluator reach it. Reads are cheap: they come from what the stop
// brought, or from pages kept until the program runs again.
export interface Target {
  readonly thread: number;
  context(): ContextRecord;
  setContext(context: ContextRecord): Promise<void>;
  read(address: Address, length: number): Promise<MemoryRead>;
  write(address: Address, bytes: Uint8Array): Promise<void>; // throws ValueError when the memory cannot be written
  writableFlags(): number;
}

// the bytes at an address; throws ValueError when any of them cannot be read
export async function readBytes(target: Target, address: Address, length: number): Promise<Uint8Array> {
  const read = await target.read(address, length);
  for (let i = 0; i < length; i++) {
    if (read.unreadable[i]) throw new ValueError("Memory at " + hex8(address + i) + "h cannot be read");
  }
  return read.bytes;
}

export function hex8(value: number): string {
  return ("0000000" + (value >>> 0).toString(16).toUpperCase()).slice(-8);
}
