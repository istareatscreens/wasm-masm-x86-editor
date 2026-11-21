import React, { useState } from "react";
import { NOT_LOADED, charText } from "./format/cellText.js";
import { Item } from "./item.js";
import { Set } from "./set.js";

// One row: its heading, its groups of cells and its characters. It reads its own bytes from the source, so a
// row the caret, the selection and the source's changes leave alone is not drawn again. `caret` and `mirror`
// are offsets in the row (-1: not in it); `selStart` and `selEnd` the selection's part of the row.
function RowComponent(props) {
  const { source, offset, count, rowLength, setLength, unit, showAscii, showOffsets, headingWidth, caret, caretColumn, selStart, selEnd, pending, hoverable, idOf, style, index } = props;
  const [hover, setHover] = useState(-1);
  const values = new Int16Array(rowLength);
  source.read(offset, values);
  let marks = null;
  if (source.marks) {
    marks = new Uint8Array(rowLength);
    source.marks(offset, marks);
  }
  for (let i = count; i < rowLength; i++) values[i] = NOT_LOADED;

  const changedAt = (at, length) => {
    if (!marks) return false;
    for (let i = at; i < at + length && i < count; i++) if (marks[i]) return true;
    return false;
  };
  const cellState = (at, kind) => {
    const step = kind === "cell" ? unit : 1;
    const cellAt = kind === "cell" ? at : at - (at % unit);
    let states = "";
    const value = values[at];
    if (value === -1) states += " hexviewer__" + kind + "--unreadable";
    if (changedAt(at, step)) states += " hexviewer__" + kind + "--changed";
    if (selStart >= 0 && at >= selStart && at < selEnd) states += " hexviewer__" + kind + "--selected";
    if (caret >= 0) {
      const ownColumn = (kind === "cell") === (caretColumn === "hex");
      if (ownColumn && (kind === "cell" ? cellAt === caret : at === caret)) states += " hexviewer__" + kind + "--caret";
      else if (!ownColumn && (kind === "cell" ? caret >= cellAt && caret < cellAt + unit : at >= caret && at < caret + (caretColumn === "hex" ? unit : 1)))
        states += " hexviewer__" + kind + "--mirror";
      if (pending && kind === "cell" && cellAt === caret && caretColumn === "hex") states += " hexviewer__cell--pending";
    }
    if (hover >= 0 && (kind === "cell" ? cellAt === hover - (hover % unit) : at >= hover - (hover % unit) && at < hover - (hover % unit) + unit)) states += " hexviewer__" + kind + "--hover";
    return states;
  };

  const onHover = hoverable ? setHover : null;
  const sets = [];
  for (let from = 0; from < count; from += setLength) {
    const to = Math.min(count, from + setLength);
    sets.push(
      <Set
        key={from}
        values={values}
        from={from}
        to={to}
        rowOffset={offset}
        unit={unit}
        hovered={hover >= from && hover < to}
        cellState={cellState}
        idOf={idOf}
        changedAt={changedAt}
        onHover={onHover}
      />,
    );
  }
  const chars = [];
  if (showAscii) {
    for (let at = 0; at < count; at++) {
      chars.push(
        <Item
          key={at}
          kind="char"
          id={idOf("a", offset + at)}
          offset={offset + at}
          text={charText(values[at])}
          states={cellState(at, "char")}
          changed={!!(marks && marks[at])}
          onHover={onHover && (() => setHover(at))}
        />,
      );
    }
  }
  return (
    <div role="row" aria-rowindex={index + 2} className="hexviewer__row" style={style} onMouseLeave={hoverable ? () => setHover(-1) : undefined}>
      {showOffsets && (
        <span role="rowheader" className="hexviewer__heading" style={{ width: headingWidth + "ch" }}>
          {source.label(offset)}
        </span>
      )}
      <span className="hexviewer__sets">{sets}</span>
      {showAscii && <span className="hexviewer__ascii">{chars}</span>}
    </div>
  );
}

// Drawn again only when something it shows may have changed: react-window gives a new style object each time.
const same = (a, b) => {
  for (const key of Object.keys(a)) {
    if (key === "style") {
      if (a.style.transform !== b.style.transform || a.style.height !== b.style.height) return false;
    } else if (key !== "ariaAttributes" && a[key] !== b[key]) return false;
  }
  return true;
};

export const Row = React.memo(RowComponent, same);
