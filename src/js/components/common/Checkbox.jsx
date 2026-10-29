import React, { forwardRef, useCallback, useEffect, useRef } from "react";

// The retro tick box (.checkbox): the file drawer's rows and select-all box, and the
// windows' options. `indeterminate` is a DOM property only, so it is set after every
// render (a click clears it in the DOM whatever the props say).
const Checkbox = forwardRef(({ className = "", indeterminate = false, ...props }, ref) => {
  const box = useRef(null);
  const setBox = useCallback(
    (element) => {
      box.current = element;
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    },
    [ref]
  );
  useEffect(() => {
    if (box.current) box.current.indeterminate = indeterminate;
  });
  return <input ref={setBox} type="checkbox" className={`checkbox ${className}`} {...props} />;
});

export default Checkbox;
