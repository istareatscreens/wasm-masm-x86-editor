import React from "react";
import Button from "../../common/Button.jsx";
import {
  postMessage,
  writeCommandToCMD,
  checkIfEqualArraysNoDuplicateElements,
  checkFileExtension,
} from "../../../utility/utilityFunctions.ts";

import buildFile from "../../../../images/buildFile.png";
import cmdReset from "../../../../images/cmdReset.png";
import runBinary from "../../../../images/runBinary.png";

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
    <>
      <div className={"banner"} />
      <div className={"banner__main"}>
        <Button
          onClick={build}
          alt={"compile and link .asm file"}
          id={"pushData"}
          disabled={checkIfAsm()}
          src={buildFile}
        />
        <Button
          onClick={run}
          alt={"run compiled binary"}
          id={"runEXE"}
          disabled={checkForFile()}
          src={runBinary}
        />
        <Button
          alt={"reset command prompt"}
          onClick={reset}
          id={"resetCMD"}
          src={cmdReset}
        />
      </div>
    </>
  );
};

export default React.memo(Banner);
