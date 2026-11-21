import React, { forwardRef, useCallback, useLayoutEffect, useState } from "react";
import useRetroScrollbars from "./useRetroScrollbars.js";

// A Windows 98 multi-line text field with an always-shown Windows 98 vertical bar (disabled while the text fits).
// A new value is no DOM mutation, so the bar is updated here.
const RetroTextArea = forwardRef(function RetroTextArea({ label, className = "", value, onInput, ...props }, ref) {
  const [host, setHost] = useState(null);
  const [area, setArea] = useState(null);
  const controls = useRetroScrollbars(area, host, label);
  const setRefs = useCallback(
    (element) => {
      setArea(element);
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    },
    [ref],
  );
  const update = () => {
    if (controls.current) controls.current.update();
  };
  useLayoutEffect(update, [value, area]);
  return (
    <div ref={setHost} className={("retro-scroll-host text-area " + (props.readOnly ? "text-area--read-only " : "") + (props.disabled ? "text-area--disabled " : "") + className).trim()}>
      <textarea
        ref={setRefs}
        className="text-area__input"
        aria-label={label}
        value={value}
        onInput={(event) => {
          update();
          if (onInput) onInput(event);
        }}
        {...props}
      />
    </div>
  );
});

export default RetroTextArea;
