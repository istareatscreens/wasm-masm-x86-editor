import React from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import CodeMirror from "react-codemirror2";
import "codemirror/mode/gas/gas.js";

function TextEditor({ onChange, value }) {
  const handleChange = (editor, data, value) => {
    onChange(value);
  };

  return (
    <CodeMirror
      value={value}
      onBeforeChange={handleChange}
      className="Editor"
      options={{
        lineWrapping: true,
        lineNumbers: true,
        mode: "gas",
        theme: "material",
      }}
    ></CodeMirror>
  );
}

export default TextEditor;
