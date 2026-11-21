import React, { useMemo } from "react";

import { useStore } from "../session/debugStore";
import useRows, { scopeSource } from "../tree/useRows.js";
import { Empty, RUNNING } from "./ScopeTree.jsx";
import SidebarSection from "./SidebarSection.jsx";
import VirtualList from "./VirtualList.jsx";

function StackRow({ index, style, rows, onMemory }) {
  const row = rows[index];
  return (
    <div style={style} role="listitem" className={"debug-stack__row" + (row.type ? " debug-stack__row--noted" : "")} title={row.type || undefined} onDoubleClick={() => onMemory(row.memoryReference)}>
      <span className="debug-stack__address">{row.name}</span>
      <span className="debug-stack__value">{row.value}</span>
      <span className="debug-stack__note">{row.type || ""}</span>
    </div>
  );
}

function StackRows({ controller }) {
  const phase = useStore(controller.store, (view) => view.phase);
  const source = useMemo(() => scopeSource(controller, "Stack"), [controller]);
  const { rows: found, error, stale } = useRows(controller, "scope:Stack", source);
  const rowProps = useMemo(() => ({ rows: found ? found.rows : [], onMemory: (address) => address && controller.viewMemory(address) }), [found, controller]);
  if (!found || !found.rows.length) return <Empty>{error || (phase === "idle" ? "Start debugging (F5) to see the stack." : RUNNING)}</Empty>;
  return <VirtualList label="Stack" count={found.rows.length} row={StackRow} rowProps={rowProps} className={"debug-stack" + (stale ? " debug-virtual--stale" : "")} />;
}

// The stack from ESP upward, a doubleword a row, labelled where known (return address, saved EBP, parameter, LOCAL).
function StackSection({ controller }) {
  return (
    <SidebarSection id="stack" title="Stack" controller={controller} scrolls>
      <StackRows controller={controller} />
    </SidebarSection>
  );
}

export default StackSection;
