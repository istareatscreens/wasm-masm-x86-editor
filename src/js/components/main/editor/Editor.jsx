import React, { useState } from "react";
import TextEditor from "./TextEditor.jsx";

function Editor({ setCode, code }) {
  return (
    <>
      <TextEditor onChange={setCode} value={code} />
    </>
  );
}

export default Editor;
