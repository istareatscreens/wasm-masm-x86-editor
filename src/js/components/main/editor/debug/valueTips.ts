// Value tips: while the program is stopped, the pointer over a register, a name or a [...] operand shows its
// value, in a Windows 98 info tip. What cannot be evaluated shows nothing.
import { Extension } from "@codemirror/state";
import { EditorView, hoverTooltip } from "@codemirror/view";
import type { DebugController } from "../../debugger/session/debugController";

const NAME = /[A-Za-z_@$?][\w@$?]*(?:\.[A-Za-z_@$?][\w@$?]*)*/g;
const MAX_TIP = 200;

// The expression under a column of a line: a whole [...] operand (with its "type PTR", when it has one), or a
// name with its fields. A comment has none.
export function expressionAt(text: string, column: number): { from: number; to: number; expression: string } | null {
  const comment = text.search(/;(?=(?:[^'"]|'[^']*'|"[^"]*")*$)/);
  const code = comment < 0 ? text : text.slice(0, comment);
  if (column >= code.length) return null;
  const open = code.lastIndexOf("[", column);
  const close = open < 0 ? -1 : code.indexOf("]", open);
  if (open >= 0 && close >= column) {
    const before = /((?:[A-Za-z]+\s+PTR\s+)?(?:[A-Za-z_@$?][\w@$?.]*)?)$/i.exec(code.slice(0, open));
    const from = open - (before ? before[1].length : 0);
    return { from, to: close + 1, expression: code.slice(from, close + 1) };
  }
  NAME.lastIndex = 0;
  for (let match = NAME.exec(code); match; match = NAME.exec(code)) {
    if (match.index <= column && column < match.index + match[0].length) return { from: match.index, to: match.index + match[0].length, expression: match[0] };
  }
  return null;
}

export function valueTips(controller: DebugController, guard: (work: () => void) => void): Extension {
  return hoverTooltip(
    async (view: EditorView, position: number) => {
      const state = controller.view;
      if (state.phase !== "stopped") return null;
      const line = view.state.doc.lineAt(position);
      const found = expressionAt(line.text, position - line.from);
      if (!found) return null;
      let answer;
      try {
        answer = await controller.client.ask("evaluate", { expression: found.expression, frameId: state.frame, context: "hover", format: { hex: state.settings.hex } });
      } catch (error) {
        guard(() => {
          throw error;
        });
        return null;
      }
      if ("refused" in answer) return null;
      const value = String(answer.body.result);
      return {
        pos: line.from + found.from,
        end: line.from + found.to,
        above: true,
        create() {
          const dom = document.createElement("div");
          guard(() => {
            dom.className = "cm-debug-tip";
            dom.textContent = found.expression + " = " + (value.length > MAX_TIP ? value.slice(0, MAX_TIP) + "…" : value) + (answer.body.type ? "  (" + answer.body.type + ")" : "");
          });
          return { dom };
        },
      };
    },
    { hoverTime: 350 },
  );
}
