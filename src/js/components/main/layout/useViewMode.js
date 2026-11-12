import { useCallback, useMemo, useState } from "react";
import { DEFAULT_VIEW, ONLY_TERMINAL_VIEW, ZEN_VIEW, modifierFor, withPane } from "./viewMode";

// The panes the layout shows (editor, terminal, file drawer) and the changes made to them by the view
// switches, the build buttons (the terminal comes back) and the Snake button (only the terminal).
export default function useViewMode() {
  const [view, setView] = useState(DEFAULT_VIEW);
  const setPane = useCallback((pane, visible) => setView((current) => withPane(current, pane, visible)), []);
  const setZen = useCallback((on) => setView(on ? ZEN_VIEW : DEFAULT_VIEW), []);
  const showTerminal = useCallback(() => setView((current) => withPane(current, "cmd", true)), []);
  const showOnlyTerminal = useCallback(() => setView(ONLY_TERMINAL_VIEW), []);
  return useMemo(() => {
    const modifier = modifierFor(view);
    return { view, modifier, zen: modifier === "only-editor", setPane, setZen, showTerminal, showOnlyTerminal };
  }, [view, setPane, setZen, showTerminal, showOnlyTerminal]);
}
