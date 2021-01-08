import React, { Component} from "react";

export class CommandPrompt extends React.Component {

    render() {
      return <canvas className={"emscripten"} id={"canvas"}></canvas>
    }
    //create 4 script tags

  componentDidMount () {
    //append the 4 required script tags for boxedwine to function
    ["browserfs.boxedwine.js","jszip.min.js",
    "boxedwine-shell.js", "boxedwine.js"].map(
      (scriptName) =>{
      const script = document.createElement("script");
      script.src = scriptName;
      script.async = true;
      script.type = "text/javascript";
      document.body.appendChild(script);
    });
  }


 }