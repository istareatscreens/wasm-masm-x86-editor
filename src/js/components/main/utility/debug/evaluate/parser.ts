// MASM's expression syntax as a tree: its operators in its order of precedence, [address], TYPE PTR operand,
// record.field and array[byte offset]. After the expression may come ",specifier"s; before it, in the Console,
// "target =".
import { ExpressionError, Token, tokenize } from "./lexer";

export type Node =
  | { kind: "number"; value: bigint; at: number }
  | { kind: "real"; value: number; text: string; at: number }
  | { kind: "name"; name: string; module: string | null; at: number }
  | { kind: "st"; index: number; at: number }
  | { kind: "unary"; op: string; operand: Node; at: number }
  | { kind: "binary"; op: string; left: Node; right: Node; at: number }
  | { kind: "deref"; address: Node; at: number }
  | { kind: "cast"; type: string; operand: Node; at: number }
  | { kind: "member"; object: Node; name: string; at: number }
  | { kind: "index"; object: Node; offset: Node; at: number };

export interface Statement {
  target: Node | null; // an assignment's left side
  expression: Node;
  specifiers: string[];
}

const WORD_OPERATORS: { [level: string]: string[] } = {
  or: ["OR", "XOR"],
  and: ["AND"],
  compare: ["EQ", "NE", "LT", "LE", "GT", "GE", "==", "!=", "<", "<=", ">", ">="],
  add: ["+", "-"],
  multiply: ["*", "/", "MOD", "SHL", "SHR"],
};
const PREFIXES = ["OFFSET", "ADDR", "TYPE", "SIZEOF", "LENGTHOF"];
const RESERVED = ["OR", "XOR", "AND", "NOT", "EQ", "NE", "LT", "LE", "GT", "GE", "MOD", "SHL", "SHR", "PTR"].concat(PREFIXES);
const SAME: { [spelling: string]: string } = { "==": "EQ", "!=": "NE", "<": "LT", "<=": "LE", ">": "GT", ">=": "GE", ADDR: "OFFSET" };

class Parser {
  private at = 0;

  constructor(private readonly tokens: Token[]) {}

  private get token(): Token {
    return this.tokens[this.at];
  }

  private word(token: Token): string {
    return token.kind === "name" ? token.text.toUpperCase() : token.kind === "operator" ? token.text : "";
  }

  private is(...spellings: string[]): boolean {
    return spellings.indexOf(this.word(this.token)) >= 0 && this.token.kind !== "number";
  }

  private take(spelling: string): Token {
    if (!this.is(spelling)) throw new ExpressionError("'" + spelling + "' is expected" + (this.token.kind === "end" ? " at the end" : " before '" + this.token.text + "'"), this.token.at);
    return this.tokens[this.at++];
  }

  statement(allowAssignment: boolean): Statement {
    let depth = 0;
    const assigns = this.tokens.some((token) => {
      if (token.kind === "operator" && (token.text === "(" || token.text === "[")) depth++;
      if (token.kind === "operator" && (token.text === ")" || token.text === "]")) depth--;
      return token.kind === "operator" && token.text === "=" && depth === 0;
    });
    let target: Node | null = null;
    if (assigns) {
      if (!allowAssignment) throw new ExpressionError("A value can only be changed from the Console. To compare, write == or EQ", this.tokens.filter((t) => t.text === "=")[0].at);
      target = this.level("or");
      this.take("=");
    }
    const expression = this.level("or");
    const specifiers: string[] = [];
    while (this.is(",")) {
      this.at++;
      if (this.token.kind !== "name" && this.token.kind !== "number") throw new ExpressionError("A format is expected after the comma: x, d, u, o, b, c, s, su or a count", this.token.at);
      specifiers.push(this.tokens[this.at++].text);
    }
    if (this.token.kind !== "end") throw new ExpressionError("'" + this.token.text + "' is not expected here", this.token.at);
    return { target, expression, specifiers };
  }

