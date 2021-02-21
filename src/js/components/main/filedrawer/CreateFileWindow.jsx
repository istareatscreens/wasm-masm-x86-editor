import React, { useState, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

import Button from "../../common/ImageButton.jsx";
import Window from "../../common/Window.jsx";

import {
  getFileExtension,
  debounce,
  checkFileExtension,
} from "../../../utility/utilityFunctions.ts";

import bmcLogo from "../../../../images/bmcLogo.svg";

//TODO REFACTOR TO CREATE DIFFERENT FILE TYPES
function CreateFileWindow({ createFile, closeFileWindow, fileList }) {
  const [value, setValue] = useState("");
  const inputbox = useRef(null);
  const [canCreate, setCanCreate] = useState(true);

  const handleChange = ({ target }) => {
    setValue(target.value);
    activateCreateButton.callback();
  };

  //debounce to check if file name is proper
  const activateCreateButton = useDebouncedCallback(() => {
    console.log("CHECK FILE");
    setCanCreate(value != "" || !checkIfFilenameExists());
  }, 500);

  //If true then disable, if false dont disable
  //TODO: FIX This
  const checkIfFilenameExists = () => {
    return fileList.find(
      (file) =>
        (getFileExtension(value)
          ? file
          : file.substring(0, file.length - getFileExtension(file).length)) ==
        value
    );
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      //Put button focus in here
    }
  };

  const handleCreateFileButton = () => {
    createFile(checkFileExtension(value, ".asm") ? value : value + ".asm");
  };
  /*
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
  */

  return (
    <Window
      closeWindow={closeFileWindow}
      titlebarClass={"title-bar--create-file"}
      windowClass={"window--create-file"}
      titlebarText={"Create file"}
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
      />
      <div className="external-buttons">
        <Button
          src={bmcLogo}
          className={"banner__file-drawer__btn"}
          title="create file(s)"
          disabled={canCreate}
          onClick={handleCreateFileButton}
        >
          OK
        </Button>
        <Button
          src={bmcLogo}
          className={"banner__file-drawer__btn"}
          title="cancel"
          onClick={closeFileWindow}
        />
      </div>
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
