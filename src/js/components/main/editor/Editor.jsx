import React, { useState } from "react";
import TextEditor from "./TextEditor.jsx";

const Editor = React.memo(function Editor({ setCode, code, filename }) {
  return (
    <>
      <TextEditor filename={filename} onChange={setCode} value={code} />
    </>
  );
});

export default Editor;
