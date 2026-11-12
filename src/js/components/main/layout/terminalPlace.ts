// Where the terminal sits while the editor, the file drawer and the terminal are all shown: under the
// drawer (right), across the bottom (bottom) or under the editor (left), kept per breakpoint
// (layoutStorage.ts). The editor is always in the left column and the drawer in the right. The grid's
// tracks are the same in every place, only its areas change (layout/_layout.scss, data-terminal).
import type { Modifier } from "./viewMode";

export type Place = "right" | "bottom" | "left";
export const PLACES: Place[] = ["right", "bottom", "left"];
export const DEFAULT_PLACE: { wide: Place; narrow: Place } = { wide: "right", narrow: "bottom" };
export const isPlace = (value: unknown): value is Place => PLACES.indexOf(value as Place) >= 0;

// The layouts the place changes: all three panes, and the editor with the terminal (side by side when
// the terminal was under the drawer, stacked otherwise). Hiding the editor or the terminal gives the
// same layout in every place.
export const placeMatters = (modifier: Modifier): boolean => modifier === "" || modifier === "no-file-drawer";

// A splitter: its first pane (name, element id for aria-controls) and the name of the pane after it.
export type Splitter = [[string, string], string];
export type Splitters = { x?: Splitter; y?: Splitter };

const EDITOR: [string, string] = ["editor", "editor-pane"];
const DRAWER: [string, string] = ["file drawer", "file-drawer-pane"];
const TERMINAL: [string, string] = ["terminal", "terminal-pane"];

// The splitters of each layout and place: x between the columns, y between the rows.
export function splittersFor(modifier: Modifier, place: Place): Splitters {
  switch (modifier) {
    case "":
      if (place === "right") return { x: [EDITOR, "file drawer and terminal"], y: [DRAWER, "terminal"] };
      if (place === "bottom") return { x: [EDITOR, "file drawer"], y: [["editor and file drawer", "editor-pane"], "terminal"] };
      return { x: [["editor and terminal", "editor-pane"], "file drawer"], y: [EDITOR, "terminal"] };
    case "no-editor":
      return { x: [TERMINAL, "file drawer"] };
    case "no-cmd":
      return { x: [EDITOR, "file drawer"] };
    case "no-file-drawer":
      return place === "right" ? { x: [EDITOR, "terminal"] } : { y: [EDITOR, "terminal"] };
    default:
      return {};
  }
}

// The move buttons of each place (all three panes shown), each offering one of the two other places: the
// splitter it sits on, its grid row and column (lines of layout/_layout.scss: rows top bar, upper panes,
// horizontal splitter, lower panes; columns left, vertical splitter, right), the way its arrows point
// (where the space goes) and the place it moves the terminal to.
export type Move = { on: "x" | "y"; row: number; column: number; arrow: "down" | "left" | "right"; to: Place };

export const MOVES: { [place in Place]: Move[] } = {
  right: [
    { on: "x", row: 4, column: 2, arrow: "left", to: "bottom" },
    { on: "y", row: 3, column: 3, arrow: "down", to: "left" },
  ],
  bottom: [
    { on: "y", row: 3, column: 1, arrow: "down", to: "right" },
    { on: "y", row: 3, column: 3, arrow: "down", to: "left" },
  ],
  left: [
    { on: "x", row: 4, column: 2, arrow: "right", to: "bottom" },
    { on: "y", row: 3, column: 1, arrow: "down", to: "right" },
  ],
};

// what a move button does, named for where it puts the terminal: its accessible name and tooltip
export const MOVE_NAMES: { [place in Place]: string } = {
  left: "Move the terminal under the editor",
  right: "Move the terminal under the file drawer",
  bottom: "Stretch the terminal across the bottom",
};
