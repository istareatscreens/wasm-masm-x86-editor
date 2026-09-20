import React, { useEffect, useState, useRef } from "react";
import { useDebouncedCallback } from "use-debounce";

import Button from "../../common/ImageButton.jsx";
import Window from "../../common/Window.jsx";

import accept from "../../../../images/accept.png";
import acceptDisabled from "../../../../images/accept-disabled.png";

import {
  getFileExtension,
  checkFileExtension,
  invalidFilenameReason,
} from "../../../utility/utilityFunctions.ts";

//TODO REFACTOR TO CREATE DIFFERENT FILE TYPES
function CreateFileWindow({ createFile, closeFileWindow, fileList }) {
  const [value, setValue] = useState("");
  const inputbox = useRef(null);
  const [cannotCreate, setCannotCreate] = useState(true);

  useEffect(() => {
    inputbox.current.focus();
  }, []);

  const handleChange = ({ target }) => {
    setValue(target.value);
    activateCreateButton.callback();
  };

  // The name is trimmed (a stray trailing space is not an error) and must obey the
  // Windows file-name rules (invalidFilenameReason); spaces inside are fine.
  const proposedName = () => value.trim();
  const problem = () => invalidFilenameReason(proposedName()) || (checkIfFilenameExists() ? "a file with that name already exists" : null);

  //debounce to check if file name is proper
  const activateCreateButton = useDebouncedCallback(() => {
    setCannotCreate(!!problem());
  }, 200);

  //If true then disable, if false dont disable
  //TODO: FIX THIS LOGIC
  const checkIfFilenameExists = () => {
    const name = proposedName();
    return fileList.find(
      (file) =>
        (getFileExtension(name)
          ? file
          : file.substring(0, file.length - getFileExtension(file).length)) ==
        name
    );
  };

  const handleKeyDown = (event) => {
    // Evaluate synchronously: the debounced cannotCreate lags 200ms behind the
    // last keystroke, which silently swallowed an Enter typed right after the name.
    if (event.key === "Enter" && !problem()) {
      handleCreateFileButton();
      closeFileWindow();
    }
  };

  const handleCreateFileButton = () => {
    const name = proposedName();
    if (problem()) return;
    // (extension, filename): a name typed with its .asm keeps it, anything else gets one
    createFile(checkFileExtension(".asm", name) ? name : name + ".asm");
  };

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
        title={problem() || "file name (spaces are fine)"}
        onKeyDown={(event) => {
          handleKeyDown(event);
        }}
        onChange={(event) => handleChange(event)}
        ref={inputbox}
      />
      <br></br>
      <div className="external-buttons external-buttons--createFile">
        <Button
          src={cannotCreate ? acceptDisabled : accept}
          className={"btn btn--window btn--createFile"}
          imageClass={"btn--window--image"}
          title="create file(s)"
          disabled={cannotCreate}
          onClick={handleCreateFileButton}
        />
      </div>
    </Window>
  );
}

export default CreateFileWindow;
