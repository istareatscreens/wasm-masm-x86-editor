import React, { useEffect, useRef, useState } from "react";

// In-place rename. Enter or leaving the box commits, Escape cancels; a name that breaks
// a rule (problemFor) leaves the old one, its reason shown as the box's tooltip.
function RenameInput({ initial, problemFor, onCommit, onCancel }) {
  const input = useRef(null);
  const done = useRef(false);
  const [value, setValue] = useState(initial);

  useEffect(() => {
    if (input.current) {
      input.current.focus();
      input.current.select();
    }
  }, []);

  const name = value.trim().normalize("NFC");
  const problem = name && name !== initial ? problemFor(name) : null;

  const commit = () => {
    if (done.current) return;
    done.current = true;
    if (name && name !== initial && !problemFor(name)) onCommit(name);
    else onCancel();
  };

  return (
    <input
      ref={input}
      type="text"
      className={"input-box file-tree__rename" + (problem ? " file-tree__rename--invalid" : "")}
      value={value}
      aria-label="New name"
      aria-invalid={!!problem}
      title={problem || "new name"}
      onChange={(event) => setValue(event.target.value)}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Enter") commit();
        else if (event.key === "Escape") {
          done.current = true;
          onCancel();
        }
      }}
      onBlur={commit}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => event.stopPropagation()}
    />
  );
}

export default RenameInput;
