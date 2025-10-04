import React, { useState, useEffect, lazy, Suspense } from "react";
import TextEditor from "./TextEditor.jsx";
import FileSystem from "../utility/FileSystem.js";

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
    <div className="editor-container" style={{ height: '100%', overflow: 'hidden' }}>
      {isHexViewer ? (
        <Suspense fallback={<div>Loading hex viewer...</div>}>
          <HexViewer 
            filename={filename}
            selectedTheme={selectedTheme}
          />
        </Suspense>
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
