import React, { useCallback, useEffect, useState } from "react";

import FileDrawer from "./filedrawer/FileDrawer.jsx";
import CommandPrompt from "./cmd/CommandPrompt.jsx";
import Editor from "./editor/Editor.jsx";
import Banner from "./banner/Banner.jsx";

import FileSystem from "./utility/FileSystem";
import { postMessage } from "../../utility/utilityFunctions.ts";
//import { FileSystem } from "./utility/FileSystem.js";

function App() {
  const [filename, setFilename] = useState("test");
  const [fileList, setFileList] = useState([""]);
  const [code, setCode] = useState("");

  const refreshFileList = async () => {
    const fileList = FileSystem.getFileList();
    //remove all files
    const asmFiles = fileList
      .filter((filename) => /.asm$/g.test(filename)) //remove all non .asm files from list
      .map((filename) => filename.substring(0, filename.length - 4)); //remove .asm
    //set create and set focused file
    if (!fileList || !asmFiles.length) {
      postMessage("reset", {});
      FileSystem.createFile({ filename: "test" }, true);
      switchFile("test");
    } else {
      switchFile(asmFiles[0]);
    }
    setFileList(asmFiles);
  };

  useEffect(() => {
    //Load file list
    const initFileList = async () => {
      await FileSystem.init(refreshFileList);
    };
    initFileList();
  }, []);

  const handleClick = () => {
    //allow canvas element to know in iframe that editor has been selected so styling can be restored
    postMessage("editor-selected", {});
  };

  const switchFile = useCallback(
    (filename) => {
      setFilename(filename);
      setCode(FileSystem.getFileData(filename));
    },
    [filename]
  );

  return (
    <div onClick={handleClick} className="root">
      <Banner filename={filename} />
      <div className="Code-Area">
        <FileDrawer
          fileList={fileList}
          fileSelected={filename}
          switchFile={switchFile}
        />
        <Editor filename={filename} code={code} setCode={setCode} />
      </div>
      <CommandPrompt />
    </div>
  );
}

export default App;
