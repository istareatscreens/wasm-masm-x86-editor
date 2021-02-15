import React from "react";

import Button from "../../../common/ImageButton.jsx";

import gitHubLogo from "../../../../../images/gitHubLogo.png";

function AboutWindow({ closeAbout }) {
  return (
    <div className="window window__about">
      <div className="title-bar title-bar__about">
        <div className="title-bar-text">WASM MASM x86 Editor Info</div>
        <div className="title-bar-controls">
          <button onClick={closeAbout} aria-label="Close"></button>
        </div>
      </div>
      <div className="window-body">
        <p>
          {`WASM MASM x86 Editor uses JWlink and JWasm to compile x86/x64 Microsoft assembly language (MASM) and provides a 32-bit wine terminal to execute x86 code using Boxedwine emscripten port. <br>
    
    All user data is stored in local storage (which should persist between sessions) and can be freely downloaded using menu buttons. Any bugs experienced can be resolved by clearing browser data or deleting local file data (make sure to download any saved files first).<br><br>

    Note this app is a work in progress and not bug free. `}
        </p>
        <div className="external-buttons">
          <Button
            src={gitHubLogo}
            className={"btn--about"}
            href={"https://github.com/istareatscreens"}
          ></Button>
          <script
            type={"text/javascript"}
            src={"https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js"}
            data-name={"bmc-button"}
            data-slug={"istareatscreens"}
            data-color={"#c0c0c0"}
            data-emoji={""}
            data-font={"Cookie"}
            data-text={"Buy me a coffee"}
            data-outline-color={"#000000"}
            data-font-color={"#000000"}
            data-coffee-color={"#FFDD00"}
          ></script>
        </div>
      </div>
    </div>
  );
}

export default AboutWindow;
