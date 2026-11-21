export type Flow = "next" | "jump" | "indirect-jump" | "conditional" | "return" | "call" | "indirect-call" | "interrupt" | "exception";
export type Access = "none" | "read" | "write" | "read-write" | "maybe-read" | "maybe-write" | "read-maybe-write";

export interface MemoryUse {
  segment: string; // DS, SS, ES, FS, ...
  base: string | null; // a register's name, lower case
  index: string | null;
  scale: number;
  displacement: number;
  size: number; // bytes; 0 when the instruction does not say (a REP's range, an image of unknown size)
  kind: string; // iced's name for what is there: UInt32, Float80, FpuState108, ...
  access: Access;
}

export interface RegisterUse {
  name: string; // lower case: eax, ax, al, st0, xmm3, ...
  access: Access;
}

export interface Instruction {
  address: number;
  length: number;
  text: string;
  mnemonic: string; // lower case
  flow: Flow;
  target: number | null; // where a direct jump or call goes
  invalid: boolean;
  repeats: boolean; // a REP, REPE or REPNE prefix
  string: boolean; // MOVS, STOS, CMPS, SCAS, LODS, INS, OUTS
  stackChange: number; // what it adds to ESP, when that is fixed
  memory: MemoryUse[];
  registers: RegisterUse[];
}

const FLOWS: Flow[] = ["next", "jump", "indirect-jump", "conditional", "return", "call", "indirect-call", "interrupt", "exception", "exception"];
const ACCESSES: Access[] = ["none", "read", "maybe-read", "write", "maybe-write", "read-write", "read-maybe-write", "none"];
const MAX_LENGTH = 15;
const KEPT = 4096; // decoded instructions kept, by address

export function writes(access: Access): boolean {
  return access === "write" || access === "read-write" || access === "maybe-write" || access === "read-maybe-write";
}

export function reads(access: Access): boolean {
  return access === "read" || access === "read-write" || access === "maybe-read" || access === "read-maybe-write";
}

function sameBytes(kept: Uint8Array, bytes: Uint8Array, offset: number): boolean {
  if (offset + kept.length > bytes.length) return false;
  for (let i = 0; i < kept.length; i++) if (kept[i] !== bytes[offset + i]) return false;
  return true;
}

export class Decoder {
  private readonly formatter: any;
  private readonly factory: any;

  // `iced`: the iced-x86 namespace, with its WebAssembly module already started
  constructor(private readonly iced: any) {
    this.formatter = new iced.Formatter(iced.FormatterSyntax.Masm);
    this.formatter.spaceAfterOperandSeparator = true;
    this.factory = new iced.InstructionInfoFactory();
  }

  private name(table: any, value: number): string | null {
    const text = table[value];
    return !text || text === "None" ? null : String(text).toLowerCase();
  }

  // The instruction at the start of `bytes`, which are at `address`; null when there are no bytes.
  decode(bytes: Uint8Array, address: number): Instruction | null {
    return this.decodeAll(bytes.subarray(0, MAX_LENGTH), address, 1)[0] || null;
  }

  // Instructions one after another from the start of `bytes`: at most `limit`, and only whole ones. An address
  // decoded before, with the same bytes, gives the same instruction again (shared: callers never change one).
  decodeAll(bytes: Uint8Array, address: number, limit = Infinity): Instruction[] {
    const iced = this.iced;
    const instructions: Instruction[] = [];
    let decoder: any = null;
    try {
      for (let offset = 0; offset < bytes.length && instructions.length < limit; ) {
        const at = (address + offset) >>> 0;
        const kept = this.kept.get(at);
        if (kept && sameBytes(kept.bytes, bytes, offset)) {
          instructions.push(kept.instruction);
          offset += kept.bytes.length;
          continue;
        }
        if (!decoder) decoder = new iced.Decoder(32, bytes, iced.DecoderOptions.None);
        decoder.position = offset;
        decoder.ip = BigInt(at);
        const raw = decoder.decode();
        try {
          if (decoder.lastError === iced.DecoderError.NoMoreBytes) break;
          const instruction = this.describe(raw, decoder.lastError !== iced.DecoderError.None);
          this.keep(at, bytes.slice(offset, offset + raw.length), instruction);
          instructions.push(instruction);
          offset += raw.length;
        } finally {
          raw.free();
        }
      }
    } finally {
      if (decoder) decoder.free();
    }
    return instructions;
  }

  private readonly kept = new Map<number, { bytes: Uint8Array; instruction: Instruction }>();

  private keep(address: number, bytes: Uint8Array, instruction: Instruction): void {
    if (this.kept.size >= KEPT) this.kept.delete(this.kept.keys().next().value as number);
    this.kept.set(address, { bytes, instruction });
  }

  private describe(raw: any, invalid: boolean): Instruction {
    const iced = this.iced;
    const flow = FLOWS[raw.flowControl] || "next";
    const instruction: Instruction = {
      address: Number(raw.ip) >>> 0,
      length: raw.length,
      text: invalid ? "(bad)" : this.formatter.format(raw),
      mnemonic: (this.name(iced.Mnemonic, raw.mnemonic) || "").toLowerCase(),
      flow,
      target: (flow === "jump" || flow === "conditional" || flow === "call") && !invalid && raw.op0Kind === iced.OpKind.NearBranch32 ? Number(raw.nearBranchTarget) >>> 0 : null,
      invalid,
      repeats: raw.hasRepPrefix || raw.hasRepePrefix || raw.hasRepnePrefix,
      string: raw.isStringInstruction,
      stackChange: raw.stackPointerIncrement,
      memory: [],
      registers: [],
    };
    if (invalid) return instruction;
    const info = this.factory.info(raw);
    try {
      for (const used of info.usedMemory()) {
        instruction.memory.push({
          segment: (this.name(iced.Register, used.segment) || "ds").toUpperCase(),
          base: this.name(iced.Register, used.base),
          index: this.name(iced.Register, used.index),
          scale: used.scale,
          displacement: Number(used.displacement) >>> 0,
          size: iced.MemorySizeExt.size(used.memorySize),
          kind: String(iced.MemorySize[used.memorySize]),
          access: ACCESSES[used.access] || "none",
        });
        used.free();
      }
      for (const used of info.usedRegisters()) {
        const name = this.name(iced.Register, used.register);
        if (name) instruction.registers.push({ name, access: ACCESSES[used.access] || "none" });
        used.free();
      }
    } finally {
      info.free();
    }
    return instruction;
  }
}
