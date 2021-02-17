import React, { useState, useRef } from "react";

import Switch from "../../../common/ImageSwitch.jsx";

import filedrawer from "../../../../../images/filedrawer.png";
import zen from "../../../../../images/zen.png";
import cmd from "../../../../../images/cmd.png";
import editor from "../../../../../images/editor.png";

function ViewControlGroup({ className, ...props }) {
  const [showCMD, setShowCMD] = useState(true);
  const [showFileDrawer, setShowFileDrawer] = useState(true);
  const [showEditor, setShowEditor] = useState(true);

  const handleCMDView = (status) => {
    if (status) {
      document.getElementsByClassName("app").setStyle.gridArea;
    }
  };

  const handleFileDrawerView = (status) => {};

  const altPrint = (test, show, hide) => (test ? hide : show);

  return (
    <div className={`${className} `}>
      <Switch
        onChange={(event) => {
          handleCMDView(event.target.value);
        }}
        imgClass={"switch--zen"}
        src={zen}
        alt={altPrint(showEditor, "turn zen mode on", "turn zen mode off")}
      />

      <Switch
        onChange={(event) => {
          handleCMDView(event.target.value);
        }}
        src={editor}
        imgClass={"switch--editor"}
        alt={altPrint(showEditor, "hide editor", "show editor")}
      />

      <Switch
        onChange={(event) => {
          handleCMDView(event.target.value);
        }}
        src={cmd}
        imgClass={"switch--cmd"}
        alt={altPrint(showCMD, "hide command prompt", "show command prompt")}
      />

      <Switch
        onChange={(event) => {
          handleFileDrawerView(event.target.value);
        }}
        src={filedrawer}
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
