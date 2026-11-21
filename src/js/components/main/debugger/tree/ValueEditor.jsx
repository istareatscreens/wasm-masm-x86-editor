import React, { useContext, useEffect, useRef, useState } from "react";

import TextField from "../../../common/TextField.jsx";
import { useStore } from "../session/debugStore";
import { TreeContext } from "./treeContext.js";

// A refusal from the adapter is said under the box, and the box stays.
function ValueEditor({ variable, parent, path }) {
  const { controller, setEditing, hex } = useContext(TreeContext);
  const frame = useStore(controller.store, (view) => view.frame);
  const [text, setText] = useState(variable.value);
  const [problem, setProblem] = useState("");
  const input = useRef(null);
  const row = useRef(null);

  useEffect(() => {
    row.current = input.current.closest('[role="treeitem"]');
    input.current.focus();
    input.current.select();
  }, []);

  const close = () => {
    setEditing("");
    if (row.current) row.current.focus();
  };

  const commit = async () => {
    const value = text.trim();
    if (!value || value === variable.value) return close();
    const answer = parent
      ? await controller.client.ask("setVariable", { variablesReference: parent, name: variable.name, value, format: { hex } })
      : await controller.client.ask("setExpression", { expression: variable.evaluateName || variable.name, value, frameId: frame, format: { hex } });
    if ("refused" in answer) return setProblem(answer.refused);
    close();
  };

  return (
    <span className="debug-tree__editor">
      <TextField
        ref={input}
        className="debug-tree__input"
        aria-label={"New value of " + variable.name}
        aria-invalid={!!problem}
        aria-describedby={problem ? "debug-edit-problem" : undefined}
        spellCheck={false}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setProblem("");
        }}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") commit();
          else if (event.key === "Escape") close();
        }}
        onBlur={() => setEditing((current) => (current === path ? "" : current))}
      />
      {problem && (
        <span className="debug-tree__problem" id="debug-edit-problem" role="alert">
          {problem}
        </span>
      )}
    </span>
  );
}

export default ValueEditor;
