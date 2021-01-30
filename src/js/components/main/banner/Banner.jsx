import React, { useState, useEffect } from "react";
import Button from "../../common/Button.jsx";
import {
  postMessage,
  writeCommandToCMD,
} from "../../../utility/utilityFunctions.ts";

const Banner = React.memo(function Banner({ filename, fileList }) {
  const [disableRun, setDisableRun] = useState(true);

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

  return (
    <div className={"banner banner--dark"}>
      <Button
        onClick={build}
        id={"pushData"}
        className={"banner__btn banner_btn--build windows--btn"}
      >
        {"build"}
      </Button>
      <Button
        onClick={run}
        id={"runEXE"}
        className={"banner__btn banner_btn--run windows--btn"}
        disabled={checkForFile()}
      >
        {"run"}
      </Button>
      <Button
        onClick={reset}
        id={"resetCMD"}
        className={"banner__btn banner_btn--reset windows--btn"}
      >
        {"reset"}
      </Button>
    </div>
  );
});

export default Banner;
