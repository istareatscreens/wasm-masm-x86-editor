import React, { Component} from "react";
import {CommandPrompt} from "./components/CommandPrompt.jsx";
import Editor from "./components/Editor.jsx";

class App extends Component{

  render(){
    return(
      <div className="App">
        <Editor 
        value="hello friend" 
        onChange={()=>{}} />
        <CommandPrompt/>
      </div>
    );
  }
}

export default App;