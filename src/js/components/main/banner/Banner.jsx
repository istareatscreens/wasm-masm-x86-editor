import React from "react";
import Button from "../../common/Button.jsx";
import {
  postMessage,
  writeCommandToCMD,
  checkIfEqualArraysNoDuplicateElements,
  checkFileExtension,
} from "../../../utility/utilityFunctions.ts";

import deleteFile from "../../../../images/deleteFile.png";

const Banner = function Banner({ filename, fileList }) {
  const build = () => {
    //TODO rework assemble.bat to simplify this logic
    if (/.asm$/.test(filename)) {
      writeCommandToCMD(
        `assemble ${filename.substring(0, filename.length - 4)}`
      );
    } else {
      console.log("not an assembly file: " + filename);
    }
  };

  const getExecutableName = () => {
    return `${filename.substring(0, filename.length - 3)}exe`;
  };

  const checkForFile = () => {
    return !fileList.includes(getExecutableName());
  };

  const reset = () => {
    postMessage("reset", {});
  };

  const run = () => {
    if (/.asm$/.test(filename)) {
      writeCommandToCMD(getExecutableName());
    }
  };

  const checkIfAsm = () => {
    return !checkFileExtension(".asm", filename);
  };

  return (
    <div className={"banner banner--main"}>
      <Button
        onClick={build}
        id={"pushData"}
        className={"btn btn__banner--build windows--btn"}
        disabled={checkIfAsm()}
        src={{ deleteFile }}
      />
      <Button
        onClick={run}
        id={"runEXE"}
        className={"btn btn__banner--run windows--btn"}
        disabled={checkForFile()}
        src={{ deleteFile }}
      />
      <Button
        onClick={reset}
        id={"resetCMD"}
        className={"btn btn__banner--reset windows--btn"}
        src={{ deleteFile }}
      />
    </div>
  );
};

export default React.memo(Banner);
