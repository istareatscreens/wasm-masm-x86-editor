import { bigOf, bytesOf, fits, hexDigits } from "../format/numbers";
import { real4Text, real8Text, realBytes, realOf } from "../format/real";
import { Target, ValueError, ValueNode, ValueParser } from "./values";

interface View {
  name: string;
  size: number;
  real: boolean;
}

export const XMM_VIEWS: View[] = [
  { name: "floats", size: 4, real: true },
  { name: "doubles", size: 8, real: true },
  { name: "bytes", size: 1, real: false },
  { name: "words", size: 2, real: false },
  { name: "dwords", size: 4, real: false },
  { name: "qwords", size: 8, real: false },
];
const ROUNDING = ["to nearest", "down", "up", "toward zero"];
const EXCEPTIONS = ["invalid operation", "denormal operand", "divide by zero", "overflow", "underflow", "precision"];

function elementText(bytes: Uint8Array, view: View): string {
  if (view.real) return view.size === 4 ? real4Text(realOf(bytes)) : real8Text(realOf(bytes));
  return hexDigits(bigOf(bytes), view.size);
}

// {1.5, 2, -0.25, 8}: the elements from the lowest address up
export function vectorText(bytes: Uint8Array, view: View): string {
  const parts: string[] = [];
  for (let at = 0; at < bytes.length; at += view.size) parts.push(elementText(bytes.subarray(at, at + view.size), view));
  return "{" + parts.join(", ") + "}";
}

async function elementBytes(typed: string, view: View, parse: ValueParser): Promise<Uint8Array> {
  const parsed = await parse(typed);
  if (view.real) {
    const value = parsed.real !== null ? parsed.real : parsed.integer !== null ? Number(parsed.integer) : null;
    if (value === null) throw new ValueError("A number is needed here");
    return realBytes(value, view.size);
  }
  if (parsed.integer === null) throw new ValueError("A whole number is needed here");
  if (!fits(parsed.integer, view.size)) throw new ValueError("The value does not fit " + view.size * 8 + " bits");
  return bytesOf(parsed.integer, view.size);
}

function viewNode(target: Target, parse: ValueParser, register: number, view: View): ValueNode {
  const whole = () => target.context().xmm(register);
  const count = 16 / view.size;
  return {
    name: view.name,
    text: () => vectorText(whole(), view),
    indexed: count,
    children: async (start = 0, wanted = count) =>
      Array.from({ length: Math.max(0, Math.min(wanted, count - start)) }, (_, i): ValueNode => {
        const at = (start + i) * view.size;
        return {
          name: "[" + (start + i) + "]",
          text: () => elementText(whole().subarray(at, at + view.size), view),
          async assign(typed: string) {
            const bytes = whole();
            bytes.set(await elementBytes(typed, view, parse), at);
            const context = target.context().clone();
            context.setXmm(register, bytes);
            await target.setContext(context);
          },
        };
      }),
  };
}

export function xmmNodes(target: Target, parse: ValueParser): ValueNode[] {
  const nodes: ValueNode[] = [0, 1, 2, 3, 4, 5, 6, 7].map((register) => ({
    name: "XMM" + register,
    expression: "XMM" + register,
    text: () => vectorText(target.context().xmm(register), XMM_VIEWS[0]),
    named: XMM_VIEWS.length,
    children: async () => XMM_VIEWS.map((view) => viewNode(target, parse, register, view)),
  }));
  const word = () => target.context().mxcsr;
  const named = (shift: number) => {
    const set = EXCEPTIONS.filter((_, bit) => (word() >> (shift + bit)) & 1);
    return set.length ? set.join(", ") : "none";
  };
  nodes.push({
    name: "MXCSR",
    expression: "MXCSR",
    text: () => hexDigits(BigInt(word()), 4),
    named: 5,
    children: async () => [
      { name: "exceptions", text: () => named(0) },
      { name: "masked", text: () => named(7), note: "the exceptions that do not interrupt the program" },
      { name: "rounding", text: () => ROUNDING[(word() >> 13) & 3] },
      { name: "denormals are zero", text: () => String((word() >> 6) & 1) },
      { name: "flush to zero", text: () => String((word() >> 15) & 1) },
    ],
    async assign(typed: string) {
      const parsed = await parse(typed);
      if (parsed.integer === null || !fits(parsed.integer, 4)) throw new ValueError("MXCSR takes a 32-bit number");
      const context = target.context().clone();
      context.mxcsr = Number(BigInt.asUintN(32, parsed.integer));
      await target.setContext(context);
    },
  });
  return nodes;
}

// MMi is the low eight bytes of the x87's physical register i
export function mmxNodes(target: Target, parse: ValueParser): ValueNode[] {
  return [0, 1, 2, 3, 4, 5, 6, 7].map((register) => ({
    name: "MM" + register,
    expression: "MM" + register,
    text: () => hexDigits(bigOf(target.context().fpuRegister(register).subarray(0, 8)), 8),
    async assign(typed: string) {
      const parsed = await parse(typed);
      if (parsed.integer === null || !fits(parsed.integer, 8)) throw new ValueError("An MMX register takes a 64-bit number");
      const bytes = target.context().fpuRegister(register);
      bytes.set(bytesOf(parsed.integer, 8));
      const context = target.context().clone();
      context.setFpuRegister(register, bytes);
      await target.setContext(context);
    },
  }));
}
