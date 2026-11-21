// The messages between the emulator engine (in the app, or in VS Code's extension host) and the emulator bridge
// (in the page that runs the emulator). Requests carry an id, replies name it, events come on their own.
import { Disposable } from "../engine";

export const BRIDGE_PROTOCOL = 1;
export const DEBUGGER_VERSION = 1; // the emulator's bwDebugVersion this code was written against

export type BridgeOp =
  | "hello"
  | "arm"
  | "disarm"
  | "detach"
  | "continue"
  | "step"
  | "stepRange"
  | "pause"
  | "terminate"
  | "setBreakpoints"
  | "setWatches"
  | "setCounting"
  | "stopState"
  | "setContext"
  | "restore"
  | "read"
  | "write"
  | "readFile"
  | "threads";

export interface BridgeRequest {
  bwDebug: number;
  id: number;
  op: BridgeOp;
  thread?: number;
  name?: string;
  suffix?: string;
  path?: string;
  start?: number;
  end?: number;
  over?: number[];
  code?: number;
  addresses?: number[];
  watches?: { address: number; size: number }[];
  on?: boolean;
  ranges?: { address: number; length: number }[];
  address?: number;
  bytes?: ArrayBuffer;
  writes?: { address: number; bytes: ArrayBuffer }[]; // restore: written back in this order, before `bytes`
}

// a stop's registers, stack and code, as buffers that travel without a copy
export interface WireStopState {
  thread: number;
  context: ArrayBuffer;
  stackAddress: number;
  stack: ArrayBuffer;
  stackUnreadable: ArrayBuffer;
  codeAddress: number;
  code: ArrayBuffer;
  codeUnreadable: ArrayBuffer;
  threads: { id: number; waiting: boolean }[];
}

// Why a request was not served. A number is the emulator's own answer:
// -1 not attached, -2 no such thread, -3 the program is not stopped, -4 a bad argument.
export type BridgeError = "unsupported" | "not-ready" | "out-of-date" | "threw" | "trap" | "no-file" | "bad-request" | number;

export interface BridgeReply {
  bwDebug: number;
  re: number;
  ok: boolean;
  error?: BridgeError;
  message?: string;
  version?: number; // hello
  runtime?: string; // hello: "st" or "mt"
  state?: WireStopState; // stopState
  reads?: { bytes: ArrayBuffer; unreadable: ArrayBuffer }[]; // read
  written?: number; // write
  restored?: boolean; // restore: false when a write was refused, and nothing after it was applied
  file?: ArrayBuffer; // readFile
  threads?: { id: number; waiting: boolean }[]; // threads
}

export interface BridgeEvent {
  bwDebug: number;
  // failed: the bridge itself broke, and let the program go; closed: its page is going away (reloaded or closed)
  event: "attached" | "stopped" | "exited" | "failed" | "closed";
  message?: string;
  process?: number;
  thread?: number;
  commandLine?: string;
  reason?: "breakpoint" | "step" | "pause" | "watch";
  state?: WireStopState;
  watch?: { address: number; size: number; old: string; new: string }; // the bytes as hex, first byte first
  count?: string;
  code?: number | null;
}

export interface BridgeTransport {
  post(message: BridgeRequest | BridgeReply | BridgeEvent, transfer?: ArrayBuffer[]): void;
  listen(handler: (message: unknown) => void): Disposable;
}

export const TIMEOUT_CONTROL_MS = 5000;
export const TIMEOUT_READ_MS = 2000;

export function isBridgeMessage(message: unknown): message is { bwDebug: number } {
  return !!message && typeof message === "object" && (message as { bwDebug?: unknown }).bwDebug === BRIDGE_PROTOCOL;
}
