import React from "react";

// Terminal notice: a strip floating over the top edge of the cmd window (absolutely positioned, out of the
// flow), so it never resizes the terminal grid. Notices only ever restart the terminal iframe - they never
// touch the user's files or the editor state.
function RetroNotice({ title, children, actions = [], onDismiss, id = "retro-notice" }) {
  return (
    <div className="freeze-banner" id={id} role="alert" aria-labelledby={id + "-title"}>
      <span className="freeze-banner__icon" aria-hidden="true"></span>
      <div className="freeze-banner__text">
        <strong className="freeze-banner__title" id={id + "-title"}>
          {title}
        </strong>
        <span className="freeze-banner__body">{children}</span>
      </div>
      <div className="freeze-banner__actions">
        {actions.map((a) => (
          <button type="button" key={a.label} className="freeze-banner__btn" onClick={a.onClick}>
            {a.label}
          </button>
        ))}
        <button type="button" className="freeze-banner__btn" onClick={onDismiss}>
          OK
        </button>
      </div>
      <div className="title-bar-controls freeze-banner__close">
        <button className="title-bar__btn btn" aria-label="Close" title="hide" onClick={onDismiss}></button>
      </div>
    </div>
  );
}

export default React.memo(RetroNotice);
