import React, { Component} from "react";
import {CommandPrompt} from "./components/CommandPrompt.jsx";

class App extends Component{
  render(){
    return(
      <div className="App">
        <h1> Hello, World! </h1>
        <CommandPrompt/>
      </div>
    );
  }
}

export default App;