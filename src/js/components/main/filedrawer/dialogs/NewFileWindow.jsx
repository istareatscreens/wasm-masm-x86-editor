import React from "react";

import NameWindow from "./NameWindow.jsx";
import FileTypeChoice from "./FileTypeChoice.jsx";
import { joinPath, nameProblem, folderLabel } from "../../utility/filesystem/paths";
import { nameWithType } from "../model/fileTypes";

// "Create file in D:\lab1": a name and its type. The name's rules apply to the name the file gets (the type's
// extension added); the type chosen is kept with the editor settings, so it is the one chosen the next time.
function NewFileWindow({ folder, allPaths, fileType, onFileType, onCreate, close }) {
  const finalName = (name) => nameWithType(name, fileType);
  return (
    <NameWindow
      title={"Create file in " + folderLabel(folder)}
      label="create file(s)"
      problemFor={(name) => nameProblem(finalName(name), folder, allPaths)}
      finalName={finalName}
      onCreate={(name) => onCreate(joinPath(folder, finalName(name)))}
      close={close}
    >
      <FileTypeChoice value={fileType} onChange={onFileType} />
    </NameWindow>
  );
}

export default NewFileWindow;
