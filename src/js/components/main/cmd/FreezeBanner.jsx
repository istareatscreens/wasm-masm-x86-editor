import React from "react";
import RetroNotice from "../../common/RetroNotice.jsx";

// Shown when the emulator hardlocks (Boxedwine.jsx startFreezeDetector); App hides it on "emulator-recovered".
// Reset only reloads the emulator iframe: the user's files and the editor are in the parent app.
function FreezeBanner({ onReset, onDismiss }) {
  return (
    <RetroNotice
      id="freeze-banner"
      title="Terminal unresponsive"
      onDismiss={onDismiss}
      actions={[{ label: "Reset terminal", onClick: onReset }]}
    >
      <span className="freeze-banner__msg">
        The terminal has stopped responding (a program may be stuck, or the emulator crashed).
      </span>
      <span className="freeze-banner__safe">
        <strong>Your files are safe:</strong> resetting only restarts the terminal.
      </span>
    </RetroNotice>
  );
}

export default React.memo(FreezeBanner);
