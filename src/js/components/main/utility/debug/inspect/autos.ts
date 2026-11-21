// Autos: every register and memory operand the current statement and the one before it use, named as the
// source names it where the debug information can say.
import { Decoder, MemoryUse } from "../disasm/decoder";
import { GENERAL_REGISTERS } from "../engine/contextRecord";
import { Address, MemoryRead } from "../engine/engine";
import { Modules } from "../session/modules";
import { Frame } from "../session/stackWalker";

const SIZE_NAMES: { [size: number]: string } = { 1: "BYTE", 2: "WORD", 4: "DWORD", 8: "QWORD", 10: "TBYTE" };
const PARTS: { [name: string]: string } = {};
GENERAL_REGISTERS.forEach((name, index) => {
  PARTS[name] = PARTS[name.slice(1)] = name;
  if (index < 4) PARTS[name[1] + "l"] = PARTS[name[1] + "h"] = name;
});
const MAX_INSTRUCTIONS = 64;

type Read = (address: Address, length: number) => Promise<MemoryRead>;

// 404000h as its symbol, when it is exactly a data symbol of the frame's own module
function symbolAt(modules: Modules, address: Address): string | null {
  const module = modules.moduleAt(address);
  const info = module && module.program && module.program.info;
  if (!info) return null;
  const found = info.data.filter((symbol) => module.base + symbol.rva === address)[0];
  return found ? found.name : null;
}

// A memory operand as an expression: its symbol or its LOCAL's name when it has one, else SIZE PTR [address].
export function operandExpression(use: MemoryUse, modules: Modules, frame: Frame | null): string | null {
  if (!SIZE_NAMES[use.size] || use.segment === "FS" || use.segment === "GS" || use.segment === "ES") return null;
  if (!use.base && !use.index) return symbolAt(modules, use.displacement) || SIZE_NAMES[use.size] + " PTR [" + use.displacement.toString(16).toUpperCase().replace(/^(?=[A-F])/, "0") + "h]";
  const offset = use.displacement | 0;
  const procedure = frame && frame.location && frame.location.procedure;
  if (use.base === "ebp" && !use.index && procedure && frame.framed) {
    const local = procedure.locals.filter((entry) => entry.offset === offset)[0];
    if (local) return local.name;
  }
  if (use.base === "esp" && !use.index) return null; // the stack's own traffic: pushes, calls and returns
  const parts = [use.base, use.index ? use.index + (use.scale > 1 ? "*" + use.scale : "") : null].filter((part) => part).join("+");
  return SIZE_NAMES[use.size] + " PTR [" + parts + (offset > 0 ? "+" + offset : offset < 0 ? "-" + -offset : "") + "]";
}

export async function autoExpressions(decoder: Decoder, read: Read, modules: Modules, frame: Frame): Promise<string[]> {
  const location = frame.location;
  if (!location || !location.statement || !location.module.program.lines) return [];
  const base = location.module.base;
  const current = location.statement;
  const before = location.module.program.lines.statementAt(current.rva - 1);
  const statements = [current].concat(before && before.procedure === current.procedure ? [before] : []);
  const seen: string[] = [];
  const add = (expression: string | null) => {
    if (expression && seen.indexOf(expression) < 0) seen.push(expression);
  };
  for (const statement of statements) {
    const bytes = await read(base + statement.rva, statement.end - statement.rva);
    if (bytes.unreadable.some((u) => u)) continue;
    for (const instruction of decoder.decodeAll(bytes.bytes, base + statement.rva, MAX_INSTRUCTIONS)) {
      if (instruction.invalid) break;
      for (const use of instruction.registers) {
        const whole = PARTS[use.name];
        if (whole && whole !== "esp" && whole !== "ebp") add(whole.toUpperCase());
      }
      for (const use of instruction.memory) add(operandExpression(use, modules, frame));
    }
  }
  return seen;
}
