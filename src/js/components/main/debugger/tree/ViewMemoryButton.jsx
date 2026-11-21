import React, { useContext } from "react";

import { TreeContext } from "./treeContext.js";

// On the selected row of a value that lives in memory: shows its bytes in the Memory section.
function ViewMemoryButton({ address }) {
  const { controller } = useContext(TreeContext);
  return (
    <button
      type="button"
      className="btn btn--text debug-tree__memory"
      tabIndex={-1}
      title={"View memory at " + address.replace(/^0x/, "") + "h"}
      aria-label="View memory"
      onMouseDown={(event) => event.preventDefault()}
      onClick={(event) => {
        event.stopPropagation();
        controller.viewMemory(address);
      }}
    >
      …
    </button>
  );
}

export default ViewMemoryButton;
