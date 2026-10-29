import React from "react";
import { guestPath } from "../utility/filesystem/paths";

// Above a non-.asm file: its D:\ path and how it is shown, "Edit as text" or "View in hex"
// (a pair of 98.css buttons, the current one pressed).
function ViewModeBanner({ filename, view, binary, onView }) {
  const choice = (mode, label) => (
    <button
      type="button"
      role="radio"
      aria-checked={view === mode}
      className={"btn btn--text view-mode-banner__btn" + (view === mode ? " view-mode-banner__btn--on" : "")}
      onClick={() => view !== mode && onView(mode)}
    >
      {label}
    </button>
  );
  return (
    <div className="view-mode-banner">
      <span className="view-mode-banner__name" title={guestPath(filename)}>
        {guestPath(filename)}
      </span>
      {binary && view === "text" && <span className="view-mode-banner__note">binary file shown as text</span>}
      <span className="view-mode-banner__choices" role="radiogroup" aria-label="Show this file as">
        {choice("text", "Edit as text")}
        {choice("hex", "View in hex")}
      </span>
    </div>
  );
}

export default ViewModeBanner;
