// In the program's own procedures the return address is found exactly: through EBP once the frame is set up,
// by adding up the prologue's pushes before that, at [ESP] on a RET. Elsewhere the EBP chain is followed when it
// holds together, and otherwise the stack is searched for an address that a CALL left there.
import { Decoder, Instruction } from "../disasm/decoder";
import { ContextRecord } from "../engine/contextRecord";
import { Address, MemoryRead } from "../engine/engine";
import { CodeLocation, Modules } from "./modules";

export interface Frame {
  eip: Address; // the innermost frame: where the thread is; a caller: where it returns to
  esp: Address; // ESP once control is in this frame
  ebp: Address; // EBP as this frame has it
  framed: boolean; // EBP is this procedure's own frame pointer: its parameters and LOCALs can be read
  returnSlot: Address | null; // where its return address is kept; null when that is not known for certain
  location: CodeLocation | null; // null for code without debug information; a caller's is its CALL's
}

export interface CallStack {
  frames: Frame[];
  truncated: boolean; // more frames exist than are listed
}

type Read = (address: Address, length: number) => Promise<MemoryRead>;
export type Peek = (address: Address, length: number) => MemoryRead | null; // bytes at hand, without waiting

export const MAX_FRAMES = 256;
const SCAN_LIMIT = 0x4000; // how far up the stack a return address is looked for
const STACK_SPAN = 0x100000; // an EBP further than this above ESP is not a frame pointer
const CALL_LENGTHS = [5, 2, 3, 6, 7]; // call rel32, then the indirect forms
const MAX_CALL = 7;

interface Caller {
  eip: Address;
  esp: Address;
  ebp: Address;
  slot: Address;
  certain: boolean;
}

export class StackWalker {
  constructor(private readonly modules: Modules, private readonly read: Read, private readonly decoder: Decoder, private readonly peek: Peek = () => null) {}

  async walk(context: ContextRecord, limit = MAX_FRAMES): Promise<CallStack> {
    const frames: Frame[] = [];
    let at = { eip: context.eip, esp: context.esp, ebp: context.ebp };
    for (;;) {
      // A caller is inside the CALL it made: the address after it can be the next line, or the next procedure.
      const innermost = frames.length === 0;
      const location = this.modules.locate(innermost ? at.eip : at.eip - 1);
      const frame: Frame = { eip: at.eip, esp: at.esp, ebp: at.ebp, framed: false, returnSlot: null, location };
      frames.push(frame);
      const caller = location && location.procedure ? await this.fromProcedure(frame, innermost) : await this.fromOtherCode(frame);
      if (!caller || caller.eip === 0 || caller.esp <= frame.esp) return { frames, truncated: false };
      if (frames.length >= limit) return { frames, truncated: true };
      frame.returnSlot = caller.certain ? caller.slot : null;
      at = caller;
    }
  }

  private async u32(address: Address): Promise<number | null> {
    const read = this.peek(address >>> 0, 4) || (await this.read(address >>> 0, 4));
    if (read.unreadable[0] || read.unreadable[3]) return null;
    return (read.bytes[0] | (read.bytes[1] << 8) | (read.bytes[2] << 16) | (read.bytes[3] << 24)) >>> 0;
  }

  private async instructionAt(address: Address): Promise<Instruction | null> {
    const read = this.peek(address, 15) || (await this.read(address, 15));
    let length = 0;
    while (length < 15 && !read.unreadable[length]) length++;
    return this.decoder.decode(read.bytes.subarray(0, length), address);
  }

  // The CALL that ends at `address`, when one does.
  async callBefore(address: Address): Promise<Instruction | null> {
    const known = this.callBeforeKnown(address);
    return known !== undefined ? known : this.callIn(await this.read(address - MAX_CALL, MAX_CALL), address);
  }

  // the same from bytes at hand; undefined when they are not
  private callBeforeKnown(address: Address): Instruction | null | undefined {
    const read = this.peek(address - MAX_CALL, MAX_CALL);
    return read ? this.callIn(read, address) : undefined;
  }

  // the CALL that ends at `address`, in `read`: the MAX_CALL bytes before it
  private callIn(read: MemoryRead, address: Address): Instruction | null {
    for (const length of CALL_LENGTHS) {
      const from = MAX_CALL - length;
      if (read.unreadable[from] || read.unreadable[MAX_CALL - 1]) continue;
      const instruction = this.decoder.decode(read.bytes.subarray(from), address - length);
      if (instruction && !instruction.invalid && instruction.length === length && (instruction.flow === "call" || instruction.flow === "indirect-call")) return instruction;
    }
    return null;
  }

  private async callerAt(slot: Address, ebp: Address): Promise<Caller | null> {
    const eip = await this.u32(slot);
    return eip === null ? null : { eip, esp: slot + 4, ebp, slot, certain: true };
  }

