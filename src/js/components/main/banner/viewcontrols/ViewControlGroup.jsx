import React, { useState, useRef } from "react";

import Switch from "../../../common/ImageSwitch.jsx";

import filedrawer from "../../../../../images/filedrawer.png";
import zen from "../../../../../images/zen.png";
import cmd from "../../../../../images/cmd.png";
import editor from "../../../../../images/editor.png";

//TODO: MODIFY break point size for each view
function ViewControlGroup({ className, refApp, ...props }) {
  const [showCMD, setShowCMD] = useState(true);
  const [showFileDrawer, setShowFileDrawer] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [isZen, setZen] = useState(false);

  const classPrefix = "app-layout";

  const handleCMDView = (status) => {
    if (status) {
      console.log(document.getElementsByClassName("app").classList);

/*
Use element.classList.add to add a class:
element.classList.add("my-class");
And element.classList.remove to remove a class:
element.classList.remove("my-class");
*/

  /* 
Switch table:
    editor | cmd | file drawer
      0 0 0 Not allowed
      0 0 1 Not allowed
      0 1 0 --only-cmd
      0 1 1 --no-editor
      1 0 0 --only-editor
      1 0 1 --no-cmd
      1 1 0 --no-file-drawer
      1 1 1 --default


zen button:
      1 --only-editor
      0 --default

class List
  //"--no-editor"
  //"--no-cmd"
  //"--no-file-drawer"
  //"--only-editor"
  //"--only-cmd"
*/

  const handleSwitchZen = (switchValue) => {};
  const handleSwitchFileDrawer = (switchValue) => {};
  const handleSwitchEditor = (switchValue) => {};
  const handleSwitchCMD = (switchValue) => {};

  const checkIfValidSwitchState = () => {
    return showCMD || showEditor; // checks state 0 0 0 && 0 0 1
  };

  const handleFileDrawerView = (switchValue) => {
    console.log(switchValue);
    console.log(refApp.classList);
    if (
      (switchValue && !checkIfValidSwitchState) ||
      (!switchValue && !checkIfValidSwitchState)
    ) {
      //invalid state do nothing
      // 0 0 0 || 0 0 1
      return;
    }

    if (showCMD && showEditor && switchValue) {
      //set 1 1 1 default state
      refApp.classList.remove(refApp.classList[2]);
      setShowFileDrawer(true);
    } else if (showCMD && showEditor && !switchValue) {
      //set 1 1 0 state
      refApp.classList.add(classPrefix + "--no-file-drawer");
      setShowFileDrawer(false);
    }
  };

  const altPrint = (test, show, hide) => (test ? hide : show);

  return (
    <div className={`${className} `}>
      <Switch
        onChange={(event) => {
          handleCMDView(event.target.checked);
        }}
        checked={isZen}
        imgClass={"switch--zen"}
        src={zen}
        alt={altPrint(isZen, "turn zen mode on", "turn zen mode off")}
      />

      <Switch
        onChange={(event) => {
          handleCMDView(event.target.checked);
        }}
        checked={showEditor}
        src={editor}
        imgClass={"switch--editor"}
        alt={altPrint(showEditor, "hide editor", "show editor")}
      />

      <Switch
        onChange={(event) => {
          handleCMDView(event.target.checked);
        }}
        checked={showCMD}
        src={cmd}
        imgClass={"switch--cmd"}
        alt={altPrint(showCMD, "hide command prompt", "show command prompt")}
      />

      <Switch
        src={filedrawer}
        checked={showFileDrawer}
        onChange={(event) => handleFileDrawerView(event.target.checked)}
        imgClass={"switch--file-drawer"}
        alt={altPrint(
          showFileDrawer,
          "hide file explorer",
          "show file explorer"
        )}
      />
    </div>
  );
}

export default ViewControlGroup;
