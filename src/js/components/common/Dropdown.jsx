import React from "react";

function ThemeSelect({ options, selectedId }) {
  return (
    <select class="select-box">
      {options &&
        options.map((option) =>
          selectedId == option.id ? (
            <option selected id={option.id}>
              {option.value}
            </option>
          ) : (
            <option id={option.id}>{option.text}</option>
          )
        )}
    </select>
  );
}

export default ThemeSelect;
