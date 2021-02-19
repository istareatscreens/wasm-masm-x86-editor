import React, { useState, useRef } from "react";

import Switch from "../../../common/ImageSwitch.jsx";

import filedrawer from "../../../../../images/filedrawer.png";
import zen from "../../../../../images/zen.png";
import cmd from "../../../../../images/cmd.png";
import editor from "../../../../../images/editor.png";

//TODO: Move zen button to main button group on right
//TODO: MODIFY break point size for each view
function ViewControlGroup({ className, refApp, ...props }) {
  const [showCMD, setShowCMD] = useState(true);
  const [showFileDrawer, setShowFileDrawer] = useState(true);
  const [showEditor, setShowEditor] = useState(true);
  const [isZen, setZen] = useState(false);

  const classPrefix = "app-layout";

  /*
Use element.classList.add to add a class:
element.classList.add("my-class");
And element.classList.remove to remove a class:
element.classList.remove("my-class");
*/

  const getChangedBoolean = (editor, cmd, filedrawer) => {
    if (editor != showEditor) {
      return editor;
    } else if (cmd != showCMD) {
      return cmd;
    } else if (filedrawer != showFileDrawer) {
      return filedrawer;
    }
    console.error("Called changeViewState without change of switch variable");
  };

  const handleSwitchChange = (
    setState,
    editor = showEditor,
    cmd = showCMD,
    filedrawer = showFileDrawer
  ) => {
    const changeView = changeViewState(
      setState,
      getChangedBoolean(editor, cmd, filedrawer)
    );

    if ((!editor && !cmd && !filedrawer) || (!editor && !cmd && filedrawer)) {
      //invalid state do nothing
      // 0 0 0 | 0 0 1
      return;
    } else if (editor && cmd && filedrawer) {
      //1 1 1 default
      changeView();
    } else if (!editor && cmd && !filedrawer) {
      //0 1 0 --only-cmd
      changeView("--only-cmd");
    } else if (!editor && cmd && filedrawer) {
      //  0 1 1 --no-editor
      changeView("--no-editor");
    } else if (editor && !cmd && !filedrawer) {
      //1 0 0 --only-editor
      changeView("--only-editor");
    } else if (editor && !cmd && filedrawer) {
      //1 0 1 --no-cmd
      changeView("--no-cmd");
    } else if (editor && cmd && !filedrawer) {
      // 1 1 0 --no-file-drawer
      changeView("--no-file-drawer");
    }
  };

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
  //TODO: Generify these by making a single function
  //switch between two states 000 and 010
  const handleSwitchZen = (switchValue) => {
    if (switchValue) {
      changeViewState(switchValue);
    } else {
      changeViewState("--only-editor");
    }
  };
  /*
  const handleSwitchEditor = (switchValue) => {
    if (!showEditor && !switchValue && !showFileDrawer) {
      //invalid state do nothing
      // 0 0 0
      return;
    }

    if (!switchValue && showCMD && !showFileDrawer) {
      //0 1 0
      changeViewState(switchValue, "--only-cmd");
    } else if ((setShowEditor, switchValue && showCMD && showFileDrawer)) {
      //1 1 1
      changeViewState(switchValue);
    } else if ((setShowEditor, !switchValue && showCMD && showFileDrawer)) {
      //0 1 1
      changeViewState(setShowEditor, switchValue, "--no-editor");
    }
  };

  const handleSwitchCMD = (switchValue) => {
    if (!showEditor && !switchValue && !showFileDrawer) {
      //invalid state do nothing
      // 0 0 0
      return;
    }

    //010 not a possible switch state from this function
    if (showEditor && !switchValue && showFileDrawer) {
      //1 0 1
      changeViewState(setShowCMD, switchValue, "--no-cmd");
    } else if (showEditor && switchValue && showFileDrawer) {
      //1 1 1
      changeViewState(setShowCMD, switchValue);
    } else if (!switchValue && !showFileDrawer && showEditor) {
      //1 0 0
      changeViewState(setShowCMD, switchValue, "--only-editor");
    }
  };

  const checkIfValidSwitchState = () => showCMD || showEditor; // checks state 0 0 0 && 0 0 1
  */

  const changeViewState = (setState, switchValue) => (classModifier = "") => {
    refApp.classList.remove(refApp.classList[2]);
    if (classModifier) {
      if (classModifier == "--only-editor") {
        setZen(true);
      }
      refApp.classList.add(classPrefix + classModifier);
    } else {
      setZen(false);
    }
    setState(switchValue);
  };
  /*

  const changeViewState = (setState, switchValue, classModifier = "") => {
    if (switchValue) {
      setZen(false);
      refApp.classList.remove(refApp.classList[2]);
      setState(setShowFileDrawer, switchValue);
    } else {
      if (classModifier == "--only-editor") {
        setZen(true);
      }
      refApp.classList.add(classPrefix + classModifier);
      setState(setShowFileDrawer, switchValue);
    }
  };

  const handleSwitchFileDrawer = (switchValue) => {
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
      changeViewState(switchValue);
    } else if (showCMD && showEditor && !switchValue) {
      //set 1 1 0 state

      changeViewState(switchValue, "--no-file-drawer");
    }
  };
  */

  const altPrint = (test, show, hide) => (test ? hide : show);

  return (
    <div className={`${className} `}>
      <Switch
        onClick={(event) => {
          handleSwitchZen(event.target.checked);
        }}
        checked={isZen}
        imgClass={"switch--zen"}
        src={zen}
        alt={altPrint(isZen, "turn zen mode on", "turn zen mode off")}
      />

      <Switch
        onChange={(event) => {
          handleSwitchChange(
            setShowEditor,
            event.target.checked,
            showCMD,
            showFileDrawer
          );
        }}
        checked={showEditor}
        src={editor}
        imgClass={"switch--editor"}
        alt={altPrint(showEditor, "hide editor", "show editor")}
      />

      <Switch
        onChange={(event) => {
          handleSwitchChange(
            setShowCMD,
            showEditor,
            event.target.checked,
            showFileDrawer
          );
        }}
        checked={showCMD}
        src={cmd}
        imgClass={"switch--cmd"}
        alt={altPrint(showCMD, "hide command prompt", "show command prompt")}
      />

      <Switch
        src={filedrawer}
        checked={showFileDrawer}
        onChange={(event) =>
          handleSwitchChange(
            setShowFileDrawer,
            showEditor,
            showCMD,
            event.target.checked
          )
        }
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
