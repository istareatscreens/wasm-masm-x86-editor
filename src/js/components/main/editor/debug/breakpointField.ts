// The editor's breakpoints: one mark a breakpoint, kept in the editor's state so that it moves with its text
// as the user types (CodeMirror's breakpoint-gutter pattern). The page's list of breakpoints is the source:
// it is given with `setBreakpoints`, and the editor reports where edits moved the marks.
import { RangeSet, StateEffect, StateField } from "@codemirror/state";
import { GutterMarker } from "@codemirror/view";
import { pixelArtCanvas } from "../../../common/pixelArt.js";

export type MarkLook = "enabled" | "disabled" | "conditional" | "logpoint" | "unverified";

export interface BreakpointMark {
  key: number;
  line: number;
  look: MarkLook;
  title: string;
}

export const ICON_PIXELS = 11;
export const ICON_REM = 1.1;

// A pixel icon in the gutter, drawn as the page's other pixel icons are (common/pixelArt.js). `key` is the
// breakpoint's, for a breakpoint's mark.
export interface IconMarker extends GutterMarker {
  src: string;
  title: string;
  className: string;
  key: number;
}

// The app is compiled to ES5, whose classes cannot extend a native class such as GutterMarker: a marker is an
// instance of GutterMarker itself, with methods of its own.
const MarkerBase = GutterMarker as unknown as new () => GutterMarker;

export function iconMarker(src: string, title: string, className: string, key = 0): IconMarker {
  const marker = new MarkerBase() as IconMarker;
  marker.src = src;
  marker.title = title;
  marker.className = className;
  marker.key = key;
  marker.eq = (other: GutterMarker) => {
    const icon = other as IconMarker;
    return icon.key === key && icon.src === src && icon.title === title && icon.className === className;
  };
  marker.toDOM = () => {
    const art = pixelArtCanvas(src, ICON_PIXELS, ICON_REM, "cm-debug-icon " + className);
    art.canvas.title = title;
    (art.canvas as any).destroyPixelArt = art.destroy;
    return art.canvas;
  };
  marker.destroy = (dom: Node) => {
    const destroy = (dom as any).destroyPixelArt;
    if (destroy) destroy();
  };
  return marker;
}

export interface MarkIcons {
  [look: string]: string;
}

export const setBreakpoints = StateEffect.define<{ marks: BreakpointMark[]; icons: MarkIcons }>();

export const breakpointField = StateField.define<RangeSet<IconMarker>>({
  create: () => RangeSet.empty,
  update(set, transaction) {
    let next = set.map(transaction.changes);
    for (const effect of transaction.effects) {
      if (!effect.is(setBreakpoints)) continue;
      const doc = transaction.state.doc;
      const ranges = effect.value.marks
        .map((mark) => iconMarker(effect.value.icons[mark.look], mark.title, "cm-debug-icon--breakpoint", mark.key).range(doc.line(Math.max(1, Math.min(doc.lines, mark.line))).from))
        .sort((a, b) => a.from - b.from);
      next = RangeSet.of(ranges);
    }
    return next;
  },
});

// Each mark's line now, by its breakpoint's key.
export function markLines(state: { doc: { lineAt(pos: number): { number: number } }; field(field: typeof breakpointField): RangeSet<IconMarker> }): { [key: number]: number } {
  const lines: { [key: number]: number } = {};
  const cursor = state.field(breakpointField).iter();
  for (; cursor.value; cursor.next()) lines[cursor.value.key] = state.doc.lineAt(cursor.from).number;
  return lines;
}
