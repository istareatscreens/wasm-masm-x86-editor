import React, { useState } from "react";

import CheckOption from "../../../common/CheckOption.jsx";
import Checkbox from "../../../common/Checkbox.jsx";
import GroupBox from "../../../common/GroupBox.jsx";
import SelectAllSwitch from "../../../common/SelectAllSwitch.jsx";
import TextField from "../../../common/TextField.jsx";
import { baseOf } from "../../utility/filesystem/paths";
import DataBreakpointWindow from "../dialogs/DataBreakpointWindow.jsx";
import { useStore } from "../session/debugStore";
import SidebarSection from "./SidebarSection.jsx";

// what a breakpoint's properties make of it, after its place: "when eax == 5", "hit count >= 3", "logs"
const summary = (breakpoint) =>
  [breakpoint.condition ? (breakpoint.when === "changed" ? "when " + breakpoint.condition + " changes" : "when " + breakpoint.condition) : "", breakpoint.hit ? "hit count " + breakpoint.hit : "", breakpoint.log ? "logs" : ""]
    .filter(Boolean)
    .join(", ");

function Row({ label, detail, problem, checked, onCheck, onRemove, onOpen, onProperties }) {
  return (
    <li className={"debug-list__row" + (problem ? " debug-list__row--subtle" : "")} title={problem || detail || label}>
      {onCheck ? <Checkbox className="debug-list__check" checked={checked} aria-label={"Enable " + label} onChange={(event) => onCheck(event.target.checked)} /> : <span className="debug-list__check" />}
      <span className="debug-list__text" onDoubleClick={onOpen}>
        {label}
        {detail && <span className="debug-list__detail"> {detail}</span>}
      </span>
      {onProperties && (
        <button type="button" className="btn btn--text debug-list__button" title={"Properties of " + label} aria-label={"Properties of " + label} onClick={onProperties}>
          …
        </button>
      )}
      <button type="button" className="btn btn--text debug-list__button" title={"Remove " + label} aria-label={"Remove " + label} onClick={onRemove}>
        ×
      </button>
    </li>
  );
}

function BreakpointsSection({ controller }) {
  const byFile = useStore(controller.store, (view) => view.breakpoints);
  const functions = useStore(controller.store, (view) => view.functionBreakpoints);
  const data = useStore(controller.store, (view) => view.dataBreakpoints);
  const instructions = useStore(controller.store, (view) => view.instructionBreakpoints);
  const filters = useStore(controller.store, (view) => view.exceptionFilters);
  const stopped = useStore(controller.store, (view) => view.phase === "stopped");
  const [name, setName] = useState("");
  const [dataOpen, setDataOpen] = useState(false);
  const sync = controller.breakpoints;

  const files = Object.keys(byFile).sort();
  const none = !files.length && !functions.length && !data.length && !instructions.length;
  const tickable = files.reduce((list, file) => list.concat(byFile[file]), []).concat(functions);
  const allTicked = tickable.length > 0 && tickable.every((breakpoint) => breakpoint.enabled);
  const allFilters = filters.length > 0 && filters.every((entry) => entry.enabled);
  const addName = () => {
    sync.addFunction(name);
    setName("");
  };

  return (
    <SidebarSection id="breakpoints" title="Breakpoints" controller={controller}>
      <div className="debug-section__tools debug-section__tools--head">
        <button type="button" className="btn btn--text debug-section__button" disabled={none} title="Remove every breakpoint" onClick={() => controller.removeAllBreakpoints()}>
          Remove All
        </button>
        <SelectAllSwitch
          checked={allTicked}
          disabled={!tickable.length}
          title={allTicked ? "Untick every breakpoint" : "Tick every breakpoint"}
          onChange={(enabled) => sync.enableAll(enabled)}
        />
      </div>
      {none ? (
        <p className="debug-section__empty">Click left of a line's number, or press F9, to stop the program there.</p>
      ) : (
        <ul className="debug-list" aria-label="Breakpoints">
          {files.map((file) =>
            byFile[file].map((breakpoint) => (
              <Row
                key={breakpoint.key}
                label={baseOf(file) + ", line " + breakpoint.line}
                detail={summary(breakpoint)}
                problem={breakpoint.verified === false ? breakpoint.message || "Not bound" : ""}
                checked={breakpoint.enabled}
                onCheck={(enabled) => sync.enable(file, breakpoint.line, enabled)}
                onRemove={() => sync.remove(file, breakpoint.key)}
                onOpen={() => controller.showLine(file, breakpoint.line)}
                onProperties={() => controller.store.set({ properties: { file, key: breakpoint.key } })}
              />
            )),
          )}
          {functions.map((entry) => (
            <Row
              key={entry.key}
              label={entry.name}
              detail="(by name)"
              problem={entry.verified === false ? entry.message || "Not bound" : ""}
              checked={entry.enabled}
              onCheck={(enabled) => sync.enableFunction(entry.key, enabled)}
              onRemove={() => sync.removeFunction(entry.key)}
            />
          ))}
          {data.map((entry) => (
            <Row key={entry.key} label={entry.label} detail="(when it changes)" problem={entry.verified === false ? entry.message : ""} onRemove={() => sync.removeData(entry.key)} />
          ))}
          {instructions.map((entry) => (
            <Row key={entry.key} label={entry.address.replace(/^0x/, "") + "h"} detail="(address)" onRemove={() => sync.toggleInstruction(entry.address)} />
          ))}
        </ul>
      )}
      <div className="debug-section__tools">
        <TextField
          className="debug-section__input"
          aria-label="New breakpoint at a procedure or label"
          placeholder="New breakpoint at: a procedure or label"
          spellCheck={false}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addName();
          }}
        />
        <button
          type="button"
          className="btn btn--text debug-section__button"
          disabled={!stopped}
          title={stopped ? "Stop when a value in memory changes" : "Available while the program is stopped"}
          onClick={() => setDataOpen(true)}
        >
          New Data Breakpoint…
        </button>
      </div>
      <GroupBox caption="Stop at exceptions" className="debug-section__group">
        <SelectAllSwitch
          checked={allFilters}
          disabled={!filters.length}
          title={allFilters ? "Stop at no exception" : "Stop at every exception"}
          onChange={(enabled) => sync.setFilters(enabled)}
        />
        {filters.length ? (
          filters.map((entry) => (
            <CheckOption key={entry.filter} checked={entry.enabled} onChange={(enabled) => sync.setFilter(entry.filter, enabled)}>
              {entry.label}
            </CheckOption>
          ))
        ) : (
          <p className="debug-section__empty">Listed when debugging starts.</p>
        )}
      </GroupBox>
      {dataOpen && <DataBreakpointWindow controller={controller} close={() => setDataOpen(false)} />}
    </SidebarSection>
  );
}

export default BreakpointsSection;
