import React, { useState, useEffect, lazy, useMemo } from "react";
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
    if (FileSystem.fileListKey !== "" && filename) {
      const fileExt = getFileExtension(filename);
      const isHex = ['.exe', '.obj'].includes(fileExt.toLowerCase());
      setIsHexViewer(isHex);
      setCode(
        isHex ? FileSystem.getBase64Data(filename) :
          FileSystem.getFileData(filename)
      );
    }
  }, [filename, shouldRefreshFile]);

  return (
    <>
      {isHexViewer ? (
        <React.Suspense fallback={<div>Loading hex viewer...</div>}>
          <HexViewer 
            data={code}
            selectedTheme={selectedTheme}
          />
        </React.Suspense>
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
     </>
  );
};

export default Editor;
