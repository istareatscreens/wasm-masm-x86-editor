// The stepper decides from where the thread is, never from why the engine stopped. In the program's own code a
// step runs one instruction at a time, so that Step Back can undo it; a call into code without lines (Irvine32,
// Windows), and the rest of a step too long to record, runs at full speed.
import { Decoder, Instruction } from "../disasm/decoder";
import { writeFootprint } from "../disasm/writeFootprint";
import { Address, DebugEngine, MemoryRead, StopState } from "../engine/engine";
import { Breakpoints } from "./breakpoints";
import { Modules } from "./modules";
import { StackWalker } from "./stackWalker";
import { BARRIERS, STEP_INSTRUCTIONS, STEP_MS, StepHistory } from "./stepHistory";

export type StepKind = "into" | "over" | "out" | "to";

export interface StepRequest {
  kind: StepKind;
  byInstruction: boolean; // stop after one instruction, wherever that is, not at the next line
  targets?: Address[]; // "to": the places to run to
}

export interface StepHost {
  engine: DebugEngine;
  modules: Modules;
  decoder: Decoder;
  breakpoints: Breakpoints;
  walker: StackWalker;
  history: StepHistory | null; // null: nothing is recorded (a second thread, an engine that cannot undo)
  read(address: Address, length: number): Promise<MemoryRead>;
  now(): number;
}

// a call the step runs through: where it returns to, and ESP just before the CALL
interface Mark {
  back: Address;
  esp: Address;
  name: string | null;
}

export type StepResult =
  | { state: "running" } // the engine was told to go on with the step
  | { state: "done"; returned?: { name: string; eax: number } }
  | { state: "free" } // the step left the program's own code for good: the program just runs now
  | { state: "refused"; message: string };

const OWNER = "step";

export class Step {
  private range: { start: Address; end: Address } | null = null; // the statement, or the instruction, stepped
  private traced: Mark[] = []; // calls into the program's own procedures, followed one instruction at a time
  private awaited: Mark | null = null; // a return address the program is running to at full speed
  private afterAwaited: "done" | "resume" = "resume";
  private entering: Address | null = null; // Step Into: the procedure being entered
  private returned: { name: string; eax: number } | undefined;
  private recorded = 0;
  private plain = false; // past the recording budget: no more single steps
  private started = 0;
  private first = true;

  constructor(private readonly host: StepHost, private readonly request: StepRequest) {}

  cancel(): void {
    this.host.breakpoints.setInternal(OWNER, []);
    if (this.host.history) this.host.history.end();
  }

  // What to do now that the thread is where `stop` says. Called when the step is asked for, and at every stop
  // after that until it answers "done", "free" or "refused".
  async advance(stop: StopState): Promise<StepResult> {
    const result = await this.decide(stop);
    this.first = false;
    if (result.state !== "running") this.cancel();
    return result;
  }

  private async decide(stop: StopState): Promise<StepResult> {
    const { host, request } = this;
    const eip = stop.context.eip;
    const esp = stop.context.esp;
    if (this.first) {
      this.started = host.now();
      if (host.history) host.history.begin();
      if (request.kind === "out") return this.stepOut(stop);
      if (request.kind === "to") return this.runTo(stop, { back: 0, esp: 0, name: null }, request.targets || []);
      const statement = request.byInstruction ? null : host.modules.locate(eip);
      if (statement && statement.statement) this.range = { start: statement.module.base + statement.statement.rva, end: statement.module.base + statement.statement.end };
      else if (!request.byInstruction) return this.stepOut(stop, true); // no lines here: back to the program's own code
    }
    if (this.awaited) {
      if (!this.arrived(this.awaited, eip, esp)) {
        await this.resumeAwaited();
        return { state: "running" };
      }
      const mark = this.awaited;
      this.awaited = null;
      host.breakpoints.setInternal(OWNER, []);
      if (mark.back) this.noteReturn(mark, stop);
      if (this.afterAwaited === "done" || (request.targets && request.targets.indexOf(eip) >= 0)) return { state: "done", returned: this.returned };
    }
    while (this.traced.length && this.arrived(this.traced[this.traced.length - 1], eip, esp)) this.noteReturn(this.traced.pop(), stop);
    const instruction = this.instructionAt(stop);
    if (!this.traced.length) {
      if (request.byInstruction && !this.first) return { state: "done", returned: this.returned };
      const inside = this.range ? eip >= this.range.start && eip < this.range.end : this.first;
      if (!inside) {
        if (host.modules.hasLines(eip)) return { state: "done", returned: this.returned };
        // code without lines: an import's "jmp [address]" into a procedure that has lines is stepped through
        if (request.kind === "into" && instruction && (await this.leadsToLines(instruction))) return this.single(stop, instruction);
        return this.leaveToCaller(stop);
      }
    } else if (!host.modules.hasLines(eip)) {
      return this.finishAtFullSpeed(BARRIERS.call); // a traced procedure jumped out of the program's own code
    }
    if (!instruction) return { state: "refused", message: "The code at " + eip.toString(16).toUpperCase() + "h cannot be read" };
    if (this.plain) return this.plainStep(stop);
    if (this.recorded >= STEP_INSTRUCTIONS || host.now() - this.started >= STEP_MS) return this.finishAtFullSpeed(BARRIERS.long, stop);
    if (instruction.flow === "call" || instruction.flow === "indirect-call") return this.atCall(stop, instruction);
    return this.single(stop, instruction);
  }

