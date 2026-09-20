import React from "react";

// Retro-Windows notice banner for the terminal. It is rendered inside
// the terminal panel (CommandPrompt) as a thin strip floating over the top edge of
// the cmd window (position:absolute in the panel, out of the layout flow), so it
// never reflows or resizes the terminal grid area and follows the panel through
// every view layout. Styled after the Windows 98 information/tooltip surface
// (COLOR_INFOBK #ffffe1 on black text with a 1 px window-frame border) with the
// classic warning triangle: a bold one-line title, a short message, the caller's
// action buttons plus an OK button, and the same "X" close button the app's retro
// title bars use. Used for every terminal notice: hardlock (FreezeBanner), a program
// that crashed, runtime downgrade (MT -> ST), snapshot-restore fallback, slow boot.
// Notices only ever restart the terminal iframe - they never touch the user's files
// (IndexedDB in this parent app) or the editor state.
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