  // A procedure the debug information describes. `innermost`: the thread is at frame.eip, not returning to it.
  private async fromProcedure(frame: Frame, innermost: boolean): Promise<Caller | null> {
    const { module, procedure } = frame.location;
    const start = module.base + procedure.rva;
    const offset = frame.eip - start;
    const head = await this.read(start, 3);
    const standard = !head.unreadable[2] && head.bytes[0] === 0x55 && head.bytes[1] === 0x8b && head.bytes[2] === 0xec; // push ebp / mov ebp, esp
    const here = innermost ? await this.instructionAt(frame.eip) : null;
    const returning = !!here && here.flow === "return";
    if (standard && offset >= 3 && !returning) {
      const saved = await this.u32(frame.ebp);
      if (saved === null) return null;
      frame.framed = true;
      return this.callerAt(frame.ebp + 4, saved);
    }
    if (returning) return this.callerAt(frame.esp, frame.ebp);
    if (standard) {
      // inside "push ebp / mov ebp, esp": the caller's EBP is in EBP still, or was just pushed
      return offset === 0 ? this.callerAt(frame.esp, frame.ebp) : this.callerAt(frame.esp + 4, (await this.u32(frame.esp)) || 0);
    }
    // No frame pointer. When the code from the procedure's start to here only pushes and pops, ESP at the
    // entry is known exactly.
    const body = this.peek(start, offset) || (await this.read(start, offset));
    let pushed = 0;
    let straight = !body.unreadable.some((u) => u);
    if (straight) {
      for (const instruction of this.decoder.decodeAll(body.bytes, start)) {
        if (instruction.invalid || instruction.flow !== "next" || this.changesEspFreely(instruction)) straight = false;
        pushed -= instruction.stackChange;
      }
    }
    if (straight) return this.callerAt(frame.esp + pushed, frame.ebp);
    return this.search(frame, start, frame.esp + SCAN_LIMIT);
  }

  // an instruction that sets ESP to something its bytes do not say
  private changesEspFreely(instruction: Instruction): boolean {
    return instruction.stackChange === 0 && instruction.registers.some((use) => use.name === "esp" && (use.access === "write" || use.access === "read-write"));
  }

  // Code without debug information: a library routine linked into the program, or Windows.
  private async fromOtherCode(frame: Frame): Promise<Caller | null> {
    // on a RET, and on an import's jump (which a CALL has just reached), the return address is at [ESP]
    const here = await this.instructionAt(frame.eip);
    if (here && (here.flow === "return" || (await this.modules.importAt(frame.eip)) !== null)) {
      const direct = await this.callerAt(frame.esp, frame.ebp);
      if (direct && (await this.callBefore(direct.eip))) return direct;
    }
    let chained: Caller | null = null;
    if (frame.ebp >= frame.esp && frame.ebp - frame.esp < STACK_SPAN) {
      const saved = await this.u32(frame.ebp);
      const back = await this.u32(frame.ebp + 4);
      if (saved !== null && back !== null && (saved === 0 || saved > frame.ebp) && (await this.callBefore(back))) {
        chained = { eip: back, esp: frame.ebp + 8, ebp: saved, slot: frame.ebp + 4, certain: true };
      }
    }
    const routine = this.routineAt(frame.eip);
    if (routine !== null) {
      // A linked-in routine without a frame of its own leaves no trace in the EBP chain. Every such routine
      // has a name, so its caller is the return address of a CALL to it, nearer than the chain's next frame.
      const nearer = await this.search(frame, routine, chained ? chained.slot : frame.esp + SCAN_LIMIT);
      if (nearer && (nearer.certain || !chained)) return nearer;
    }
    return chained || (routine === null ? this.search(frame, null, frame.esp + SCAN_LIMIT) : null);
  }

  // where the named routine that holds `address` starts, in a module built here; null elsewhere
  private routineAt(address: Address): Address | null {
    const module = this.modules.moduleAt(address);
    const info = module && module.program && module.program.info;
    if (!info) return null;
    const rva = address - module.base;
    let best = -1;
    for (const symbol of info.publics) if (symbol.rva <= rva && symbol.rva > best) best = symbol.rva;
    return best < 0 ? null : module.base + best;
  }

  // Looks up the stack for a return address: a value that a CALL precedes. With `target`, a direct CALL must
  // go there; an indirect one is taken when no direct one is found, and is not certain.
  private async search(frame: Frame, target: Address | null, end: Address): Promise<Caller | null> {
    let indirect: Caller | null = null;
    const span = Math.max(0, Math.min(end, 0x100000000) - frame.esp);
    const stack = await this.read(frame.esp >>> 0, span); // one read for the whole range
    for (let at = 0; at + 4 <= span; at += 4) {
      if (stack.unreadable[at] || stack.unreadable[at + 3]) break;
      const value = (stack.bytes[at] | (stack.bytes[at + 1] << 8) | (stack.bytes[at + 2] << 16) | (stack.bytes[at + 3] << 24)) >>> 0;
      const slot = frame.esp + at;
      if (!value || !this.modules.moduleAt(value)) continue;
      let call = this.callBeforeKnown(value);
      if (call === undefined) call = await this.callBefore(value);
      if (!call) continue;
      const found: Caller = { eip: value, esp: slot + 4, ebp: frame.ebp, slot, certain: true };
      if (call.flow === "call" && (target === null || call.target === target || (await this.jumpsTo(call.target, target)))) return found;
      if (call.flow === "indirect-call" && !indirect) indirect = { ...found, certain: false };
    }
    return indirect;
  }

  // a call to "jmp target", as an incremental link or an import table leaves it
  private async jumpsTo(address: Address | null, target: Address): Promise<boolean> {
    const instruction = address === null ? null : await this.instructionAt(address);
    if (!instruction) return false;
    if (instruction.flow === "jump") return instruction.target === target;
    if (instruction.flow !== "indirect-jump" || instruction.memory.length !== 1 || instruction.memory[0].base || instruction.memory[0].index) return false;
    return (await this.u32(instruction.memory[0].displacement)) === target;
  }
}
