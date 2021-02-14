import React from "react";

function AboutWindow(props) {
  return (
    <div className="window">
      <div className="title-bar">
        <div className="title-bar-text">WASM MASM x86 Editor Info</div>
        <div className="title-bar-controls">
          <button aria-label="Close"></button>
        </div>
      </div>
      <div className="window-body">
        <p style="text-align:center;font-family:Arial">
          {`WASM MASM x86 Editor uses JWlink and JWasm to compile x86/x64 Microsoft assembly language (MASM) and provides a 32-bit wine terminal to execute x86 code using Boxedwine emscripten port. <br>
    
    All user data is stored in local storage (which should persist between sessions) and can be freely downloaded using menu buttons. Any bugs experienced can be resolved by clearing browser data or deleting local file data (make sure to download any saved files first).<br><br>

    Note this app is a work in progress and not bug free. `}
        </p>
        <div className="external-buttons">
          {
            //<button className="github-btn"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg><div class="git-text">Github<div><button/>
            //</div><script type="text/javascript" src="https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js" data-name="bmc-button" data-slug="istareatscreens" data-color="#c0c0c0" data-emoji=""  data-font="Cookie" data-text="Buy me a coffee" data-outline-color="#000000" data-font-color="#000000" data-coffee-color="#FFDD00" ></script>
          }
        </div>
      </div>
    </div>
  );
}

export default AboutWindow;
