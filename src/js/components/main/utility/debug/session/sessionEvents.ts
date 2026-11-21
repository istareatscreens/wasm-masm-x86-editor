import { Decoder } from "../disasm/decoder";
import { Address, DebugEngine } from "../engine/engine";
import { Timers } from "../engine/emulator/emulatorEngine";
import { ProgramCache } from "../program/programCache";
import { SourceResolver } from "../program/sourcePaths";
import { DebugFailure } from "../report/failure";
import { Breakpoint } from "./breakpoints";

export type SessionState = "starting" | "running" | "stopped" | "ended";
export type StopReason = "entry" | "step" | "breakpoint" | "function breakpoint" | "instruction breakpoint" | "data breakpoint" | "exception" | "pause" | "goto";

export interface StopInfo {
  reason: StopReason;
  thread: number;
  text: string; // more to say: a condition's error, an exception's name
  breakpointIds: number[];
  returned?: { name: string; eax: number }; // the procedure a step ran to its end, and what it left in EAX
  watch?: { address: Address; size: number; old: Uint8Array; new: Uint8Array };
  exception?: { code: number; firstChance: boolean; address: Address };
}

export type SessionEvent =
  | { type: "started" } // the program is attached and bound, and runs towards its entry point
  | { type: "stopped"; stop: StopInfo }
  | { type: "continued" }
  | { type: "waiting" } // the program has run for a second: it may be waiting for input
  | { type: "output"; text: string }
  | { type: "breakpoints"; changed: Breakpoint[] }
  | { type: "changed"; what: "memory" | "registers" } // the user edited the program's state
  | { type: "exited"; code: number | null }
  | { type: "problem"; failure: DebugFailure } // a failure the session survives
  | { type: "ended"; message: string; failure: DebugFailure | null };

// Something asked of the session that it cannot do now; the text is for the user.
export class SessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionError";
    Object.setPrototypeOf(this, SessionError.prototype);
  }
}

export interface SessionOptions {
  engine: DebugEngine;
  decoder: Decoder;
  resolver: SourceResolver;
  cache: ProgramCache;
  programPath: string; // the built program as the build names it: D:\bin\main.exe
  stopAtEntry: boolean;
  breakpointIds?: () => number; // the next breakpoint id, when the front end's breakpoints have ids already
  timers?: Timers;
  now?: () => number;
}

export const START_MS = 10000; // a built program must attach within this
export const STOP_MS = 2000; // a Stop the engine does not act on ends the session after this
export const WAITING_MS = 1000;
