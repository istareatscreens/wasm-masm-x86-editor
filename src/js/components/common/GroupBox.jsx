import React from "react";

// A Windows 98 group box: an etched frame with its caption on the frame's top line (_group-box.scss).
function GroupBox({ caption, className = "", children }) {
  return (
    <fieldset className={("group-box " + className).trim()}>
      <legend className="group-box__caption">{caption}</legend>
      {children}
    </fieldset>
  );
}

export default GroupBox;
