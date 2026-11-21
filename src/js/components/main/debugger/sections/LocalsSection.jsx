import React from "react";

import ScopeTree from "./ScopeTree.jsx";
import SidebarSection from "./SidebarSection.jsx";

// The parameters and LOCAL variables of the procedure the call stack shows.
function LocalsSection({ controller }) {
  return (
    <SidebarSection id="locals" title="Locals" controller={controller}>
      <ScopeTree controller={controller} scope="Locals" label="Locals" idle="Start debugging (F5) to see parameters and LOCAL variables." none="This procedure has no parameters or LOCAL variables." />
    </SidebarSection>
  );
}

export default LocalsSection;
