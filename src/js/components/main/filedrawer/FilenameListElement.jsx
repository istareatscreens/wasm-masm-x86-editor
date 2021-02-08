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
          ? "file-drawer__list__group--name FileDrawer__list__group--selected"
          : "file-drawer__list__group--name"
      }
      style={{
        "-webkit-touch-callout": "none",
        "-webkit-user-select": "none",
        "-khtml-user-select": "none",
        "-moz-user-select": "none",
        "-ms-user-select": "none",
        "user-select": "none",
      }}
    >
      {children}
    </li>
  );
}

export default FilenameListElement;
