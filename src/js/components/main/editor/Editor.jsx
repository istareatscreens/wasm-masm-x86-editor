import React, { useState, useEffect, lazy, Suspense } from "react";
import TextEditor from "./TextEditor.jsx";
import FileSystem from "../utility/FileSystem.js";
import { getFileExtension } from "../../../utility/utilityFunctions";

// Lazy load the HexViewer component
const HexViewer = lazy(() => import("./HexViewer.jsx"));

const Editor = function Editor({ filename, shouldRefreshFile, selectedTheme, fontSize, selectedFont, disabled, lightMode }) {
  const [code, setCode] = useState("");
  const [isHexViewer, setIsHexViewer] = useState(false);

  useEffect(() => {
    const fileExt = getFileExtension(filename);
    const isHex = ['.exe', '.bin', '.dll', '.obj'].includes(fileExt);
    setIsHexViewer(isHex);
    setCode(isHex ? FileSystem.getRawFileData(filename) : FileSystem.getFileData(filename));
  }, [filename, shouldRefreshFile]);

  return (
    <>
      {isHexViewer ? (
        <Suspense
          fallback={
            <div
              className="editor"
              style={{
                background: lightMode ? "#ffffff" : "#1e1e1e",
              }}
            ></div>
          }>
          <HexViewer
            data={code}
            lightMode={lightMode}
            fontSize={fontSize}
            selectedFont={selectedFont}
          />
        </Suspense>
      ) : (
        <TextEditor
          className="editor"
          selectedTheme={selectedTheme}
          fontSize={fontSize}
          selectedFont={selectedFont}
          filename={filename}
          onChange={setCode}
          value={code}
        />
      )}
    </>
  );
};

export default Editor;
