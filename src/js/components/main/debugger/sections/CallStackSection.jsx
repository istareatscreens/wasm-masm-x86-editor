import React from "react";

import PixelIcon from "../../../common/PixelIcon.jsx";
import { useStore } from "../session/debugStore";
import { Empty, RUNNING } from "./ScopeTree.jsx";
import SidebarSection from "./SidebarSection.jsx";
import currentIcon from "../../../../../images/debugCurrent.png";
import callerIcon from "../../../../../images/debugCaller.png";

// The call stack's rows: each frame of the program's own code, and each run of frames without a source
// (Irvine32's routines, Windows) as one "[External Code]" row, as Visual Studio shows them.
function rowsOf(frames) {
  const rows = [];
  for (const frame of frames) {
    const last = rows[rows.length - 1];
    if (frame.subtle && last && last.external) last.frames.push(frame);
    else rows.push(frame.subtle ? { external: true, frames: [frame] } : { external: false, frames: [frame] });
  }
  return rows;
}

function CallStackSection({ controller }) {
  const frames = useStore(controller.store, (view) => view.frames);
  const selected = useStore(controller.store, (view) => view.frame);
  const threads = useStore(controller.store, (view) => view.threads);
  const stopped = useStore(controller.store, (view) => (view.stop ? view.stop.threadId : 0));
  const phase = useStore(controller.store, (view) => view.phase);
  const rows = rowsOf(frames);
  const at = rows.findIndex((row) => row.frames.some((frame) => frame.id === selected));

  const onKeyDown = (event) => {
    const step = { ArrowDown: 1, ArrowUp: -1 }[event.key];
    const to = event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : step ? at + step : -1;
    if (to < 0 || to >= rows.length) return;
    event.preventDefault();
    controller.selectFrame(rows[to].frames[0].id);
  };

  return (
    <SidebarSection id="callstack" title="Call Stack" controller={controller}>
      {threads.length > 1 && (
        <ul className="debug-threads" aria-label="Threads">
          {threads.map((thread) => (
            <li key={thread.id} className={"debug-threads__thread" + (thread.id === stopped ? " debug-threads__thread--stopped" : "")}>
              {thread.name}
            </li>
          ))}
        </ul>
      )}
      {rows.length ? (
        <ul className="debug-list" role="listbox" aria-label="Call Stack" tabIndex={0} aria-activedescendant={at >= 0 ? "debug-frame-" + at : undefined} onKeyDown={onKeyDown}>
          {rows.map((row, i) => {
            const frame = row.frames[0];
            const chosen = i === at;
            return (
              <li
                key={frame.id}
                id={"debug-frame-" + i}
                role="option"
                aria-selected={chosen}
                className={"debug-list__row" + (chosen ? " debug-list__row--selected" : "") + (row.external ? " debug-list__row--subtle" : "")}
                title={row.external ? row.frames.map((entry) => entry.name).join("\n") : frame.fileName + ", line " + frame.line}
                onClick={() => controller.selectFrame(frame.id)}
              >
                <span className="debug-list__mark">
                  {frame.id === 1 ? <PixelIcon src={currentIcon} pixels={11} rem={1.1} /> : chosen ? <PixelIcon src={callerIcon} pixels={11} rem={1.1} /> : null}
                </span>
                <span className="debug-list__text">{row.external ? "[External Code]" : frame.name}</span>
                {!row.external && <span className="debug-list__place">{frame.fileName + ":" + frame.line}</span>}
              </li>
            );
          })}
        </ul>
      ) : (
        <Empty>{phase === "idle" ? "Start debugging (F5) to see which procedures are running." : RUNNING}</Empty>
      )}
    </SidebarSection>
  );
}

export default CallStackSection;
