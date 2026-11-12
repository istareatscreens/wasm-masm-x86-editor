import React, { useRef, useState } from "react";

const STEP = 0.01;
const PAGE = 0.1;

// A Windows 98 splitter between two panes (WAI-ARIA window splitter). `value` is the first pane's share
// of the space `measure()` describes ({ size } in pixels and the { min, max } shares allowed). Dragging
// (mouse, pen or touch; the pointer is captured and <html data-resizing> keeps iframes out of the drag)
// calls onChange once per frame and onCommit at the end; Escape puts the splitter back where the drag
// started. Focused, the arrow keys move it 1 %, Shift+arrows, Page Up and Page Down 10 %, Home and End
// to its limits; a double-click calls onReset.
function SplitHandle({ orientation, value, measure, onChange, onCommit, onReset, label, controls, className = "" }) {
  const vertical = orientation === "vertical";
  const drag = useRef(null);
  const [dragging, setDragging] = useState(false);
  const coordinate = (event) => (vertical ? event.clientX : event.clientY);
  // to 0.01 %: the stored shares stay short and the keyboard's steps do not drift
  const clamp = (share, { min, max }) => Math.round(Math.min(max, Math.max(min, share)) * 10000) / 10000;

  const finish = (commit) => {
    const session = drag.current;
    if (!session) return;
    drag.current = null;
    cancelAnimationFrame(session.frame);
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
    const session = { target, pointerId: event.pointerId, origin: coordinate(event), start: value, value, space, pending: null, frame: 0, focusBefore: document.activeElement };
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
    session.pending = clamp(session.start + (coordinate(event) - session.origin) / session.space.size, session.space);
    if (!session.frame) {
      session.frame = requestAnimationFrame(() => {
        session.frame = 0;
        if (drag.current !== session || session.pending === null) return;
        session.value = session.pending;
        onChange(session.value);
      });
    }
  };

  const onPointerUp = (event) => {
    const session = drag.current;
    if (!session || event.pointerId !== session.pointerId) return;
    if (session.pending !== null && session.pending !== session.value) {
      session.value = session.pending;
      onChange(session.value);
    }
    finish(true);
  };

  const onKeyDown = (event) => {
    const space = measure();
    const back = vertical ? "ArrowLeft" : "ArrowUp";
    const forward = vertical ? "ArrowRight" : "ArrowDown";
    const moves = {
      [back]: value - (event.shiftKey ? PAGE : STEP),
      [forward]: value + (event.shiftKey ? PAGE : STEP),
      PageUp: value - PAGE,
      PageDown: value + PAGE,
      Home: space.min,
      End: space.max,
    };
    if (!Object.prototype.hasOwnProperty.call(moves, event.key)) return;
    event.preventDefault();
    const next = clamp(moves[event.key], space);
    onChange(next);
    onCommit(next);
  };

  return (
    <div
      className={`split-handle split-handle--${vertical ? "vertical" : "horizontal"}${dragging ? " split-handle--dragging" : ""} ${className}`}
      role="separator"
      aria-orientation={vertical ? "vertical" : "horizontal"}
      aria-label={label}
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
