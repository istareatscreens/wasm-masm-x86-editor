// What the debugger keeps between visits, in localStorage under "debug"; instruction and data breakpoints are not
// kept. Every write merges one change into the value as stored now, so two tabs do not undo each other.
export const DEBUG_KEY = "debug";
export const DEBUG_VERSION = 1;
export const MIN_ROWS = 4;
export const MAX_ROWS = 30;
export const DEFAULT_ROWS = 8;

export interface StoredBreakpoint {
  line: number;
  enabled: boolean;
  condition?: string;
  when?: "changed"; // stop when the condition's value has changed, not when it is true
  hit?: string;
  log?: string;
}

export interface StoredFunctionBreakpoint {
  name: string;
  enabled: boolean;
}

export interface SectionState {
  open: boolean;
  rows?: number; // the height of a section that scrolls on its own
}

export interface DebugStored {
  breakpoints: { [path: string]: StoredBreakpoint[] };
  functionBreakpoints: StoredFunctionBreakpoint[];
  watches: string[];
  exceptions: { [filter: string]: boolean };
  sections: { [id: string]: SectionState };
  hex: boolean;
  animateSpeed: number;
  instructionStepping: boolean;
  memoryFollow: string; // the expression the memory view follows at each stop; "" for none
  counting: boolean;
}

export const SECTIONS = ["registers", "watch", "autos", "locals", "callstack", "memory", "stack", "disassembly", "breakpoints", "globals", "console"];
const OPEN_BY_DEFAULT = ["registers", "watch", "autos", "locals", "callstack"];
export const SCROLLING_SECTIONS = ["memory", "stack", "disassembly", "console"];

export const defaultSection = (id: string): SectionState => (SCROLLING_SECTIONS.indexOf(id) >= 0 ? { open: OPEN_BY_DEFAULT.indexOf(id) >= 0, rows: DEFAULT_ROWS } : { open: OPEN_BY_DEFAULT.indexOf(id) >= 0 });

export function defaultDebug(): DebugStored {
  const sections: { [id: string]: SectionState } = {};
  for (const id of SECTIONS) sections[id] = defaultSection(id);
  return { breakpoints: {}, functionBreakpoints: [], watches: [], exceptions: {}, sections, hex: false, animateSpeed: 2, instructionStepping: false, memoryFollow: "", counting: false };
}

const text = (value: unknown): string | undefined => (typeof value === "string" && value.trim() ? value : undefined);

function breakpointOf(value: any): StoredBreakpoint | null {
  if (!value || typeof value !== "object" || typeof value.line !== "number" || !(value.line >= 1) || value.line !== Math.floor(value.line)) return null;
  const breakpoint: StoredBreakpoint = { line: value.line, enabled: value.enabled !== false };
  if (text(value.condition)) breakpoint.condition = value.condition;
  if (value.when === "changed" && breakpoint.condition) breakpoint.when = "changed";
  if (text(value.hit)) breakpoint.hit = value.hit;
  if (text(value.log)) breakpoint.log = value.log;
  return breakpoint;
}

// Stored text (or null) -> a valid record: anything missing, unreadable or of another version takes its default.
export function parseDebug(stored: string | null): DebugStored {
  const record = defaultDebug();
  let value: any = null;
  try {
    value = stored ? JSON.parse(stored) : null;
  } catch (error) {
    value = null;
  }
  if (!value || typeof value !== "object" || value.v !== DEBUG_VERSION) return record;
  if (value.breakpoints && typeof value.breakpoints === "object") {
    for (const path of Object.keys(value.breakpoints)) {
      const list = Array.isArray(value.breakpoints[path]) ? (value.breakpoints[path].map(breakpointOf).filter(Boolean) as StoredBreakpoint[]) : [];
      const lines: { [line: number]: boolean } = {};
      const unique = list.filter((breakpoint) => !lines[breakpoint.line] && (lines[breakpoint.line] = true));
      if (unique.length) record.breakpoints[path] = unique.sort((a, b) => a.line - b.line);
    }
  }
  if (Array.isArray(value.functionBreakpoints))
    record.functionBreakpoints = value.functionBreakpoints.filter((entry: any) => entry && text(entry.name)).map((entry: any) => ({ name: entry.name.trim(), enabled: entry.enabled !== false }));
  if (Array.isArray(value.watches)) record.watches = value.watches.filter((entry: unknown) => text(entry));
  if (value.exceptions && typeof value.exceptions === "object") for (const filter of Object.keys(value.exceptions)) record.exceptions[filter] = !!value.exceptions[filter];
  if (value.sections && typeof value.sections === "object") {
    for (const id of SECTIONS) {
      const section = value.sections[id];
      if (!section || typeof section !== "object") continue;
      record.sections[id] = { ...record.sections[id], open: !!section.open };
      if (record.sections[id].rows !== undefined && typeof section.rows === "number") record.sections[id].rows = Math.max(MIN_ROWS, Math.min(MAX_ROWS, Math.round(section.rows)));
    }
  }
  record.hex = !!value.hex;
  record.animateSpeed = [1, 2, 5, 10].indexOf(value.animateSpeed) >= 0 ? value.animateSpeed : record.animateSpeed;
  record.instructionStepping = !!value.instructionStepping;
  record.memoryFollow = typeof value.memoryFollow === "string" ? value.memoryFollow : "";
  record.counting = !!value.counting;
  return record;
}

export const serializeDebug = (record: DebugStored): string => JSON.stringify({ v: DEBUG_VERSION, ...record });

export function readDebug(): DebugStored {
  try {
    return parseDebug(window.localStorage.getItem(DEBUG_KEY));
  } catch (error) {
    return defaultDebug();
  }
}

export function updateDebug(change: (record: DebugStored) => DebugStored): DebugStored {
  const next = change(readDebug());
  try {
    window.localStorage.setItem(DEBUG_KEY, serializeDebug(next));
  } catch (error) {
    // private mode or full storage: this visit keeps the value
  }
  return next;
}

// `rename` gives a moved or renamed path's new path, or null for a path that did not move.
export function rekeyBreakpoints(record: DebugStored, rename: (path: string) => string | null): DebugStored {
  const breakpoints: DebugStored["breakpoints"] = {};
  for (const path of Object.keys(record.breakpoints)) breakpoints[rename(path) || path] = record.breakpoints[path];
  return { ...record, breakpoints };
}

export function dropBreakpoints(record: DebugStored, gone: (path: string) => boolean): DebugStored {
  const breakpoints: DebugStored["breakpoints"] = {};
  for (const path of Object.keys(record.breakpoints)) if (!gone(path)) breakpoints[path] = record.breakpoints[path];
  return { ...record, breakpoints };
}
