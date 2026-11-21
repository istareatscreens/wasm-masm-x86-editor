import { ContextRecord, GENERAL_REGISTERS, SEGMENT_REGISTERS } from "../engine/contextRecord";
import { binary, character, decimal, fits, hexDigits, masmHex, octal } from "../format/numbers";
import { IntegerParser, Target, ValueError, ValueNode } from "./values";

export interface FlagInfo {
  name: string;
  bit: number;
  title: string;
  visualStudio: [string, string] | null; // its mnemonic there when clear and when set
}

export const FLAGS: FlagInfo[] = [
  { name: "CF", bit: 0, title: "Carry flag", visualStudio: ["NC", "CY"] },
  { name: "PF", bit: 2, title: "Parity flag", visualStudio: ["PO", "PE"] },
  { name: "AF", bit: 4, title: "Auxiliary carry flag", visualStudio: ["NA", "AC"] },
  { name: "ZF", bit: 6, title: "Zero flag", visualStudio: ["NZ", "ZR"] },
  { name: "SF", bit: 7, title: "Sign flag", visualStudio: ["PL", "NG"] },
  { name: "TF", bit: 8, title: "Trap flag", visualStudio: null },
  { name: "IF", bit: 9, title: "Interrupt enable flag", visualStudio: ["DI", "EI"] },
  { name: "DF", bit: 10, title: "Direction flag", visualStudio: ["UP", "DN"] },
  { name: "OF", bit: 11, title: "Overflow flag", visualStudio: ["NV", "OV"] },
];

// the order VC6's Registers window lists them in
export const GENERAL_ORDER = ["eax", "ebx", "ecx", "edx", "esi", "edi", "ebp", "esp"];

interface Place {
  kind: "general" | "eip" | "eflags" | "flag" | "segment";
  index: number; // a general or segment register's number, a flag's bit
  shift: number;
  size: number; // bytes; 0 for a flag
}

const PLACES: { [name: string]: Place } = { eip: { kind: "eip", index: 0, shift: 0, size: 4 }, efl: { kind: "eflags", index: 0, shift: 0, size: 4 }, eflags: { kind: "eflags", index: 0, shift: 0, size: 4 } };
GENERAL_REGISTERS.forEach((name, index) => {
  PLACES[name] = { kind: "general", index, shift: 0, size: 4 };
  PLACES[name.slice(1)] = { kind: "general", index, shift: 0, size: 2 };
  if (index < 4) {
    PLACES[name[1] + "l"] = { kind: "general", index, shift: 0, size: 1 };
    PLACES[name[1] + "h"] = { kind: "general", index, shift: 8, size: 1 };
  }
});
SEGMENT_REGISTERS.forEach((name, index) => (PLACES[name] = { kind: "segment", index, shift: 0, size: 2 }));
FLAGS.forEach((flag) => (PLACES[flag.name.toLowerCase()] = { kind: "flag", index: flag.bit, shift: 0, size: 0 }));

export function isIntegerRegister(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(PLACES, name.toLowerCase());
}

// A register's value and its size in bytes (0 for a flag); null for a name that is not an integer register.
export function readRegister(context: ContextRecord, name: string): { value: bigint; size: number } | null {
  const place = isIntegerRegister(name) ? PLACES[name.toLowerCase()] : null;
  if (!place) return null;
  switch (place.kind) {
    case "general":
      return { value: BigInt((context.general(place.index) >>> place.shift) & (place.size === 4 ? 0xffffffff : place.size === 2 ? 0xffff : 0xff)) & BigInt(0xffffffff), size: place.size };
    case "eip":
      return { value: BigInt(context.eip), size: 4 };
    case "eflags":
      return { value: BigInt(context.eflags), size: 4 };
    case "flag":
      return { value: BigInt((context.eflags >>> place.index) & 1), size: 0 };
    default:
      return { value: BigInt(context.segment(place.index)), size: 2 };
  }
}

