import React, { useMemo } from "react";

import { useStore } from "../session/debugStore";
import ValueTree from "../tree/ValueTree.jsx";
import useRows, { scopeSource } from "../tree/useRows.js";

export const RUNNING = "The program is running.";

export function Empty({ children }) {
  return <p className="debug-section__empty">{children}</p>;
}

// One of the shown frame's scopes as a value tree. `idle` is said before a session, `none` when the scope is empty.
function ScopeTree({ controller, scope, label, idle, none }) {
  const phase = useStore(controller.store, (view) => view.phase);
  const source = useMemo(() => scopeSource(controller, scope), [controller, scope]);
  const { rows: found, error, stale } = useRows(controller, "scope:" + scope, source);
  if (!found) return <Empty>{error || (phase === "idle" ? idle : RUNNING)}</Empty>;
  if (!found.rows.length) return <Empty>{none}</Empty>;
  return <ValueTree controller={controller} label={label} rows={found.rows} reference={found.reference} stale={stale} />;
}

export default ScopeTree;
