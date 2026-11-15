import { useEffect, useRef, useState } from "react";

// Ticking rows with a selection rectangle, as Windows' list view selects with its marquee. A mouse or pen press
// outside every row's label (onLabelAt) starts it once the pointer has moved START_PX; the pointer is captured.
// The rectangle lives in the list's content coordinates, so it stays anchored to the rows while the list scrolls,
// and is kept inside the content. While the pointer is within EDGE_PX of an edge of the list, or past it, a timer
// scrolls that way, on both axes, faster the further out it is, also while the pointer is still. Ctrl (or Cmd)
// toggles the rows from their state when the drag began; Escape gives back that state and ends the drag. A touch
// keeps scrolling the list: held still on the background for LONG_PRESS_MS and released, it opens the menu.
//   onLabelAt(x, y): is the content point on a row's label; rowsIn(rect): the rows a content rectangle touches;
//   onStart(): the ticks when a drag begins; onChange(rows, toggle, start); onCancel(start); onLongPress(x, y).
const START_PX = 4;
const TOUCH_SLOP_PX = 8;
const LONG_PRESS_MS = 400;
const EDGE_PX = 24;
const TICK_MS = 30;
const MAX_STEP_PX = 48;

export default function useMarquee({ list, onLabelAt, rowsIn, onStart, onChange, onCancel, onLongPress }) {
  const [box, setBox] = useState(null);
  const handlers = useRef({});
  handlers.current = { onLabelAt, rowsIn, onStart, onChange, onCancel, onLongPress };
  const suppressClick = useRef(false);

  useEffect(() => {
    if (!list) return undefined;
    let s = null;
    const toContent = (clientX, clientY) => {
      const r = list.getBoundingClientRect();
      return { x: clientX - r.left - list.clientLeft + list.scrollLeft, y: clientY - r.top - list.clientTop + list.scrollTop };
    };
    const update = () => {
      const p = toContent(s.clientX, s.clientY);
      const x = Math.max(0, Math.min(s.width, p.x)), y = Math.max(0, Math.min(s.height, p.y));
      const rect = { left: Math.min(s.ax, x), top: Math.min(s.ay, y), right: Math.max(s.ax, x), bottom: Math.max(s.ay, y) };
      setBox(rect);
      handlers.current.onChange(handlers.current.rowsIn(rect), s.toggle, s.start);
    };
    // the step for a pointer `d` px into an edge's band, or past the edge
    const step = (d) => (d > 0 ? Math.min(MAX_STEP_PX, 2 + Math.round(d / 2)) : 0);
    const edgeScroll = () => {
      if (!s) return;
      const r = list.getBoundingClientRect();
      const left = r.left + list.clientLeft, top = r.top + list.clientTop;
      const dx = step(s.clientX - (left + list.clientWidth - EDGE_PX)) - step(left + EDGE_PX - s.clientX);
      const dy = step(s.clientY - (top + list.clientHeight - EDGE_PX)) - step(top + EDGE_PX - s.clientY);
      const x = list.scrollLeft, y = list.scrollTop;
      list.scrollLeft = x + dx;
      list.scrollTop = y + dy;
      if (list.scrollLeft !== x || list.scrollTop !== y) update();
    };
    const stop = (cancelled) => {
      if (!s) return;
      const ended = s;
      s = null;
      clearTimeout(ended.pressTimer);
      clearInterval(ended.scrollTimer);
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onCancelPointer, true);
      window.removeEventListener("keydown", onKey, true);
      try {
        if (ended.captured) list.releasePointerCapture(ended.pointerId);
      } catch (error) {
        /* already released */
      }
      if (!ended.active) return;
      if (cancelled) handlers.current.onCancel(ended.start);
      // the click that follows the release must not open or select a row
      suppressClick.current = true;
      setTimeout(() => {
        suppressClick.current = false;
      }, 0);
      setBox(null);
    };
    const onMove = (e) => {
      if (!s || e.pointerId !== s.pointerId) return;
      s.clientX = e.clientX;
      s.clientY = e.clientY;
      const moved = Math.hypot(e.clientX - s.x0, e.clientY - s.y0);
      if (s.touch) {
        if (moved > TOUCH_SLOP_PX) stop(false); // a swipe: the list scrolls natively
        return;
      }
      if (!s.active) {
        if (moved < START_PX) return;
        s.active = true;
        s.start = handlers.current.onStart();
        s.width = list.scrollWidth;
        s.height = list.scrollHeight;
        s.ax = Math.max(0, Math.min(s.width, s.ax));
        s.ay = Math.max(0, Math.min(s.height, s.ay));
        try {
          list.setPointerCapture(s.pointerId);
          s.captured = true;
        } catch (error) {
          /* the pointer is gone; the window listeners still track it */
        }
        s.scrollTimer = setInterval(edgeScroll, TICK_MS);
      }
      e.preventDefault();
      update();
    };
    const onUp = (e) => {
      if (!s || e.pointerId !== s.pointerId) return;
      if (s.touch && s.armed) handlers.current.onLongPress(s.x0, s.y0);
      stop(false);
    };
    const onCancelPointer = (e) => {
      if (s && e.pointerId === s.pointerId) stop(!s.touch);
    };
    const onKey = (e) => {
      if (e.key !== "Escape" || !s || !s.active) return;
      e.preventDefault();
      e.stopPropagation();
      stop(true);
    };
    const onDown = (e) => {
      if (s || e.button !== 0 || e.target.closest("input, button, .file-tree__toggle")) return;
      const r = list.getBoundingClientRect();
      // the list's own scrollbars (forced colours) are not the list
      if (e.clientX - r.left - list.clientLeft >= list.clientWidth || e.clientY - r.top - list.clientTop >= list.clientHeight) return;
      const p = toContent(e.clientX, e.clientY);
      const touch = e.pointerType === "touch";
      if (touch ? !!e.target.closest("[data-path]") : handlers.current.onLabelAt(p.x, p.y)) return;
      s = { touch, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY, clientX: e.clientX, clientY: e.clientY, ax: p.x, ay: p.y, toggle: e.ctrlKey || e.metaKey, active: false };
      if (touch) {
        s.pressTimer = setTimeout(() => {
          if (s) s.armed = true;
        }, LONG_PRESS_MS);
      }
      window.addEventListener("pointermove", onMove, true);
      window.addEventListener("pointerup", onUp, true);
      window.addEventListener("pointercancel", onCancelPointer, true);
      window.addEventListener("keydown", onKey, true);
    };
    list.addEventListener("pointerdown", onDown);
    return () => {
      list.removeEventListener("pointerdown", onDown);
      stop(true);
    };
  }, [list]);

  return { box, suppressClick };
}
