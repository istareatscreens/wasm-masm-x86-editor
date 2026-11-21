// What Step Back undoes: for each instruction the stepper ran one at a time, the registers before it and the
// bytes it was about to overwrite. Instructions are grouped by the step the user made. History is kept only
// where undoing is exact; anything else is a barrier that empties it, and says why.
import { ContextRecord } from "../engine/contextRecord";
import { Address } from "../engine/engine";

interface Saved {
  context: ContextRecord;
  writes: { address: Address; bytes: Uint8Array }[];
}

interface Group {
  instructions: Saved[];
  bytes: number;
}

export const MAX_STEPS = 256;
export const MAX_INSTRUCTIONS = 4096;
export const MAX_BYTES = 0x100000;
export const STEP_INSTRUCTIONS = 256; // one step records this many instructions at most
export const STEP_MS = 100;

export const BARRIERS = {
  none: "Nothing to step back to",
  call: "Nothing to step back to: the last step ran code outside your program",
  system: "Nothing to step back to: the last step made a system call",
  unknown: "Nothing to step back to: the last step wrote memory in a way that cannot be undone",
  exception: "Nothing to step back to: an exception happened",
  ran: "Nothing to step back to: the program ran freely since",
  long: "Nothing to step back to: the last step was too long to record",
  edited: "Nothing to step back to: a register or memory was changed by hand",
  threads: "Step Back needs a program with one thread",
  moved: "Nothing to step back to: the next statement was set by hand",
};

export class StepHistory {
  private groups: Group[] = [];
  private open: Group | null = null;
  private instructions = 0;
  private bytes = 0;
  reason: string = BARRIERS.none; // why there is nothing to undo, when there is nothing

  get depth(): number {
    return this.groups.length;
  }

  // A forward step begins: what it records is one thing to undo.
  begin(): void {
    this.open = { instructions: [], bytes: 0 };
  }

  record(context: ContextRecord, writes: { address: Address; bytes: Uint8Array }[]): void {
    if (!this.open) return;
    this.open.instructions.push({ context: context.clone(), writes });
    for (const write of writes) this.open.bytes += write.bytes.length;
  }

  get recording(): number {
    return this.open ? this.open.instructions.length : 0;
  }

  // The step is over: it joins the history, and the oldest steps leave when the history is full.
  end(): void {
    const group = this.open;
    this.open = null;
    if (!group || !group.instructions.length) return;
    this.groups.push(group);
    this.instructions += group.instructions.length;
    this.bytes += group.bytes;
    while (this.groups.length > MAX_STEPS || this.instructions > MAX_INSTRUCTIONS || this.bytes > MAX_BYTES) {
      const oldest = this.groups.shift();
      this.instructions -= oldest.instructions.length;
      this.bytes -= oldest.bytes;
    }
  }

  // Something happened that cannot be taken back: the history is empty from here.
  barrier(reason: string): void {
    this.groups = [];
    this.open = null;
    this.instructions = this.bytes = 0;
    this.reason = reason;
  }

  // The newest step, to undo: its instructions from the last one back. Null when there is none.
  take(): Saved[] | null {
    const group = this.groups.pop();
    if (!group) return null;
    this.instructions -= group.instructions.length;
    this.bytes -= group.bytes;
    if (!this.groups.length) this.reason = BARRIERS.none;
    return group.instructions.slice().reverse();
  }

  // where the program was before the newest step
  previousEip(): Address | null {
    const group = this.groups[this.groups.length - 1];
    return group ? group.instructions[0].context.eip : null;
  }
}