  private arrived(mark: Mark, eip: Address, esp: Address): boolean {
    return mark.back ? eip === mark.back && esp >= mark.esp : (this.request.targets || []).indexOf(eip) >= 0;
  }

  private instructionAt(stop: StopState): Instruction | null {
    let length = 0;
    while (length < stop.code.bytes.length && !stop.code.unreadable[length]) length++;
    return stop.codeAddress === stop.context.eip ? this.host.decoder.decode(stop.code.bytes.subarray(0, length), stop.context.eip) : null;
  }

  private noteReturn(mark: Mark, stop: StopState): void {
    if (mark.name) this.returned = { name: mark.name, eax: stop.context.eax };
  }

  // One instruction, saved first when it can be undone.
  private async single(stop: StopState, instruction: Instruction): Promise<StepResult> {
    const history = this.host.history;
    const module = this.host.modules.moduleAt(stop.context.eip);
    if (history && module && module.own) {
      const footprint = writeFootprint(instruction, stop.context);
      if ("unknown" in footprint) {
        history.barrier(footprint.unknown === "a system call" ? BARRIERS.system : BARRIERS.unknown);
      } else {
        const writes: { address: Address; bytes: Uint8Array }[] = [];
        for (const range of footprint.ranges) {
          const before = await this.host.read(range.address, range.length);
          if (before.unreadable.some((u) => u)) {
            history.barrier(BARRIERS.unknown); // the write will fault, or grow the stack: neither is undone
            break;
          }
          writes.push({ address: range.address, bytes: before.bytes });
        }
        if (writes.length === footprint.ranges.length) history.record(stop.context, writes);
      }
    } else if (history) {
      history.barrier(BARRIERS.call);
    }
    this.recorded++;
    await this.host.engine.step(stop.thread);
    return { state: "running" };
  }

  private async atCall(stop: StopState, instruction: Instruction): Promise<StepResult> {
    const { host, request } = this;
    const target = await this.targetOf(instruction, stop);
    const callee = target === null ? null : await this.throughJumps(target);
    const name = callee === null ? null : await host.modules.symbolFor(callee);
    const mark: Mark = { back: stop.context.eip + instruction.length, esp: stop.context.esp, name: name && name.replace(/^.*!/, "") };
    const own = callee !== null && host.modules.hasLines(callee);
    if (request.kind === "into" && !this.traced.length && (own || request.byInstruction)) {
      this.entering = callee;
      return this.single(stop, instruction);
    }
    if (own) {
      this.traced.push(mark);
      return this.single(stop, instruction);
    }
    // code without lines runs at full speed, and what it did cannot be taken back
    if (host.history) host.history.barrier(BARRIERS.call);
    return this.runTo(stop, mark, [], true);
  }

  // Runs to a return address (or to the request's targets) at full speed.
  private async runTo(stop: StopState, mark: Mark, targets: Address[], overCall = false): Promise<StepResult> {
    const { host } = this;
    if (host.history) host.history.barrier(overCall ? BARRIERS.call : BARRIERS.ran);
    this.awaited = mark;
    this.afterAwaited = this.request.kind === "out" || this.request.kind === "to" ? "done" : "resume";
    if (overCall) {
      // the engine runs this one CALL to its return in a single request
      await host.engine.stepRange(stop.thread, stop.context.eip, mark.back, [stop.context.eip]);
      return { state: "running" };
    }
    host.breakpoints.setInternal(OWNER, mark.back ? [mark.back] : targets);
    await host.breakpoints.sync(host.engine);
    await host.engine.continue();
    return { state: "running" };
  }

  // The program stopped somewhere else on its way to the awaited address (a breakpoint that did not stop it):
  // a breakpoint at the address brings the step back.
  private async resumeAwaited(): Promise<void> {
    const { host } = this;
    if (this.awaited.back) host.breakpoints.setInternal(OWNER, [this.awaited.back]);
    await host.breakpoints.sync(host.engine);
    await host.engine.continue();
  }

  private async stepOut(stop: StopState, toOwnCode = false): Promise<StepResult> {
    const { host } = this;
    const stack = await host.walker.walk(stop.context);
    let frame = 0;
    // from code without lines, out means out to the program's own code
    if (toOwnCode) while (frame + 1 < stack.frames.length && !(stack.frames[frame + 1].location && stack.frames[frame + 1].location.statement)) frame++;
    const from = stack.frames[frame];
    const caller = stack.frames[frame + 1];
    if (!caller || from.returnSlot === null) return { state: "refused", message: "Step Out needs a procedure frame here" };
    const procedure = stack.frames[0].location && stack.frames[0].location.procedure;
    this.afterAwaited = "done";
    return this.runTo(stop, { back: caller.eip, esp: from.returnSlot + 4, name: procedure ? procedure.name : await this.nameAt(stack.frames[0].eip) }, []);
  }

