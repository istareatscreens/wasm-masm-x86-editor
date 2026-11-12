import React, { useState } from "react";
import useRetroScrollbars from "./useRetroScrollbars.js";

// A part of a window that scrolls with Windows 98 scrollbars: the host draws the rails, the surface
// holds the content. A region (the default) is a named tab stop, so the keyboard scrolls it; without
// it the area only catches content that does not fit, and its rail takes the focus when it is shown.
function RetroScrollArea({ label, region = true, horizontal, vertical, className = "", surfaceClassName = "", children }) {
  const [host, setHost] = useState(null);
  const [surface, setSurface] = useState(null);
  useRetroScrollbars(surface, host, label, { horizontal, vertical });
  return (
    <div ref={setHost} className={("retro-scroll-host retro-scroll-area " + className).trim()}>
      <div
        ref={setSurface}
        className={("retro-scroll-area__surface " + surfaceClassName).trim()}
        {...(region ? { role: "region", "aria-label": label, tabIndex: 0 } : {})}
      >
        {children}
      </div>
    </div>
  );
}

export default RetroScrollArea;
