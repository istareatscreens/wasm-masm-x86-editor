import { fromStored } from "./breakpointModel";
import { DebugStored } from "./debugStorage";
import { DebugSettings, DebugView } from "./debugStore";

export const IDLE_STATUS = "Ready";
export const LOST_TERMINAL = "The debugger lost contact with the terminal";

export const settingsOf = (record: DebugStored): DebugSettings => ({
  watches: record.watches,
  sections: record.sections,
  hex: record.hex,
  animateSpeed: record.animateSpeed,
  instructionStepping: record.instructionStepping,
  memoryFollow: record.memoryFollow,
  counting: record.counting,
});

export function initialView(record: DebugStored): DebugView {
  return {
    phase: "idle",
    status: IDLE_STATUS,
    note: "",
    stop: null,
    version: 0,
    frames: [],
    frame: 1,
    threads: [],
    waiting: false,
    animating: false,
    stepBack: { supported: true, available: false, reason: "" },
    countingAvailable: true,
    failure: null,
    breakpoints: fromStored(record.breakpoints),
    functionBreakpoints: record.functionBreakpoints.map((entry, i) => ({ ...entry, key: -1 - i })),
    dataBreakpoints: [],
    instructionBreakpoints: [],
    exceptionFilters: [],
    settings: settingsOf(record),
    program: null,
    memoryAt: null,
    shown: null,
    consoleResult: null,
    properties: null,
  };
}
