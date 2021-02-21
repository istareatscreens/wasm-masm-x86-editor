import React from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import CodeMirror from "react-codemirror2";
import "codemirror/mode/gas/gas.js";

import { useDebouncedCallback } from "use-debounce";

import FileSystem from "../utility/FileSystem.js";

function TextEditor({ onChange, value, filename }) {
  const handleChange = (editor, data, value) => {
    onChange(value);
    writeToLocalStorage.callback(filename, value);
  };

  //debounce function to write code to local storage
  //use constant should be used once
  const writeToLocalStorage = useDebouncedCallback((filename, value) => {
    console.log("Writing to file hooray");
    FileSystem.writeToFile(filename, value);
  }, 300);

  return (
    <CodeMirror
      value={value}
      onBeforeChange={handleChange}
      className="editor"
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
