// The editor's part of the debugger, for a MASM source while Debug is on: the breakpoint gutter, the arrow and
// the tint of the statement the program is at, value tips, and the bookkeeping that keeps breakpoints and line
// numbers right while the source is edited after a build.
import { Extension, Transaction } from "@codemirror/state";
import { EditorView, ViewUpdate } from "@codemirror/view";
import type { DebugController } from "../../debugger/session/debugController";
import { BreakpointView } from "../../debugger/session/debugStore";
import { failureOf } from "../../utility/debug/report/failure";
import { BreakpointMark, MarkIcons, MarkLook, breakpointField, markLines, setBreakpoints } from "./breakpointField";
import { ArrowIcons, breakpointGutter } from "./breakpointGutter";
import { debugEditorTheme } from "./editorTheme";
import { setStatements, statementField, statementLines } from "./statementMarkers";
import { valueTips } from "./valueTips";

export interface DebugEditorOptions {
  controller: DebugController;
  file: () => string; // the drawer path of the file the editor shows
  onMenu(line: number, x: number, y: number): void;
  arrows: ArrowIcons;
  isExternal(transaction: Transaction): boolean; // the editor component's own change: a file's text loaded, not an edit
}

const lookOf = (breakpoint: BreakpointView): MarkLook =>
  breakpoint.verified === false ? "unverified" : !breakpoint.enabled ? "disabled" : breakpoint.log ? "logpoint" : breakpoint.condition || breakpoint.hit ? "conditional" : "enabled";

const titleOf = (breakpoint: BreakpointView): string => {
  if (breakpoint.verified === false) return breakpoint.message || "This breakpoint is not bound";
  const parts = [breakpoint.enabled ? "Breakpoint" : "Breakpoint (disabled)"];
  if (breakpoint.condition) parts.push(breakpoint.when === "changed" ? "when " + breakpoint.condition + " changes" : "when " + breakpoint.condition);
  if (breakpoint.hit) parts.push("hit count " + breakpoint.hit);
  if (breakpoint.log) parts.push("logs: " + breakpoint.log);
  return parts.join(", ");
};

export const marksOf = (list: BreakpointView[]): BreakpointMark[] => list.map((breakpoint) => ({ key: breakpoint.key, line: breakpoint.line, look: lookOf(breakpoint), title: titleOf(breakpoint) }));

// An error in the debugger's own editor code ends the session with a report; the editor goes on. (CodeMirror's
// exceptionSink would take every extension's errors, Vim's and the highlighter's too, as the debugger's.)
export function guarded(controller: DebugController): (work: () => void) => void {
  return (work) => {
    try {
      work();
    } catch (error) {
      void controller.adapter.failed(failureOf(error));
    }
  };
}

// What the user's typing did to the lines: told to the line map (a session's line numbers are the built
// file's), and to the page's breakpoints, which follow their marks.
function onEdit(controller: DebugController, file: string, update: ViewUpdate): void {
  const before = update.startState.doc;
  const edits: { fromA: number; toA: number; inserted: number }[] = [];
  update.changes.iterChanges((fromA, toA, fromB, toB, inserted) => edits.push({ fromA, toA, inserted: inserted.lines - 1 }));
  for (const edit of edits.reverse()) {
    const first = before.lineAt(edit.fromA);
    const last = before.lineAt(edit.toA);
    controller.host.lineMapper.edited(file, before.lines, { line: first.number, removed: last.number - first.number, inserted: edit.inserted, fromLineStart: edit.fromA === first.from, toLineEnd: edit.toA === last.to });
  }
  const known = markLines(update.startState);
  const now = markLines(update.state);
  const removed = Object.keys(known).map(Number).filter((key) => now[key] === undefined);
  if (removed.length || Object.keys(now).some((key) => now[Number(key)] !== known[Number(key)])) controller.breakpoints.movedInEditor(file, now, removed);
}

export function debugExtensions(options: DebugEditorOptions): Extension[] {
  const { controller } = options;
  const guard = guarded(controller);
  return [
    breakpointField,
    statementField,
    statementLines,
    debugEditorTheme,
    breakpointGutter(
      {
        toggle: (line) => guard(() => controller.breakpoints.toggle(options.file(), line)),
        menu: (line, x, y) => guard(() => options.onMenu(line, x, y)),
      },
      options.arrows,
    ),
    valueTips(controller, guard),
    EditorView.updateListener.of((update) => {
      if (!update.docChanged || update.transactions.some((transaction) => options.isExternal(transaction))) return;
      guard(() => onEdit(controller, options.file(), update));
    }),
  ];
}

// The page's breakpoints of this file, drawn in the gutter.
export function showBreakpoints(view: EditorView, list: BreakpointView[], icons: MarkIcons): void {
  if (view.state.field(breakpointField, false) === undefined) return;
  view.dispatch({ effects: setBreakpoints.of({ marks: marksOf(list), icons }) });
}

// The statement the program is at and the caller the call stack shows, as line numbers of this file.
export function showStatements(view: EditorView, current: number | null, caller: number | null): void {
  if (view.state.field(statementField, false) === undefined) return;
  view.dispatch({ effects: setStatements.of({ current, caller }) });
}

// A line centred in the editor, without giving the editor the keyboard focus.
export function revealLine(view: EditorView, line: number): void {
  if (line < 1 || line > view.state.doc.lines) return;
  view.dispatch({ effects: EditorView.scrollIntoView(view.state.doc.line(line).from, { y: "center" }) });
}

// Where the editor's cursor is, for the debugger's keys: its line, and the selection or the word at it.
export function placeOf(view: EditorView): { line: number; text: string } {
  const selection = view.state.selection.main;
  const line = view.state.doc.lineAt(selection.head);
  let text = view.state.sliceDoc(selection.from, selection.to).trim();
  if (!text) {
    const word = view.state.wordAt(selection.head);
    text = word ? view.state.sliceDoc(word.from, word.to) : "";
  }
  return { line: line.number, text: text.split("\n")[0] };
}
