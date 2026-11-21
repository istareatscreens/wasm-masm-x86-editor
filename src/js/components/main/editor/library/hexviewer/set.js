import React from "react";
import { cellText } from "./format/cellText.js";
import { Item } from "./item.js";

// One group of cells in the hex column (`setLength` bytes). `cellState(at, kind)` gives a cell's state classes.
const SetComponent = ({ values, from, to, rowOffset, unit, hovered, cellState, idOf, changedAt, onHover }) => {
  const items = [];
  for (let at = from; at < to; at += unit) {
    const offset = rowOffset + at;
    items.push(
      <Item
        key={at}
        kind="cell"
        id={idOf("h", offset)}
        offset={offset}
        text={cellText(values, at, unit)}
        states={cellState(at, "cell")}
        changed={changedAt(at, unit)}
        onHover={onHover && (() => onHover(at))}
      />,
    );
  }
  return <span className={"hexviewer__set" + (hovered ? " hexviewer__set--hover" : "")}>{items}</span>;
};

export const Set = React.memo(SetComponent);
