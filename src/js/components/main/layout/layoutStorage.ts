import { DEFAULT_PLACE, isPlace } from "./terminalPlace";
import type { Place } from "./terminalPlace";
import { isDebugTo } from "./debugPlace";
import type { DebugTo } from "./debugPlace";
import { removeStoredState } from "../../common/useStoredState.js";

// The splitters' positions and the terminal's place for the wide and the narrow (<= 900 px) layout: x and y
// are the left column's and the upper row's shares, d the debug sidebar's share of the page.
export const LAYOUT_KEY = "layout";
export const LAYOUT_VERSION = 1;
export const MIN_PANE_PX = 120;

export type Split = { x: number; y: number; terminal: Place; d: number; debugTo: DebugTo; debugHidden: boolean };
export type Layout = { wide: Split; narrow: Split };
export type Breakpoint = keyof Layout;

export const DEFAULT_LAYOUT: Layout = {
  wide: { x: 0.6, y: 0.4, terminal: DEFAULT_PLACE.wide, d: 0.24, debugTo: "bottom", debugHidden: false },
  narrow: { x: 0.7, y: 0.5, terminal: DEFAULT_PLACE.narrow, d: 0.4, debugTo: "bottom", debugHidden: false },
};

const share = (value: unknown, fallback: number): number =>
  typeof value === "number" && isFinite(value) && value >= 0.05 && value <= 0.95 ? value : fallback;

// Stored text (or null) -> a valid layout: anything missing, unreadable, of another version or out of
// range takes its default.
export function parseLayout(text: string | null): Layout {
  let stored: any = null;
  try {
    stored = text ? JSON.parse(text) : null;
  } catch (error) {
    stored = null;
  }
  const current = !!stored && typeof stored === "object" && stored.version === LAYOUT_VERSION;
  const pair = (name: Breakpoint): Split => {
    const split = current && stored[name] && typeof stored[name] === "object" ? stored[name] : {};
    const fallback = DEFAULT_LAYOUT[name];
    return {
      x: share(split.x, fallback.x),
      y: share(split.y, fallback.y),
      terminal: isPlace(split.terminal) ? split.terminal : fallback.terminal,
      d: share(split.d, fallback.d),
      debugTo: isDebugTo(split.debugTo) ? split.debugTo : fallback.debugTo,
      debugHidden: split.debugHidden === true,
    };
  };
  return { wide: pair("wide"), narrow: pair("narrow") };
}

export const serializeLayout = (layout: Layout): string =>
  JSON.stringify({ version: LAYOUT_VERSION, wide: layout.wide, narrow: layout.narrow });

export const isDefaultLayout = (layout: Layout): boolean => serializeLayout(layout) === serializeLayout(DEFAULT_LAYOUT);

// Restore Default Layout: the stored layout goes, and the page takes the default at once, with no reload.
export const resetLayout = (): void => removeStoredState(LAYOUT_KEY);
