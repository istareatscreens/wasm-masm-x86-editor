import React from "react";
import Button from "../../common/Button.jsx";
import { postMessage } from "../../../utility/utilityFunctions.ts";

function Banner({ filename }) {
  const build = () => {
    postMessage("build-code", {
      //data: { filename },
      data: [..."assemble ", "spacebar", ...filename, "enter"],
    });
  };

  return (
    <div className={"banner banner--dark"}>
      <Button
        onClick={build}
        id={"pushData"}
        className={"banner__btn banner_btn--build"}
      >
        {"build"}
      </Button>
    </div>
  );
}

export default Banner;
