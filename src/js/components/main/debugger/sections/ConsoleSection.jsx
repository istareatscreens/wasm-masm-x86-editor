import React, { useEffect, useMemo, useRef, useState } from "react";

import TextField from "../../../common/TextField.jsx";
import { useStore } from "../session/debugStore";
import ValueTree from "../tree/ValueTree.jsx";
import SidebarSection from "./SidebarSection.jsx";
import VirtualList from "./VirtualList.jsx";

const HISTORY = 50;

function ConsoleRow({ index, style, lines, dropped }) {
  if (dropped && index === 0) {
    return (
      <div style={style} role="listitem" className="debug-console__row debug-console__row--message">
        {dropped + (dropped === 1 ? " earlier line is" : " earlier lines are") + " not shown"}
      </div>
    );
  }
  const line = lines[index - (dropped ? 1 : 0)];
  return (
    <div style={style} role="listitem" className={"debug-console__row debug-console__row--" + line.kind} title={line.text}>
      {line.kind === "input" ? "> " + line.text : line.text}
    </div>
  );
}

// The last answer that has parts stays under the lines, to be opened.
function ConsoleSection({ controller }) {
  const log = useStore(controller.console.store, (state) => state);
  const result = useStore(controller.store, (view) => view.consoleResult);
  const stopped = useStore(controller.store, (view) => view.phase === "stopped");
  const [text, setText] = useState("");
  const history = useRef({ entries: [], at: 0 });
  const list = useRef(null);
  const count = log.lines.length + (log.dropped ? 1 : 0);

  // the newest line stays in sight
  useEffect(() => {
    if (count && list.current) list.current.scrollToRow({ index: count - 1, align: "end" });
  }, [count, log.lines]);

  const rowProps = useMemo(() => ({ lines: log.lines, dropped: log.dropped }), [log]);
  const resultRows = useMemo(() => (result && result.variable.variablesReference ? [result.variable] : []), [result]);

  const onKeyDown = (event) => {
    const past = history.current;
    if (event.key === "Enter" && text.trim()) {
      past.entries = past.entries.filter((entry) => entry !== text.trim()).concat(text.trim()).slice(-HISTORY);
      past.at = past.entries.length;
      controller.evaluateInConsole(text.trim());
      setText("");
    } else if (event.key === "ArrowUp" && past.at > 0) {
      past.at--;
      setText(past.entries[past.at]);
    } else if (event.key === "ArrowDown" && past.at < past.entries.length) {
      past.at++;
      setText(past.entries[past.at] || "");
    } else return;
    event.preventDefault();
  };

  return (
    <SidebarSection id="console" title="Console" controller={controller} scrolls>
      <div className="debug-console">
        {count ? (
          <VirtualList
            label="Console"
            count={count}
            row={ConsoleRow}
            rowProps={rowProps}
            onList={(api) => {
              list.current = api;
            }}
            className="debug-console__lines"
          />
        ) : (
          <p className="debug-section__empty debug-console__lines">Logpoints, OutputDebugString text and the debugger's messages appear here.</p>
        )}
        {resultRows.length > 0 && (
          <div className="debug-console__result">
            <ValueTree controller={controller} label="Last result" rows={resultRows} stale={!stopped || result.stale} />
          </div>
        )}
        <TextField
          id="debug-console-input"
          className="debug-section__input"
          aria-label="Evaluate an expression"
          placeholder={stopped ? "eax, total, total = 5" : "Available while the program is stopped"}
          spellCheck={false}
          disabled={!stopped}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>
    </SidebarSection>
  );
}

export default ConsoleSection;
