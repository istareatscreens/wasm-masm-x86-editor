import React, { useId } from "react";

import GroupBox from "../../../common/GroupBox.jsx";
import RadioOption from "../../../common/RadioOption.jsx";
import { FILE_TYPES } from "../model/fileTypes";

// The Create file window's "Type": a Windows 98 group box of radio buttons, one per type (model/fileTypes.ts).
function FileTypeChoice({ value, onChange }) {
  const name = useId();
  return (
    <GroupBox caption="Type" className="file-type-choice">
      {FILE_TYPES.map((type) => (
        <RadioOption key={type.id} name={name} value={type.id} checked={value === type.id} onChange={() => onChange(type.id)}>
          {type.label}
        </RadioOption>
      ))}
    </GroupBox>
  );
}

export default FileTypeChoice;
