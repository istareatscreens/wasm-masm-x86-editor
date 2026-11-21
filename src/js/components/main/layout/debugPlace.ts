// The debug sidebar has the grid's first column, its splitter the second. Shown, it runs to the bottom of the
// page, or ends above a terminal that lies under the editor.
import type { Modifier } from "./viewMode";
import type { Place } from "./terminalPlace";

export type DebugTo = "bottom" | "terminal";
export const isDebugTo = (value: unknown): value is DebugTo => value === "bottom" || value === "terminal";
export type DebugShown = "off" | "shown" | "hidden";

export const DEBUG_PANE: [string, string] = ["debug sidebar", "debug-pane"];
export const MIN_DEBUG_PX = 160;
export const MIN_DEBUG_SHARE = 0.4; // of a page too narrow for MIN_DEBUG_PX
export const MAX_DEBUG_SHARE = 0.5;

// Zen and the terminal-only view show the reveal bar whatever is stored, until the user reveals the sidebar there.
export function debugShown(on: boolean, hidden: boolean, modifier: Modifier, revealedInView: boolean): DebugShown {
  if (!on) return "off";
  if (modifier === "only-editor" || modifier === "only-cmd") return revealedInView ? "shown" : "hidden";
  return hidden ? "hidden" : "shown";
}

// The terminal lies under the editor, so it can run under the sidebar too.
export const terminalUnderEditor = (modifier: Modifier, place: Place): boolean => (modifier === "" || modifier === "no-file-drawer") && place !== "right";

// What data-debug-to says: set only where the terminal is under the sidebar.
export const debugUnder = (shown: DebugShown, modifier: Modifier, place: Place, to: DebugTo): boolean => shown === "shown" && to === "terminal" && terminalUnderEditor(modifier, place);

// The sidebar's handle buttons; `on` is the splitter each sits on (d: the sidebar's own, y: the horizontal one).
export type DebugAction = "hide" | "under" | "bottom";
export interface DebugButton {
  action: DebugAction;
  on: "d" | "y";
  row: number;
  column: number;
  arrow: "left" | "down";
  label: string;
}

export const DEBUG_BUTTON_NAMES: { [action in DebugAction]: string } = {
  hide: "Hide the debug sidebar",
  under: "Stretch the terminal under the debug sidebar",
  bottom: "Extend the debug sidebar to the bottom",
};

export function debugButtons(shown: DebugShown, modifier: Modifier, place: Place, to: DebugTo): DebugButton[] {
  if (shown !== "shown") return [];
  const button = (action: DebugAction, on: "d" | "y", row: number, column: number, arrow: "left" | "down"): DebugButton => ({ action, on, row, column, arrow, label: DEBUG_BUTTON_NAMES[action] });
  const buttons = [button("hide", "d", 2, 2, "left")];
  if (!terminalUnderEditor(modifier, place)) return buttons;
  buttons.push(to === "terminal" ? button("bottom", "y", 3, 1, "down") : button("under", "d", 4, 2, "left"));
  return buttons;
}

// the button that undoes an action: where the keyboard focus goes after it
export const UNDOES: { [action in DebugAction]: DebugAction | "reveal" } = { hide: "reveal", under: "bottom", bottom: "under" };

// The sidebar's share of the page's width, and its limits, from the page's width in pixels.
export function debugSpace(width: number): { size: number; min: number; max: number } {
  const size = Math.max(1, width);
  return { size, min: Math.min(MIN_DEBUG_PX / size, MIN_DEBUG_SHARE), max: MAX_DEBUG_SHARE };
}
