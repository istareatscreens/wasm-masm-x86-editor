import React, { useEffect, useMemo, useRef, useState } from "react";

import PixelIcon from "../../../common/PixelIcon.jsx";
import TreeContextMenu from "../../../common/TreeContextMenu.jsx";
import { useStore } from "../session/debugStore";
import useRows from "../tree/useRows.js";
import { Empty, RUNNING } from "./ScopeTree.jsx";
import SidebarSection from "./SidebarSection.jsx";
import VirtualList from "./VirtualList.jsx";
import breakpointIcon from "../../../../../images/debugBreakpoint.png";
import currentIcon from "../../../../../images/debugCurrent.png";

const BEFORE = 24; // instructions shown before the current one
const COUNT = 160;

// The instructions as rows, with a row of its own before each name (main:) and each source line (main.asm:18).
function rowsOf(instructions) {
  const rows = [];
  for (const instruction of instructions) {
    if (instruction.symbol) rows.push({ label: instruction.symbol + ":" });
    if (instruction.location && instruction.line) rows.push({ label: "; " + instruction.location.name + ":" + instruction.line, source: true });
    rows.push({ instruction });
  }
  return rows;
}

function DisassemblyRow({ index, style, rows, current, breakpoints, onToggle, onMenu }) {
  const row = rows[index];
  if (!row.instruction) return <div style={style} role="listitem" className={"debug-disasm__row debug-disasm__row--label" + (row.source ? " debug-disasm__row--source" : "")}>{row.label}</div>;
  const { address, instructionBytes, instruction } = row.instruction;
  const here = address === current;
  return (
    <div style={style} role="listitem" className={"debug-disasm__row" + (here ? " debug-disasm__row--current" : "")} aria-current={here ? "true" : undefined} onContextMenu={(event) => onMenu(event, address)}>
      <span className="debug-disasm__mark" title="Toggle a breakpoint on this instruction" onClick={() => onToggle(address)}>
        {breakpoints.indexOf(address) >= 0 && <PixelIcon src={breakpointIcon} pixels={11} rem={1.1} alt="breakpoint" />}
        {here && <PixelIcon src={currentIcon} pixels={11} rem={1.1} className="debug-disasm__arrow" alt="current instruction" />}
      </span>
      <span className="debug-disasm__address">{address.replace(/^0x/, "")}</span>
      <span className="debug-disasm__bytes">{instructionBytes}</span>
      <span className="debug-disasm__text">{instruction}</span>
    </div>
  );
}

// where the frame the call stack shows is, as a memory reference; "" before its stack is known
const addressShown = (view) => {
  const shown = view.frames.filter((entry) => entry.id === view.frame)[0] || view.frames[0];
  return shown ? shown.address : "";
};

const disassemblySource = (controller) => ({
  key: (view) => (addressShown(view) ? view.version + ":" + addressShown(view) : null),
  load: async (view) => rowsOf((await controller.client.request("disassemble", { memoryReference: addressShown(view), instructionOffset: -BEFORE, instructionCount: COUNT })).instructions),
});

function DisassemblyRows({ controller }) {
  const address = useStore(controller.store, addressShown);
  const phase = useStore(controller.store, (view) => view.phase);
  const set = useStore(controller.store, (view) => view.instructionBreakpoints);
  const [menu, setMenu] = useState(null);
  const list = useRef(null);
  const source = useMemo(() => disassemblySource(controller), [controller]);
  const { rows, error, stale } = useRows(controller, "disassembly", source);

  useEffect(() => {
    const at = rows ? rows.findIndex((row) => row.instruction && row.instruction.address === address) : -1;
    if (at >= 0 && list.current) list.current.scrollToRow({ index: Math.max(0, at - 2), align: "start" });
  }, [rows, address]);

  const rowProps = useMemo(
    () => ({
      rows: rows || [],
      current: address,
      breakpoints: set.map((entry) => entry.address),
      onToggle: (at) => controller.breakpoints.toggleInstruction(at),
      onMenu: (event, at) => {
        event.preventDefault();
        setMenu({
          x: event.clientX,
          y: event.clientY,
          items: [
            { label: "Insert/Remove Breakpoint", onSelect: () => controller.breakpoints.toggleInstruction(at) },
            { label: "Run to Cursor", onSelect: () => controller.runTo({ address: at }) },
            { separator: true },
            { label: "View Memory", onSelect: () => controller.viewMemory(at) },
          ],
        });
      },
    }),
    [rows, address, set, controller],
  );

  return (
    <>
      {rows && rows.length ? (
        <VirtualList
          label="Disassembly"
          count={rows.length}
          row={DisassemblyRow}
          rowProps={rowProps}
          onList={(api) => {
            list.current = api;
          }}
          className={"debug-disasm" + (stale ? " debug-virtual--stale" : "")}
        />
      ) : (
        <Empty>{error || (phase === "idle" ? "Start debugging (F5) to see the machine code." : RUNNING)}</Empty>
      )}
      {menu && <TreeContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}
    </>
  );
}

// The machine code around the frame the call stack shows, in MASM syntax with the program's own names.
function DisassemblySection({ controller }) {
  return (
    <SidebarSection id="disassembly" title="Disassembly" controller={controller} scrolls>
      <DisassemblyRows controller={controller} />
    </SidebarSection>
  );
}

export default DisassemblySection;
