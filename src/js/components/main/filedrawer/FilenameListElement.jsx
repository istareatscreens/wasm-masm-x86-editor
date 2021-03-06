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
    <div
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={
        isFileSelected
          ? "file-drawer__list__group--name file-drawer__list__group--selected"
          : "file-drawer__list__group--name"
      }
    >
      {children}
    </div>
  );
}

export default FilenameListElement;
