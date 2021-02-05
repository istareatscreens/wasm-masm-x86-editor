import React, { useState } from "react";
import useClickPreventionOnDoubleClick from "../utility/doubleclickfix/useClickPreventionOnDoubleClick.js";

function FilenameListElement({
  children,
  onClick,
  onDoubleClick,
  isFileSelected,
}) {
  const [handleClick, handleDoubleClick] = useClickPreventionOnDoubleClick(
    onClick,
    onDoubleClick
  );

  return (
    <li
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={
        isFileSelected
          ? "FileDrawer__listItem FileDrawer__listItem--selected"
          : "FileDrawer__listItem"
      }
    >
      {children}
    </li>
  );
}

export default FilenameListElement;
