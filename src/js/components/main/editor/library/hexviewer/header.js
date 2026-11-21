import React, { forwardRef } from "react";

const two = (value) => (value < 16 ? "0" : "") + value.toString(16).toUpperCase();

// The header row: the offset column's name (a button when `offsetHeader.onClick` is given), the column of each
// cell in its row, and the character column's name. It scrolls sideways with the rows. `rowRef` is given the
// row itself, which is as wide as a row of `rowLength` bytes.
export const Header = forwardRef(function Header({ rowLength, setLength, unit, showAscii, showOffsets, headingWidth, offsetHeader, height, rowRef }, ref) {
  const sets = [];
  for (let from = 0; from < rowLength; from += setLength) {
    const cells = [];
    for (let at = from; at < Math.min(rowLength, from + setLength); at += unit) {
      cells.push(
        <span key={at} role="columnheader" className="hexviewer__cell hexviewer__header-cell">
          {two(at)}
        </span>,
      );
    }
    sets.push(
      <span key={from} className="hexviewer__set">
        {cells}
      </span>,
    );
  }
  const offset = offsetHeader || { text: "Offset" };
  return (
    <div ref={ref} className="hexviewer__header" role="rowgroup">
      <div ref={rowRef} role="row" aria-rowindex={1} className="hexviewer__header-row" style={{ height, lineHeight: height + "px" }}>
        {showOffsets && (
          <span role="columnheader" className="hexviewer__heading hexviewer__header-cell" style={{ width: headingWidth + "ch" }}>
            {offset.onClick ? (
              <button type="button" className="hexviewer__offset-button" title={offset.title} onClick={offset.onClick}>
                {offset.text}
              </button>
            ) : (
              <span title={offset.title}>{offset.text}</span>
            )}
          </span>
        )}
        <span className="hexviewer__sets">{sets}</span>
        {showAscii && (
          <span role="columnheader" className="hexviewer__ascii hexviewer__header-cell" style={{ width: "calc(" + rowLength + "ch + var(--hexviewer-set-gap))" }}>
            ASCII
          </span>
        )}
      </div>
    </div>
  );
});
