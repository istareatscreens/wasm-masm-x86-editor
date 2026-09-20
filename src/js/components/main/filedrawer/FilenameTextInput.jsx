import React, { useRef, useEffect, useState } from "react";
import onClickOutside from "react-onclickoutside";
import { invalidFilenameReason } from "../../../utility/utilityFunctions.ts";

//TODO Generify this with CreateFile
function FilenameTextInput({
  filename,
  setEditingMode,
  handleRename,
  isFileSelected,
}) {
  const inputbox = useRef(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(filename);
  }, [filename]);

  // Focus + select the name when the rename box opens (double-click), like the
  // create-file window does, so typing goes to the rename and not the editor.
  useEffect(() => {
    if (inputbox.current) { inputbox.current.focus(); inputbox.current.select(); }
  }, []);

  FilenameTextInput.handleClickOutside = () => {
    completedInput();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      completedInput();
    }
  };

  const completedInput = () => {
    // trimmed, and only a name that obeys the Windows file-name rules is applied
    // (an invalid one just leaves the old name in place)
    const newName = String(inputbox.current.value || "").trim();
    if (newName && newName != filename && !invalidFilenameReason(newName)) {
      // FileDrawer.handleRenameFile rejects an existing name and switches the editor
      // itself when the open file was renamed
      handleRename(filename, newName);
    }
    setEditingMode(false);
  };

  const handleChange = (event) => {
    if (event.target.value != filename) {
      setValue(event.target.value);
    }
  };

  return (
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
  );
}

const clickOutsideConfig = {
  handleClickOutside: () => FilenameTextInput.handleClickOutside,
};

export default onClickOutside(FilenameTextInput, clickOutsideConfig);
