import React, { useEffect, useRef } from "react";

import Window from "../../../common/Window.jsx";
import RetroScrollArea from "../../../common/RetroScrollArea.jsx";

// A retro message box: the text (a string or a list of lines) and one button per choice;
// the first choice has the focus, Escape closes as the title bar's X does.
function ConfirmWindow({ title, message, details, choices, close }) {
  const first = useRef(null);
  useEffect(() => {
    if (first.current) first.current.focus();
  }, []);
  const onKeyDown = (event) => {
    if (event.key === "Escape") close();
  };

  return (
    <Window
      onClose={close}
      className={"window__confirm"}
      title={title}
      footer={
        <div className="window__confirm__buttons" onKeyDown={onKeyDown}>
          {choices.map((choice, i) => (
            <button
              key={choice.label}
              ref={i === 0 ? first : null}
              type="button"
              className="btn btn--text window__confirm__btn"
              onClick={() => {
                close();
                if (choice.onSelect) choice.onSelect();
              }}
            >
              {choice.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="window__confirm__body" onKeyDown={onKeyDown}>
        <p className="window__confirm__message">{message}</p>
        {details && details.length > 0 && (
          <RetroScrollArea label="Details" className="window__confirm__details-area">
            <ul className="window__confirm__details">
              {details.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </RetroScrollArea>
        )}
      </div>
    </Window>
  );
}

export default ConfirmWindow;
