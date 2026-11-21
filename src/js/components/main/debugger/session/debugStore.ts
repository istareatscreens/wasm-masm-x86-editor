// The debugger's view state; the sidebar, the editor's gutter and the banner each subscribe to the part they draw.
import { useSyncExternalStore } from "react";
import { DebugStored } from "./debugStorage";

export type Phase = "idle" | "launching" | "running" | "stopped";

export interface StopView {
  number: number; // counts this page's stops, so a view can tell one stop from the next
  reason: string;
  description: string;
  threadId: number;
  hint: string; // what an exception usually means
  report?: string; // a bug report's link: an illegal instruction the emulated CPU should have run
}

export interface FrameView {
  id: number;
  name: string;
  file: string | null; // the drawer path; null for code without a source
  fileName: string;
  line: number;
  address: string; // a memory reference: "0x00401000"
  subtle: boolean; // code that is not the program's own
}

export interface BreakpointView {
  key: number; // this page's name for it; the adapter's id comes with a session
  line: number;
  enabled: boolean;
  condition?: string;
  when?: "changed";
  hit?: string;
  log?: string;
  id?: number;
  verified?: boolean; // undefined: no session has bound it
  message?: string;
}

export interface FunctionBreakpointView {
  key: number;
  name: string;
  enabled: boolean;
  id?: number;
  verified?: boolean;
  message?: string;
}

export interface DataBreakpointView {
  key: number;
  dataId: string;
  label: string;
  verified?: boolean;
  message?: string;
}

export interface InstructionBreakpointView {
  key: number;
  address: string; // a memory reference
  verified?: boolean;
}

export interface ExceptionFilterView {
  filter: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface FailureView {
  kind: string;
  message: string;
  url: string;
  fatal: boolean;
}

export type DebugSettings = Pick<DebugStored, "watches" | "sections" | "hex" | "animateSpeed" | "instructionStepping" | "memoryFollow" | "counting">;

export interface DebugView {
  phase: Phase;
  status: string;
  note: string; // under the status: the source changed since the build, a file was renamed or removed
  stop: StopView | null;
  version: number; // grows whenever shown values may have changed: a stop, an edited value
  frames: FrameView[];
  frame: number; // the frame the views show: 1 is the innermost
  threads: { id: number; name: string }[];
  waiting: boolean; // the program waits for input in the terminal
  animating: boolean;
  stepBack: { supported: boolean; available: boolean; reason: string };
  countingAvailable: boolean;
  failure: FailureView | null;
  breakpoints: { [file: string]: BreakpointView[] };
  functionBreakpoints: FunctionBreakpointView[];
  dataBreakpoints: DataBreakpointView[];
  instructionBreakpoints: InstructionBreakpointView[];
  exceptionFilters: ExceptionFilterView[];
  settings: DebugSettings;
  program: string | null; // the program last debugged in this tab
  memoryAt: { address: string; request: number } | null; // "View memory": where the Memory section should go
  shown: { file: string; line: number; request: number } | null; // the line the editor was last asked to show
  consoleResult: { variable: any; stale: boolean } | null; // the Console's last answer, as a row that can be opened
  properties: { file: string; key: number } | null; // the breakpoint whose properties window is open
}

// State with two faces: the latest (`get`), which the code acts on, and the one the views draw (`drawn`). They
// differ only while the store is held: the changes made then reach the views together, as one update.
export class Store<T> {
  private readonly listeners = new Set<() => void>();
  private shown: T;
  private holds = 0;

  constructor(private state: T) {
    this.shown = state;
  }

  get = (): T => this.state;

  drawn = (): T => this.shown;

  set(change: Partial<T> | ((state: T) => Partial<T>)): void {
    const patch = typeof change === "function" ? change(this.state) : change;
    this.state = { ...this.state, ...patch };
    if (!this.holds) this.publish();
  }

  // Changes from now on are drawn when every hold is let go, and at the latest after `limit` ms. Gives what lets
  // this one go; letting it go again does nothing.
  hold(limit: number): () => void {
    this.holds++;
    let held = true;
    const release = (): void => {
      if (!held) return;
      held = false;
      clearTimeout(timer);
      this.holds--;
      if (!this.holds) this.publish();
    };
    const timer = setTimeout(release, limit);
    return release;
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  private publish(): void {
    if (this.shown === this.state) return;
    this.shown = this.state;
    this.listeners.forEach((listener) => listener());
  }
}

// The part of a store a component draws. `select` must give the same value for the same state.
export function useStore<T, S>(store: Store<T>, select: (state: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => select(store.drawn()));
}
