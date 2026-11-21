// What a session needs from whatever runs the program: the emulator here, a native helper in VS Code. Every
// engine offers the same few primitives, and system code is never traced one instruction at a time.
import { ContextRecord } from "./contextRecord";

export type Address = number;

export interface MemoryRange {
  address: Address;
  length: number;
}

// `unreadable[i]` is 1 for a byte the program has not mapped
export interface MemoryRead {
  bytes: Uint8Array;
  unreadable: Uint8Array;
}

// everything a stop's views start from, in one message
export interface StopState {
  thread: number;
  context: ContextRecord;
  stackAddress: Address; // a little below ESP, so that what the next push overwrites is already here
  stack: MemoryRead;
  codeAddress: Address; // EIP
  code: MemoryRead;
  threads: ThreadInfo[];
}

export interface ThreadInfo {
  id: number;
  waiting: boolean; // inside a system call that has not returned
}

export interface DataWatch {
  address: Address;
  size: number; // 1, 2, 4 or 8
}

export type EngineStopReason = "breakpoint" | "step" | "pause" | "watch";

export type EngineEvent =
  | { type: "attached"; process: number; thread: number; commandLine: string }
  | {
      type: "stopped";
      thread: number;
      reason: EngineStopReason;
      state: StopState;
      watch?: { address: Address; size: number; old: Uint8Array; new: Uint8Array };
      count?: string; // the thread's instructions so far, while counting: a decimal, as it may pass 2^53
    }
  | { type: "exited"; code: number | null }
  | { type: "lost"; reason: string }; // the engine itself is gone: a reloaded terminal, a dead helper

export interface EngineFeatures {
  stepBack: boolean;
  counting: boolean;
  writableFlags: number; // the EFLAGS bits setContext applies
}

export interface Disposable {
  dispose(): void;
}

// The engine's own "no". A session expects these in a race, as when the program exits while a request is
// on its way; they are not failures of the debugger.
export class EngineRefusal extends Error {
  readonly op: string;
  readonly reason: "not-attached" | "no-thread" | "not-stopped" | "bad-argument";

  constructor(op: string, reason: EngineRefusal["reason"]) {
    super(op + ": " + reason);
    this.name = "EngineRefusal";
    this.op = op;
    this.reason = reason;
    Object.setPrototypeOf(this, EngineRefusal.prototype);
  }
}

export interface DebugEngine {
  readonly features: EngineFeatures;
  // Tell the engine which program to hold when it starts; the `attached` event follows the build.
  arm(programName: string, pathSuffix: string): Promise<void>;
  disarm(): Promise<void>;
  // the program's file as the build left it
  readProgram(path: string): Promise<Uint8Array>;
  continue(): Promise<void>;
  step(thread: number): Promise<void>; // one whole instruction, a REP with all its repeats
  // Runs while EIP stays inside [start, end). A CALL at an address of `over` runs to its return.
  stepRange(thread: number, start: Address, end: Address, over: Address[]): Promise<void>;
  pause(): Promise<void>;
  terminate(exitCode: number): Promise<void>;
  detach(): Promise<void>; // releases every hold; the program runs on
  setBreakpoints(addresses: Address[]): Promise<void>;
  setWatches(watches: DataWatch[]): Promise<void>;
  setCounting(on: boolean): Promise<void>;
  stopState(thread: number): Promise<StopState>;
  read(ranges: MemoryRange[]): Promise<MemoryRead[]>;
  write(address: Address, bytes: Uint8Array): Promise<number>; // how many bytes were written
  setContext(thread: number, context: ContextRecord): Promise<void>;
  // Step Back in one request: the bytes written back in the order given, then the thread's registers, and the
  // stop as it then is. Null when the memory refused a write: nothing after it was applied.
  restore(thread: number, writes: { address: Address; bytes: Uint8Array }[], context: ContextRecord): Promise<StopState | null>;
  threads(): Promise<ThreadInfo[]>;
  onEvent(listener: (event: EngineEvent) => void): Disposable;
  // What the engine is and what it was last asked, for a failure report: "emulator (st), stepRange".
  describe(): string;
  dispose(): void;
}
