import React from "react";
import Switch from "../../../common/ImageSwitch.jsx";
import resizeHandlesImage from "../../../../../images/resizeHandles.png";

// Hides the splitters between the panes and their move buttons (layout/AppLayout.jsx): pressed while
// they are hidden, as zen is pressed while it hides panes. The choice is kept with the other settings.
const HandlesSwitch = ({ hidden, onChange }) => (
  <Switch
    className={"switch--file-drawer"}
    imgClass={"switch__view--handles"}
    title={hidden ? "show resize handles" : "hide resize handles"}
    onChange={(event) => onChange(event.target.checked)}
    checked={hidden}
    src={resizeHandlesImage}
  />
);

export default HandlesSwitch;
