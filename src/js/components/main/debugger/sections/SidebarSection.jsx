import React from "react";

import SplitHandle from "../../../common/SplitHandle.jsx";
import TreeToggle from "../../../common/TreeToggle.jsx";
import { DEFAULT_ROWS, MAX_ROWS, MIN_ROWS } from "../session/debugStorage";
import { useStore } from "../session/debugStore";

export const ROW_PX = 20;
const SPAN = MAX_ROWS - MIN_ROWS;

// A section that scrolls on its own (`scrolls`) is as many rows tall as the user dragged its bottom handle, a strip
// with a gripper; a drag held at the sidebar's edge keeps resizing and scrolls the sidebar.
function SidebarSection({ id, title, controller, scrolls = false, tools = null, children }) {
  const section = useStore(controller.store, (view) => view.settings.sections[id]);
  const rows = section.rows || DEFAULT_ROWS;
  const toggle = () => controller.setSection(id, { open: !section.open });
  const setRows = (share) => controller.setSection(id, { rows: Math.round(MIN_ROWS + share * SPAN) });

  return (
    <section className={"debug-section" + (section.open ? " debug-section--open" : "")} aria-labelledby={"debug-" + id + "-title"} data-section={id}>
      <div className="debug-section__header">
        <button type="button" className="debug-section__title" id={"debug-" + id + "-title"} aria-expanded={section.open} aria-controls={"debug-" + id} onClick={toggle}>
          <TreeToggle className="debug-section__toggle" expanded={section.open} onToggle={toggle} />
          {title}
        </button>
        {section.open && tools}
      </div>
      {section.open && (
        <div className={"debug-section__body" + (scrolls ? " debug-section__body--scrolls" : "")} id={"debug-" + id} style={scrolls ? { height: rows * ROW_PX + 4 } : undefined}>
          {children}
        </div>
      )}
      {section.open && scrolls && (
        <SplitHandle
          className="debug-section__resize split-handle--grip"
          orientation="horizontal"
          value={(rows - MIN_ROWS) / SPAN}
          measure={() => ({ size: SPAN * ROW_PX, min: 0, max: 1 })}
          step={1 / SPAN}
          page={5 / SPAN}
          onChange={setRows}
          onCommit={setRows}
          onReset={() => controller.setSection(id, { rows: DEFAULT_ROWS })}
          label={"Resize " + title}
          title="Drag to change the height; double-click for the default"
          scrolls
          controls={"debug-" + id}
        />
      )}
    </section>
  );
}

export default SidebarSection;
