import React, { useEffect, useState } from "react";
import FileSystem from "./utility/FileSystem";

import CommandPrompt from "./cmd/CommandPrompt.jsx";
import Editor from "./editor/Editor.jsx";
import Banner from "./banner/Banner.jsx";
import { postMessage } from "../../utility/utilityFunctions.ts";
//import { FileSystem } from "./utility/FileSystem.js";

function App() {
  const [filename, setFilename] = useState("test");
  const [fileList, setFileList] = useState([]);

  const [code, setCode] = useState(
    `INCLUDE D:/irvine/Irvine32.inc

  .data                          ;data decleration

  
  .code                          ;code decleration

  
  main PROC                      ;main method starts
  
     call DumpRegs
  
     exit                        ;Exit program
  main ENDP
  END main`
  );

  useEffect(() => {
    //Load file list
    const getFileList = async () => {
      setFileList(await FileSystem.init());
    };
    getFileList();
    //set focused file

    const asmFiles = fileList.filter((fileName) =>
      new RegExp(/.asm$/).match(fileName)
    );

    if (!fileList || !asmFiles.length) {
      console.log("No file to edit");
    } else {
      console.log(asmFiles);
    }
  }, []);

  const handleClick = () => {
    //allow canvas element to know in iframe that editor has been selected so styling can be restored
    postMessage("editor-selected", {});
  };

  return (
    <div onClick={handleClick} className="root">
      <Banner filename={filename} />
      <Editor filename={filename} code={code} setCode={setCode} />
      <CommandPrompt />
    </div>
  );
}

export default App;
