import React from "react";

function ThemeSelect({ options, selected, classNameDropDown, handleChange }) {
  return (
    <select
      onChange={handleChange}
      className={`select-box ${classNameDropDown}`}
      defaultValue={selected.text}
    >
      {options &&
        options.map((option) => <option key={option.id}>{option.text}</option>)}
    </select>
  );
}

export default ThemeSelect;
