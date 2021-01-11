import React, { useState } from "react";
import TextEditor from "./TextEditor.jsx";

function Editor() {
  const [code, setCode] = useState("");
  return <TextEditor onChange={setCode} value={code} />;
}

export default Editor;
