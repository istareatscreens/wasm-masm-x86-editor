import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import CheckOption from "../../../common/CheckOption.jsx";
import Dropdown from "../../../common/Dropdown.jsx";
import TextField from "../../../common/TextField.jsx";
import TreeContextMenu from "../../../common/TreeContextMenu.jsx";
import { retroScrollbarHost } from "../../../common/retroScrollbarHost.js";
import { HexViewer } from "../../editor/library/hexviewer/index.js";
import { toBase64 } from "../../utility/debug/format/base64";
import { memoryReference } from "../../utility/debug/adapter/references";
import { MemoryWindow } from "../memory/memoryWindow";
import { addressOfResult, goToPlaces } from "../memory/memoryPlaces.js";
import { PageCache } from "../memory/pageCache";
import { useStore } from "../session/debugStore";
import { Empty } from "./ScopeTree.jsx";
import SidebarSection from "./SidebarSection.jsx";

const ROW_HEIGHT = 20;
const UNITS = [
  { id: 1, text: "Bytes" },
  { id: 2, text: "Words" },
  { id: 4, text: "Dwords" },
];
const scrollbars = retroScrollbarHost("Memory");

// Memory while the program is stopped, in the editor's hex viewer. Follow goes to the address box's expression again
// at every stop; while the program runs the last bytes stay, greyed.
function MemorySection({ controller, lightMode }) {
  const phase = useStore(controller.store, (view) => view.phase);
  const stop = useStore(controller.store, (view) => (view.stop ? view.stop.number : 0));
  const version = useStore(controller.store, (view) => view.version);
  const memoryAt = useStore(controller.store, (view) => view.memoryAt);
  const follow = useStore(controller.store, (view) => view.settings.memoryFollow);
  const program = useStore(controller.store, (view) => view.program);
  const frame = useStore(controller.store, (view) => view.frame);
  const [text, setText] = useState(follow || "");
  const [unit, setUnit] = useState(1);
  const [message, setMessage] = useState("");
  const [place, setPlace] = useState(null); // { offset, caret, request }: where the view goes once it is drawn
  const [menu, setMenu] = useState(null);
  const viewer = useRef(null);
  const [drawn, setDrawn] = useState(false); // the viewer exists: the section is open and has a place
  const setViewer = useCallback((handle) => {
    viewer.current = handle;
    setDrawn(!!handle);
  }, []);
  const requests = useRef(0);
  const chosen = useRef(false); // a place was chosen in this session
  const settling = useRef(true); // the view is being moved: the window waits

  const memory = useMemo(() => {
    let window = null;
    const cache = new PageCache((args) => controller.client.request("readMemory", args), () => window && window.changed());
    window = new MemoryWindow(cache, (address, bytes) => controller.client.request("writeMemory", { memoryReference: memoryReference(address), data: toBase64(bytes) }));
    return { cache, window };
  }, [controller]);

  // the address an expression names, or null with the reason shown
  const addressOf = async (expression) => {
    const answer = await controller.client.ask("evaluate", { expression, frameId: frame, context: "watch", format: { hex: true } });
    if ("refused" in answer) {
      setMessage(answer.refused);
      return null;
    }
    const address = addressOfResult(answer.body);
    if (address === null) setMessage("'" + expression + "' is not an address");
    return address;
  };
  const go = async (target, caret = true) => {
    const address = typeof target === "number" ? target : await addressOf(target);
    if (address === null) return;
    chosen.current = true;
    setMessage("");
    setPlace({ offset: memory.window.show(address), caret, request: ++requests.current });
  };

  const lastStop = useRef(0);
  useEffect(() => {
    if (phase === "idle") {
      memory.cache.clear();
      memory.window.changed();
      lastStop.current = 0;
      chosen.current = false;
      setPlace(null);
      setMessage("");
    } else if (phase !== "stopped") {
      memory.cache.running();
      memory.window.changed();
    }
  }, [phase, memory]);
  // the rows on screen are read again at a new stop, or after a value changed at this one
  useEffect(() => {
    if (phase !== "stopped") return;
    if (stop !== lastStop.current) {
      lastStop.current = stop;
      memory.cache.stopped();
    } else {
      memory.cache.refresh();
    }
    if (drawn) void memory.cache.prepare(memory.window.pagesShown());
  }, [stop, version, phase]);

  // at a stop: Follow's address every time; otherwise, the first time, the program's .data, or the stack
  useEffect(() => {
    if (!drawn || phase !== "stopped") return;
    if (follow) go(follow, false);
    else if (!chosen.current) {
      const start = goToPlaces(program)[0];
      go(start.address !== undefined ? start.address : start.expression, false);
    }
  }, [drawn, phase, stop]);

  // "View memory" from a value
  useEffect(() => {
    if (memoryAt && phase === "stopped") go(parseInt(memoryAt.address, 16) >>> 0);
  }, [memoryAt]);

  // where the view was sent, once it is drawn: when the place is chosen, or when the section opens
  const settled = () => requestAnimationFrame(() => requestAnimationFrame(() => (settling.current = false)));
  useLayoutEffect(() => {
    if (!place || !drawn) return;
    settling.current = true;
    viewer.current.scrollToOffset(place.offset, "start");
    if (place.caret) viewer.current.setCaret(place.offset);
    settled();
  }, [place, drawn]);

  // near the window's edge the window and the view move together; rows reported while the view moves are ignored
  const onRange = ({ start, end }) => {
    memory.window.visible(start, end);
    if (settling.current || !viewer.current) return;
    const shift = memory.window.follow(start, end);
    if (!shift) return;
    settling.current = true;
    const handle = viewer.current;
    const caret = handle.getCaret();
    requestAnimationFrame(() => {
      if (handle.element) handle.element.scrollTop += (shift / handle.rowLength) * ROW_HEIGHT;
      if (caret && caret.offset + shift >= 0 && caret.offset + shift < memory.window.length) handle.setCaret(caret.offset + shift, caret.column);
      settled();
    });
  };

  const places = menu ? goToPlaces(program) : [];
  const stopped = phase === "stopped";
  const shown = phase !== "idle" && (phase === "stopped" || place !== null);
  return (
    <SidebarSection id="memory" title="Memory" controller={controller} scrolls>
      <div className="debug-memory">
        <div className="debug-memory__tools">
          <TextField
            className="debug-memory__address"
            aria-label="Address: an expression"
            placeholder="Address: esp, OFFSET list"
            spellCheck={false}
            disabled={!stopped}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && text.trim()) {
                go(text.trim());
                if (follow) controller.setMemoryFollow(text.trim());
              }
            }}
          />
          <button
            type="button"
            className="btn btn--text debug-memory__goto"
            disabled={!stopped}
            aria-haspopup="menu"
            aria-expanded={!!menu}
            onClick={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              setMenu({ x: box.left, y: box.bottom });
            }}
          >
            Go to
          </button>
          <Dropdown aria-label="Show memory as" options={UNITS} selected={UNITS.filter((entry) => entry.id === unit)[0]} onChange={(entry) => setUnit(entry.id)} />
          <CheckOption checked={!!follow} onChange={(on) => controller.setMemoryFollow(on ? text.trim() || "esp" : "")}>
            Follow
          </CheckOption>
        </div>
        {message && (
          <p className="debug-memory__message" role="alert">
            {message}
          </p>
        )}
        {menu && (
          <TreeContextMenu
            x={menu.x}
            y={menu.y}
            items={places.map((entry) => ({ label: entry.text, onSelect: () => go(entry.address !== undefined ? entry.address : entry.expression) }))}
            onClose={() => setMenu(null)}
          />
        )}
        <div className="debug-memory__field">
          {shown ? (
            <HexViewer
              ref={setViewer}
              source={memory.window}
              theme={lightMode ? "win98-field" : "win98-field-dark"}
              rowLength="auto"
              unit={unit}
              rowHeight={ROW_HEIGHT}
              highlightOnHover={false}
              disabled={!stopped}
              historyKey={stop}
              offsetHeader={{ text: "Address" }}
              onVisibleRangeChange={onRange}
              onEditError={setMessage}
              attachScrollbars={scrollbars}
              label="Memory"
            />
          ) : (
            <Empty>{phase === "idle" ? "Start debugging (F5) to view memory." : "The program is running."}</Empty>
          )}
        </div>
      </div>
    </SidebarSection>
  );
}

export default MemorySection;
