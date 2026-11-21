// The Console's last MAX_LINES lines, with a count of those dropped. Lines are added once a frame, so a logpoint in
// a loop cannot hold the page up.
import { Store } from "./debugStore";

export const MAX_LINES = 1000;

export type LineKind = "output" | "message" | "input" | "result" | "error";

export interface ConsoleLine {
  id: number;
  kind: LineKind;
  text: string;
  expression?: string; // a result that can be opened: the expression it is the value of
  stop?: number; // the stop it was evaluated at; it can be opened while the program is still there
}

export interface ConsoleState {
  lines: ConsoleLine[];
  dropped: number;
}

type Frame = (callback: () => void) => unknown;

export class ConsoleLog {
  readonly store = new Store<ConsoleState>({ lines: [], dropped: 0 });
  private pending: ConsoleLine[] = [];
  private dropped = 0; // lines that went before they were drawn
  private scheduled = false;
  private nextId = 1;

  constructor(private readonly frame: Frame = (callback) => requestAnimationFrame(callback)) {}

  add(kind: LineKind, text: string, more: Partial<ConsoleLine> = {}): void {
    for (const line of text.replace(/\n$/, "").split("\n")) this.pending.push({ ...more, id: this.nextId++, kind, text: line });
    if (this.pending.length > MAX_LINES) {
      const over = this.pending.length - MAX_LINES;
      this.pending.splice(0, over);
      this.dropped += over;
    }
    if (this.scheduled) return;
    this.scheduled = true;
    this.frame(() => this.flush());
  }

  flush(): void {
    this.scheduled = false;
    if (!this.pending.length && !this.dropped) return;
    const state = this.store.get();
    const all = state.lines.concat(this.pending);
    const over = Math.max(0, all.length - MAX_LINES);
    this.store.set({ lines: over ? all.slice(over) : all, dropped: state.dropped + this.dropped + over });
    this.pending = [];
    this.dropped = 0;
  }

  clear(): void {
    this.pending = [];
    this.dropped = 0;
    this.store.set({ lines: [], dropped: 0 });
  }
}
