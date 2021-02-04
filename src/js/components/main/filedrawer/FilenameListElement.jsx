import React, { useState } from "react";
import useClickPreventionOnDoubleClick from "../utility/doubleclickfix/useClickPreventionOnDoubleClick.js";

function FilenameListElement({ children, onClick, onDoubleClick }) {
  const [handleClick, handleDoubleClick] = useClickPreventionOnDoubleClick(
    onClick,
    onDoubleClick
  );

  return (
    <li onClick={handleClick} onDoubleClick={handleDoubleClick}>
      {children}
    </li>
  );
}

export default FilenameListElement;
