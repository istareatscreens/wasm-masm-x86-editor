import React, { useCallback, useMemo, useRef, useState } from "react";

import TreeContextMenu from "../../../common/TreeContextMenu.jsx";
import { useStore } from "../session/debugStore";
import { TreeContext } from "./treeContext.js";
import { topPath } from "./treePaths.js";
import ValueRow from "./ValueRow.jsx";

const itemsOf = (root) => Array.from(root.querySelectorAll('[role="treeitem"]'));
const levelOf = (item) => Number(item.getAttribute("aria-level"));

// The adapter's variables as a Windows 98 tree. `reference` is the rows' container (0: none, as for watches);
// `menu(row)` adds the section's own menu entries; `onRemove(index)` makes Delete remove a top row. The selection is
// the tree's own unless the section holds it (`selected` and `onSelect(path)`, both row paths).
function ValueTree({ controller, label, rows, reference = 0, stale = false, menu = null, onRemove = null, selected: held, onSelect = null }) {
  const stop = useStore(controller.store, (view) => (view.stop ? view.stop.number : 0));
  const hex = useStore(controller.store, (view) => view.settings.hex);
  const root = useRef(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [own, setOwn] = useState("");
  const isHeld = held !== undefined;
  const selected = isHeld ? held : own;
  const select = useCallback(
    (path) => {
      if (!isHeld) setOwn(path);
      if (onSelect) onSelect(path);
    },
    [isHeld, onSelect],
  );
  const [editing, setEditing] = useState("");
  const [menuAt, setMenuAt] = useState(null);

  // each value as it was at the previous stop, by its path: a value that differs now has changed
  const values = useRef({ stop, hex, previous: new Map(), current: new Map() });
  if (values.current.hex !== hex) values.current = { stop, hex, previous: new Map(), current: new Map() };
  else if (values.current.stop !== stop) values.current = { stop, hex, previous: values.current.current, current: new Map() };

  const toggle = useCallback((path, open) => {
    setExpanded((before) => {
      const next = new Set(before);
      if (open === undefined ? !next.has(path) : open) next.add(path);
      else next.delete(path);
      return next;
    });
  }, []);

  const focusPath = (path) => {
    select(path);
    const item = root.current && itemsOf(root.current).filter((entry) => entry.dataset.path === path)[0];
    if (item) item.focus();
  };

  const openMenu = useCallback(
    (row, path, x, y) => {
      const items = [];
      if (row.editable) items.push({ label: "Edit Value", onSelect: () => setEditing(path), disabled: stale });
      items.push({ label: "Copy Value", onSelect: () => navigator.clipboard && navigator.clipboard.writeText(row.variable.value).catch(() => {}) });
      if (row.variable.evaluateName) items.push({ label: "Add Watch", onSelect: () => controller.setWatches(controller.view.settings.watches.concat(row.variable.evaluateName)) });
      if (row.variable.memoryReference) {
        items.push({ separator: true });
        items.push({ label: "View Memory", onSelect: () => controller.viewMemory(row.variable.memoryReference) });
        items.push({ label: "Break When Value Changes", disabled: stale, onSelect: () => controller.breakOnChange(row.variable, row.parent) });
      }
      for (const extra of menu ? menu(row) : []) items.push(extra);
      setMenuAt({ x, y, items, path });
    },
    [controller, menu, stale],
  );

  const onKeyDown = (event) => {
    if (editing || event.target.tagName === "INPUT") return;
    const items = itemsOf(root.current);
    const at = items.findIndex((item) => item === document.activeElement);
    if (at < 0) return;
    const item = items[at];
    const path = item.dataset.path;
    const open = item.getAttribute("aria-expanded");
    const go = (to) => to && focusPath(to.dataset.path);
    switch (event.key) {
      case "ArrowDown":
        go(items[at + 1]);
        break;
      case "ArrowUp":
        go(items[at - 1]);
        break;
      case "Home":
        go(items[0]);
        break;
      case "End":
        go(items[items.length - 1]);
        break;
      case "ArrowRight":
        if (open === "false") toggle(path, true);
        else if (open === "true") go(items[at + 1]);
        break;
      case "ArrowLeft":
        if (open === "true") toggle(path, false);
        else go(items.slice(0, at).reverse().filter((entry) => levelOf(entry) < levelOf(item))[0]);
        break;
      case "Enter":
      case "F2":
        if (item.hasAttribute("data-editable") && !stale) setEditing(path);
        break;
      case "Delete":
        if (onRemove && levelOf(item) === 1) onRemove(Number(item.dataset.index));
        break;
      case "ContextMenu":
        item.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: item.getBoundingClientRect().left + 24, clientY: item.getBoundingClientRect().bottom }));
        break;
      default:
        return;
    }
    event.preventDefault();
    event.stopPropagation();
  };

  const context = useMemo(
    () => ({ controller, expanded, toggle, selected, select, editing, setEditing, values, stale, openMenu, hex, first: rows.length ? topPath(rows[0].name) : "" }),
    [controller, expanded, toggle, selected, select, editing, stale, openMenu, hex, rows],
  );

  return (
    <TreeContext.Provider value={context}>
      <ul ref={root} role="tree" aria-label={label} className={"debug-tree" + (stale ? " debug-tree--stale" : "")} onKeyDown={onKeyDown}>
        {rows.map((variable, i) => (
          <ValueRow key={variable.name + "#" + i} variable={variable} index={i} path={topPath(variable.name)} level={1} parent={reference} guides={[]} last={i === rows.length - 1} />
        ))}
      </ul>
      {menuAt && (
        <TreeContextMenu
          x={menuAt.x}
          y={menuAt.y}
          items={menuAt.items}
          onClose={() => {
            setMenuAt(null);
            focusPath(menuAt.path);
          }}
        />
      )}
    </TreeContext.Provider>
  );
}

export default ValueTree;
