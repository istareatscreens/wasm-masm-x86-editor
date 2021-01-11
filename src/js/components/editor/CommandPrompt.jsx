import React, { Component, useEffect, useRef } from "react";
import Iframe from "./Iframe.jsx";

import React from "react";

function CommandPrompt() {
  const refCMD = useRef(null);

  const handleClick = () => {};

  return (
    <Iframe
      onInferredClick={handleClick}
      className="boxedwine"
      id="boxedwine"
      width="100%"
      height="100%"
      src="boxedwine.html"
      sandbox="allow-scripts allow-same-origin"
      border="none"
    ></Iframe>
  );
}

export default CommandPrompt;
