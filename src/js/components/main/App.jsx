import React, { useState } from "react";

import CommandPrompt from "./cmd/CommandPrompt.jsx";
import Editor from "./editor/Editor.jsx";
import Banner from "./banner/Banner.jsx";

function App() {
  const [code, setCode] = useState(
    `INCLUDE D:/irvine/Irvine32.inc

  .data                          ;data decleration
  
  .code                          ;code decleration
  ode decleration
  
  main PROC                      ;main method starts
  
     call DumpRegs
  
     exit                        ;Exit program
  main ENDP
  END main`
  );

  const handleClick = () => {
    //allow canvas element to know in iframe that editor has been selected so styling can be restored
    document
      .getElementById("boxedwine")
      .contentWindow.postMessage(
        JSON.stringify({ eventName: "editor-selected", data: {} }),
        "/"
      );
  };

  return (
    <div onClick={handleClick} className="root">
      <Banner />
      <Editor code={code} setCode={setCode} />
      <CommandPrompt />
    </div>
  );
}

export default App;
