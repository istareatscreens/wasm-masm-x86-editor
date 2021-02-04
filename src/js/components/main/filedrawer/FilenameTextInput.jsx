import React, { useRef, useEffect, useState } from "react";
import onClickOutside from "react-onclickoutside";

function FilenameTextInput({ filename, setEditingMode, handleRename }) {
  const inputbox = useRef(null);
  const [value, setValue] = useState("");

  useEffect(() => {
    setValue(filename);
  }, [filename]);

  FilenameTextInput.handleClickOutside = () => {
    handleRename(filename, inputbox.current.value);
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
      value={value}
      onChange={(event) => handleChange(event)}
      ref={inputbox}
    />
  );
}

const clickOutsideConfig = {
  handleClickOutside: () => FilenameTextInput.handleClickOutside,
};

export default onClickOutside(FilenameTextInput, clickOutsideConfig);
