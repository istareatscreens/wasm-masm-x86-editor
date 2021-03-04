import React from "react";

function ThemeSelect(props) {
  return (
    <select class="select-box">
      <option>5 - Incredible!</option>
      <option>4 - Great!</option>
      <option selected>3 - Pretty good</option>
      <option>2 - Not so great</option>
      <option>1 - Unfortunate</option>
    </select>
  );
}

export default ThemeSelect;
