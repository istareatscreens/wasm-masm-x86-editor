import React, { useRef, useState } from "react";

import { addTravel, edgeStep, keepInView, scrollParentOf, scrollTo, viewOf } from "./edgeScroll.js";

const STEP = 0.01;
const PAGE = 0.1;

// A WAI-ARIA window splitter. `value` is the first pane's share of the space `measure()` gives ({ size } in
// pixels, { min, max } shares). A drag calls onChange once per frame and onCommit at the end, Escape puts it
// back; <html data-resizing> keeps iframes out of the drag. A double-click calls onReset. With `scrolls` the handle
// is inside a scrolling area: a drag held at its edge keeps resizing and scrolls it, and the keyboard keeps the
// handle in view.
function SplitHandle({ orientation, value, measure, onChange, onCommit, onReset, label, title, controls, className = "", step = STEP, page = PAGE, scrolls = false }) {
  const vertical = orientation === "vertical";
  const drag = useRef(null);
  const [dragging, setDragging] = useState(false);
  const coordinate = (event) => (vertical ? event.clientX : event.clientY);
  // to 0.01 %: the stored shares stay short and the keyboard's steps do not drift
  const clamp = (share, { min, max }) => Math.round(Math.min(max, Math.max(min, share)) * 10000) / 10000;
  const shareOf = (session) => clamp(session.start + (session.pointer - session.origin + session.travel) / session.space.size, session.space);
  const apply = (session) => {
    const next = shareOf(session);
    if (next === session.value) return;
    session.value = next;
    onChange(next);
  };

  const finish = (commit) => {
    const session = drag.current;
    if (!session) return;
    drag.current = null;
    cancelAnimationFrame(session.frame);
    cancelAnimationFrame(session.edgeFrame);
    window.removeEventListener("keydown", session.onKey, true);
    window.removeEventListener("pointerup", session.onUp, true);
    document.documentElement.removeAttribute("data-resizing");
    try {
      if (session.target.hasPointerCapture(session.pointerId)) session.target.releasePointerCapture(session.pointerId);
    } catch (error) {
      // the pointer is gone already
    }
    // the keyboard focus back where it was before the drag (a resize does not take it from the editor
    // or the terminal); when nothing had it, the splitter lets it go, so it does not stay drawn as focused
    const before = session.focusBefore;
    if (before !== session.target && document.activeElement === session.target) {
      if (before && before !== document.body && before.isConnected) before.focus({ preventScroll: true });
      else session.target.blur();
    }
    setDragging(false);
    if (commit) onCommit(session.value);
  };

  const onPointerDown = (event) => {
    if (event.button !== 0 || drag.current) return;
    event.preventDefault();
    const target = event.currentTarget;
    const space = measure();
    // the splitter has the keyboard focus for the drag, so Escape reaches it even when the focus was in
    // a frame (the terminal); preventDefault above keeps the browser from moving it
    const origin = coordinate(event);
    const area = scrolls ? scrollParentOf(target, vertical) : null;
    const session = { target, pointerId: event.pointerId, origin, pointer: origin, travel: 0, start: value, value, space, area, frame: 0, edgeFrame: 0, focusBefore: document.activeElement };
    target.focus({ preventScroll: true });
    session.onKey = (key) => {
      if (key.key !== "Escape") return;
      key.preventDefault();
      key.stopPropagation();
      session.value = session.start;
      onChange(session.start);
      finish(false);
    };
    session.onUp = (up) => onPointerUp(up);
    // held within the area's edge band: a step a frame, the handle kept under the pointer; it stops when the
    // pointer leaves the band or the size reaches its limit, and the next move starts it again
    session.edge = () => {
      session.edgeFrame = 0;
      if (drag.current !== session) return;
      const [from, to] = viewOf(area, vertical);
      const step = edgeStep(session.pointer, from, to, session.pointer - session.origin);
      if (!step) return;
      scrollTo(target, area, Math.min(Math.max(session.pointer, from), to), vertical);
      const travel = addTravel({ start: session.start, moved: session.pointer - session.origin, travel: session.travel, step, size: space.size, min: space.min, max: space.max });
      if (travel === session.travel) return;
      session.travel = travel;
      apply(session);
      session.edgeFrame = requestAnimationFrame(session.edge);
    };
    try {
      target.setPointerCapture(event.pointerId);
    } catch (error) {
      // no capture: the window's pointerup below still ends the drag
    }
    window.addEventListener("keydown", session.onKey, true);
    window.addEventListener("pointerup", session.onUp, true);
    document.documentElement.setAttribute("data-resizing", vertical ? "x" : "y");
    drag.current = session;
    setDragging(true);
  };

  const onPointerMove = (event) => {
    const session = drag.current;
    if (!session || event.pointerId !== session.pointerId) return;
    session.pointer = coordinate(event);
    if (!session.frame) {
      session.frame = requestAnimationFrame(() => {
        session.frame = 0;
        if (drag.current === session) apply(session);
      });
    }
    if (session.area && !session.edgeFrame) session.edgeFrame = requestAnimationFrame(session.edge);
  };

  const onPointerUp = (event) => {
    const session = drag.current;
    if (!session || event.pointerId !== session.pointerId) return;
    session.pointer = coordinate(event);
    apply(session);
    finish(true);
  };

  const onKeyDown = (event) => {
    const space = measure();
    const back = vertical ? "ArrowLeft" : "ArrowUp";
    const forward = vertical ? "ArrowRight" : "ArrowDown";
    const moves = {
      [back]: value - (event.shiftKey ? page : step),
      [forward]: value + (event.shiftKey ? page : step),
      PageUp: value - page,
      PageDown: value + page,
      Home: space.min,
      End: space.max,
    };
    if (!Object.prototype.hasOwnProperty.call(moves, event.key)) return;
    event.preventDefault();
    const next = clamp(moves[event.key], space);
    onChange(next);
    onCommit(next);
    if (scrolls) {
      const target = event.currentTarget;
      requestAnimationFrame(() => {
        const area = scrollParentOf(target, vertical);
        if (area) keepInView(target, area, vertical);
      });
    }
  };

  return (
    <div
      className={`split-handle split-handle--${vertical ? "vertical" : "horizontal"}${dragging ? " split-handle--dragging" : ""} ${className}`}
      role="separator"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      aria-label={label}
      title={title}
      aria-controls={controls}
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => finish(true)}
      onLostPointerCapture={() => finish(true)}
      onKeyDown={onKeyDown}
      onDoubleClick={onReset}
    />
  );
}

export default SplitHandle;
