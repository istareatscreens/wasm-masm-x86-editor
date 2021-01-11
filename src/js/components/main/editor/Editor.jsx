import React, { useState } from "react";
import TextEditor from "./TextEditor.jsx";

function Editor(...props) {
  const [code, setCode] = useState("");

  return (
    <>
      <TextEditor onChange={setCode} value={code} />
    </>
  );
}

export default Editor;
