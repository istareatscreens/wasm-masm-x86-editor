import React, { Component, useEffect } from "react";
import { removeScript, addScript } from "../utility/utilityFunctions.ts";
import IFrame from "./IFrame.jsx";

import React from "react";

function CommandPrompt() {
  const scripts = [
    "browserfs.boxedwine.js",
    "jszip.min.js",
    "boxedwine-shell.js",
    "boxedwine.js",
  ];

  const addScript = (scriptName, index) => {
    return <script type="text/javascript" src={scriptName} key={index} />;
  };

  return (
    <IFrame>
      <link rel="stylesheet" type="text/css" href="style.css"></link>
      <canvas className={"emscripten"} id={"canvas"}></canvas>
      {scripts.map((scriptName, index) => addScript(scriptName, index))}
    </IFrame>
  );
}

export default CommandPrompt;
