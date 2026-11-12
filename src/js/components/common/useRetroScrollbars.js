import { useLayoutEffect, useRef } from "react";
import { attachRetroScrollbars } from "./retroScrollbars.js";

// Windows 98 scrollbars for `surface` (the element that scrolls), drawn inside `host`, for as long as
// both elements are mounted; pass the elements themselves (callback-ref state), so a surface created
// after mount (CodeMirror's scrollDOM, react-window's list) is attached when it appears. The ref holds
// the controls, for an update() after a change the presenter's observers cannot see.
export default function useRetroScrollbars(surface, host, label, { horizontal, vertical } = {}) {
  const controls = useRef(null);
  useLayoutEffect(() => {
    if (!surface || !host) return undefined;
    const options = {};
    if (horizontal) options.horizontal = horizontal;
    if (vertical) options.vertical = vertical;
    const attached = attachRetroScrollbars(surface, host, label, options);
    controls.current = attached;
    return () => {
      attached.destroy();
      if (controls.current === attached) controls.current = null;
    };
  }, [surface, host, label, horizontal, vertical]);
  return controls;
}
