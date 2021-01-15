import React, { useEffect } from "react";
import { createMessageListner } from "../../utility/utilityFunctions";
import { keyCodes } from "./keypress.js";

function Boxedwine() {
  useEffect(() => {
    createMessageListner(); //creates message listener to intercept messages from parent document and rethrow messages as events
    createClickListener(); //creates a click listener to allow selection and operator of terminal when clicked on
    createBuildListener(); //Executes build command
    return () => {
      removeListeners();
    };
  }, []);

  const resetAndBuild = (filename) => {
    Module.killLoop();
    window.callMain([
      "-root",
      "/root/base",
      "-mount_drive",
      "/root/files/",
      "d",
      "-nozip",
      "-w",
      "/home/username/.wine/dosdevices/d:",
      "/bin/wine",
      "cmd",
      "/c",
      `start build.bat ${filename} 1`,
    ]);
  };

  const writeToConsole = (data) => {
    //source: https://stackoverflow.com/questions/35143695/how-can-i-simulate-a-keypress-in-javascript
    data.forEach((key) => {
      const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        char: key.toUpperCase(),
        key: key,
        shiftKey: true,
        keyCode: keyCodes[key],
      });
      window.dispatchEvent(event);
    });
  };

  const createBuildListener = (event) => {
    window.addEventListener("build-code", (event) => {
      //writeToConsole(event.detail);
      console.log(event.detail);
      resetAndBuild(event.detail.filename);
    });
  };

  const removeListeners = () => {
    window.removeEventListener("editor-selected");
    window.removeEventListener("build-code");
  };

  const createClickListener = () => {
    window.addEventListener("editor-selected", (event) => {
      event.preventDefault();
      document.getElementById("emscripten-overlay").style.pointerEvents =
        "unset";
    });
  };

  const handleClick = (event) => {
    event.preventDefault();
    event.target.style.pointerEvents = "none";
  };

  return (
    <>
      <canvas
        onContextMenu={(event) => event.preventDefault()}
        className={"emscripten"}
        id={"canvas"}
      />
      <div
        onClick={(event) => handleClick(event)}
        onContextMenu={(event) => handleClick(event)}
        id={"emscripten-overlay"}
        className={"emscripten-overlay"}
      />
    </>
  );
}

export default Boxedwine;
