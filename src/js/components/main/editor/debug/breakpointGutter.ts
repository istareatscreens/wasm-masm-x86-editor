// The breakpoint gutter, left of the line numbers: a breakpoint's mark, and the arrow of the statement the
// program is at. A click sets or removes a breakpoint; the right button opens the line's menu.
import { Extension } from "@codemirror/state";
import { BlockInfo, EditorView, gutter } from "@codemirror/view";
import { breakpointField, iconMarker } from "./breakpointField";
import { statementField } from "./statementMarkers";

export interface GutterActions {
  toggle(line: number): void;
  menu(line: number, x: number, y: number): void;
}

export interface ArrowIcons {
  current: string;
  caller: string;
}

const lineOf = (view: EditorView, block: BlockInfo): number => view.state.doc.lineAt(block.from).number;

export function breakpointGutter(actions: GutterActions, arrows: ArrowIcons): Extension {
  const current = iconMarker(arrows.current, "The statement that runs next", "cm-debug-icon--arrow");
  const caller = iconMarker(arrows.caller, "The call stack's frame is at this line", "cm-debug-icon--arrow");
  return gutter({
    class: "cm-debug-gutter",
    markers: (view) => view.state.field(breakpointField),
    lineMarker(view, block) {
      const statements = view.state.field(statementField);
      const inLine = (position: number | null) => position !== null && position >= block.from && position <= block.to;
      return inLine(statements.current) ? current : inLine(statements.caller) ? caller : null;
    },
    lineMarkerChange: (update) => update.startState.field(statementField) !== update.state.field(statementField),
    initialSpacer: () => current,
    domEventHandlers: {
      mousedown(view, block, event) {
        if ((event as MouseEvent).button !== 0) return false;
        actions.toggle(lineOf(view, block));
        event.preventDefault();
        return true;
      },
      contextmenu(view, block, event) {
        const mouse = event as MouseEvent;
        actions.menu(lineOf(view, block), mouse.clientX, mouse.clientY);
        event.preventDefault();
        return true;
      },
    },
  });
}
