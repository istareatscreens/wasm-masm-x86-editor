import React, { useState } from "react";

import CommandPrompt from "./cmd/CommandPrompt.jsx";
import Editor from "./editor/Editor.jsx";
import Banner from "./banner/Banner.jsx";

function App() {
  const [code, setCode] = useState("");

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
