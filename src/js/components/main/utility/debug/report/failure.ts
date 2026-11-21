// What can go wrong inside the debugger itself: a closed list. Each ends the session cleanly and can be reported.
// A build error, a program without debug information or the user's own exception is not one of these.
import { DebugInfoError } from "../codeview/reader";

export type FailureKind =
  | "internal-error" // an exception inside the adapter, a handler, the bridge or a view
  | "debug-info" // a program built for debugging whose debug information cannot be read
  | "lost-contact" // an engine request timed out while the terminal is alive
  | "engine" // the engine refused a request it should serve
  | "unexpected-address" // the program loaded away from its preferred base
  | "not-started" // the build succeeded but the program never attached
  | "no-exception-stops" // the exception entry points were not found: the session goes on without them
  | "step-back" // an undo could not write its bytes back
  | "out-of-date"; // the emulator's debugger is not the version this code expects

export const FAILURE_TEXT: { [kind in FailureKind]: string } = {
  "internal-error": "The debugger hit an internal error",
  "debug-info": "The program's debug information could not be read",
  "lost-contact": "The debugger lost contact with the program",
  engine: "The emulator refused a debugger request",
  "unexpected-address": "The program loaded at an unexpected address",
  "not-started": "The program did not start",
  "no-exception-stops": "Exception stops are not available in this session",
  "step-back": "Step Back could not restore the program's memory",
  "out-of-date": "The terminal's debugger is out of date: reload the page",
};

export class DebugFailure extends Error {
  readonly kind: FailureKind;
  readonly detail: string;

  // `detail` says what exactly failed, for the report: never a value, an expression or source text
  constructor(kind: FailureKind, detail = "") {
    super(FAILURE_TEXT[kind] + (detail ? ": " + detail : ""));
    this.name = "DebugFailure";
    this.kind = kind;
    this.detail = detail;
    Object.setPrototypeOf(this, DebugFailure.prototype);
  }
}

// A report must not carry the user's folders: a path or an address keeps its last part alone.
export function withoutPaths(text: string): string {
  return text.replace(/(?:[a-z][a-z0-9+.-]*:\/\/|[A-Za-z]:[\\\/]|\/)[^\s)"']*[\\\/]([^\\\/\s)"']+)/g, "$1");
}

export function failureOf(error: unknown): DebugFailure {
  if (error instanceof DebugFailure) return error;
  if (error instanceof DebugInfoError) return new DebugFailure("debug-info", error.message);
  const text = error instanceof Error ? error.name + ": " + error.message : String(error);
  const where = error instanceof Error && error.stack ? error.stack.split("\n").slice(1, 4).join(" |").replace(/\s+/g, " ").trim() : "";
  return new DebugFailure("internal-error", withoutPaths(text + (where ? " (" + where + ")" : "")));
}
