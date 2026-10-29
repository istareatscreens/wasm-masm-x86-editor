import { useCallback, useEffect, useState } from "react";
import { ancestorsOf, isWithin } from "../../utility/filesystem/paths";

// Expanded folders survive reloads (this browser only; the hard reset keeps non-bw-
// keys); a missing or unreadable value means everything collapsed.
const EXPANDED_KEY = "fileDrawerExpanded";
const readExpanded = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(EXPANDED_KEY) || "[]");
    return new Set(Array.isArray(stored) ? stored : []);
  } catch (error) {
    return new Set();
  }
};

// Expansion, the selected row (a file, a folder, or "" for the (D:) root) and the row
// that holds keyboard focus. Opening a file selects it and expands its folders.
export default function useTreeState(openFile) {
  const [expanded, setExpanded] = useState(readExpanded);
  const [selected, setSelected] = useState(null);
  const [focused, setFocused] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(EXPANDED_KEY, JSON.stringify(Array.from(expanded)));
    } catch (error) {
      /* storage unavailable: expansion lasts for the session */
    }
  }, [expanded]);

  useEffect(() => {
    if (!openFile) return;
    setSelected(openFile);
    setFocused(openFile);
    const folders = ancestorsOf(openFile);
    setExpanded((prev) => (folders.every((folder) => prev.has(folder)) ? prev : new Set([...prev, ...folders])));
  }, [openFile]);

  const toggle = useCallback((path, open) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (open === undefined ? !prev.has(path) : open) next.add(path);
      else next.delete(path);
      return next;
    });
  }, []);

  // after a folder is renamed or moved, its expansion follows it
  const relocate = useCallback((from, to) => {
    setExpanded((prev) => {
      if (![...prev].some((path) => isWithin(path, from))) return prev;
      return new Set([...prev].map((path) => (isWithin(path, from) ? to + path.slice(from.length) : path)));
    });
  }, []);

  // deleted folders are forgotten (one made again later with the same name starts collapsed)
  const forget = useCallback((paths) => {
    setExpanded((prev) => {
      const gone = (path) => paths.some((target) => isWithin(path, target));
      return [...prev].some(gone) ? new Set([...prev].filter((path) => !gone(path))) : prev;
    });
  }, []);

  return { expanded, toggle, relocate, forget, selected, setSelected, focused, setFocused };
}
