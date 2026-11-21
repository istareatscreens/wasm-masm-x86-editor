import React from "react";

// One cell: a byte, word or dword in the hex column (`kind` "cell"), or one byte in the character column
// ("char"). Its states are classes of the viewer's stylesheet; `id` lets the grid name it as the active cell.
const ItemComponent = ({ kind, id, offset, text, states, changed, onHover }) => (
  <span
    role="gridcell"
    id={id}
    data-offset={offset}
    data-column={kind === "cell" ? "hex" : "ascii"}
    className={"hexviewer__" + kind + states}
    aria-selected={states.indexOf("--selected") >= 0 || undefined}
    aria-description={changed ? "changed" : undefined}
    onMouseEnter={onHover}
  >
    {text}
  </span>
);

export const Item = React.memo(ItemComponent);
