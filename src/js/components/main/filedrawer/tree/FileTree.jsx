import React, { forwardRef, startTransition, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { attachRetroScrollbars } from "../../../common/retroScrollbars.js";
import { parentOf, baseOf } from "../../utility/filesystem/paths";
import { PAGE_ROWS, pageCount, pageOf } from "../model/tree";
import FileTreeRow, { ROW_HEIGHT } from "./FileTreeRow.jsx";
import TreeContextMenu from "./TreeContextMenu.jsx";
import usePointerDrag from "../hooks/usePointerDrag.js";

// scrollIntoView({ block: "nearest" }) within the list alone: scrollIntoView also scrolls
// every scrollable ancestor, the page itself when the row lies outside the window
const showInList = (scroller, element) => {
  const outer = scroller.getBoundingClientRect();
  const top = outer.top + scroller.clientTop, left = outer.left + scroller.clientLeft;
  const box = element.getBoundingClientRect();
  if (box.top < top) scroller.scrollTop -= top - box.top;
  else if (box.bottom > top + scroller.clientHeight) scroller.scrollTop += box.bottom - top - scroller.clientHeight;
  if (box.left < left) scroller.scrollLeft -= left - box.left;
  else if (box.right > left + scroller.clientWidth) scroller.scrollLeft += box.right - left - scroller.clientWidth;
};

// The drawer's tree (WAI-ARIA tree pattern): rows from model/tree.ts, one roving tab stop,
// Explorer's keys, the context menu and drag-to-folder. The list keeps one scroll range
// for every row, but draws only the rows near the view: the pages (PAGE_ROWS rows) the
// view shows and one page before and after them, in normal flow between two spacers that
// stand for the rest; scrolling loads and unloads pages. All file operations go
// through `ops` (FileDrawer.jsx); this component only presents and routes input. Its
// ref's focus() puts the DOM focus on the row that holds the tab stop.
const FileTree = forwardRef(function FileTree({ rows, iconFor, checkFor, openFile, selected, focused, setFocused, cut, renaming, lightMode, ops }, ref) {
  const scrollHost = useRef(null);
  const list = useRef(null);
  const [listElement, setListElement] = useState(null); // the list, for the drag hook
  const padTop = useRef(0);
  const rowElements = useRef(new Map());
  const keyboardFocus = useRef(false);
  const pending = useRef(null); // a row to show (and focus) once it is drawn
  const lastFocused = useRef(null);
  const [view, setView] = useState({ top: 0, bottom: 0 }); // the pages at the view's edges
  const [menu, setMenu] = useState(null);

  useLayoutEffect(() => {
    padTop.current = parseFloat(getComputedStyle(list.current).paddingTop) || 0;
    setListElement(list.current);
  }, []);
  useEffect(() => {
    const controls = attachRetroScrollbars(list.current, scrollHost.current, "Files", { horizontal: "always" });
    return () => controls.destroy();
  }, []);

  // The view's pages follow the scroll position and the list's size. Scrolling into a
  // page next to the view finds it drawn already, and the page beyond is drawn as a
  // transition (in slices, so scrolling keeps its frame rate); a jump past the drawn pages
  // (dragging the thumb) is drawn before the browser paints.
  const viewRef = useRef(view);
  viewRef.current = view;
  useEffect(() => {
    const element = list.current;
    const measure = () => {
      const y = Math.max(0, element.scrollTop - padTop.current);
      const top = pageOf(Math.floor(y / ROW_HEIGHT));
      const bottom = pageOf(Math.floor((y + element.clientHeight) / ROW_HEIGHT));
      const now = viewRef.current;
      if (top === now.top && bottom === now.bottom) return;
      if (top < now.top - 1 || bottom > now.bottom + 1) flushSync(() => setView({ top, bottom }));
      else startTransition(() => setView({ top, bottom }));
    };
    element.addEventListener("scroll", measure, { passive: true });
    const resize = new ResizeObserver(measure);
    resize.observe(element);
    return () => {
      element.removeEventListener("scroll", measure);
      resize.disconnect();
    };
  }, []);

  const lastPage = pageCount(rows.length) - 1;
  const first = Math.max(0, Math.min(view.top, lastPage) - 1) * PAGE_ROWS;
  const last = Math.min(rows.length, (Math.min(view.bottom, lastPage) + 2) * PAGE_ROWS);
  const drawn = useMemo(() => rows.slice(first, last), [rows, first, last]);
  const indexOf = useMemo(() => new Map(rows.map((row, i) => [row.path, i])), [rows]);

  const { drag, onPointerDown, suppressClick } = usePointerDrag({
    list: listElement,
    itemsFor: ops.dragItems,
    check: ops.moveProblem,
    onDrop: ops.move,
    onRefuse: ops.notice,
    onExpand: (path) => ops.toggle(path, true),
    onLongPress: (row, x, y) => openMenu(row, x, y),
  });

  // The row with the one tab stop: the focused row or, when that row is not shown
  // (deleted, hidden by the switch or inside a collapsed folder), its nearest shown
  // ancestor, so the tree never loses its tab stop.
  const focusPath = useMemo(() => {
    let path = focused;
    while (path && !indexOf.has(path)) path = parentOf(path);
    return path;
  }, [indexOf, focused]);
  const focusIndex = indexOf.has(focusPath) ? indexOf.get(focusPath) : 0;

  // each row's place among its siblings (aria-posinset of aria-setsize): only the rows
  // near the view are in the DOM, so assistive technology cannot count them itself
  const positions = useMemo(() => {
    const siblings = new Map();
    const at = rows.map((row) => {
      const parent = row.kind === "root" ? null : parentOf(row.path);
      siblings.set(parent, (siblings.get(parent) || 0) + 1);
      return { parent, posinset: siblings.get(parent) };
    });
    return at.map(({ parent, posinset }) => ({ posinset, setsize: siblings.get(parent) }));
  }, [rows]);

  // Show a row: scrolled into view at once when it is drawn; else the list scrolls to it,
  // its page is drawn and setRowElement finishes the job.
  const reveal = (path, focus) => {
    const element = rowElements.current.get(path);
    if (element) {
      if (focus) element.focus({ preventScroll: true });
      showInList(list.current, element);
      return;
    }
    if (!indexOf.has(path)) return;
    const index = indexOf.get(path);
    const y = padTop.current + index * ROW_HEIGHT;
    const scroller = list.current;
    scroller.scrollTop = y < scroller.scrollTop ? y : y + ROW_HEIGHT - scroller.clientHeight;
    pending.current = { path, focus };
    setView({ top: pageOf(index), bottom: pageOf(index) });
  };
  const focusRow = () => reveal(focusPath, true);
  useImperativeHandle(ref, () => ({ focus: focusRow }), [focusPath, indexOf]);

  const setRowElement = useCallback((path, element) => {
    if (element) {
      rowElements.current.set(path, element);
      const want = pending.current;
      if (want && want.path === path) {
        pending.current = null;
        if (want.focus) element.focus({ preventScroll: true });
        showInList(list.current, element);
      }
      return;
    }
    const gone = rowElements.current.get(path);
    rowElements.current.delete(path);
    // the row with the DOM focus leaves the DOM (scrolled far away, deleted, moved or
    // renamed): the list takes the focus, so the keys keep working
    if (gone && gone.contains(document.activeElement) && list.current) list.current.focus({ preventScroll: true });
  }, []);

  // The DOM focus follows the tab stop after a keyboard move, and while the tree has the
  // focus (a file just created or opened takes the tab stop).
  useEffect(() => {
    const viaKeyboard = keyboardFocus.current;
    keyboardFocus.current = false;
    if (document.activeElement === rowElements.current.get(focusPath)) return;
    if (viaKeyboard || (list.current && list.current.contains(document.activeElement))) reveal(focusPath, true);
  }, [focusPath]);

  // An element of a row that had the focus and is gone (the rename box) leaves it on the
  // page body: it goes back to the tab stop.
  useEffect(() => {
    const last = lastFocused.current;
    const active = document.activeElement;
    if (last && !last.isConnected && (!active || active === document.body)) {
      lastFocused.current = null;
      focusRow();
    }
  });

  // a newly opened file is scrolled into view once its row exists (its folders open first)
  const openToShow = useRef(null);
  useEffect(() => {
    openToShow.current = openFile;
  }, [openFile]);
  useEffect(() => {
    const path = openToShow.current;
    if (path && indexOf.has(path)) {
      openToShow.current = null;
      reveal(path, false);
    }
  });

  const openMenu = (row, x, y) => {
    setFocused(row.path);
    setMenu({ row, x, y });
  };
  // a closing menu hands the focus back to its row (an item that opens a dialog or the
  // rename box moves it on from there)
  const closeMenu = () => {
    setMenu(null);
    const active = document.activeElement;
    if (!active || active === document.body || active.closest(".tree-menu")) focusRow();
  };

  const actions = useMemo(
    () => ({
      activate: (row) => ops.activate(row),
      doubleActivate: (row) => ops.doubleActivate(row),
      toggle: (path) => ops.toggle(path),
      check: (row, value) => ops.check(row, value),
      focus: (row) => setFocused(row.path),
      contextMenu: (row, x, y) => openMenu(row, x, y),
      pointerDown: (event, row) => onPointerDown(event, row),
      dragJustEnded: () => suppressClick.current,
      rename: (path, name) => ops.rename(path, name),
      renameCancel: () => ops.renameCancel(),
      renameProblem: (path, name) => ops.renameProblem(path, name),
    }),
    // ops is memoised by FileDrawer; onPointerDown reads its handlers through a ref
    [ops, setFocused, onPointerDown],
  );

  const onKeyDown = (event) => {
    if (menu || renaming !== null) return;
    const at = focusIndex;
    const row = rows[at];
    const go = (i) => {
      keyboardFocus.current = true;
      setFocused(rows[Math.max(0, Math.min(rows.length - 1, i))].path);
    };
    const folderOf = (r) => (r.kind === "file" ? parentOf(r.path) : r.path);
    const ctrl = event.ctrlKey || event.metaKey;
    if (event.key === "ArrowDown") go(at + 1);
    else if (event.key === "ArrowUp") go(at - 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(rows.length - 1);
    else if (event.key === "ArrowRight") {
      if (row.kind === "folder" && row.hasChildren && !row.expanded) ops.toggle(row.path, true);
      else if (row.expanded && rows[at + 1] && rows[at + 1].depth > row.depth) go(at + 1);
    } else if (event.key === "ArrowLeft") {
      if (row.kind === "folder" && row.expanded) ops.toggle(row.path, false);
      else if (row.kind !== "root") go(rows.findIndex((r) => r.path === parentOf(row.path)));
    } else if (event.key === "Enter") ops.activate(row, true);
    else if (event.key === "F2" && row.kind !== "root") ops.renameStart(row.path);
    else if (event.key === "Delete" && row.kind !== "root") ops.deleteRow(row);
    else if (event.key === " " && row.kind !== "root") ops.check(row, checkFor(row) !== "checked");
    else if (event.key === "ContextMenu" || (event.key === "F10" && event.shiftKey)) {
      const label = event.currentTarget.querySelector('[data-path="' + CSS.escape(row.path) + '"] .file-tree__label');
      const rect = (label || event.currentTarget).getBoundingClientRect();
      openMenu(row, rect.left + 8, label ? rect.bottom : rect.top + 8);
    } else if (ctrl && (event.key === "x" || event.key === "X") && row.kind !== "root") ops.cut(row);
    else if (ctrl && (event.key === "v" || event.key === "V")) ops.paste(folderOf(row));
    else if (event.key === "Escape" && cut.size) ops.clearCut();
    else return;
    event.preventDefault();
    event.stopPropagation();
  };

  const menuItems = (row) => {
    const folder = row.kind === "file" ? parentOf(row.path) : row.path;
    const pasteProblem = cut.size ? ops.moveProblem(Array.from(cut), folder) : "nothing to paste";
    return [
      row.kind === "file"
        ? { label: "Open", onSelect: () => ops.activate(row, true) }
        : { label: row.expanded ? "Collapse" : "Expand", onSelect: () => ops.toggle(row.path), disabled: !row.hasChildren || row.kind === "root" },
      { separator: true },
      { label: "New File...", onSelect: () => ops.newFile(folder) },
      { label: "New Folder...", onSelect: () => ops.newFolder(folder) },
      { separator: true },
      { label: "Cut", onSelect: () => ops.cut(row), disabled: row.kind === "root" },
      { label: "Paste", onSelect: () => ops.paste(folder), disabled: !!pasteProblem },
      { separator: true },
      { label: "Rename", onSelect: () => ops.renameStart(row.path), disabled: row.kind === "root" },
      { label: "Delete", onSelect: () => ops.deleteRow(row), disabled: row.kind === "root" },
    ];
  };

  // the list itself is the tab stop while the focused row is not drawn
  const focusDrawn = focusIndex >= first && focusIndex < last;
  const ghostRow = drag && rows.find((row) => row.path === drag.row.path);
  return (
    <div className="file-drawer-scroll retro-scroll-host" ref={scrollHost}>
      <ul
        ref={list}
        role="tree"
        aria-label="Files on D:"
        tabIndex={focusDrawn ? -1 : 0}
        className={"file-drawer__list tree-view file-tree" + (lightMode ? "" : " file-drawer__list--dark file-tree--dark")}
        onKeyDown={onKeyDown}
        onFocus={(event) => {
          lastFocused.current = event.target;
        }}
      >
        {first > 0 && <li key="above" className="file-tree__spacer" data-spacer="" role="presentation" aria-hidden="true" style={{ height: first * ROW_HEIGHT }} />}
        {drawn.map((row) => (
          <FileTreeRow
            key={row.path || "(root)"}
            row={row}
            posinset={positions[indexOf.get(row.path)].posinset}
            setsize={positions[indexOf.get(row.path)].setsize}
            icon={iconFor(row)}
            check={row.kind === "root" ? undefined : checkFor(row)}
            isOpen={row.path === openFile}
            isSelected={row.path === selected}
            isFocused={row.path === focusPath}
            isCut={cut.has(row.path)}
            isDropTarget={!!drag && drag.target === row.path && !drag.problem}
            isRenaming={renaming === row.path}
            actions={actions}
            setRowElement={setRowElement}
          />
        ))}
        {last < rows.length && <li key="below" className="file-tree__spacer" data-spacer="" role="presentation" aria-hidden="true" style={{ height: (rows.length - last) * ROW_HEIGHT }} />}
      </ul>
      {drag &&
        createPortal(
          <div className={"file-tree__ghost" + (lightMode ? "" : " file-tree__ghost--dark")} style={{ left: drag.x + 12, top: drag.y + 8 }} aria-hidden="true">
            <img className="file-tree__icon" src={iconFor(ghostRow || drag.row)} alt="" />
            <span>{ghostRow ? ghostRow.name : baseOf(drag.row.path)}{drag.items.length > 1 ? " (+" + (drag.items.length - 1) + ")" : ""}</span>
          </div>,
          document.body,
        )}
      {menu && <TreeContextMenu x={menu.x} y={menu.y} items={menuItems(menu.row)} onClose={closeMenu} />}
    </div>
  );
});

export default FileTree;
