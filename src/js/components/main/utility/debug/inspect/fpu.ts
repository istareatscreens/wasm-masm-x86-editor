import { ContextRecord } from "../engine/contextRecord";
import { hexDigits } from "../format/numbers";
import { parseReal10, real10Class, real10FromNumber, real10Text } from "../format/real";
import { Target, ValueError, ValueNode, ValueParser } from "./values";

export const FPU_TAG_NAMES = ["valid", "zero", "special", "empty"];
const EMPTY = 3;
const PRECISION = ["24 bits (REAL4)", "reserved", "53 bits (REAL8)", "64 bits (REAL10)"];
const ROUNDING = ["to nearest", "down", "up", "toward zero"];
const EXCEPTIONS = ["invalid operation", "denormal operand", "divide by zero", "overflow", "underflow", "precision"];

const hex16 = (value: number) => hexDigits(BigInt(value), 2);
const fixed = (name: string, text: () => string, note?: string): ValueNode => ({ name, text, note });

// the names of the set bits among the six exception bits, from `shift`
function exceptionsOf(word: number, shift: number): string {
  const set = EXCEPTIONS.filter((_, bit) => (word >> (shift + bit)) & 1);
  return set.length ? set.join(", ") : "none";
}

// the tag a value should carry once it is in a register
function tagFor(bytes: Uint8Array): number {
  const kind = real10Class(bytes);
  return kind === "zero" ? 1 : kind === "normal" ? 0 : 2;
}

export function stText(context: ContextRecord, st: number): string {
  const physical = context.physicalOf(st);
  return context.fpuTag(physical) === EMPTY ? "empty" : real10Text(context.fpuRegister(physical));
}

// What the user typed for a REAL10: decimal text is taken exactly, anything else through the evaluator.
export async function real10Of(text: string, parse: ValueParser): Promise<Uint8Array> {
  const exact = parseReal10(text);
  if (exact) return exact;
  const parsed = await parse(text);
  if (parsed.real !== null) return real10FromNumber(parsed.real);
  if (parsed.integer !== null) return parseReal10(parsed.integer.toString());
  throw new ValueError("A number is needed here");
}

function stNode(target: Target, parse: ValueParser, st: number): ValueNode {
  const physical = () => target.context().physicalOf(st);
  return {
    name: "ST(" + st + ")",
    type: "REAL10",
    expression: "ST(" + st + ")",
    text: () => stText(target.context(), st),
    note: "",
    named: 2,
    children: async () => [
      fixed("tag", () => FPU_TAG_NAMES[target.context().fpuTag(physical())]),
      fixed("bytes", () => Array.from(target.context().fpuRegister(physical()), (byte) => ("0" + byte.toString(16).toUpperCase()).slice(-2)).reverse().join(" "), "R" + physical() + ", sign and exponent first"),
    ],
    async assign(typed: string) {
      const bytes = await real10Of(typed, parse);
      const context = target.context().clone();
      context.setFpuRegister(physical(), bytes);
      context.setFpuTag(physical(), tagFor(bytes));
      await target.setContext(context);
    },
  };
}

function controlNodes(target: Target): ValueNode[] {
  const word = () => target.context().fpuControl;
  return [
    fixed("precision", () => PRECISION[(word() >> 8) & 3]),
    fixed("rounding", () => ROUNDING[(word() >> 10) & 3]),
    fixed("masked", () => exceptionsOf(word(), 0), "the exceptions that do not interrupt the program"),
  ];
}

function statusNodes(target: Target): ValueNode[] {
  const word = () => target.context().fpuStatus;
  const bit = (n: number) => String((word() >> n) & 1);
  return [
    fixed("TOP", () => String(target.context().fpuTop), "the physical register that is ST(0)"),
    fixed("C3 C2 C1 C0", () => [14, 10, 9, 8].map(bit).join(" "), "the condition codes a comparison sets"),
    fixed("exceptions", () => exceptionsOf(word(), 0)),
    fixed("stack fault", () => bit(6)),
    fixed("busy", () => bit(15)),
  ];
}

function tagNodes(target: Target): ValueNode[] {
  return [0, 1, 2, 3, 4, 5, 6, 7].map((physical) => fixed("R" + physical, () => FPU_TAG_NAMES[target.context().fpuTag(physical)]));
}

export function fpuNodes(target: Target, parse: ValueParser): ValueNode[] {
  const nodes: ValueNode[] = [0, 1, 2, 3, 4, 5, 6, 7].map((st) => stNode(target, parse, st));
  nodes.push({ name: "CTRL", text: () => hex16(target.context().fpuControl), note: "control word", named: 3, children: async () => controlNodes(target) });
  nodes.push({ name: "STAT", text: () => hex16(target.context().fpuStatus), note: "status word", named: 5, children: async () => statusNodes(target) });
  nodes.push({ name: "TAGS", text: () => hex16(target.context().fpuTags), note: "tag word", named: 8, children: async () => tagNodes(target) });
  return nodes;
}
