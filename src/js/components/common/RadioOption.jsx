import React from "react";

// A radio button and its text, as Windows 98 draws one: 98.css's button (_radio.scss) centred on the text's first
// line, the text wrapping under itself, as a tick box's option is (CheckOption, _check-option.scss). Clicking the
// text chooses it; buttons sharing a `name` are one group, which the arrow keys move through.
function RadioOption({ name, value, checked, disabled, onChange, className = "", children }) {
  return (
    <label className={("check-option " + className).trim()}>
      <span className="check-option__box">
        <input type="radio" className="radio" name={name} value={value} checked={checked} disabled={disabled} onChange={onChange} />
      </span>
      <span className="check-option__text">{children}</span>
    </label>
  );
}

export default RadioOption;
