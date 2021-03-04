import React, { useState, useEffect } from "react";
import TextEditor from "./TextEditor.jsx";
import FileSystem from "../utility/FileSystem.js";

const Editor = function Editor({ filename, shouldRefreshFile, fontSize }) {
  const [code, setCode] = useState("");

  useEffect(() => {
    if (FileSystem.fileListKey != "") {
      setCode(FileSystem.getFileData(filename)); //refresh code
    }
  }, [filename, shouldRefreshFile]);

  return (
    <>
      <TextEditor
        filename={filename}
        onChange={setCode}
        fontSize={fontSize}
        value={code}
      />
    </>
  );
};

export default Editor;
