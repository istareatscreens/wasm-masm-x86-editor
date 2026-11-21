import React from "react";

import ScopeTree from "./ScopeTree.jsx";
import SidebarSection from "./SidebarSection.jsx";

// The CPU's registers and flags at the stop: open one for its parts. A value that changed since the last stop is red.
function RegistersSection({ controller }) {
  return (
    <SidebarSection id="registers" title="Registers" controller={controller}>
      <ScopeTree controller={controller} scope="Registers" label="Registers" idle="Start debugging (F5) to see the registers." none="No registers." />
    </SidebarSection>
  );
}

export default RegistersSection;
