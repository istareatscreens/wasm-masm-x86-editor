import React from "react";

import Button from "../../../common/ImageButton.jsx";

import gitHubLogo from "../../../../../images/gitHubLogo.png";
import bmcLogo from "../../../../../images/bmcLogo.svg";

function AboutWindow({ closeAbout }) {
  return (
    <div className="window window__about">
      <div className="title-bar title-bar__about">
        <div className="title-bar-text">WASM MASM x86 Editor Info</div>
        <div className="title-bar-controls">
          <button
            onClick={closeAbout}
            className={"title-bar__btn btn"}
            aria-label="Close"
          ></button>
        </div>
      </div>
      <div className="window-body">
        <p>
          {
            "WASM MASM x86 Editor uses JWlink and JWasm to compile x86/x64 Microsoft assembly language (MASM) and provides a 32-bit wine terminal to execute x86 code using Boxedwine emscripten port."
          }
        </p>
        <br></br>
        <p>
          {
            "All user data is stored in local storage (which should persist between sessions) and can be freely downloaded using menu buttons. Any bugs experienced can be resolved by clearing browser data or deleting local file data (make sure to download any saved files first)."
          }
        </p>
        <br></br>
        <p>{"Note this app is a work in progress and not bug free."}</p>
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
  );
}

export default AboutWindow;
