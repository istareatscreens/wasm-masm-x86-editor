// The memory an instruction is about to write, worked out from its operands and the registers before it runs:
// what Step Back saves so that it can put the bytes back. Anything not certain is "unknown", and is never undone.
import { ContextRecord, GENERAL_REGISTERS } from "../engine/contextRecord";
import { Instruction, MemoryUse, writes } from "./decoder";

export interface WriteRange {
  address: number;
  length: number;
}

export type Footprint = { ranges: WriteRange[] } | { unknown: string };

const MAX_RANGE = 0x10000;
const SPACE = 0x100000000;
const STRING_WIDTH: { [mnemonic: string]: number } = { movsb: 1, movsw: 2, movsd: 4, stosb: 1, stosw: 2, stosd: 4 };
const BIT_STRING = ["bt", "bts", "btr", "btc"];
const DF = 0x400;

function register(context: ContextRecord, name: string | null): number | null {
  if (name === null) return 0;
  const index = GENERAL_REGISTERS.indexOf(name);
  return index < 0 ? null : context.general(index);
}

function segmentBase(context: ContextRecord, segment: string): number {
  return segment === "FS" ? context.fsBase : segment === "GS" ? context.gsBase : 0;
}

function addressOf(context: ContextRecord, use: MemoryUse): number | null {
  const base = register(context, use.base);
  const index = register(context, use.index);
  if (base === null || index === null) return null; // a 16-bit or vector register: not an address this code works out
  return (segmentBase(context, use.segment) + base + index * use.scale + use.displacement) % SPACE;
}

export function writeFootprint(instruction: Instruction, context: ContextRecord): Footprint {
  if (instruction.invalid) return { unknown: "an instruction that cannot be decoded" };
  if (instruction.flow === "interrupt" || instruction.flow === "exception") return { unknown: "a system call" };
  if (instruction.mnemonic === "sysenter" || instruction.mnemonic === "syscall") return { unknown: "a system call" };
  const ranges: WriteRange[] = [];
  for (const use of instruction.memory) {
    if (!writes(use.access)) continue;
    const address = addressOf(context, use);
    if (address === null) return { unknown: "an address through a register this debugger does not follow" };
    let start = address;
    let length = use.size;
    if (instruction.repeats && instruction.string) {
      const width = STRING_WIDTH[instruction.mnemonic];
      if (!width) return { unknown: "a repeated " + instruction.mnemonic };
      const count = context.general(1);
      length = count * width;
      // with the direction flag set the string runs downwards from EDI
      if (context.eflags & DF) start = (address - (count - 1) * width + SPACE) % SPACE;
    } else if (BIT_STRING.indexOf(instruction.mnemonic) >= 0 && instruction.registers.some((used) => used.access === "read" && GENERAL_REGISTERS.indexOf(used.name) >= 0 && used.name !== use.base && used.name !== use.index)) {
      return { unknown: "a bit in a string of bits" }; // the register picks a bit that may lie outside the operand
    }
    if (!length) {
      if (instruction.repeats && instruction.string) continue; // a count of zero writes nothing
      return { unknown: "a write of unknown size" };
    }
    if (length > MAX_RANGE) return { unknown: "a write of more than 64 KiB" };
    if (start + length > SPACE) return { unknown: "a write past the end of memory" };
    ranges.push({ address: start, length });
  }
  return { ranges };
}
