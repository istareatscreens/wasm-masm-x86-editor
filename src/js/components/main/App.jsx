import React, { useCallback, useEffect, useState } from "react";

import FileDrawer from "./filedrawer/FileDrawer.jsx";
import CommandPrompt from "./cmd/CommandPrompt.jsx";
import Editor from "./editor/Editor.jsx";
import Banner from "./banner/Banner.jsx";

import FileSystem from "./utility/FileSystem";
import { postMessage } from "../../utility/utilityFunctions.ts";

function App() {
  const [filename, setFilename] = useState("test");
  const [fileList, setFileList] = useState([""]);
  const [code, setCode] = useState("");

  const refreshFileList = async (initialRun = false) => {
    let fileList = FileSystem.getFileList();
    //remove all files
    const asmFiles = fileList.filter((filename) => /.asm$/g.test(filename)); //remove all non .asm files from list
    //.map((filename) => filename.substring(0, filename.length - 4)); //remove .asm
    //set create and set focused file
    if (!fileList || !asmFiles.length) {
      const initialFileName = "test.asm";
      FileSystem.createAssemblyFile(initialFileName, true);
      switchFile(initialFileName);
      fileList = FileSystem.getFileList();
    } else if (initialRun) {
      switchFile(asmFiles[0]);
    }

    setFileList(fileList);
  };

  useEffect(() => {
    //Load file list
    FileSystem.init(refreshFileList);
  }, []);

  const handleClick = () => {
    //allow canvas element to know in iframe that editor has been selected so styling can be restored
    postMessage("editor-selected", {});
  };

  //change current file
  const switchFile = useCallback(
    (filename) => {
      setFilename(filename);
      setCode(FileSystem.getFileData(filename));
    },
    [filename]
  );

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
    <div onClick={handleClick} className="root">
      <div className="Code-Area">
        <FileDrawer
          fileList={fileList}
          fileSelected={filename}
          switchFile={switchFile}
          createFile={createFile}
        />
        <div className="Editor__container">
          <Banner filename={filename} fileList={fileList} />
          <Editor filename={filename} code={code} setCode={setCode} />
        </div>
      </div>
      <CommandPrompt />
    </div>
  );
}

export default App;
