import { parseNumber } from "../format/numbers";

export type TokenKind = "number" | "real" | "name" | "operator" | "end";

export interface Token {
  kind: TokenKind;
  text: string; // a name as typed; an operator in its one spelling
  integer?: bigint;
  real?: number;
  at: number; // where it starts in the expression
}

// An expression that cannot be read or evaluated. `at` is where in the text, when that is known.
export class ExpressionError extends Error {
  readonly at: number;

  constructor(message: string, at = -1) {
    super(message);
    this.name = "ExpressionError";
    this.at = at;
    Object.setPrototypeOf(this, ExpressionError.prototype);
  }
}

const OPERATORS = ["==", "!=", "<=", ">=", "<", ">", "+", "-", "*", "/", "(", ")", "[", "]", ".", ",", "!", "=", ":"];

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let at = 0;
  while (at < text.length) {
    const rest = text.slice(at);
    const space = /^\s+/.exec(rest);
    if (space) {
      at += space[0].length;
      continue;
    }
    const quoted = /^'[^']{1,4}'|^"[^"]{1,4}"/.exec(rest);
    const real = /^(?:[0-9]+[.][0-9]*|[.][0-9]+)(?:[eE][+-]?[0-9]+)?/.exec(rest); // a real number has a point
    const number = /^[0-9][0-9a-zA-Z]*/.exec(rest);
    const name = /^[A-Za-z_@$?][A-Za-z0-9_@$?]*/.exec(rest);
    if (quoted) {
      tokens.push({ kind: "number", text: quoted[0], integer: parseNumber(quoted[0]), at });
      at += quoted[0].length;
    } else if (real) {
      tokens.push({ kind: "real", text: real[0], real: Number(real[0]), at });
      at += real[0].length;
    } else if (number) {
      const integer = parseNumber(number[0]);
      if (integer === null) throw new ExpressionError("'" + number[0] + "' is not a number", at);
      tokens.push({ kind: "number", text: number[0], integer, at });
      at += number[0].length;
    } else if (name) {
      tokens.push({ kind: "name", text: name[0], at });
      at += name[0].length;
    } else {
      const operator = OPERATORS.filter((candidate) => rest.slice(0, candidate.length) === candidate)[0];
      if (!operator) throw new ExpressionError("'" + rest[0] + "' is not part of an expression", at);
      tokens.push({ kind: "operator", text: operator, at });
      at += operator.length;
    }
  }
  tokens.push({ kind: "end", text: "", at: text.length });
  return tokens;
}
