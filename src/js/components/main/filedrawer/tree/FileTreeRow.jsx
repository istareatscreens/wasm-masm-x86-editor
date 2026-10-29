import React, { useCallback } from "react";
import Checkbox from "../../../common/Checkbox.jsx";
import useClickPreventionOnDoubleClick from "../../utility/doubleclickfix/useClickPreventionOnDoubleClick.js";
import TreeToggle from "./TreeToggle.jsx";
import RenameInput from "./RenameInput.jsx";

// Windows 98 Explorer geometry: each level is INDENT px; level L's connector column sits at
// (L-1)*INDENT + MID, under the icon of the level above; rows are ROW_HEIGHT px (an even
// height keeps the 1-px dotted lines in phase from row to row).
export const INDENT = 19;
export const ROW_HEIGHT = 20;
const MID = 9;
const column = (level) => (level - 1) * INDENT + MID;

// One row: checkbox gutter, connector lines, +/- box, icon, label (or the rename box).
// posinset of setsize is its place among its siblings.
function FileTreeRow({ row, posinset, setsize, icon, check, isOpen, isSelected, isFocused, isCut, isDropTarget, isRenaming, actions, setRowElement }) {
  const [click, doubleClick] = useClickPreventionOnDoubleClick(
    () => actions.activate(row),
    () => actions.doubleActivate(row),
  );
  const register = useCallback((element) => setRowElement(row.path, element), [row.path, setRowElement]);

  const lines = [];
  for (let level = 1; level < row.depth; level++) {
    if (row.guides[level - 1]) lines.push(<span key={level} className="file-tree__line file-tree__line--through" style={{ left: column(level) }} />);
  }
  if (row.depth > 0) {
    lines.push(<span key="up" className="file-tree__line file-tree__line--up" style={{ left: column(row.depth) }} />);
    if (!row.isLast) lines.push(<span key="down" className="file-tree__line file-tree__line--down" style={{ left: column(row.depth) }} />);
    lines.push(<span key="across" className="file-tree__line file-tree__line--across" style={{ left: column(row.depth) + 1 }} />);
  }
  if (row.expanded) lines.push(<span key="kids" className="file-tree__line file-tree__line--down" style={{ left: column(row.depth + 1) }} />);

  const folder = row.kind !== "file";
  return (
    <li
      ref={register}
      role="treeitem"
      aria-level={row.depth + 1}
      aria-setsize={setsize}
      aria-posinset={posinset}
      aria-expanded={folder ? row.expanded : undefined}
      aria-selected={isSelected}
      tabIndex={isFocused ? 0 : -1}
      data-path={row.path}
      data-kind={row.kind}
      className={"file-tree__row" + (isCut ? " file-tree__row--cut" : "") + (isDropTarget ? " file-tree__row--drop" : "")}
      onClick={(event) => {
        if (actions.dragJustEnded()) return;
        actions.focus(row);
        if (event.detail <= 1) click();
      }}
      onDoubleClick={() => {
        if (!actions.dragJustEnded()) doubleClick();
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        actions.contextMenu(row, event.clientX, event.clientY);
      }}
      onPointerDown={(event) => actions.pointerDown(event, row)}
    >
      <span className="file-tree__gutter">
        {row.kind !== "root" && (
          <Checkbox
            tabIndex={-1}
            className="file-tree__check"
            aria-label={"select " + row.name}
            checked={check === "checked"}
            indeterminate={check === "mixed"}
            onChange={(event) => actions.check(row, event.target.checked)}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
          />
        )}
      </span>
      <span className="file-tree__indent" style={{ width: row.depth * INDENT + 2 }} aria-hidden="true">
        {lines}
        {row.kind === "folder" && row.hasChildren && (
          <span className="file-tree__toggle-slot" style={{ left: column(row.depth) - 4 }}>
            <TreeToggle expanded={row.expanded} onToggle={() => actions.toggle(row.path)} />
          </span>
        )}
      </span>
      <img className="file-tree__icon" src={icon} alt="" draggable={false} />
      {isRenaming ? (
        <RenameInput
          initial={row.name}
          problemFor={(name) => actions.renameProblem(row.path, name)}
          onCommit={(name) => actions.rename(row.path, name)}
          onCancel={actions.renameCancel}
        />
      ) : (
        <span className={"file-tree__label" + (isSelected ? " file-tree__label--selected" : "") + (isOpen ? " file-tree__label--open" : "")}>{row.name}</span>
      )}
    </li>
  );
}

export default React.memo(FileTreeRow);
