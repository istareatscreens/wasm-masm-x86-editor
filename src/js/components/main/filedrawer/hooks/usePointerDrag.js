import { useCallback, useEffect, useRef, useState } from "react";

// Dragging rows onto folders with Pointer Events (mouse, pen and touch alike; HTML5
// drag-and-drop has no touch support and loses the pointer over the terminal iframe).
// A mouse or pen drag starts after DRAG_PX of movement; a touch drag after a LONG_PRESS_MS
// press (a swipe before that scrolls the list natively; a press released without moving
// opens the context menu). The pointer is captured, so a drag survives leaving the
// drawer, the iframe or the window. A collapsed folder hovered for HOVER_EXPAND_MS opens;
// the list scrolls while the pointer is near its top or bottom edge; Escape cancels.
const DRAG_PX = 4;
const TOUCH_SLOP_PX = 8;
const LONG_PRESS_MS = 400;
const HOVER_EXPAND_MS = 700;
const EDGE_PX = 24;
const SCROLL_STEP_PX = 12;

// list: the scrolling list element (null until it is mounted).
export default function usePointerDrag({ list, itemsFor, check, onDrop, onRefuse, onExpand, onLongPress }) {
  const [drag, setDrag] = useState(null); // { items, row, x, y, target, problem }
  const listRef = useRef(list);
  listRef.current = list;
  const session = useRef(null);
  const suppressClick = useRef(false);
  const handlers = useRef({});
  handlers.current = { itemsFor, check, onDrop, onRefuse, onExpand, onLongPress };

  const stopScroll = (s) => {
    if (s.scrollTimer) clearInterval(s.scrollTimer);
    s.scrollTimer = 0;
    s.scrollBy = 0;
  };

  const finish = useCallback(() => {
    const s = session.current;
    session.current = null;
    if (!s) return;
    clearTimeout(s.pressTimer);
    clearTimeout(s.hoverTimer);
    stopScroll(s);
    try {
      if (s.captured) s.el.releasePointerCapture(s.pointerId);
    } catch (error) {
      /* already released */
    }
    window.removeEventListener("pointermove", s.onMove, true);
    window.removeEventListener("pointerup", s.onUp, true);
    window.removeEventListener("pointercancel", s.onCancel, true);
    window.removeEventListener("keydown", s.onKey, true);
    document.documentElement.classList.remove("file-tree-dragging", "file-tree-no-drop");
    setDrag(null);
  }, []);

  useEffect(() => finish, [finish]);

  // Once a touch drag is armed the list must not pan under the finger. The listener is
  // registered up front, not on the press: the moves of a touch that began with no
  // blocking touchmove listener are uncancelable, and the browser's pan would end the drag.
  useEffect(() => {
    if (!list) return undefined;
    const hold = (event) => {
      const s = session.current;
      if (s && s.touch && s.armed && event.cancelable) event.preventDefault();
    };
    list.addEventListener("touchmove", hold, { passive: false });
    return () => list.removeEventListener("touchmove", hold);
  }, [list]);

  const begin = (s, x, y) => {
    s.dragging = true;
    try {
      s.el.setPointerCapture(s.pointerId);
      s.captured = true;
    } catch (error) {
      /* the pointer is gone; the window listeners still track it */
    }
    s.items = handlers.current.itemsFor(s.row.path);
    document.documentElement.classList.add("file-tree-dragging");
    setDrag({ items: s.items, row: s.row, x, y, target: null, problem: null });
  };

  // the drop target under the pointer: a folder row, the (D:) row, or the empty list
  // area below the rows (= D:\); a file row, and the space of rows not drawn yet
  // (data-spacer), are no target
  const targetAt = (x, y) => {
    const list = listRef.current;
    const hit = document.elementFromPoint(x, y);
    if (!list || !hit || !list.contains(hit) || hit.closest("[data-spacer]")) return { target: null, rowEl: null };
    const rowEl = hit.closest("[data-path]");
    if (!rowEl) return { target: "", rowEl: null };
    return { target: rowEl.getAttribute("data-kind") === "file" ? null : rowEl.getAttribute("data-path"), rowEl };
  };

  const autoScroll = (s, y) => {
    const list = listRef.current;
    if (!list) return;
    const box = list.getBoundingClientRect();
    const by = y < box.top + EDGE_PX ? -SCROLL_STEP_PX : y > box.bottom - EDGE_PX ? SCROLL_STEP_PX : 0;
    if (by === s.scrollBy) return;
    stopScroll(s);
    if (!by) return;
    s.scrollBy = by;
    s.scrollTimer = setInterval(() => {
      list.scrollTop += by;
    }, 30);
  };

  // stable: everything it uses is a ref, a state setter or a pure helper
  const onPointerDown = useCallback((event, row) => {
    if (event.button !== 0 || row.kind === "root" || session.current) return;
    if (event.target.closest("input, .file-tree__toggle")) return; // checkbox, rename box and +/- keep their own clicks
    const s = {
      row,
      el: event.currentTarget,
      pointerId: event.pointerId,
      x0: event.clientX,
      y0: event.clientY,
      touch: event.pointerType === "touch",
      armed: event.pointerType !== "touch",
      dragging: false,
      target: null,
      problem: null,
      hover: null,
    };
    s.onMove = (e) => {
      if (e.pointerId !== s.pointerId) return;
      if (!s.dragging) {
        const moved = Math.hypot(e.clientX - s.x0, e.clientY - s.y0);
        if (!s.armed) {
          if (moved > TOUCH_SLOP_PX) finish(); // a swipe: the list scrolls natively
          return;
        }
        if (moved < (s.touch ? TOUCH_SLOP_PX : DRAG_PX)) return;
        begin(s, e.clientX, e.clientY);
      }
      e.preventDefault();
      const { target, rowEl } = targetAt(e.clientX, e.clientY);
      s.target = target;
      s.problem = target === null ? "Drop on a folder or on (D:)." : handlers.current.check(s.items, target);
      // hover over a collapsed folder opens it
      const collapsed = rowEl && rowEl.getAttribute("aria-expanded") === "false" ? rowEl.getAttribute("data-path") : null;
      if (collapsed !== s.hover) {
        clearTimeout(s.hoverTimer);
        s.hover = collapsed;
        if (collapsed !== null) s.hoverTimer = setTimeout(() => handlers.current.onExpand(collapsed), HOVER_EXPAND_MS);
      }
      autoScroll(s, e.clientY);
      document.documentElement.classList.toggle("file-tree-no-drop", !!s.problem);
      setDrag((prev) => prev && { ...prev, x: e.clientX, y: e.clientY, target, problem: s.problem });
    };
    s.onUp = (e) => {
      if (e.pointerId !== s.pointerId) return;
      if (s.dragging) {
        // the click that follows the release must not open or select the row
        suppressClick.current = true;
        setTimeout(() => {
          suppressClick.current = false;
        }, 0);
        if (s.target !== null && !s.problem) handlers.current.onDrop(s.items, s.target);
        else if (s.target !== null) handlers.current.onRefuse(s.problem);
      } else if (s.touch && s.armed) {
        handlers.current.onLongPress(s.row, s.x0, s.y0);
      }
      finish();
    };
    s.onCancel = (e) => {
      if (e.pointerId === s.pointerId) finish();
    };
    s.onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finish();
      }
    };
    if (s.touch) {
      s.pressTimer = setTimeout(() => {
        s.armed = true;
        if (navigator.vibrate) {
          try {
            navigator.vibrate(10);
          } catch (error) {
            /* not allowed here */
          }
        }
      }, LONG_PRESS_MS);
    }
    session.current = s;
    window.addEventListener("pointermove", s.onMove, true);
    window.addEventListener("pointerup", s.onUp, true);
    window.addEventListener("pointercancel", s.onCancel, true);
    window.addEventListener("keydown", s.onKey, true);
  }, [finish]);

  return { drag, onPointerDown, suppressClick };
}
