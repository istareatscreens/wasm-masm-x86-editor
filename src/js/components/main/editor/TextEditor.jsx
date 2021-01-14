import React from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import CodeMirror from "react-codemirror2";
import "codemirror/mode/gas/gas.js";
import { writeToAssemblyFile } from "../utility/fileWriter.js";
import useConstant from "use-constant";
import { debounce } from "../../../utility/utilityFunctions.ts";

function TextEditor({ onChange, value, filename }) {
  const handleChange = (editor, data, value) => {
    onChange(value);
    writeToLocalStorage(filename, value);
  };

  //debounce function to write code to local storage
  const writeToLocalStorage = useConstant(() => {
    return (filename, value) => {
      debounce(() => {
        writeToAssemblyFile(filename, value);
      }, 250);
    };
  });

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
