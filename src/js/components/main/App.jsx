import React, { Component } from "react";
import CommandPrompt from "./cmd/CommandPrompt.jsx";
import Editor from "./editor/Editor.jsx";

class App extends Component {
  render() {
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
        <Editor />
        <CommandPrompt />
      </div>
    );
  }
}

export default App;
