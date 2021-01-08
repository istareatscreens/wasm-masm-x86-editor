import React, { Component} from "react";

class App extends Component{
  render(){
    return(
      <div className="App">
        <h1> Hello, World! </h1>
        <canvas className={"emscripten"} id={"canvas"} ></canvas>
      </div>
    );
  }
}

export default App;