  private level(name: "or" | "and" | "compare" | "add" | "multiply"): Node {
    const order: ("or" | "and" | "not" | "compare" | "add" | "multiply")[] = ["or", "and", "not", "compare", "add", "multiply"];
    const below = (): Node => {
      const next = order[order.indexOf(name) + 1];
      if (next === "not") return this.not();
      return next ? this.level(next as "compare" | "add" | "multiply") : this.unary();
    };
    let left = below();
    while (this.is.apply(this, WORD_OPERATORS[name])) {
      const operator = this.tokens[this.at++];
      const op = this.word(operator);
      left = { kind: "binary", op: SAME[op] || op, left, right: below(), at: operator.at };
    }
    return left;
  }

  private not(): Node {
    if (!this.is("NOT")) return this.level("compare");
    const operator = this.tokens[this.at++];
    return { kind: "unary", op: "NOT", operand: this.not(), at: operator.at };
  }

  private unary(): Node {
    const token = this.token;
    if (token.kind === "operator" && (token.text === "-" || token.text === "+")) {
      this.at++;
      return { kind: "unary", op: token.text, operand: this.unary(), at: token.at };
    }
    if (this.is.apply(this, PREFIXES)) {
      this.at++;
      const op = this.word(token);
      return { kind: "unary", op: SAME[op] || op, operand: this.unary(), at: token.at };
    }
    // TYPE PTR operand: the name before PTR is a type's
    const after = this.tokens[this.at + 1];
    if (token.kind === "name" && after.kind === "name" && after.text.toUpperCase() === "PTR") {
      this.at += 2;
      return { kind: "cast", type: token.text, operand: this.unary(), at: token.at };
    }
    return this.postfix();
  }

  private postfix(): Node {
    let node = this.primary();
    for (;;) {
      if (this.is(".")) {
        const dot = this.tokens[this.at++];
        if (this.token.kind !== "name") throw new ExpressionError("A field's name is expected after the point", this.token.at);
        node = { kind: "member", object: node, name: this.tokens[this.at++].text, at: dot.at };
      } else if (this.is("[")) {
        const open = this.tokens[this.at++];
        const offset = this.level("or");
        this.take("]");
        node = { kind: "index", object: node, offset, at: open.at };
      } else {
        return node;
      }
    }
  }

  private primary(): Node {
    const token = this.tokens[this.at++];
    if (token.kind === "number") return { kind: "number", value: token.integer, at: token.at };
    if (token.kind === "real") return { kind: "real", value: token.real, text: token.text, at: token.at };
    if (token.kind === "operator" && token.text === "(") {
      const inner = this.level("or");
      this.take(")");
      return inner;
    }
    if (token.kind === "operator" && token.text === "[") {
      const address = this.level("or");
      this.take("]");
      return { kind: "deref", address, at: token.at };
    }
    if (token.kind === "name") {
      if (RESERVED.indexOf(token.text.toUpperCase()) >= 0) throw new ExpressionError("'" + token.text + "' needs a value before it", token.at);
      if (/^st$/i.test(token.text) && this.is("(")) {
        this.at++;
        const index = this.tokens[this.at++];
        this.take(")");
        if (index.kind !== "number" || index.integer > BigInt(7)) throw new ExpressionError("ST takes a register number from 0 to 7", index.at);
        return { kind: "st", index: Number(index.integer), at: token.at };
      }
      if (this.is("!")) {
        this.at++;
        if (this.token.kind !== "name") throw new ExpressionError("A symbol's name is expected after '!'", this.token.at);
        return { kind: "name", name: this.tokens[this.at++].text, module: token.text, at: token.at };
      }
      return { kind: "name", name: token.text, module: null, at: token.at };
    }
    this.at--;
    throw new ExpressionError(token.kind === "end" ? "The expression ends too soon" : "'" + token.text + "' is not expected here", token.at);
  }
}

export function parseStatement(text: string, allowAssignment = false): Statement {
  if (!text.trim()) throw new ExpressionError("An expression is expected", 0);
  return new Parser(tokenize(text)).statement(allowAssignment);
}
