import React, { useEffect, useRef, useState } from "react";

import Button from "../../../common/ImageButton.jsx";
import Window from "../../../common/Window.jsx";

import accept from "../../../../../images/accept.png";
import acceptDisabled from "../../../../../images/accept-disabled.png";

// "Create file in D:\lab1" / "Create folder in D:\lab1". The typed name is trimmed and
// NFC-normalised; problemFor(name) returns the first broken rule (shown as the box's
// tooltip) or null. Enter is evaluated synchronously, so a name typed and confirmed at
// once is never swallowed.
function NameWindow({ title, label, problemFor, onCreate, close }) {
  const [value, setValue] = useState("");
  const input = useRef(null);

  useEffect(() => {
    input.current.focus();
  }, []);

  const name = value.trim().normalize("NFC");
  const problem = problemFor(name);

  const create = () => {
    if (problem) return;
    onCreate(name);
    close();
  };

  return (
    <Window
      closeWindow={close}
      titlebarClass={"title-bar--create-file"}
      windowClass={"window--create-file"}
      titlebarText={title}
      keepInViewport
    >
      <input
        type="text"
        className="input-box"
        value={value}
        aria-label={label}
        aria-invalid={!!(value && problem)}
        title={problem || label}
        onKeyDown={(event) => {
          // a handled Enter is cancelled: its keypress would otherwise reach the control
          // the focus returns to (the toolbar button) and open the window again
          if (event.key === "Enter") {
            event.preventDefault();
            create();
          } else if (event.key === "Escape") close();
        }}
        onChange={(event) => setValue(event.target.value)}
        ref={input}
      />
      <p className="window__name-problem" aria-live="polite">
        {value && problem ? problem : "\u00a0"}
      </p>
      <div className="external-buttons external-buttons--createFile">
        <Button
          src={problem ? acceptDisabled : accept}
          className={"btn btn--window btn--createFile"}
          imageClass={"btn--window--image"}
          title={label}
          disabled={!!problem}
          onClick={create}
        />
      </div>
    </Window>
  );
}

export default NameWindow;
