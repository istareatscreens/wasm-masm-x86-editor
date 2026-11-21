import React from "react";

import ScopeTree from "./ScopeTree.jsx";
import SidebarSection from "./SidebarSection.jsx";

// What the current line and the one before it use, and what a call just returned.
function AutosSection({ controller }) {
  return (
    <SidebarSection id="autos" title="Autos" controller={controller}>
      <ScopeTree controller={controller} scope="Autos" label="Autos" idle="Start debugging (F5) to see what the current line uses." none="This line and the one before use no values." />
    </SidebarSection>
  );
}

export default AutosSection;
