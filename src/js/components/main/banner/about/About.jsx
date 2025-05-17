import React from "react";
import AboutWindow from "./AboutWindow.jsx";
import WindowBackground from "./WindowBackground.jsx";

function About({ close }) {
  return (
    <>
      <WindowBackground />
      <AboutWindow close={close} />
    </>
  );
}

export default About;
