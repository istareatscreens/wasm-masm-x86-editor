import React from "react";
import Iframe from "./Iframe.jsx";

// The terminal panel: the emulator iframe plus, when there is one, the terminal
// notice banner (RetroNotice) floating over the iframe's top edge. The panel is the
// grid item (.cmd-panel, position: relative) so the banner is positioned against the
// terminal itself and follows it through every view layout.
const CommandPrompt = ({ notice = null }) => (
  <div className="cmd-panel">
    <Iframe onInferredClick={(e) => {}}></Iframe>
    {notice}
  </div>
);

export default React.memo(CommandPrompt);
