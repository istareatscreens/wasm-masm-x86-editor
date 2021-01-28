import React from "react";
import Button from "../../common/Button.jsx";
import { postMessage } from "../../../utility/utilityFunctions.ts";

const Banner = React.memo(function Banner({ filename }) {
  const build = () => {
    postMessage("write-command", {
      //data: { filename },
      data: [..."assemble ", "spacebar", ...filename, "enter"],
    });
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
