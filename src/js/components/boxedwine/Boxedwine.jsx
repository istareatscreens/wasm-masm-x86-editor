import React, { useEffect } from "react";
import { createMessageListner } from "../../utility/utilityFunctions";
import { keyCodes } from "./keypress.js";
import { FileSystem } from "../main/utility/FileSystem.js";

function Boxedwine() {
  useEffect(() => {
    createMessageListner(); //creates message listener to intercept messages from parent document and rethrow messages as events
    createClickListener(); //creates a click listener to allow selection and operator of terminal when clicked on
    createBuildListener(); //Executes build command
    createCommandWriteListener();
    return () => {
      removeListeners();
    };
  }, []);

  const resetAndBuild = (filename) => {
    Module.reset();
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
    let press = "keydown";
    data.forEach((key) => {
      if (key == "/shift") {
        press = "keyup";
        key = "shift";
      } else if (press == "keyup") {
        press = "keydown";
      }

      if (key.toLowerCase() != key.toUpperCase() && key == key.toUpperCase()) {
        {
          const event = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            char: "shift",
            key: "shift",
            shiftKey: true,
            keyCode: keyCodes["shift"],
          });
          window.dispatchEvent(event);

          event = new KeyboardEvent(press, {
            bubbles: true,
            cancelable: true,
            char: key,
            key: key.toLowerCase(),
            shiftKey: true,
            keyCode: keyCodes[key.toLowerCase()],
          });
          window.dispatchEvent(event);

          event = new KeyboardEvent("keyup", {
            bubbles: true,
            cancelable: true,
            char: "shift",
            key: "shift",
            shiftKey: true,
            keyCode: keyCodes["shift"],
          });
          window.dispatchEvent(event);
        }
      } else {
        const event = new KeyboardEvent(press, {
          bubbles: true,
          cancelable: true,
          char: key.toUpperCase(),
          key: key,
          shiftKey: true,
          keyCode: keyCodes[key],
        });
        window.dispatchEvent(event);
      }
    });
  };

  const createCommandWriteListener = () => {
    window.addEventListener("write-command", (event) => {
      writeToConsole(event.detail);
    });
  };

  const createBuildListener = () => {
    window.addEventListener(
      "build-code",
      (event) => {
        console.log("HERE");
        Module.ProcessRun.runCommand("cmd.bat");
        //Module.runCommand("cmd.bat");
      }
      //writeToConsole(event.detail)
    );
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

  useEffect(() => {
    console.log(Module);
    //console.log(window.FS.readFile("/etc/hosts", { encoding: "utf8" }));
  });

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
