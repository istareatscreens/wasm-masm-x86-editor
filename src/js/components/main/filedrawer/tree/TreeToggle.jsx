import React from "react";

// The 9-px +/- box on a folder's connector line (98.css tree view).
function TreeToggle({ expanded, onToggle }) {
  return (
    <span
      className={"file-tree__toggle" + (expanded ? " file-tree__toggle--open" : "")}
      aria-hidden="true"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onDoubleClick={(event) => event.stopPropagation()}
    />
  );
}

export default TreeToggle;
