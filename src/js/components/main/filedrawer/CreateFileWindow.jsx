import React, { useState } from "react";

import Button from "../../../common/ImageButton.jsx";
import Window from "../../../common/Window.jsx";

import bmcLogo from "../../../../../images/bmcLogo.svg";

//TODO REFACTOR TO CREATE DIFFERENT FILE TYPES
function CreateFileWindow({ createFile, closeFileWindow }) {
  const [value, setValue] = useState("");
  const createNewFile = () => {
    let filename = "";
    let error = "";
    do {
      //TODO: replace prompt with page popup
      filename = prompt("Please enter a filename: ", error);
      if (!/.asm$/.test(filename)) {
        filename += ".asm";
      }
      //TODO: possibly add prompt to allow overwritting
      error = "file already exists, please try again";
    } while (
      fileList.includes(filename) ||
      filename == error + ".asm" || //clicked ok on error message
      filename == ".asm" || //wrote just a file extension
      filename == "null.asm" //entered no input but clicked ok
    );
    createFile(filename);
  };

  return (
    <Window
      closeWindow={closeFileWindow}
      titlebarClass={"title-bar--create-file"}
      windowClass={"window--create-file"}
      titlebarText={"Create new file"}
    >
      <input
        type="text"
        className="input-box"
        value={value}
        onKeyDown={(event) => {
          handleKeyDown(event);
        }}
        onChange={(event) => handleChange(event)}
        ref={inputbox}
      ></input>
    </Window>
  );
}

export default CreateFileWindow;

/*
    let filename = "";
    let error = "";
    do {
      //TODO: replace prompt with page popup
      filename = prompt("Please enter a filename: ", error);
      if (!/.asm$/.test(filename)) {
        filename += ".asm";
      }
      //TODO: possibly add prompt to allow overwritting
      error = "file already exists, please try again";
    } while (
      fileList.includes(filename) ||
      filename == error + ".asm" || //clicked ok on error message
      filename == ".asm" || //wrote just a file extension
      filename == "null.asm" //entered no input but clicked ok
    );
    createFile(filename);
    */