// Changes the record; throws ValueError for a value that does not fit, or a register that cannot be set.
export function writeRegister(context: ContextRecord, name: string, value: bigint, writableFlags: number): void {
  const place = isIntegerRegister(name) ? PLACES[name.toLowerCase()] : null;
  const shown = name.toUpperCase();
  if (!place) throw new ValueError("'" + name + "' is not a register");
  if (place.kind === "segment") throw new ValueError(shown + " cannot be changed: segment registers belong to the system");
  if (place.kind === "flag") {
    if (value !== BigInt(0) && value !== BigInt(1)) throw new ValueError("A flag is 0 or 1");
    if (!((writableFlags >>> place.index) & 1)) throw new ValueError(shown + " cannot be changed: " + (shown === "TF" ? "the debugger steps with it" : "it belongs to the system"));
    context.eflags = (context.eflags & ~(1 << place.index)) | (Number(value) << place.index);
    return;
  }
  if (!fits(value, place.size)) throw new ValueError("The value does not fit " + shown + " (" + place.size * 8 + " bits)");
  const bits = Number(BigInt.asUintN(place.size * 8, value));
  if (place.kind === "eip") context.eip = bits;
  else if (place.kind === "eflags") context.eflags = (context.eflags & ~writableFlags) | (bits & writableFlags);
  else {
    const mask = (place.size === 4 ? 0xffffffff : place.size === 2 ? 0xffff : 0xff) << place.shift;
    context.setGeneral(place.index, (context.general(place.index) & ~mask) | ((bits << place.shift) & mask));
  }
}

function integerNode(target: Target, parse: IntegerParser, name: string, text: (value: bigint, size: number) => string, note?: string): ValueNode {
  const current = () => readRegister(target.context(), name);
  return {
    name: name.toUpperCase(),
    text: () => text(current().value, current().size),
    expression: name.toUpperCase(),
    note,
    async assign(typed: string) {
      const context = target.context().clone();
      writeRegister(context, name, await parse(typed), target.writableFlags());
      await target.setContext(context);
    },
  };
}

const withCharacter = (value: bigint, size: number) => masmHex(value, size) + (character(Number(value)) ? " (" + character(Number(value)) + ")" : "");
const fixed = (name: string, text: () => string): ValueNode => ({ name, text });

// EAX's parts and every way of writing it: AX, AH, AL, signed, unsigned, octal, binary, its character
function formsOf(target: Target, parse: IntegerParser, name: string): ValueNode[] {
  const value = () => readRegister(target.context(), name).value;
  const parts = [name.slice(1)].concat(GENERAL_REGISTERS.indexOf(name) < 4 ? [name[1] + "h", name[1] + "l"] : []);
  const nodes = parts.map((part) => integerNode(target, parse, part, part.length === 2 && /[hl]$/.test(part) ? withCharacter : masmHex));
  nodes.push(fixed("signed", () => decimal(value(), 4, true)), fixed("unsigned", () => decimal(value(), 4, false)), fixed("octal", () => octal(value(), 4)), fixed("binary", () => binary(value(), 4)));
  return nodes;
}

function flagNote(flag: FlagInfo): string {
  return flag.title + (flag.visualStudio ? " (" + flag.visualStudio[0] + "/" + flag.visualStudio[1] + " in Visual Studio)" : "");
}

export function flagNodes(target: Target, parse: IntegerParser): ValueNode[] {
  return FLAGS.map((flag) => integerNode(target, parse, flag.name, (value) => String(value), flagNote(flag)));
}

export function integerRegisterNodes(target: Target, parse: IntegerParser): ValueNode[] {
  const eight = (value: bigint) => hexDigits(value, 4);
  const nodes: ValueNode[] = GENERAL_ORDER.map((name) => ({ ...integerNode(target, parse, name, eight), named: formsOf(target, parse, name).length, children: async () => formsOf(target, parse, name) }));
  nodes.push(integerNode(target, parse, "eip", eight));
  nodes.push({ ...integerNode(target, parse, "efl", eight), name: "EFLAGS", named: FLAGS.length, children: async () => flagNodes(target, parse) });
  const segments = () => SEGMENT_REGISTERS.map((name) => integerNode(target, parse, name, (value) => hexDigits(value, 2))).concat([fixed("FS base", () => hexDigits(BigInt(target.context().fsBase), 4))]);
  nodes.push({ name: "Segments", text: () => "", named: SEGMENT_REGISTERS.length + 1, children: async () => segments() });
  return nodes;
}
