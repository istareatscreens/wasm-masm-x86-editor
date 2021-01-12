import React from "react";
import Button from "../../common/Button.jsx";

function Banner(props) {
  return (
    <div className={"banner banner--dark"}>
      <Button id={"pushData"} className={"banner__btn banner_btn--build"}>
        {"build"}
      </Button>
    </div>
  );
}

export default Banner;
