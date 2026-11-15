import React from "react";
import Checkbox from "./Checkbox.jsx";

// A tick box and its text, as Windows 98 draws one: the box centred on the text's first line, the text wrapping
// under itself (_check-option.scss). Clicking the text toggles the box.
function CheckOption({ id, checked, disabled, onChange, className = "", children }) {
  return (
    <label className={("check-option " + className).trim()}>
      <span className="check-option__box">
        <Checkbox id={id} checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
      </span>
      <span className="check-option__text">{children}</span>
    </label>
  );
}

export default CheckOption;
