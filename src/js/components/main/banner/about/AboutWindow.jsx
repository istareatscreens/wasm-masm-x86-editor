import React, { useRef } from "react";

import Draggable from "react-draggable";

import Button from "../../../common/ImageButton.jsx";

import gitHubLogo from "../../../../../images/gitHubLogo.png";
import bmcLogo from "../../../../../images/bmcLogo.svg";

function AboutWindow({ closeAbout }) {
  const windowRef = useRef(null);
  return (
    <Draggable
      cancel={".no-drag"}
      positionOffset={{ x: "-50%", y: "-50%" }}
      nodeRef={windowRef}
    >
      <div ref={windowRef} className="window window__about no-cursor">
        <div className={`title-bar title-bar__about cursor`}>
          <div className="title-bar-text">WASM MASM x86 Editor Info</div>
          <div className="title-bar-controls no-drag">
            <button
              onClick={closeAbout}
              className={"title-bar__btn btn"}
              aria-label="Close"
            ></button>
          </div>
        </div>
        <div className="window-body no-drag">
          <p>
            {
              "WASM MASM x86 Editor uses JWlink and JWasm to compile x86/x64 Microsoft assembly language (MASM) and provides a 32-bit wine terminal to execute x86 code using Boxedwine emscripten port."
            }
          </p>
          <br />
          <p>
            {
              "Irvine library created by Kip Irvine is also included. You can include it with the following line:"
            }
          </p>
          <p>{"INCLUDE D:/irvine/Irvine32.inc"}</p>
          <br></br>
          <p>
            {
              "All user data is stored in local storage (which should persist between sessions) and can be freely downloaded using menu buttons. Any bugs experienced can be resolved by clearing browser data or deleting local file data (make sure to download any saved files first)."
            }
          </p>
          <br></br>
          <p>
            {
              "Note this app should be considered a work in progress and is not bug free. If you find a bug please feel free to post an issue."
            }
          </p>
          <br></br>
          <p>
            {
              "This software was not published by, affiliated with or endorsed by Microsoft."
            }
          </p>
          <br></br>
          <div className="external-buttons">
            <Button
              src={gitHubLogo}
              className={"btn--text btn--window btn--window--first"}
              alt={"go to github repository"}
              onClick={() => window.open("https://github.com/istareatscreens")}
            >
              <span>{"Repo"}</span>
            </Button>
            <Button
              src={bmcLogo}
              className={"btn--text btn--window"}
              alt={"buy me a coffee"}
              onClick={() =>
                window.open("https://www.buymeacoffee.com/istareatscreens")
              }
            >
              <span>{"Buy me a coffee"}</span>
            </Button>
          </div>
        </div>
      </div>
    </Draggable>
  );
}

export default AboutWindow;