  private async nameAt(address: Address): Promise<string | null> {
    const name = await this.host.modules.symbolFor(address);
    return name ? name.replace(/^.*!/, "").replace(/\+[0-9A-F]+h$/, "") : null;
  }

  // The thread is in code without lines, outside the statement. If a CALL of the statement brought it here,
  // that call runs to its return. Otherwise the program returned out of its own code, and just runs.
  private async leaveToCaller(stop: StopState): Promise<StepResult> {
    const { host } = this;
    const top = stop.stack.bytes;
    const at = stop.context.esp - stop.stackAddress;
    const back = at >= 0 && at + 4 <= top.length && !stop.stack.unreadable[at] ? (top[at] | (top[at + 1] << 8) | (top[at + 2] << 16) | (top[at + 3] << 24)) >>> 0 : 0;
    const call = back && this.range && back > this.range.start && back <= this.range.end ? await host.walker.callBefore(back) : null;
    if (call && call.address >= this.range.start) return this.runTo(stop, { back, esp: stop.context.esp + 4, name: await this.nameAt(stop.context.eip) }, []);
    if (host.history) host.history.barrier(BARRIERS.ran);
    await host.engine.continue();
    return { state: "free" };
  }

  // The rest of the step without recording: the traced calls run to the outermost one's return, and the
  // statement itself by range.
  private async finishAtFullSpeed(reason: string, stop?: StopState): Promise<StepResult> {
    const { host } = this;
    this.plain = true;
    if (host.history) host.history.barrier(reason);
    if (this.traced.length) {
      const outermost = this.traced[0];
      this.traced = [];
      this.awaited = outermost;
      this.afterAwaited = "resume";
      await this.resumeAwaited();
      return { state: "running" };
    }
    return this.plainStep(stop);
  }

  // Runs until the thread leaves the statement: by reaching another one, or by a call, which lands in decide().
  private async plainStep(stop: StopState): Promise<StepResult> {
    const { host } = this;
    if (!this.range) {
      await host.engine.step(stop.thread);
      return { state: "running" };
    }
    await host.engine.stepRange(stop.thread, this.range.start, this.range.end, []);
    return { state: "running" };
  }

  private async u32(address: Address): Promise<number | null> {
    const read = await this.host.read(address >>> 0, 4);
    if (read.unreadable[0] || read.unreadable[3]) return null;
    return (read.bytes[0] | (read.bytes[1] << 8) | (read.bytes[2] << 16) | (read.bytes[3] << 24)) >>> 0;
  }

  // where a CALL or a JMP goes, read from its register or its memory operand when it is indirect
  private async targetOf(instruction: Instruction, stop: StopState): Promise<Address | null> {
    if (instruction.target !== null) return instruction.target;
    const footprint = instruction.memory.filter((use) => use.access === "read" && use.segment !== "SS");
    if (footprint.length === 1 && footprint[0].size === 4) {
      const use = footprint[0];
      const names = ["eax", "ecx", "edx", "ebx", "esp", "ebp", "esi", "edi"];
      const value = (name: string | null) => (name === null ? 0 : names.indexOf(name) < 0 ? null : stop.context.general(names.indexOf(name)));
      const base = value(use.base);
      const index = value(use.index);
      if (base === null || index === null || use.segment === "FS" || use.segment === "GS") return null;
      return this.u32(base + index * use.scale + use.displacement);
    }
    const through = instruction.registers.filter((use) => use.access === "read" && use.name !== "esp" && use.name.length === 3 && use.name[0] === "e");
    const names = ["eax", "ecx", "edx", "ebx", "esp", "ebp", "esi", "edi"];
    return through.length === 1 && !instruction.memory.some((use) => use.access === "read" && use.segment !== "SS") ? stop.context.general(names.indexOf(through[0].name)) : null;
  }

  // follows "jmp target" and "jmp [address]" stubs to the code they lead to
  private async throughJumps(address: Address): Promise<Address> {
    for (let hops = 0; hops < 4 && !this.host.modules.hasLines(address); hops++) {
      const read = await this.host.read(address, 15);
      if (read.unreadable[0]) break;
      let length = 0;
      while (length < 15 && !read.unreadable[length]) length++;
      const instruction = this.host.decoder.decode(read.bytes.subarray(0, length), address);
      if (!instruction || (instruction.flow !== "jump" && instruction.flow !== "indirect-jump")) break;
      const next = instruction.target !== null ? instruction.target : instruction.memory.length === 1 && !instruction.memory[0].base && !instruction.memory[0].index ? await this.u32(instruction.memory[0].displacement) : null;
      if (next === null) break;
      address = next;
    }
    return address;
  }

  private async leadsToLines(instruction: Instruction): Promise<boolean> {
    if (instruction.flow !== "jump" && instruction.flow !== "indirect-jump") return false;
    return this.host.modules.hasLines(await this.throughJumps(instruction.address));
  }
}
