import React, { useState, useEffect, lazy, Suspense } from "react";
import TextEditor from "./TextEditor.jsx";
import ViewModeBanner from "./ViewModeBanner.jsx";
import FileSystem from "../utility/FileSystem.js";
import { isAsm, isMasmSource, isToolchainText } from "../utility/filesystem/paths";

const HexViewer = lazy(() => import("./HexViewer.jsx"));

// The toolchain's outputs are always shown in hex (an empty one has no bytes to judge).
const BINARY_EXTENSIONS = /\.(exe|bin|dll|obj)$/i;
// each non-.asm file's "text"/"hex" choice, for the session
const viewChoices = new Map();

// .asm files are always edited as text. Other files get the view-mode banner and open in hex when isbinaryfile
// calls them binary, except the toolchain's text files (.inc, .def). `debugPlace` is a ref the text editor fills
// with its cursor's place.
const Editor = function Editor({ filename, shouldRefreshFile, selectedTheme, fontSize, selectedFont, disabled, lightMode, vimMode, debug, debugOn, debugPlace }) {
  const [code, setCode] = useState("");
  const [view, setView] = useState("text");
  const [binary, setBinary] = useState(false);
  // the file whose content `code` is, and how many times content was loaded
  const [loaded, setLoaded] = useState({ file: "", count: 0 });

  const load = (mode, isBinaryFile) => {
    setView(mode);
    setCode(mode === "hex" ? FileSystem.getRawFileData(filename) : FileSystem.readText(filename, isBinaryFile).text);
    setLoaded((before) => ({ file: filename, count: before.count + 1 }));
  };

  useEffect(() => {
    const isBinaryFile = !isToolchainText(filename) && (BINARY_EXTENSIONS.test(filename) || FileSystem.isBinaryFile(filename));
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
          id={isAsm(filename) ? "editor-pane" : undefined}
          className="editor"
          selectedTheme={selectedTheme}
          fontSize={fontSize}
          selectedFont={selectedFont}
          filename={filename}
          onChange={setCode}
          value={code}
          vimMode={vimMode}
          exactLineBreaks={binary}
          debug={debug}
          debugActive={!!debugOn && isMasmSource(filename) && !binary}
          debugPlace={debugPlace}
          loaded={loaded}
        />
      )}
    </>
  );
  if (isAsm(filename)) return content;
  return (
    <div className="editor editor--with-banner" id="editor-pane">
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
