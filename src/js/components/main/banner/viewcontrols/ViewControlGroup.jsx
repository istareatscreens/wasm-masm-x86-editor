import React from "react";

import Switch from "../../../common/ImageSwitch.jsx";

import filedrawerImage from "../../../../../images/filedrawer.png";
import zenImage from "../../../../../images/zen.png";
import cmdImage from "../../../../../images/cmd.png";
import editorImage from "../../../../../images/editor.png";

// The zen, editor, terminal and file drawer switches: they show the view (layout/useViewMode.js) and
// report changes to it; the view refuses a change that would leave neither the editor nor the terminal.
function ViewControlGroup({ className, view, zen, onPaneChange, onZenChange }) {
  const altPrint = (test, show, hide) => (test ? hide : show);

  return (
    <div className={`${className} `}>
      <Switch
        onChange={(event) => onZenChange(event.target.checked)}
        checked={zen}
        imgClass={"switch__view--zen"}
        src={zenImage}
        title={altPrint(zen, "turn zen mode on", "turn zen mode off")}
      />

      <Switch
        onChange={(event) => onPaneChange("editor", event.target.checked)}
        checked={view.editor}
        src={editorImage}
        imgClass={"switch__view--editor"}
        title={altPrint(view.editor, "show editor", "hide editor")}
      />

      <Switch
        onChange={(event) => onPaneChange("cmd", event.target.checked)}
        checked={view.cmd}
        src={cmdImage}
        imgClass={"switch__view--cmd"}
        title={altPrint(view.cmd, "show command prompt", "hide command prompt")}
      />
      <Switch
        src={filedrawerImage}
        checked={view.drawer}
        onChange={(event) => onPaneChange("drawer", event.target.checked)}
        imgClass={"switch__view--file-drawer"}
        title={altPrint(
          view.drawer,
          "show file explorer",
          "hide file explorer"
        )}
      />
    </div>
  );
}

export default ViewControlGroup;
