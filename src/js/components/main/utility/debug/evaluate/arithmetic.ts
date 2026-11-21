// MASM's binary operators on two numbers. A comparison gives a truth (1 or 0), and AND, OR and XOR of two truths
// are truths again. With a real on either side the arithmetic is real. Integers compute in the larger side's size,
// a doubleword at least, and stay signed only when both sides are.
import { ExpressionError } from "./lexer";
import { Value, ZERO, integer, truth, whole } from "./values";

// `at` places errors: the left and right operands, and the operator
export function arithmetic(op: string, left: Value, right: Value, at: { left: number; right: number; op: number }): Value {
  if (left.kind === "real" || right.kind === "real") {
    const a = left.kind === "real" ? left.value : Number(whole(left, at.left));
    const b = right.kind === "real" ? right.value : Number(whole(right, at.right));
    const compared: { [op: string]: boolean } = { EQ: a === b, NE: a !== b, LT: a < b, LE: a <= b, GT: a > b, GE: a >= b };
    if (op in compared) return truth(compared[op]);
    const result: { [op: string]: number } = { "+": a + b, "-": a - b, "*": a * b, "/": a / b };
    if (!(op in result)) throw new ExpressionError(op + " needs whole numbers", at.op);
    return { kind: "real", value: result[op], size: 8 };
  }
  const a = whole(left, at.left);
  const b = whole(right, at.right);
  const size = Math.max(4, left.kind === "integer" ? left.size : 4, right.kind === "integer" ? right.size : 4);
  const signed = left.kind === "integer" && right.kind === "integer" && left.signed && right.signed;
  const compared: { [op: string]: boolean } = { EQ: a === b, NE: a !== b, LT: a < b, LE: a <= b, GT: a > b, GE: a >= b };
  if (op in compared) return truth(compared[op]);
  if ((op === "/" || op === "MOD") && b === ZERO) throw new ExpressionError("Division by zero", at.op);
  const truths = left.kind === "integer" && right.kind === "integer" && !!left.truth && !!right.truth;
  if (truths && (op === "AND" || op === "OR" || op === "XOR")) return truth(op === "AND" ? a + b === BigInt(2) : op === "OR" ? a + b > ZERO : a !== b);
  const bits = BigInt(size * 8);
  switch (op) {
    case "+":
      return integer(a + b, size, signed);
    case "-":
      return integer(a - b, size, signed);
    case "*":
      return integer(a * b, size, signed);
    case "/":
      return integer(a / b, size, signed);
    case "MOD":
      return integer(a % b, size, signed);
    case "SHL":
      return integer(b >= bits ? ZERO : BigInt.asUintN(size * 8, a) << b, size, false);
    case "SHR":
      return integer(b >= bits ? ZERO : BigInt.asUintN(size * 8, a) >> b, size, false);
    case "AND":
      return integer(a & b, size, signed);
    case "OR":
      return integer(a | b, size, signed);
    default:
      return integer(a ^ b, size, signed);
  }
}
