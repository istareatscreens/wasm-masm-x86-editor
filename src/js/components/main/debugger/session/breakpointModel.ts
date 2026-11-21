// Pure updates of a file's breakpoint list; the caller stores the result and tells the adapter.
import { DebugProtocol } from "@vscode/debugprotocol";
import { StoredBreakpoint } from "./debugStorage";
import { BreakpointView } from "./debugStore";

let nextKey = 1;
export const newKey = (): number => nextKey++;

export type BreakpointProperties = Pick<BreakpointView, "condition" | "when" | "hit" | "log">;

const byLine = (list: BreakpointView[]): BreakpointView[] => list.slice().sort((a, b) => a.line - b.line);
const clean = (text: string | undefined): string | undefined => (text && text.trim() ? text.trim() : undefined);

export function fromStored(stored: { [path: string]: StoredBreakpoint[] }): { [path: string]: BreakpointView[] } {
  const views: { [path: string]: BreakpointView[] } = {};
  for (const path of Object.keys(stored)) views[path] = stored[path].map((breakpoint) => ({ ...breakpoint, key: newKey() }));
  return views;
}

export function toStored(views: { [path: string]: BreakpointView[] }): { [path: string]: StoredBreakpoint[] } {
  const stored: { [path: string]: StoredBreakpoint[] } = {};
  for (const path of Object.keys(views)) {
    if (!views[path].length) continue;
    stored[path] = views[path].map(({ line, enabled, condition, when, hit, log }) => {
      const breakpoint: StoredBreakpoint = { line, enabled };
      if (condition) breakpoint.condition = condition;
      if (condition && when) breakpoint.when = when;
      if (hit) breakpoint.hit = hit;
      if (log) breakpoint.log = log;
      return breakpoint;
    });
  }
  return stored;
}

// F9, or a click in the gutter: the line's breakpoint goes, or a new one comes.
export function toggled(list: BreakpointView[], line: number): BreakpointView[] {
  if (list.some((breakpoint) => breakpoint.line === line)) return list.filter((breakpoint) => breakpoint.line !== line);
  return byLine(list.concat({ key: newKey(), line, enabled: true }));
}

// Ctrl+F9: the line's breakpoint is switched on or off; a line without one gets one that is off.
export function withEnabled(list: BreakpointView[], line: number, enabled?: boolean): BreakpointView[] {
  if (!list.some((breakpoint) => breakpoint.line === line)) return byLine(list.concat({ key: newKey(), line, enabled: enabled === undefined ? false : enabled }));
  return list.map((breakpoint) => (breakpoint.line === line ? { ...breakpoint, enabled: enabled === undefined ? !breakpoint.enabled : enabled } : breakpoint));
}

export function withProperties(list: BreakpointView[], key: number, properties: BreakpointProperties): BreakpointView[] {
  return list.map((breakpoint) => {
    if (breakpoint.key !== key) return breakpoint;
    const condition = clean(properties.condition);
    return { ...breakpoint, condition, when: condition && properties.when === "changed" ? "changed" : undefined, hit: clean(properties.hit), log: clean(properties.log) };
  });
}

// The editor's text moved the markers: each breakpoint takes its marker's line, and of two that met on one
// line the first stays.
export function moved(list: BreakpointView[], lines: { [key: number]: number }): BreakpointView[] {
  const taken: { [line: number]: boolean } = {};
  const next: BreakpointView[] = [];
  for (const breakpoint of list) {
    const line = lines[breakpoint.key] === undefined ? breakpoint.line : lines[breakpoint.key];
    if (taken[line]) continue;
    taken[line] = true;
    next.push(line === breakpoint.line ? breakpoint : { ...breakpoint, line });
  }
  return byLine(next);
}

// What the adapter is asked to set for a file: the breakpoints that are on, with the protocol's names.
export function requestOf(list: BreakpointView[]): { sent: BreakpointView[]; breakpoints: DebugProtocol.SourceBreakpoint[] } {
  const sent = list.filter((breakpoint) => breakpoint.enabled);
  return {
    sent,
    breakpoints: sent.map((breakpoint) => ({
      line: breakpoint.line,
      condition: breakpoint.condition ? (breakpoint.when === "changed" ? "changed(" + breakpoint.condition + ")" : breakpoint.condition) : undefined,
      hitCondition: breakpoint.hit,
      logMessage: breakpoint.log,
    })),
  };
}

const bound = (breakpoint: BreakpointView, answer: DebugProtocol.Breakpoint): BreakpointView => ({
  ...breakpoint,
  id: answer.id,
  verified: answer.verified,
  message: answer.message,
  // a breakpoint on a line without code moves down to the next statement
  line: answer.verified && answer.line ? answer.line : breakpoint.line,
});

// The adapter's answer, one entry for each breakpoint sent. A switched-off breakpoint was not sent, and has no
// state of the session's. With no program attached (`live` false) the answer only names each breakpoint.
export function applied(list: BreakpointView[], sent: BreakpointView[], answers: DebugProtocol.Breakpoint[], live: boolean): BreakpointView[] {
  const lines: { [key: number]: number } = {};
  const next = list.map((breakpoint): BreakpointView => {
    const at = sent.map((entry) => entry.key).indexOf(breakpoint.key);
    if (at < 0 || !answers[at]) return { ...breakpoint, id: undefined, verified: undefined, message: undefined };
    if (!live) return { ...breakpoint, id: answers[at].id, verified: undefined, message: undefined };
    const after = bound(breakpoint, answers[at]);
    lines[after.key] = after.line;
    return after;
  });
  return moved(next, lines);
}

// A `breakpoint` event: the adapter bound one, or moved it.
export function changed(list: BreakpointView[], answer: DebugProtocol.Breakpoint): BreakpointView[] {
  if (!list.some((breakpoint) => breakpoint.id === answer.id)) return list;
  const next = list.map((breakpoint) => (breakpoint.id === answer.id ? bound(breakpoint, answer) : breakpoint));
  return moved(next, {});
}

export function unbound(list: BreakpointView[]): BreakpointView[] {
  return list.map((breakpoint): BreakpointView => ({ ...breakpoint, id: undefined, verified: undefined, message: undefined }));
}
