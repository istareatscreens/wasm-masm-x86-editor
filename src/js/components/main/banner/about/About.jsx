import React from "react";
import Draggable from "react-draggable";
import AboutBackground from "./AboutBackground.jsx";
import AboutWindow from "./AboutWindow.jsx";

function About({ closeAbout }) {
  return (
    <>
      <AboutBackground />
      <Draggable>
        <AboutWindow closeAbout={closeAbout} />
      </Draggable>
    </>
  );
}

export default About;
