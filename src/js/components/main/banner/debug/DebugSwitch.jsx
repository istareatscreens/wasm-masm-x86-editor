import React from "react";
import Switch from "../../../common/ImageSwitch.jsx";
import debugImage from "../../../../../images/debug.png";

// Debug mode: pressed while it is on. On, RUN builds with debug information and debugs, the debug sidebar
// stands left of the editor and the editor has its breakpoint gutter. The choice is kept with the settings.
const DebugSwitch = ({ on, onChange }) => (
  <Switch
    id="debugSwitch"
    imgClass={"switch__view--debug"}
    title={on ? "turn debugging off" : "turn debugging on"}
    onChange={(event) => onChange(event.target.checked)}
    checked={on}
    src={debugImage}
  />
);

export default DebugSwitch;
