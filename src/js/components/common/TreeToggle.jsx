import React from "react";

// The 9-px +/- box on a tree row's connector line (98.css tree view). `className` is the box's class in its
// tree's stylesheet, which draws it with the tree-toggle mixin.
function TreeToggle({ expanded, onToggle, className = "tree-toggle" }) {
  return (
    <span
      className={className + (expanded ? " " + className + "--open" : "")}
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
