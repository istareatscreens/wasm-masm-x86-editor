// Where the program is, in the editor: a yellow arrow and a tinted line on the statement that runs next, and a
// green arrow on the line of the caller the call stack shows. Kept as positions, so they stay on their text.
import { Extension, StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView } from "@codemirror/view";

export interface Statements {
  current: number | null; // the position of the line the program is at, or null
  caller: number | null;
}

export const setStatements = StateEffect.define<{ current: number | null; caller: number | null }>(); // as line numbers

const NONE: Statements = { current: null, caller: null };

export const statementField = StateField.define<Statements>({
  create: () => NONE,
  update(value, transaction) {
    let next = value;
    if (transaction.docChanged && (value.current !== null || value.caller !== null)) {
      next = { current: value.current === null ? null : transaction.changes.mapPos(value.current, -1), caller: value.caller === null ? null : transaction.changes.mapPos(value.caller, -1) };
    }
    for (const effect of transaction.effects) {
      if (!effect.is(setStatements)) continue;
      const doc = transaction.state.doc;
      const at = (line: number | null) => (line === null || line < 1 || line > doc.lines ? null : doc.line(line).from);
      next = { current: at(effect.value.current), caller: at(effect.value.caller) };
    }
    return next;
  },
});

const currentLine = Decoration.line({ class: "cm-debug-current-line" });
const callerLine = Decoration.line({ class: "cm-debug-caller-line" });

export const statementLines: Extension = EditorView.decorations.compute([statementField], (state): DecorationSet => {
  const { current, caller } = state.field(statementField);
  const lines = [];
  if (caller !== null && caller !== current) lines.push({ at: state.doc.lineAt(caller).from, mark: callerLine });
  if (current !== null) lines.push({ at: state.doc.lineAt(current).from, mark: currentLine });
  return Decoration.set(lines.sort((a, b) => a.at - b.at).map((line) => line.mark.range(line.at)));
});
