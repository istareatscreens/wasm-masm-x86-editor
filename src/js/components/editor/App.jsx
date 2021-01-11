import React, { Component } from "react";
import CommandPrompt from "./CommandPrompt.jsx";
import Editor from "./Editor.jsx";

class App extends Component {
  render() {
    const handleClick = () => {};

    return (
      <div onClick={} className="root">
        <Editor />
        <CommandPrompt />
      </div>
    );
  }
}

export default App;
