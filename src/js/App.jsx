import React, { Component } from "react";
import CommandPrompt from "./components/CommandPrompt.jsx";
import Editor from "./components/Editor.jsx";
import IFrame from "./components/IFrame.jsx";

class App extends Component {
  render() {
    return (
      <div className="App">
        <Editor />
        <CommandPrompt />
      </div>
    );
  }
}

export default App;
