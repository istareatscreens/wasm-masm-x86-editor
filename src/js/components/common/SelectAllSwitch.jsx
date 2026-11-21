import React from "react";

const LABELS = ["Select All", "Select None"];

// A push button that ticks or unticks every tick box of a list: pushed in and reading "Select None" while all are
// ticked, out and reading "Select All" otherwise. Both labels share one cell, so the button keeps its width.
function SelectAllSwitch({ checked, onChange, disabled = false, title, className = "" }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={("btn btn--text select-all-switch " + className).trim()}
      disabled={disabled}
      title={title}
      onClick={() => onChange(!checked)}
    >
      <span className="select-all-switch__labels">
        {LABELS.map((text, i) => (
          <span key={text} className={"select-all-switch__label" + (i === 1 === checked ? "" : " select-all-switch__label--hidden")}>
            {text}
          </span>
        ))}
      </span>
    </button>
  );
}

export default SelectAllSwitch;
