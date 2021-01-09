import React, {Component} from "react";
import {removeScript, addScript} from '../utility/utilityFunctions.ts';

export class CommandPrompt extends React.Component {

    render() {
      return <canvas className={"emscripten"} id={"canvas"}></canvas>
    }
    //create 4 script tags

  componentDidMount () {
    //append the 4 required script tags for boxedwine to function
    ["browserfs.boxedwine.js","jszip.min.js",
    "boxedwine-shell.js", "boxedwine.js"].map((scriptName)=>addScript(scriptName));
  }

  componentWillUnmount(){
    //remove the 4 required script tags to fully refresh
    ["browserfs.boxedwine.js","jszip.min.js",
    "boxedwine-shell.js", "boxedwine.js"].map((scriptName)=>removeScript(scriptName));
  }


 }