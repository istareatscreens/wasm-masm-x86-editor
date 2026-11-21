import React from "react";
import Iframe from "./Iframe.jsx";

// The terminal panel: the emulator iframe plus the terminal notice, which is positioned against the panel
// (.cmd-panel, position: relative) so it follows the terminal through every view layout.
const CommandPrompt = ({ notice = null }) => (
  <div className="cmd-panel" id="terminal-pane">
    <Iframe onInferredClick={(e) => {}}></Iframe>
    {notice}
  </div>
);

export default React.memo(CommandPrompt);
