import React from "react";

import ScopeTree from "./ScopeTree.jsx";
import SidebarSection from "./SidebarSection.jsx";

// The program's variables, by module.
function GlobalsSection({ controller }) {
  return (
    <SidebarSection id="globals" title="Globals" controller={controller}>
      <ScopeTree controller={controller} scope="Globals" label="Globals" idle="Start debugging (F5) to see the program's variables." none="The program has no variables." />
    </SidebarSection>
  );
}

export default GlobalsSection;
