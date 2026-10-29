import React, { useState, useEffect, lazy, Suspense } from "react";
import TextEditor from "./TextEditor.jsx";
import ViewModeBanner from "./ViewModeBanner.jsx";
import FileSystem from "../utility/FileSystem.js";
import { isAsm } from "../utility/filesystem/paths";

// Lazy load the HexViewer component
const HexViewer = lazy(() => import("./HexViewer.jsx"));

// The toolchain's outputs are always shown in hex (an empty one has no bytes to judge).
const BINARY_EXTENSIONS = /\.(exe|bin|dll|obj)$/i;
// each non-.asm file's "text"/"hex" choice, for the session
const viewChoices = new Map();

// .asm files are always edited as text. Any other file gets the view-mode banner and opens
// in hex when its content is binary (isbinaryfile's verdict), as text otherwise.
const Editor = function Editor({ filename, shouldRefreshFile, selectedTheme, fontSize, selectedFont, disabled, lightMode, vimMode }) {
  const [code, setCode] = useState("");
  const [view, setView] = useState("text");
  const [binary, setBinary] = useState(false);

  const load = (mode, isBinaryFile) => {
    setView(mode);
    setCode(mode === "hex" ? FileSystem.getRawFileData(filename) : FileSystem.readText(filename, isBinaryFile).text);
  };

  useEffect(() => {
    const isBinaryFile = !isAsm(filename) && (BINARY_EXTENSIONS.test(filename) || FileSystem.isBinaryFile(filename));
    setBinary(isBinaryFile);
    load(isAsm(filename) ? "text" : viewChoices.get(filename) || (isBinaryFile ? "hex" : "text"), isBinaryFile);
  }, [filename, shouldRefreshFile]);

  const isHexViewer = view === "hex";
  const content = (
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
          vimMode={vimMode}
          exactLineBreaks={binary}
        />
      )}
    </>
  );
  if (isAsm(filename)) return content;
  return (
    <div className="editor editor--with-banner">
      <ViewModeBanner
        filename={filename}
        view={view}
        binary={binary}
        onView={(mode) => {
          viewChoices.set(filename, mode);
          load(mode, binary);
        }}
      />
      {content}
    </div>
  );
};

export default Editor;
