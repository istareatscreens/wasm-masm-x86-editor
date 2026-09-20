import React, { useRef, useEffect } from "react";

import Button from "../../../common/ImageButton.jsx";
import Window from "../../../common/Window.jsx";
import { attachRetroScrollbars } from "../../../common/retroScrollbars.js";

import gitHubLogo from "../../../../../images/gitHubLogo.png";
import donate from "../../../../../images/donate.svg";
import profile16 from "../../../../../images/profile_16x16.png";
import profile32 from "../../../../../images/profile_32x32.png";
import profile48 from "../../../../../images/profile_48x48.png";
import profile64 from "../../../../../images/profile_64x64.png";
import profile128 from "../../../../../images/profile_128x128.png";
import profile256 from "../../../../../images/profile_256x256.png";
import aboutImage from "../../../../../images/about.png";

function AboutWindow({ close }) {
  const scrollHost = useRef(null);
  const scrollSurface = useRef(null);
  useEffect(() => {
    const controls = attachRetroScrollbars(
      scrollSurface.current,
      scrollHost.current,
      "About",
    );
    return () => controls.destroy();
  }, []);

  return (
    <Window
      closeWindow={close}
      windowClass={"window__about"}
      titlebarClass={"title-bar__about"}
      titlebarText={"WASM MASM x86 Editor Info"}
      keepInViewport
    >
      <div
        className="about-host retro-scroll-host"
        ref={scrollHost}
        role="region"
        aria-label="About this application"
        tabIndex={0}
      >
        <div className="about-content" ref={scrollSurface}>
          <div className="about-content__text">
            <img
              className="about-content__image"
              src={aboutImage}
              alt="About Image"
            />
            <div className="about-content__text">
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
              <p>{"INCLUDE Irvine32.inc"}</p>
              <br></br>
              <p> {"Optional library includes:"} </p>
              <p>{"INCLUDE Macros.inc"}</p>
              <p>{"INCLUDE SmallWin.inc"}</p>
              <p>{"INCLUDE VirtualKeys.inc"}</p>
              <p>{"INCLUDE GraphWin.inc"}</p>
              <br />
              <p>
                <a href="https://masm.isas.dev/guide/" target="_blank" rel="noopener noreferrer">
                  MASM and Irvine32 getting-started guide
                </a>
              </p>
              <br />
              <p>
                {
                  "All user data is stored in local storage + IndexedDB. If you have any errors you can reset local storage but make sure to back up your work or it will be wiped. All files can be freely downloaded using the menu buttons."
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
                  "This program is free software. It comes without any warranty, to the extent permitted by applicable law. I take no responsibility for any loss of work or anything else that results from using this software."
                }
                {
                  "Furthermore, this software is not published by, affiliated with or endorsed by Microsoft."
                }
              </p>
              <br></br>
            </div>
          </div>
        </div>
      </div>
      <div className="external-buttons about-links">
        <Button
          src={gitHubLogo}
          className="about-link"
          imageClass="btn__img--about-link"
          type="button"
          alt=""
          onClick={() =>
            window.open(
              "https://github.com/istareatscreens/wasm-masm-x86-editor",
            )
          }
        >
          <span>{"Repo"}</span>
        </Button>
        <Button
          src={profile32}
          srcSet={`${profile16} 16w, ${profile32} 32w, ${profile48} 48w, ${profile64} 64w, ${profile128} 128w, ${profile256} 256w`}
          sizes="20px"
          imageClass="btn__img--about-link"
          className="about-link"
          type="button"
          alt=""
          onClick={() => window.open("https://isas.dev")}
        >
          <span>{"Portfolio"}</span>
        </Button>
        <Button
          src={donate}
          imageClass="btn__img--about-link"
          className="about-link"
          type="button"
          alt=""
          onClick={() => window.open("https://isas.dev/donate")}
        >
          <span>{"Donate"}</span>
        </Button>
      </div>
    </Window>
  );
}

export default AboutWindow;
