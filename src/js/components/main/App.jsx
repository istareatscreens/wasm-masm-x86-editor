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
  const [lockEditor, setEditorLock] = useState(false);

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
        console.log("HERE SHOULD UPDATE!");
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
  const switchFile = useCallback(
    (filename) => {
      setFilename(filename);
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
    <>
      <div onClick={handleClick} className="root app">
        <FileDrawer
          fileList={fileList}
          fileSelected={filename}
          switchFile={switchFile}
          createFile={createFile}
          refreshFileList={refreshFileList}
          setEditorLock={setEditorLock}
        />
        <Banner filename={filename} fileList={fileList} />
        <Editor filename={filename} disabled={lockEditor} />
        <CommandPrompt />
      </div>
    </>
  );
}

export default App;
