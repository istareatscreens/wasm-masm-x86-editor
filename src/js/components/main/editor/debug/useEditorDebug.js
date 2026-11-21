import React, { useEffect, useMemo, useRef, useState } from "react";
import { ExternalChange } from "@uiw/react-codemirror";

import TreeContextMenu from "../../../common/TreeContextMenu.jsx";
import { useStore } from "../../debugger/session/debugStore";
import { gutterMenuItems } from "./gutterMenu";
import { debugExtensions, guarded, placeOf, revealLine, showBreakpoints, showStatements } from "./index";
import breakpointIcon from "../../../../../images/debugBreakpoint.png";
import disabledIcon from "../../../../../images/debugBreakpointDisabled.png";
import conditionalIcon from "../../../../../images/debugBreakpointConditional.png";
import logpointIcon from "../../../../../images/debugLogpoint.png";
import unverifiedIcon from "../../../../../images/debugBreakpointUnverified.png";
import currentIcon from "../../../../../images/debugCurrent.png";
import callerIcon from "../../../../../images/debugCaller.png";

const ICONS = { enabled: breakpointIcon, disabled: disabledIcon, conditional: conditionalIcon, logpoint: logpointIcon, unverified: unverifiedIcon };
const ARROWS = { current: currentIcon, caller: callerIcon };
const NONE = [];
// @uiw/react-codemirror marks the text it puts in from its `value` (a file loaded) with ExternalChange
const isExternal = (transaction) => !!transaction.annotation(ExternalChange);

// The debugger's CodeMirror extensions while `active` (Debug on, a MASM source open), kept showing the page's
// breakpoints, statements and requested line. `ready`: the editor holds the file's text (it loads a moment after
// the name changes); `loads` counts loads; `place` (a ref) gets the cursor for the debugger's keys.
export default function useEditorDebug({ controller, active, filename, view, ready, loads, place }) {
  const file = useRef(filename);
  file.current = filename;
  const [menu, setMenu] = useState(null);
  const extensions = useMemo(
    () => (active ? debugExtensions({ controller, file: () => file.current, onMenu: (line, x, y) => setMenu({ line, x, y }), arrows: ARROWS, isExternal }) : NONE),
    [active, controller],
  );

  const list = useStore(controller.store, (state) => state.breakpoints[filename]) || NONE;
  const frames = useStore(controller.store, (state) => state.frames);
  const selected = useStore(controller.store, (state) => state.frame);
  const shown = useStore(controller.store, (state) => state.shown);
  const here = (frame) => (frame && frame.file === filename ? frame.line : null);
  const current = here(frames[0]);
  // the caller the call stack shows; or, where the program is in code without a source, the nearest of its own
  const chosen = selected > 1 ? frames.filter((frame) => frame.id === selected)[0] : frames[0] && !frames[0].file ? frames.filter((frame) => frame.file)[0] : null;
  const caller = here(chosen);

  const shows = active && ready && view;
  const guard = useMemo(() => guarded(controller), [controller]);
  useEffect(() => {
    if (shows) guard(() => showBreakpoints(view, list, ICONS));
  }, [shows, view, list, loads]);
  useEffect(() => {
    if (shows) guard(() => showStatements(view, current, caller));
  }, [shows, view, current, caller, loads]);

  // a line asked for is centred once, when its file's text is in the editor
  const revealed = useRef(0);
  useEffect(() => {
    if (!shows || !shown || shown.file !== filename || shown.request === revealed.current) return;
    revealed.current = shown.request;
    guard(() => revealLine(view, shown.line));
  }, [shows, view, shown, filename, loads]);

  useEffect(() => {
    place.current = active && view ? () => ({ file: file.current, ...placeOf(view) }) : () => null;
    return () => {
      place.current = () => null;
    };
  }, [active, view, place]);

  const element = menu && active && <TreeContextMenu x={menu.x} y={menu.y} items={gutterMenuItems(controller, filename, menu.line)} onClose={() => setMenu(null)} />;
  return { extensions, menu: element };
}
