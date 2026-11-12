import React, { forwardRef, useImperativeHandle, useLayoutEffect, useRef } from "react";

import ArrowButton from "../../common/ArrowButton.jsx";
import SplitHandle from "../../common/SplitHandle.jsx";
import useMediaQuery from "../../common/useMediaQuery.js";
import useStoredState from "../../common/useStoredState.js";
import useDocumentAtTop from "./useDocumentAtTop.js";
import { DEFAULT_LAYOUT, LAYOUT_KEY, MIN_PANE_PX, parseLayout, serializeLayout } from "./layoutStorage";
import { MOVES, MOVE_NAMES, placeMatters, splittersFor } from "./terminalPlace";

// the grid's resolved track sizes in pixels
const tracks = (element, property) => getComputedStyle(element)[property].split(" ").map(parseFloat);

// The page's grid (layout/_layout.scss): the panes come in as children, the layout modifier is the
// root's third class, the splitters' positions (layoutStorage.ts) go to the grid as CSS variables and the
// terminal's place (terminalPlace.ts) as data-terminal on the layouts it changes. With every pane shown,
// move buttons on the splitters put the terminal in the two other places. Without `handles` there are no
// splitters or move buttons, and their tracks are 0. A drag re-renders this component only: its children
// are the same elements.
const AppLayout = forwardRef(function AppLayout({ modifier, handles = true, onClick, children }, ref) {
  const root = useRef(null);
  useImperativeHandle(ref, () => root.current);
  const breakpoint = useMediaQuery("(max-width: 900px)") ? "narrow" : "wide";
  const [layout, setLayout, commitLayout] = useStoredState(LAYOUT_KEY, parseLayout, serializeLayout);
  useDocumentAtTop();
  const view = modifier || "";
  const place = layout[breakpoint].terminal;

  // after a move made from the keyboard, the focus goes to the button that moves the terminal back
  const moveButtons = useRef({});
  const refocus = useRef(null);
  useLayoutEffect(() => {
    const back = refocus.current && moveButtons.current[refocus.current];
    refocus.current = null;
    if (back) back.focus();
  }, [place]);

  // the two pane tracks a splitter divides, and the shares that keep each at MIN_PANE_PX while there is
  // room for both (half each otherwise, as the grid's own clamp)
  const measure = (axis) => () => {
    const sizes = axis === "x" ? tracks(root.current, "gridTemplateColumns") : tracks(root.current, "gridTemplateRows").slice(1);
    const size = Math.max(1, sizes[0] + sizes[2]);
    const min = Math.min(0.5, MIN_PANE_PX / size);
    return { size, min, max: 1 - min };
  };
  const update = (key, value) => (current) => ({ ...current, [breakpoint]: { ...current[breakpoint], [key]: value } });
  const splitter = (axis, [[firstName, firstId], secondName]) => (
    <SplitHandle
      key={axis}
      className={axis === "x" ? "app-layout__vsplit" : "app-layout__hsplit"}
      orientation={axis === "x" ? "vertical" : "horizontal"}
      value={layout[breakpoint][axis]}
      measure={measure(axis)}
      onChange={(share) => setLayout(update(axis, share))}
      onCommit={(share) => commitLayout(update(axis, share))}
      onReset={() => commitLayout(update(axis, DEFAULT_LAYOUT[breakpoint][axis]))}
      label={`Resize ${firstName} and ${secondName}`}
      controls={firstId}
    />
  );
  const move = ({ on, row, column, arrow, to }) => (
    <ArrowButton
      key={"move-" + to}
      ref={(element) => {
        moveButtons.current[to] = element;
      }}
      className={"app-layout__move app-layout__move--" + on}
      style={{ gridRow: String(row), gridColumn: String(column) }}
      direction={arrow}
      label={MOVE_NAMES[to]}
      onPress={(fromKeyboard) => {
        if (fromKeyboard) refocus.current = place;
        commitLayout(update("terminal", to));
      }}
    />
  );
  const splitters = handles ? splittersFor(view, place) : {};
  const moves = handles && view === "" ? MOVES[place] : [];
  // each splitter followed by the move buttons on it, in that tab order
  const along = (axis) => [splitters[axis] && splitter(axis, splitters[axis]), ...moves.filter((m) => m.on === axis).map(move)];

  return (
    <div
      ref={root}
      onClick={onClick}
      className={"root app-layout" + (modifier ? " app-layout--" + modifier : "")}
      data-terminal={placeMatters(view) ? place : undefined}
      data-handles={handles ? undefined : "hidden"}
      style={{
        "--split-wide-x": layout.wide.x,
        "--split-wide-y": layout.wide.y,
        "--split-narrow-x": layout.narrow.x,
        "--split-narrow-y": layout.narrow.y,
      }}
    >
      {children}
      {along("x")}
      {along("y")}
    </div>
  );
});

export default AppLayout;
