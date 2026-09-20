import React from "react";
import RetroNotice from "../../common/RetroNotice.jsx";

// Retro-Windows banner shown when the emulator hardlocks (see Boxedwine.jsx
// startFreezeDetector -> "emulator-frozen"; App hides it again on
// "emulator-recovered", i.e. when the guest turns out to be alive after all).
// Floats over the top edge of the cmd window and is dismissable (RetroNotice). The
// reset action ONLY reloads the emulator iframe — it does NOT touch the user's
// files (IndexedDB in this parent app) or the editor (parent React state).
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
