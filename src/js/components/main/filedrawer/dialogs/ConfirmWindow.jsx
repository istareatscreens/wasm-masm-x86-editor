import React, { useEffect, useRef } from "react";

import Window from "../../../common/Window.jsx";
import ListBox from "../../../common/ListBox.jsx";
import CheckOption from "../../../common/CheckOption.jsx";
import iconWarning from "../../../../../images/msgWarning.png";
import iconInformation from "../../../../../images/msgInfo.png";
import iconQuestion from "../../../../../images/msgQuestion.png";
import iconError from "../../../../../images/msgError.png";

const ICONS = { warning: iconWarning, information: iconInformation, question: iconQuestion, error: iconError };

// A Windows 98 message box. `choices` is one group of choices or a list of groups (a narrow page wraps whole
// groups); `defaultChoice` (a label, else the first) has the focus. A choice closes the box first; `dismiss`, when
// given, is what the X and Escape do instead of `close`. `option` adds a tick box; `details` go in a list box.
function ConfirmWindow({ title, message, details, choices, defaultChoice, close, dismiss, option, icon }) {
  const focused = useRef(null);
  useEffect(() => {
    if (focused.current) focused.current.focus();
  }, []);
  const leave = dismiss || close;
  const onKeyDown = (event) => {
    if (event.key === "Escape") leave();
  };
  const paragraphs = Array.isArray(message) ? message : [message];
  const groups = Array.isArray(choices[0]) ? choices : [choices];
  const focus = defaultChoice || groups[0][0].label;

  return (
    <Window
      onClose={leave}
      className={"window__confirm"}
      title={title}
      size="fit"
      footer={
        <div className="window__confirm__buttons" onKeyDown={onKeyDown}>
          {groups.map((group, g) => (
            <div key={g} className="window__confirm__group">
              {group.map((choice) => (
                <button
                  key={choice.label}
                  ref={choice.label === focus ? focused : null}
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
          ))}
        </div>
      }
    >
      <div className="window__confirm__body" onKeyDown={onKeyDown}>
        {icon && <img className="window__confirm__icon" src={ICONS[icon]} alt="" width={32} height={32} />}
        <div className="window__confirm__text">
          {paragraphs.map((text, i) => (
            <p key={i} className="window__confirm__message">
              {text}
            </p>
          ))}
          {option && (
            <CheckOption className="window__confirm__option" checked={option.checked} onChange={option.onChange}>
              {option.label}
            </CheckOption>
          )}
          {details && details.length > 0 && <ListBox label="Details" items={details} className="window__confirm__details" />}
        </div>
      </div>
    </Window>
  );
}

export default ConfirmWindow;
