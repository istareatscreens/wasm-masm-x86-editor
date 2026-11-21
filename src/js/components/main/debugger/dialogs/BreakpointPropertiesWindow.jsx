import React, { useEffect, useRef, useState } from "react";

import CheckOption from "../../../common/CheckOption.jsx";
import Dropdown from "../../../common/Dropdown.jsx";
import GroupBox from "../../../common/GroupBox.jsx";
import RadioOption from "../../../common/RadioOption.jsx";
import TextField from "../../../common/TextField.jsx";
import Window from "../../../common/Window.jsx";
import DialogButtons from "./DialogButtons.jsx";

const HIT_TESTS = [
  { id: "", text: "always" },
  { id: "=", text: "when the hit count is equal to" },
  { id: ">=", text: "when the hit count is at least" },
  { id: "%", text: "when the hit count is a multiple of" },
];

// "= 5", ">= 5", "% 5" as the list's choice and the number
const hitParts = (hit) => {
  const match = /^\s*(==?|>=|%)?\s*(\d+)\s*$/.exec(hit || "");
  return match ? { test: match[1] === ">=" || match[1] === "%" ? match[1] : "=", count: match[2] } : { test: "", count: "" };
};

// `where` names the breakpoint's line.
function BreakpointPropertiesWindow({ breakpoint, where, onSave, close }) {
  const [condition, setCondition] = useState(breakpoint.condition || "");
  const [changed, setChanged] = useState(breakpoint.when === "changed");
  const [hit, setHit] = useState(() => hitParts(breakpoint.hit));
  const [logs, setLogs] = useState(!!breakpoint.log);
  const [log, setLog] = useState(breakpoint.log || "");
  const first = useRef(null);
  useEffect(() => first.current.focus(), []);

  const save = () => {
    onSave({
      condition,
      when: changed ? "changed" : undefined,
      hit: hit.test && Number(hit.count) > 0 ? hit.test + " " + Number(hit.count) : undefined,
      log: logs ? log : undefined,
    });
    close();
  };
  const onKeyDown = (event) => {
    if (event.key === "Enter" && event.target.tagName === "INPUT" && event.target.type === "text") save();
    else if (event.key === "Escape") close();
  };

  return (
    <Window title="Breakpoint Properties" size="fit" className="window__debug" onClose={close} footer={<DialogButtons onOk={save} onCancel={close} />}>
      <div className="window__debug__body" onKeyDown={onKeyDown}>
        <p className="window__debug__where">{where}</p>
        <GroupBox caption="Condition">
          <TextField
            ref={first}
            aria-label="Condition"
            placeholder="eax == 5, total > 100, [esi] != 0"
            spellCheck={false}
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
          />
          <RadioOption name="debug-condition-when" checked={!changed} onChange={() => setChanged(false)}>
            Stop when it is true
          </RadioOption>
          <RadioOption name="debug-condition-when" checked={changed} onChange={() => setChanged(true)}>
            Stop when its value has changed
          </RadioOption>
        </GroupBox>
        <GroupBox caption="Hit count">
          <div className="window__debug__line">
            <Dropdown aria-label="Stop" options={HIT_TESTS} selected={HIT_TESTS.filter((entry) => entry.id === hit.test)[0]} onChange={(option) => setHit({ ...hit, test: option.id })} />
            <TextField
              inputMode="numeric"
              className="window__debug__count"
              aria-label="Hit count"
              disabled={!hit.test}
              value={hit.count}
              onChange={(event) => setHit({ ...hit, count: event.target.value.replace(/\D/g, "") })}
            />
          </div>
        </GroupBox>
        <GroupBox caption="Action">
          <CheckOption checked={logs} onChange={setLogs}>
            Write a message to the Console and keep running
          </CheckOption>
          <TextField
            aria-label="Message"
            placeholder="total is {total}, eax = {eax,x}"
            spellCheck={false}
            disabled={!logs}
            value={log}
            onChange={(event) => setLog(event.target.value)}
          />
        </GroupBox>
      </div>
    </Window>
  );
}

export default BreakpointPropertiesWindow;
