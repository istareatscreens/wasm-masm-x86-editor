import React, { Component } from "react";
import React, { Component, useEffect } from "react";

function Boxedwine() {
  const scripts = [
    "browserfs.boxedwine.js",
    "jszip.min.js",
    "boxedwine-shell.js",
    "boxedwine.js",
  ];

  const handleClick = (event) => {
    console.log("Here");
    event.target.style.pointerEvents = "none";
  };

  return (
    <>
      <canvas className={"emscripten"} id={"canvas"} />
      <div
        onClick={(event) => handleClick(event)}
        className={"emscripten-overlay"}
      />
    </>
  );
}

export default Boxedwine;
