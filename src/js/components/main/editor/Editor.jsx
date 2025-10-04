import React, { useState, useEffect, lazy } from "react";
import TextEditor from "./TextEditor.jsx";
import FileSystem from "../utility/FileSystem.js";
import { getFileExtension } from "../../../utility/utilityFunctions";

// Lazy load the HexViewer component
const HexViewer = lazy(() => import("./HexViewer.jsx"));

const Editor = function Editor({
  filename,
  shouldRefreshFile,
  fontSize,
  selectedFont,
  selectedTheme,
}) {
  const [code, setCode] = useState("");
  const [isHexViewer, setIsHexViewer] = useState(false);

  useEffect(() => {
    if (FileSystem.fileListKey !== "") {
      const fileExt = getFileExtension(filename);
      const isHex = ['exe', 'obj'].includes(fileExt);
      setIsHexViewer(isHex);
      setCode(isHex ? FileSystem.getRawFileData(filename) : FileSystem.getFileData(filename) )  
    }
  }, [filename, shouldRefreshFile]);

  return (
    <div className="editor-container" >
      {isHexViewer ? (
        <HexViewer 
          filename={filename}
          selectedTheme={selectedTheme}
        />
      ) : (
        <TextEditor
          selectedTheme={selectedTheme}
          filename={filename}
          onChange={setCode}
          fontSize={fontSize}
          value={code}
          selectedFont={selectedFont}
        />
      )}
    </div>
  );
};

export default Editor;
