import React, { useEffect } from "react";
import { createMessageListner } from "../../utility/utilityFunctions";

function Boxedwine() {
  const scripts = [
    "browserfs.boxedwine.js",
    "jszip.min.js",
    "boxedwine-shell.js",
    "boxedwine.js",
  ];

  useEffect(() => {
    createMessageListner();
    console.log("Added event listener");
    window.addEventListener("editor-selected", (event) => {
      event.preventDefault();
      document.getElementById("emscripten-overlay").style.pointerEvents =
        "unset";
    });
    return () => {
      console.log("removed");
      window.removeEventListener("editor-selected");
    };
  }, []);

  const handleClick = (event) => {
    event.preventDefault();
    event.target.style.pointerEvents = "none";
  };

  return (
    <>
      <canvas
        onContextMenu={(event) => event.preventDefault()}
        className={"emscripten"}
        id={"canvas"}
      />
      <div
        onClick={(event) => handleClick(event)}
        onContextMenu={(event) => handleClick(event)}
        id={"emscripten-overlay"}
        className={"emscripten-overlay"}
      />
    </>
  );
}

export default Boxedwine;
