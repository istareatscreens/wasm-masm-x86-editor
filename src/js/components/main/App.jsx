import React, { useCallback, useEffect, useState, useRef } from "react";

import FileDrawer from "./filedrawer/FileDrawer.jsx";
import CommandPrompt from "./cmd/CommandPrompt.jsx";
import Editor from "./editor/Editor.jsx";
import Banner from "./banner/Banner.jsx";

import FileSystem from "./utility/FileSystem";
import { postMessage } from "../../utility/utilityFunctions.ts";

function App() {
  const [filename, setFilename] = useState("test");
  const [fileList, setFileList] = useState([""]);
  const [lockEditor, setEditorLock] = useState(false);
  const [refreshFile, setRefreshFile] = useState(true); //value switched to force editor rerender
  //editor settings
  const [fontSize, setFontSize] = useState(16);
  const [fontList, setFontList] = useState([
    { id: 0, text: "Liberation Mono", path: "Liberation Mono" },
    { id: 1, text: "FiraCode", path: "./FiraCode-Retina.ttf" },
    { id: 2, text: "Consolas", path: "./Consolas.ttf" },
    { id: 3, text: "Monoid-Retina", path: "./Monoid-Retina.ttf" },
    { id: 4, text: "MS Sans Serif", path: "./MS Sans Serif.ttf" },
    { id: 5, text: "Press Start 2P", path: "./PressStart2P-Regular.ttf" },
    { id: 6, text: "Roboto Mono", path: "./RobotoMono-Regular.ttf" },
    { id: 7, text: "Source Code Pro", path: "./SourceCodePro-Medium.ttf" },
    { id: 8, text: "Sudo", path: "./Sudo-Regular.ttf" },
    { id: 9, text: "Ubuntu Mono", path: "./UbuntuMono-R.ttf" },
    { id: 10, text: "Arial", path: "Arial" },
  ]);
  const [selectedFont, setSelectedFont] = useState(fontList[0]);

  const refApp = useRef(null);

  const refreshFileList = useCallback(
    async (initialRun = false) => {
      let fileList = FileSystem.getFileList();
      //remove all files
      const asmFiles = fileList
        .filter((filename) => /.asm$/g.test(filename))
        .map((filename, index) => ({ id: index, filename: filename })); //remove all non .asm files from list
      //.map((filename) => filename.substring(0, filename.length - 4)); //remove .asm
      //set create and set focused file
      if (!fileList || !asmFiles.length) {
        const initialFileName = "test.asm";
        FileSystem.createAssemblyFile(initialFileName, true);
        switchFile(initialFileName);
        fileList = FileSystem.getFileList();
      } else if (initialRun) {
        switchFile(asmFiles[0].filename);
      }

      setFileList(fileList);
    },
    [fileList]
  );

  useEffect(() => {
    const init = async () => {
      await FileSystem.init();
      window.addEventListener("storage", () => {
        refreshFileList();
      });
      refreshFileList(true);
    };
    init();
    return () => {
      window.removeEventListener("storage");
    };
  }, []);

  const handleClick = () => {
    //allow canvas element to know in iframe that editor has been selected so styling can be restored
    postMessage("editor-selected", {});
  };

  //change current file
  const switchFile = (filename) => {
    setFilename(filename);
  };

  const createFile = useCallback(
    (filename) => {
      FileSystem.createAssemblyFile(filename);
      switchFile(filename);
      setTimeout(() => {
        //can probably generify this
        if (!fileList.includes(filename)) {
          postMessage("run-command", { data: `echo.>${filename}` });
          //postMessage("reset", {});
          refreshFileList();
        }
      }, 5000);
    },
    [filename]
  );

  return (
    <>
      <div ref={refApp} onClick={handleClick} className="root app-layout">
        <FileDrawer
          fileList={fileList}
          fileSelected={filename}
          switchFile={switchFile}
          createFile={createFile}
          refreshFileList={refreshFileList}
          setEditorLock={setEditorLock}
          forceUpdate={{ refreshFile, setRefreshFile }}
        />
        <Banner
          fontList={fontList}
          setSelectedFont={setSelectedFont}
          selectedFont={selectedFont}
          fontSize={fontSize}
          refApp={refApp.current}
          filename={filename}
          fileList={fileList}
          setFontSize={setFontSize}
        />
        <Editor
          fontSize={fontSize}
          shouldRefreshFile={refreshFile}
          filename={filename}
          disabled={lockEditor}
          selectedFont={selectedFont}
        />
        <CommandPrompt />
      </div>
    </>
  );
}

export default App;
