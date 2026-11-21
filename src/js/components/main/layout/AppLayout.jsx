import React, { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

import ArrowButton from "../../common/ArrowButton.jsx";
import SplitHandle from "../../common/SplitHandle.jsx";
import useMediaQuery from "../../common/useMediaQuery.js";
import useStoredState from "../../common/useStoredState.js";
import DebugRevealBar from "../debugger/DebugRevealBar.jsx";
import useDocumentAtTop from "./useDocumentAtTop.js";
import { DEBUG_PANE, UNDOES, debugButtons, debugShown, debugSpace, debugUnder } from "./debugPlace";
import { DEFAULT_LAYOUT, LAYOUT_KEY, MIN_PANE_PX, parseLayout, serializeLayout } from "./layoutStorage";
import { MOVES, MOVE_NAMES, placeMatters, splittersFor } from "./terminalPlace";

// the grid's resolved track sizes in pixels
const tracks = (element, property) => getComputedStyle(element)[property].split(" ").map(parseFloat);

// The page's grid (layout/_layout.scss): the splitters' positions go to it as CSS variables, the terminal's
// place as data-terminal. A drag re-renders this component only: its children are the same elements.
// With `debug`, the debug sidebar has the first column and its own splitter; hidden, a reveal bar stands in.
const AppLayout = forwardRef(function AppLayout({ modifier, handles = true, debug = false, onClick, children }, ref) {
  const root = useRef(null);
  useImperativeHandle(ref, () => root.current);
  const breakpoint = useMediaQuery("(max-width: 900px)") ? "narrow" : "wide";
  const [layout, setLayout, commitLayout] = useStoredState(LAYOUT_KEY, parseLayout, serializeLayout);
  useDocumentAtTop();
  const view = modifier || "";
  const split = layout[breakpoint];
  const place = split.terminal;
  const update = (key, value) => (current) => ({ ...current, [breakpoint]: { ...current[breakpoint], [key]: value } });

  // zen and the terminal-only view show the reveal bar; revealed there, the sidebar stays until that view ends
  const [revealedIn, setRevealedIn] = useState(null);
  const shown = debugShown(debug, split.debugHidden, view, revealedIn === view);
  const reducedView = view === "only-editor" || view === "only-cmd";
  useEffect(() => {
    if (revealedIn !== null && revealedIn !== view) setRevealedIn(null);
  }, [view, revealedIn]);
  // the Debug switch turned on again shows a sidebar that was hidden
  const wasDebug = useRef(debug);
  useEffect(() => {
    if (debug && !wasDebug.current && split.debugHidden) commitLayout(update("debugHidden", false));
    wasDebug.current = debug;
  }, [debug]);
  const setHidden = (hidden) => {
    if (reducedView) setRevealedIn(hidden ? null : view);
    else commitLayout(update("debugHidden", hidden));
  };

  // after a move made from the keyboard, the focus goes to the button that undoes it
  const buttons = useRef({});
  const refocus = useRef(null);
  useLayoutEffect(() => {
    const back = refocus.current && buttons.current[refocus.current];
    refocus.current = null;
    if (back) back.focus();
  }, [place, shown, split.debugTo]);

  // the two pane tracks a splitter divides, and the shares that keep each at MIN_PANE_PX while there is
  // room for both (half each otherwise, as the grid's own clamp)
  const measure = (axis) => () => {
    const sizes = axis === "x" ? tracks(root.current, "gridTemplateColumns").slice(2) : tracks(root.current, "gridTemplateRows").slice(1);
    const size = Math.max(1, sizes[0] + sizes[2]);
    const min = Math.min(0.5, MIN_PANE_PX / size);
    return { size, min, max: 1 - min };
  };
  const handle = (key, className, orientation, space, [[firstName, firstId], secondName]) => (
    <SplitHandle
      key={key}
      className={className}
      orientation={orientation}
      value={split[key]}
      measure={space}
      onChange={(share) => setLayout(update(key, share))}
      onCommit={(share) => commitLayout(update(key, share))}
      onReset={() => commitLayout(update(key, DEFAULT_LAYOUT[breakpoint][key]))}
      label={`Resize ${firstName} and ${secondName}`}
      controls={firstId}
    />
  );
  const arrow = ({ name, on, row, column, direction, label, undo, press }) => (
    <ArrowButton
      key={"move-" + name}
      ref={(element) => {
        buttons.current[name] = element;
      }}
      className={"app-layout__move app-layout__move--" + on}
      style={{ gridRow: String(row), gridColumn: String(column) }}
      direction={direction}
      label={label}
      onPress={(fromKeyboard) => {
        if (fromKeyboard) refocus.current = undo;
        press();
      }}
    />
  );
  const move = ({ on, row, column, arrow: direction, to }) =>
    arrow({ name: to, on, row, column, direction, label: MOVE_NAMES[to], undo: place, press: () => commitLayout(update("terminal", to)) });
  const debugButton = ({ action, on, row, column, arrow: direction, label }) =>
    arrow({
      name: action,
      on,
      row,
      column,
      direction,
      label,
      undo: UNDOES[action],
      press: () => (action === "hide" ? setHidden(true) : commitLayout(update("debugTo", action === "under" ? "terminal" : "bottom"))),
    });
  const splitters = handles ? splittersFor(view, place) : {};
  const moves = handles && view === "" ? MOVES[place] : [];
  const ofDebug = handles ? debugButtons(shown, view, place, split.debugTo) : [];
  // each splitter followed by the buttons on it, in that tab order
  const along = (axis) => [
    splitters[axis] && handle(axis, axis === "x" ? "app-layout__vsplit" : "app-layout__hsplit", axis === "x" ? "vertical" : "horizontal", measure(axis), splitters[axis]),
    ...ofDebug.filter((button) => button.on === axis).map(debugButton),
    ...moves.filter((m) => m.on === axis).map(move),
  ];

  return (
    <div
      ref={root}
      onClick={onClick}
      className={"root app-layout" + (modifier ? " app-layout--" + modifier : "")}
      data-terminal={placeMatters(view) ? place : undefined}
      data-handles={handles ? undefined : "hidden"}
      data-debug={shown === "off" ? undefined : shown}
      data-debug-to={debugUnder(shown, view, place, split.debugTo) ? "terminal" : undefined}
      style={{
        "--split-wide-x": layout.wide.x,
        "--split-wide-y": layout.wide.y,
        "--split-narrow-x": layout.narrow.x,
        "--split-narrow-y": layout.narrow.y,
        "--split-wide-d": layout.wide.d,
        "--split-narrow-d": layout.narrow.d,
      }}
    >
      {children}
      {shown === "hidden" && (
        <DebugRevealBar
          ref={(element) => {
            buttons.current.reveal = element;
          }}
          onReveal={(fromKeyboard) => {
            if (fromKeyboard) refocus.current = "hide";
            setHidden(false);
          }}
        />
      )}
      {handles && shown === "shown" && handle("d", "app-layout__dsplit", "vertical", () => debugSpace(root.current.getBoundingClientRect().width), [DEBUG_PANE, "editor"])}
      {ofDebug.filter((button) => button.on === "d").map(debugButton)}
      {along("x")}
      {along("y")}
    </div>
  );
});

export default AppLayout;
