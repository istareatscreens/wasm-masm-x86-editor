import React, { useState } from "react";
import FilenameListElement from "./FilenameListElement.jsx";
import FilenameTextInput from "./FilenameTextInput.jsx";

//TODO generify this
function FilenameEditableListElement({
  filename,
  handleRename,
  switchFile,
  isSelected,
}) {
  const [isInEditingMode, setEditingMode] = useState(false);

  const toggleEdit = () => {
    setEditingMode(!isInEditingMode);
  };

  const handleDoubleClick = () => {
    console.log("doubleclick");
    toggleEdit();
  };

  return (
    <FilenameListElement
      onDoubleClick={handleDoubleClick}
      onClick={(e) => {
        console.log("singleclick");
        switchFile(filename);
      }}
      className={
        isSelected
          ? "FileDrawer__listItem FileDrawer__listItem--selected"
          : "FileDrawer__listItem"
      }
    >
      {isInEditingMode ? (
        <FilenameTextInput
          setEditingMode={setEditingMode}
          filename={filename}
          handleRename={handleRename}
        />
      ) : (
        filename
      )}
    </FilenameListElement>
  );
}

export default FilenameEditableListElement;
