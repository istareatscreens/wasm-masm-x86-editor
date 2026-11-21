// What the adapter and its handler modules both need, kept apart so that neither has to load the other first.
import { DebugProtocol } from "@vscode/debugprotocol";
import { MasmDebugAdapter } from "./masmDebugAdapter";

// A request that cannot be served as things are; the message is for the user. `quiet`: they have been told.
export class RequestError extends Error {
  readonly quiet: boolean;

  constructor(message: string, quiet = false) {
    super(message);
    this.name = "RequestError";
    this.quiet = quiet;
    Object.setPrototypeOf(this, RequestError.prototype);
  }
}

export type Handler = (adapter: MasmDebugAdapter, args: any) => Promise<object | void>;
export type HandlerTable = { [command: string]: Handler };

// A breakpoint as the front end set it, with the id it was answered with: the same id in every session.
export interface Stored<T> {
  id: number;
  wanted: T;
}

export interface StoredBreakpoints {
  source: Map<string, Stored<DebugProtocol.SourceBreakpoint>[]>; // by the host's file id, lines as the file is now
  functions: Stored<DebugProtocol.FunctionBreakpoint>[];
  exceptionFilters: string[] | null; // null: every kind, as at the start
}

export const NO_SESSION = "No program is being debugged";
export const RUNNING = "The program is running";
export const THREAD_NAME = "Main thread";
