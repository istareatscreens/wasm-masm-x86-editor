import React from "react";

// A Windows 98 radio button and its text, laid out like CheckOption; buttons sharing a `name` are one group.
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
