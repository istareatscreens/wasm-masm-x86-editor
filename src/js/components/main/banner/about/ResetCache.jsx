import React from "react";
import WindowBackground from "./WindowBackground.jsx";
import CacheResetWindow from "./CacheResetWindow.jsx";

function About({ close }) {
  return (
    <>
      <WindowBackground />
      <CacheResetWindow close={close} />
    </>
  );
}

export default About;
