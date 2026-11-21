import React from "react";

import RetroNotice from "../../../common/RetroNotice.jsx";
import { useStore } from "../session/debugStore";

// The debugger's own failure, with a bug report. `onResetTerminal` is offered when the terminal stopped answering.
function DebugFailureNotice({ controller, onResetTerminal }) {
  const failure = useStore(controller.store, (view) => view.failure);
  if (!failure) return null;
  const dismiss = () => controller.store.set({ failure: null });
  const actions = [{ label: "Report bug", onClick: () => window.open(failure.url) }];
  if (failure.kind === "lost-contact") actions.push({ label: "Reset terminal", onClick: () => (dismiss(), onResetTerminal()) });
  if (failure.kind === "out-of-date") actions.push({ label: "Reload", onClick: () => window.location.reload() });
  return (
    <div className="debug-notice">
      <RetroNotice id="debug-failure-notice" title={failure.fatal ? "Debugger stopped:" : "Debugger:"} onDismiss={dismiss} actions={actions}>
        <span className="freeze-banner__msg">{failure.message}.</span>
        <span className="freeze-banner__hint">A bug in the debugger, not in your program: please report it.</span>
        <span className="freeze-banner__safe">Your program and files are untouched.</span>
      </RetroNotice>
    </div>
  );
}

export default DebugFailureNotice;
