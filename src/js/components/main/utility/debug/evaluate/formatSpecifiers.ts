// An expression's value as a row the views show, and Visual Studio's format specifiers after a comma:
// ,x ,X hexadecimal  ,d signed  ,u unsigned  ,o octal  ,b binary  ,c with its character  ,s ,su a string
// ,5 that many elements.
import { binary, character, decimal, masmHex, octal } from "../format/numbers";
import { real8Text } from "../format/real";
import { isIntegerRegister, writeRegister } from "../inspect/registers";
import { vectorText, XMM_VIEWS } from "../inspect/simd";
import { Target, ValueError, ValueFormat, ValueNode, ValueParser, hex8 } from "../inspect/values";
import { Place, integerText, placeNode, realText, scalarText } from "../inspect/variables";
import { ExpressionError } from "./lexer";
import { Value } from "./values";

const MAX_STRING = 256;
const MAX_COUNT = 0x100000;

async function stringAt(target: Target, address: number, wide: boolean): Promise<string> {
  const read = await target.read(address, wide ? 2 * MAX_STRING : MAX_STRING);
  let text = "";
  for (let i = 0; i + (wide ? 1 : 0) < read.bytes.length; i += wide ? 2 : 1) {
    if (read.unreadable[i]) return text ? '"' + text + '"...' : "memory at " + hex8(address) + "h cannot be read";
    const code = wide ? read.bytes[i] | (read.bytes[i + 1] << 8) : read.bytes[i];
    if (!code) return '"' + text + '"';
    text += code === 10 ? "\\n" : code === 13 ? "\\r" : code === 9 ? "\\t" : code < 0x20 ? "\\x" + ("0" + code.toString(16)).slice(-2) : String.fromCharCode(code);
  }
  return '"' + text + '"...';
}

function integerOf(value: Value): { value: bigint; size: number; signed: boolean } | null {
  return value.kind === "integer" ? { value: value.value, size: value.size, signed: value.signed } : null;
}

// The row for a value. `expression` is what gave it, for the row's own "evaluate again".
export async function valueNode(name: string, value: Value, specifiers: string[], target: Target, parse: ValueParser, expression: string): Promise<ValueNode> {
  const place: Place | undefined = "place" in value ? value.place : undefined;
  let node: ValueNode;
  if (place && (value.kind === "aggregate" || place.shape.kind !== "bitfield")) {
    node = await placeNode(target, parse, name, place, expression);
  } else if (value.kind === "integer") {
    const text = (format: ValueFormat) => (value.code ? hex8(Number(value.value)) + "h" : integerText(value.value, value.size, value.signed, format));
    node = { name, text, expression };
    const register = value.register;
    if (register && isIntegerRegister(register)) {
      node.assign = async (typed) => {
        const parsed = await parse(typed);
        if (parsed.integer === null) throw new ValueError("A whole number is needed here");
        const context = target.context().clone();
        writeRegister(context, register, parsed.integer, target.writableFlags());
        await target.setContext(context);
      };
    }
  } else if (value.kind === "real") {
    node = { name, text: () => (value.empty ? "empty" : value.bytes ? realText(value.bytes) : real8Text(value.value)), expression, type: value.size === 10 ? "REAL10" : value.size === 4 ? "REAL4" : "REAL8" };
  } else if (value.kind === "vector") {
    node = { name, text: () => vectorText(value.bytes, XMM_VIEWS[0]), expression, type: "XMMWORD" };
  } else {
    node = { name, text: () => "", expression };
  }
  for (const specifier of specifiers) node = await applied(node, value, specifier, target, parse, expression);
  return node;
}

async function applied(node: ValueNode, value: Value, specifier: string, target: Target, parse: ValueParser, expression: string): Promise<ValueNode> {
  const place: Place | undefined = "place" in value ? value.place : undefined;
  const whole = integerOf(value);
  const needsInteger = () => {
    if (!whole) throw new ExpressionError("," + specifier + " formats a whole number");
    return whole;
  };
  if (/^\d+$/.test(specifier)) {
    const count = Number(specifier);
    if (!place || !count || count > MAX_COUNT) throw new ExpressionError("," + specifier + " shows that many elements of a variable or of memory");
    const element: Place = place.shape.kind === "array" && place.types ? { address: place.address, shape: place.types.resolve(place.shape.element), types: place.types, type: place.shape.element } : place;
    const size = element.shape.size || 1;
    const rows = (start: number, wanted: number) => {
      const made: Promise<ValueNode>[] = [];
      for (let i = start; i < Math.min(count, start + wanted); i++) made.push(placeNode(target, parse, "[" + i + "]", { ...element, address: element.address + i * size }));
      return Promise.all(made);
    };
    const first = await rows(0, Math.min(count, 8));
    return {
      ...node,
      type: element.shape.name + "[" + count + "]",
      memory: { address: element.address, size: count * size },
      text: (format) => "{" + first.map((row) => row.text(format)).join(", ") + (count > first.length ? ", ..." : "") + "}",
      named: undefined,
      indexed: count,
      children: (start = 0, wanted = count) => rows(start, wanted),
      assign: undefined,
    };
  }
  switch (specifier.toLowerCase()) {
    case "x":
      if (!whole) return forced(node, { hex: true }); // an array or a structure: every number in it
      return { ...node, text: () => masmHex(whole.value, whole.size) };
    case "d":
      if (!whole) return forced(node, { hex: false });
      return { ...node, text: () => decimal(whole.value, whole.size, true) };
    case "u":
      return { ...node, text: () => decimal(needsInteger().value, whole.size, false) };
    case "o":
      return { ...node, text: () => octal(needsInteger().value, whole.size) };
    case "b":
      return { ...node, text: () => binary(needsInteger().value, whole.size) };
    case "c": {
      const low = Number(BigInt.asUintN(8, needsInteger().value));
      return { ...node, text: () => low + (character(low) ? " " + character(low) : "") };
    }
    case "s":
    case "su": {
      // a variable's own bytes, or what a pointer or a register points at
      const address = place && place.shape.kind !== "pointer" && !whole ? place.address : whole ? Number(BigInt.asUintN(32, whole.value)) : null;
      if (address === null) throw new ExpressionError("," + specifier + " shows the text at a variable or at an address");
      const text = await stringAt(target, address, specifier.toLowerCase() === "su");
      return { ...node, text: () => text, memory: node.memory || { address, size: 1 } };
    }
    default:
      throw new ExpressionError("'," + specifier + "' is not a format: use x, d, u, o, b, c, s, su or a count");
  }
}

// the same row, with every number in it and under it shown one way
function forced(node: ValueNode, format: ValueFormat): ValueNode {
  return {
    ...node,
    text: () => node.text(format),
    children: node.children ? async (start, count) => (await node.children(start, count)).map((child) => forced(child, format)) : undefined,
  };
}

// a scalar's text for places the views format themselves
export { scalarText };
