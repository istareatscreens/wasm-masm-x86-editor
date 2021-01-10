import React, { Component, useEffect } from "react";
import { removeScript, addScript } from "../utility/utilityFunctions.ts";
import IFrame from "./IFrame.jsx";

import React from "react";

function CommandPrompt() {
  return (
    <iframe
      className="boxedwine"
      width="100%"
      height="100%"
      src="boxedwine.html"
      border="none"
    ></iframe>
  );
}

export default CommandPrompt;
