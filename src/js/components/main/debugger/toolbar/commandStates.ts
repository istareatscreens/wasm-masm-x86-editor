// When each debugger command applies, for the toolbar's buttons and the keys alike. As in Visual Studio and Visual
// C++ 6, Go, Step Into, Step Over and Run to Cursor start a session when there is none; Restart, Break and the rest
// need one.
import { Phase } from "../session/debugStore";

export type ToolbarCommand = "go" | "pause" | "stop" | "restart" | "showNext" | "stepIn" | "next" | "stepOut" | "stepBack" | "runToCursor";

const NO_SESSION = "no program is being debugged";
const NOT_STOPPED = "the program is not stopped";
const BUILDING = "the program is being built";
const NOTHING_TO_DEBUG = "open the program's .asm file to debug it";

// what the commands that start a session say they do while there is none
export const START_HINTS: { [command: string]: string } = {
  go: "start debugging",
  stepIn: "start debugging and stop at the first statement",
  next: "start debugging and stop at the first statement",
  runToCursor: "start debugging and run to the cursor's line",
};

// Debugging needs an .asm open (any letter case, as RUN builds), or the program debugged last: stepping may have
// opened an include file. The banner's RUN, the toolbar and the keys all use this rule.
export function startRule(filename: string, program: string | null): { canStart: boolean; reason: string } {
  const canStart = /\.asm$/i.test(filename || "") || !!program;
  return { canStart, reason: canStart ? "" : NOTHING_TO_DEBUG };
}

export interface CommandState {
  phase: Phase;
  stepBack: { supported: boolean; available: boolean; reason: string };
  canStart: boolean;
  startReason: string;
}

// "" for a command that applies now, else why it does not (the grey button's tooltip)
export function blockedReasons({ phase, stepBack, canStart, startReason }: CommandState): { [command in ToolbarCommand]: string } {
  const idle = phase === "idle";
  const stopped = phase === "stopped";
  const building = phase === "launching";
  const starts = idle ? (canStart ? "" : startReason || NOTHING_TO_DEBUG) : "";
  const stepping = building ? BUILDING : stopped ? "" : idle ? starts : NOT_STOPPED;
  const needsStop = stopped ? "" : idle ? NO_SESSION : NOT_STOPPED;
  return {
    go: building ? BUILDING : phase === "running" ? "the program is running" : starts,
    pause: phase === "running" ? "" : idle ? NO_SESSION : stopped ? "the program is already stopped" : "the program has not started yet",
    stop: idle ? NO_SESSION : "",
    restart: idle ? NO_SESSION : building ? BUILDING : "",
    showNext: needsStop,
    stepIn: stepping,
    next: stepping,
    stepOut: needsStop,
    stepBack: !stopped ? needsStop : !stepBack.supported ? "this terminal cannot step back" : stepBack.available ? "" : stepBack.reason || "nothing to step back to",
    runToCursor: stepping,
  };
}
