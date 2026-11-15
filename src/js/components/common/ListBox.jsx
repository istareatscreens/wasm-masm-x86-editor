import React from "react";
import RetroScrollArea from "./RetroScrollArea.jsx";

// A Windows 98 list box: a grey sunken field of rows to read (text or elements). Long rows wrap, so it never scrolls
// sideways; the Windows 98 vertical bar shows inside the field while the rows do not fit (_list-box.scss).
function ListBox({ label, items, className = "" }) {
  return (
    <RetroScrollArea label={label} vertical="auto" className={("list-box " + className).trim()}>
      <ul className="list-box__rows">
        {items.map((item, i) => (
          <li key={i} className="list-box__row">
            {item}
          </li>
        ))}
      </ul>
    </RetroScrollArea>
  );
}

export default ListBox;
