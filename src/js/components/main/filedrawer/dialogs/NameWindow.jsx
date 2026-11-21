import React, { useEffect, useId, useRef, useState } from "react";

import Button from "../../../common/ImageButton.jsx";
import Window from "../../../common/Window.jsx";
import TextField from "../../../common/TextField.jsx";

import accept from "../../../../../images/accept.png";
import acceptDisabled from "../../../../../images/accept-disabled.png";

// The typed name is trimmed and NFC-normalised; problemFor(name) returns the first broken rule or null. Enter is
// evaluated synchronously, so a name typed and confirmed at once is never swallowed. finalName(name) is the name
// created; `children` are further controls, where Enter creates and Escape closes too.
function NameWindow({ title, label, initial = "", problemFor, finalName = (name) => name, onCreate, close, children }) {
  const [value, setValue] = useState(initial);
  const input = useRef(null);
  const lineId = useId();

  useEffect(() => {
    input.current.focus();
    input.current.select();
  }, []);

  const name = value.trim().normalize("NFC");
  const problem = problemFor(name);
  const shownProblem = value && problem ? problem : "";
  const final = finalName(name);

  const create = () => {
    if (problem) return;
    onCreate(name);
    close();
  };

  // a handled Enter is cancelled: its keypress would otherwise reach the control the focus returns to (the
  // toolbar button) and open the window again
  const onKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      create();
    } else if (event.key === "Escape") close();
  };

  return (
    <Window
      onClose={close}
      className={"window--create-file"}
      title={title}
      size="fit"
      footer={
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
      }
    >
      <TextField
        value={value}
        aria-label={label}
        aria-invalid={!!shownProblem}
        aria-describedby={lineId}
        title={problem || label}
        onKeyDown={onKeyDown}
        onChange={(event) => setValue(event.target.value)}
        ref={input}
      />
      <p id={lineId} className="window__name-problem">
        <span aria-live="polite">{shownProblem}</span>
        {shownProblem ? "" : value && final !== name ? "Creates " + final : "\u00a0"}
      </p>
      {children && (
        <div className="window__name-more" onKeyDown={onKeyDown}>
          {children}
        </div>
      )}
    </Window>
  );
}

export default NameWindow;
