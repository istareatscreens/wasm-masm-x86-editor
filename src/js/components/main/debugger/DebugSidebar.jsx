import React, { useRef } from "react";

import RetroScrollArea from "../../common/RetroScrollArea.jsx";
import { baseOf } from "../utility/filesystem/paths";
import BreakpointPropertiesWindow from "./dialogs/BreakpointPropertiesWindow.jsx";
import DebugErrorBoundary from "./failure/DebugErrorBoundary.jsx";
import DebugFailureNotice from "./failure/DebugFailureNotice.jsx";
import { KEY_LABELS } from "./keyboard/debugKeys.js";
import useDebugFocus from "./keyboard/useDebugFocus.js";
import AutosSection from "./sections/AutosSection.jsx";
import BreakpointsSection from "./sections/BreakpointsSection.jsx";
import CallStackSection from "./sections/CallStackSection.jsx";
import ConsoleSection from "./sections/ConsoleSection.jsx";
import DisassemblySection from "./sections/DisassemblySection.jsx";
import GlobalsSection from "./sections/GlobalsSection.jsx";
import LocalsSection from "./sections/LocalsSection.jsx";
import MemorySection from "./sections/MemorySection.jsx";
import RegistersSection from "./sections/RegistersSection.jsx";
import StackSection from "./sections/StackSection.jsx";
import WatchSection from "./sections/WatchSection.jsx";
import { useStore } from "./session/debugStore";
import DebugStatus from "./status/DebugStatus.jsx";
import DebugToolbar from "./toolbar/DebugToolbar.jsx";

function Properties({ controller }) {
  const open = useStore(controller.store, (view) => view.properties);
  const list = useStore(controller.store, (view) => (view.properties ? view.breakpoints[view.properties.file] : null));
  const breakpoint = open && list ? list.filter((entry) => entry.key === open.key)[0] : null;
  if (!breakpoint) return null;
  return (
    <BreakpointPropertiesWindow
      breakpoint={breakpoint}
      where={baseOf(open.file) + ", line " + breakpoint.line}
      onSave={(next) => controller.breakpoints.setProperties(open.file, open.key, next)}
      close={() => controller.store.set({ properties: null })}
    />
  );
}

// `editor()` gives the editor's place for Run to Cursor; `filename` is the open file; `onResetTerminal` is the app's
// terminal reset.
function DebugSidebar({ controller, lightMode, editor, filename, onResetTerminal }) {
  const status = useRef(null);
  useDebugFocus(controller, status);
  return (
    <DebugErrorBoundary controller={controller}>
      <aside className={"debug-sidebar" + (lightMode ? "" : " debug-sidebar--dark")} id="debug-pane" aria-label="Debug">
        <DebugToolbar controller={controller} keys={KEY_LABELS} cursor={editor} filename={filename} />
        <DebugFailureNotice controller={controller} onResetTerminal={onResetTerminal} />
        <DebugStatus ref={status} controller={controller} />
        <RetroScrollArea label="Debug sections" region={false} vertical="auto" className="debug-sidebar__scroll" surfaceClassName="debug-sidebar__sections">
          <RegistersSection controller={controller} />
          <WatchSection controller={controller} />
          <AutosSection controller={controller} />
          <LocalsSection controller={controller} />
          <CallStackSection controller={controller} />
          <MemorySection controller={controller} lightMode={lightMode} />
          <StackSection controller={controller} />
          <DisassemblySection controller={controller} />
          <BreakpointsSection controller={controller} />
          <GlobalsSection controller={controller} />
          <ConsoleSection controller={controller} />
          <div className="debug-sidebar__footer" aria-hidden="true" />
        </RetroScrollArea>
        <Properties controller={controller} />
      </aside>
    </DebugErrorBoundary>
  );
}

export default DebugSidebar;
