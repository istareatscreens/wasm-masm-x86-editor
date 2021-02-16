import React, { useState } from "react";
import Button from "../../common/ImageButton.jsx";
import {
  postMessage,
  writeCommandToCMD,
  checkIfEqualArraysNoDuplicateElements,
  checkFileExtension,
} from "../../../utility/utilityFunctions.ts";

import About from "./about/About.jsx";

import buildFile from "../../../../images/buildFile.png";
import cmdReset from "../../../../images/cmdReset.png";
import runBinary from "../../../../images/runBinary.png";
import about from "../../../../images/about.png";
import ViewControlGroup from "./viewcontrols/ViewControlGroup.jsx";

const Banner = function Banner({ filename, fileList, componentRefs }) {
  const [aboutPageOpened, setAboutPageOpened] = useState(false);

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

  //TODO: FIX bug when selecting non asm files
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
      {aboutPageOpened ? (
        <About closeAbout={() => setAboutPageOpened(false)} />
      ) : (
        ""
      )}
      <div className={"banner__patch"} />
      <div className={"banner"} />
      <div className={"banner__main"}>
        <div className={"banner__main__group banner__main__group--start"}>
          <Button
            className={"banner__main__btn"}
            onClick={build}
            alt={"compile and link .asm file"}
            id={"pushData"}
            disabled={checkIfAsm()}
            src={buildFile}
          />
          <Button
            onClick={run}
            className={"banner__main__btn"}
            alt={"run compiled binary"}
            id={"runEXE"}
            disabled={checkForFile()}
            src={runBinary}
          />

          <Button
            alt={"reset command prompt"}
            className={"banner__main__btn"}
            onClick={reset}
            id={"resetCMD"}
            src={cmdReset}
          />
        </div>
        <ViewControlGroup
          className={"banner__main__group banner__main__group--mid"}
        />
        <div className={"banner__main__group banner__main__group--end"}>
          <Button
            alt={"application info"}
            className={"banner__main__btn"}
            onClick={() => setAboutPageOpened(!aboutPageOpened)}
            src={about}
          />
        </div>
      </div>
    </>
  );
};

export default React.memo(Banner);
