import { ParsedValue, ValueError, ValueNode, ValueParser } from "../inspect/values";
import { Evaluator, Scope, truthy } from "./evaluator";
import { valueNode } from "./formatSpecifiers";
import { ExpressionError } from "./lexer";
import { Value } from "./values";

export class Expressions {
  private readonly evaluator: Evaluator;

  constructor(private readonly scope: Scope) {
    this.evaluator = new Evaluator(scope);
  }

  // what the user typed for a new value: an expression too, so that 0FFh, 'A' and eax+1 all work
  readonly parse: ValueParser = async (text: string): Promise<ParsedValue> => {
    let value: Value;
    try {
      value = (await this.evaluator.evaluate(text)).value;
    } catch (error) {
      throw new ValueError(error instanceof Error ? error.message : String(error));
    }
    if (value.kind === "integer") return { integer: value.value, real: null, text };
    if (value.kind === "real") return { integer: null, real: value.value, text };
    throw new ValueError("A number is needed here");
  };

  // The row for an expression. With `console`, "target = expression" is carried out first.
  async node(text: string, console = false): Promise<ValueNode> {
    const { value, statement } = await this.evaluator.evaluate(text, console);
    return valueNode(text.trim(), value, statement.specifiers, this.scope.target, this.parse, statement.target || statement.specifiers.length ? "" : text.trim());
  }

  // A breakpoint's condition, or a part of its log message: the text to show, and whether it counts as true.
  async condition(text: string): Promise<{ text: string; truthy: boolean }> {
    const { value, statement } = await this.evaluator.evaluate(text);
    const node = await valueNode(text, value, statement.specifiers, this.scope.target, this.parse, "");
    let holds = false;
    try {
      holds = truthy(value);
    } catch (error) {
      if (!(error instanceof ExpressionError)) throw error; // an array or a structure is shown, and is not "true"
    }
    return { text: node.text({ hex: false }), truthy: holds };
  }
}
