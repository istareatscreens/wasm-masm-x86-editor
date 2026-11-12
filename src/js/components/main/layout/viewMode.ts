// Which panes the layout shows, and the layout modifier class for them (layout/_layout.scss).
export type Pane = "editor" | "cmd" | "drawer";
export type View = { editor: boolean; cmd: boolean; drawer: boolean };
export type Modifier = "" | "no-editor" | "no-cmd" | "no-file-drawer" | "only-editor" | "only-cmd";

export const DEFAULT_VIEW: View = { editor: true, cmd: true, drawer: true };
export const ZEN_VIEW: View = { editor: true, cmd: false, drawer: false };
export const ONLY_TERMINAL_VIEW: View = { editor: false, cmd: true, drawer: false };

// The switch table (editor | terminal | file drawer). Neither the editor nor the terminal (0 0 0,
// 0 0 1) is refused: null.
export function modifierFor({ editor, cmd, drawer }: View): Modifier | null {
  if (!editor && !cmd) return null;
  if (editor && cmd) return drawer ? "" : "no-file-drawer";
  if (editor) return drawer ? "no-cmd" : "only-editor";
  return drawer ? "no-editor" : "only-cmd";
}

// The view after one pane is switched; a refused result leaves the view as it was.
export function withPane(view: View, pane: Pane, visible: boolean): View {
  const next = { ...view, [pane]: visible };
  return modifierFor(next) === null ? view : next;
}
