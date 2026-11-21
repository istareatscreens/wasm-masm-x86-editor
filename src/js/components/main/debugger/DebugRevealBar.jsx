import React, { forwardRef } from "react";

import PixelIcon from "../../common/PixelIcon.jsx";
import bugIcon from "../../../../images/debugRevealBug.png";

// The bar left in the hidden debug sidebar's place; `onReveal` gets true when the keyboard pressed it.
const DebugRevealBar = forwardRef(function DebugRevealBar({ onReveal }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className="debug-reveal-bar"
      aria-label="Show the debug sidebar"
      aria-expanded="false"
      aria-controls="debug-pane"
      title="Show the debug sidebar"
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => onReveal(event.detail === 0)}
    >
      <span className="debug-reveal-bar__arrow" aria-hidden="true" />
      <PixelIcon src={bugIcon} pixels={7} rem={0.7} className="debug-reveal-bar__bug" />
      <span className="debug-reveal-bar__arrow" aria-hidden="true" />
    </button>
  );
});

export default DebugRevealBar;
