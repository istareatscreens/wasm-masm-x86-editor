import React, { useEffect, useState } from "react";

import Button from "../../../common/ImageButton.jsx";
import Window from "../../../common/Window.jsx";
import accept from "../../../../../images/accept.png";
import acceptDisabled from "../../../../../images/accept-disabled.png";
import errorImage from "../../../../../images/error.png";

function CacheResetWindow({ close }) {
  const formatCountDown = (count) => ` ( ${count} )`;
  const defaultCount = 3;

  const [cannotExecute, setCannotExecute] = useState(true);
  const [countDown, setCountDown] = useState(formatCountDown(defaultCount));

  useEffect(() => {
    let count = defaultCount;

    const timer = setInterval(() => {
      switch (true) {
        case (1 < count):
          setCountDown(formatCountDown(--count));
          return;
        case 1 === count:
          setCountDown(formatCountDown(--count));
          setCannotExecute(false);
          return;
      }
      setCountDown("");
      setCannotExecute(false);
      clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, []);


  return (
    <Window
      closeWindow={close}
      windowClass={"window__reset-cache"}
      titlebarClass={"title-bar__about"}
      titlebarText={"Hard Rest Everything"}
    >
      <div class="window__reset-cache__content">
        <img
          class="window__reset-cache__content__image"
          src={errorImage}
          alt="Warning Image"
        />
        <div
          class="window__reset-cache__content__text"
        >
          <h1 class="window__reset-cache__content__text--warning">
            {
              "WARNING: THIS WILL WIPE ALL YOUR DATA AND RESET EVERYTHING MAKE SURE TO BACKUP YOUR FILES"
            }
          </h1>
          <br />
          <p>
            {
              "If the masm terminal is broken this will fix it for you by clearing cache and refreshing the page."
            }
          </p>
          <br></br>
          <p><b>
            {
              "Executing this will result in all files being lost! Backup before executing!"
            }
          </b>
          </p>
          <br></br>
        </div>
      </div>
      <div className="external-buttons">
        <Button
          src={cannotExecute ? acceptDisabled : accept}
          className={"btn--text btn--window window__reset-cache--btn"}
          alt={"Hard Reset Everything"}
          disabled={cannotExecute}
          onClick={() => {
            const settings = window.localStorage.getItem('settings')
            window.localStorage.clear()
            if (settings) {
              window.localStorage.setItem('settings', settings);
            }
            location.reload(true);
          }
          }
        >
          <span>{`Hard Reset${countDown}`}</span>
        </Button>
      </div>
    </Window>
  );
}

export default CacheResetWindow;
