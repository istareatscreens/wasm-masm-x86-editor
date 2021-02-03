import React, { useState, useEffect } from "react";
import TextEditor from "./TextEditor.jsx";
import FileSystem from "../utility/FileSystem.js";

const Editor = React.memo(function Editor({ filename }) {
  const [code, setCode] = useState("");

  useEffect(() => {
    if (FileSystem.fileListKey != "") {
      setCode(FileSystem.getFileData(filename));
    }
  }, [filename]);
  return (
    <>
      <TextEditor filename={filename} onChange={setCode} value={code} />
    </>
  );
});

export default Editor;
