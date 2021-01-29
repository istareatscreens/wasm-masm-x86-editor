import React from "react";
import Button from "../../common/Button.jsx";
import {
  postMessage,
  writeCommandToCMD,
} from "../../../utility/utilityFunctions.ts";

const Banner = React.memo(function Banner({ filename }) {
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

  const reset = () => {
    postMessage("reset", {});
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
