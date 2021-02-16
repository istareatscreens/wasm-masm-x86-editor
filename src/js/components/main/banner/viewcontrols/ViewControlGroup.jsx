import React, { useState, useRef } from "react";

import Switch from "../../../common/ImageSwitch.jsx";

function ViewControlGroup({ className, ...props }) {
  const [showCMD, setShowCMD] = useState(true);
  const [showFileDrawer, setShowFileDrawer] = useState(true);
  const [showEditor, setShowEditor] = useState(true);

  const handleCMDView = (status) => {
    if (status) {
      document.getElementsByClassName("app").setStyle.gridArea;
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
        alt={altPrint(showEditor, "hide editor", "show editor")}
      />

      <Switch
        onChange={(event) => {
          handleCMDView(event.target.value);
        }}
        alt={altPrint(showCMD, "hide command prompt", "show command prompt")}
      />

      <Switch
        onChange={(event) => {
          handleFileDrawerView(event.target.value);
        }}
        alt={altPrint(
          showFileDrawer,
          "hide project explorer",
          "show project explorer"
        )}
      />
    </div>
  );
}

export default ViewControlGroup;
