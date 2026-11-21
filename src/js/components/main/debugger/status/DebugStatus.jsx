import React, { forwardRef } from "react";

import { useStore } from "../session/debugStore";

// The status line, read out when it changes. It can hold the focus (a stop moves it here from the terminal) and does
// nothing with keys.
const DebugStatus = forwardRef(function DebugStatus({ controller }, ref) {
  const status = useStore(controller.store, (view) => view.status);
  const note = useStore(controller.store, (view) => view.note);
  const hint = useStore(controller.store, (view) => (view.stop ? view.stop.hint : ""));
  const report = useStore(controller.store, (view) => (view.stop && view.stop.report) || "");
  const exception = useStore(controller.store, (view) => !!view.stop && view.stop.reason === "exception");
  return (
    <div ref={ref} id="debug-status" className={"debug-status" + (exception ? " debug-status--exception" : "")} role="status" aria-live="polite" aria-atomic="true" tabIndex={-1}>
      <p className="debug-status__line">{status}</p>
      {hint && <p className="debug-status__note">{hint}</p>}
      {report && (
        <button type="button" className="btn btn--text debug-status__report" onClick={() => window.open(report)}>
          Report bug
        </button>
      )}
      {note && note !== status && <p className="debug-status__note">{note}</p>}
    </div>
  );
});

export default DebugStatus;
