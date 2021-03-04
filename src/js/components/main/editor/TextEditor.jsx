import React, { useEffect, useRef, useState } from "react";
import { Controlled as CodeMirror } from "react-codemirror2";
import CodeMirror from "react-codemirror2";
import "codemirror/mode/gas/gas.js";
import "./library/simple";
import "./library/MASM.js";

import { useDebouncedCallback } from "use-debounce";

import FileSystem from "../utility/FileSystem.js";

function TextEditor({ onChange, value, filename, fontSize }) {
  const refCodeMirror = useRef(null);
  const handleChange = (editor, data, value) => {
    onChange(value);
    writeToLocalStorage.callback(filename, value);
  };

  useEffect(() => {
    refCodeMirror.current.style.fontSize = fontSize + "px";
  }, [fontSize]);

  //debounce function to write code to local storage
  //use constant should be used once
  const writeToLocalStorage = useDebouncedCallback((filename, value) => {
    FileSystem.writeToFile(filename, value);
  }, 400);

  return (
    <div ref={refCodeMirror} className="editor">
      <CodeMirror
        value={value}
        onBeforeChange={handleChange}
        className="editor__code-mirror"
        options={{
          lineWrapping: true,
          lineNumbers: true,
          mode: "MASM",
          theme: "default",
        }}
      ></CodeMirror>
    </div>
  );
}

export default TextEditor;
