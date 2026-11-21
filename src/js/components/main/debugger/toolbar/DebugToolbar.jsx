import React from "react";

import Dropdown from "../../../common/Dropdown.jsx";
import Button from "../../../common/ImageButton.jsx";
import Switch from "../../../common/ImageSwitch.jsx";
import { useStore } from "../session/debugStore";
import goIcon from "../../../../../images/debugGo.png";
import breakIcon from "../../../../../images/debugBreak.png";
import stopIcon from "../../../../../images/debugStop.png";
import restartIcon from "../../../../../images/debugRestart.png";
import showNextIcon from "../../../../../images/debugShowNext.png";
import stepIntoIcon from "../../../../../images/debugStepInto.png";
import stepOverIcon from "../../../../../images/debugStepOver.png";
import stepOutIcon from "../../../../../images/debugStepOut.png";
import stepBackIcon from "../../../../../images/debugStepBack.png";
import runToCursorIcon from "../../../../../images/debugRunToCursor.png";
import animateIcon from "../../../../../images/debugAnimate.png";
import byInstructionIcon from "../../../../../images/debugByInstruction.png";
import countIcon from "../../../../../images/debugCount.png";
import hexIcon from "../../../../../images/debugHex.png";
import { START_HINTS, blockedReasons, startRule } from "./commandStates";

const SPEEDS = [1, 2, 5, 10].map((speed) => ({ id: speed, text: speed + (speed === 1 ? " step a second" : " steps a second") }));
const NOT_STOPPED = "the program is not stopped";

// The commands in Visual C++ 6's order; a button that does not apply is grey and its tooltip says why
// (commandStates.ts). `keys` names each command's key (keyboard/debugKeys.js); `cursor()` is the editor's line, for
// Run to Cursor; `filename` is the open file, which decides whether a session can start.
function DebugToolbar({ controller, keys, cursor, filename }) {
  const phase = useStore(controller.store, (view) => view.phase);
  const animating = useStore(controller.store, (view) => view.animating);
  const stepBack = useStore(controller.store, (view) => view.stepBack);
  const program = useStore(controller.store, (view) => view.program);
  const countingAvailable = useStore(controller.store, (view) => view.countingAvailable);
  const settings = useStore(controller.store, (view) => view.settings);
  const stopped = phase === "stopped";
  const start = startRule(filename, program);
  const blocked = blockedReasons({ phase, stepBack, canStart: start.canStart, startReason: start.reason });

  const action = (name, command, icon, onClick) => {
    const key = keys[command];
    const named = name + (key ? " (" + key + ")" : "");
    const hint = phase === "idle" && START_HINTS[command] ? ": " + START_HINTS[command] : "";
    return (
      <Button
        key={name}
        className="debug-toolbar__btn"
        src={icon}
        disabled={!!blocked[command]}
        aria-label={named}
        title={blocked[command] ? name + ": " + blocked[command] : named + hint}
        onMouseDown={(event) => event.preventDefault()}
        onClick={onClick}
      />
    );
  };
  const toggle = (name, icon, checked, onChange, title, disabled = false) => (
    <Switch key={name} className="debug-toolbar__switch" imgClass="debug-toolbar__switch-image" src={icon} checked={checked} disabled={disabled} aria-label={name} title={title} onChange={(event) => onChange(event.target.checked)} />
  );
  const runToCursor = () => {
    const at = cursor();
    if (at) controller.runTo(at);
  };
  const onKeyDown = (event) => {
    const controls = Array.from(event.currentTarget.querySelectorAll("button:not(:disabled), input:not(:disabled)"));
    const at = controls.indexOf(document.activeElement);
    const to = { ArrowLeft: at - 1, ArrowRight: at + 1, Home: 0, End: controls.length - 1 }[event.key];
    if (at < 0 || to === undefined || !controls[to]) return;
    event.preventDefault();
    controls[to].focus();
  };

  return (
    <div className="debug-toolbar" role="toolbar" aria-label="Debug" onKeyDown={onKeyDown}>
      {action(stopped ? "Continue" : "Go", "go", goIcon, () => controller.go())}
      {action("Break", "pause", breakIcon, () => controller.pause())}
      {action("Stop Debugging", "stop", stopIcon, () => controller.stop())}
      {action("Restart", "restart", restartIcon, () => controller.restart())}
      {action("Show Next Statement", "showNext", showNextIcon, () => controller.showNext())}
      {action("Step Into", "stepIn", stepIntoIcon, () => controller.step("stepIn"))}
      {action("Step Over", "next", stepOverIcon, () => controller.step("next"))}
      {action("Step Out", "stepOut", stepOutIcon, () => controller.step("stepOut"))}
      {action("Step Back", "stepBack", stepBackIcon, () => controller.stepBack())}
      {action("Run to Cursor", "runToCursor", runToCursorIcon, runToCursor)}
      {toggle("Animate", animateIcon, animating, (on) => controller.animate(on), animating ? "Stop animating (Esc)" : stopped ? "Animate: step again and again, to watch the program run" : "Animate: " + NOT_STOPPED, !stopped && !animating)}
      <Dropdown aria-label="Animation speed" classNameDropdown="debug-toolbar__speed" options={SPEEDS} selected={SPEEDS.filter((speed) => speed.id === settings.animateSpeed)[0]} onChange={(speed) => controller.setAnimateSpeed(speed.id)} />
      {toggle("Step by instruction", byInstructionIcon, settings.instructionStepping, (on) => controller.setInstructionStepping(on), settings.instructionStepping ? "Steps go one instruction at a time: step by line instead" : "Step by instruction, not by line")}
      {toggle(
        "Count instructions",
        countIcon,
        settings.counting,
        (on) => controller.setCounting(on),
        !countingAvailable ? "Count instructions: this terminal cannot count" : settings.counting ? "Stop counting instructions" : "Count the instructions each step runs (the program runs slower while counting)",
        !countingAvailable,
      )}
      {toggle("Hexadecimal", hexIcon, settings.hex, (on) => controller.setHex(on), settings.hex ? "Show values in decimal" : "Show values in hexadecimal")}
    </div>
  );
}

export default DebugToolbar;
