import React, { useContext, useEffect, useState } from "react";

import TreeToggle from "../../../common/TreeToggle.jsx";
import { TreeContext } from "./treeContext.js";
import { childPath } from "./treePaths.js";
import ValueEditor from "./ValueEditor.jsx";
import ViewMemoryButton from "./ViewMemoryButton.jsx";

// the tree's geometry, as the file tree's: each level is INDENT px, with its connector under the box above
const INDENT = 14;
const MID = 6;
const PAGE = 100; // an array's elements are asked for this many at a time
const column = (level) => (level - 1) * INDENT + MID;

const readOnly = (variable) => !!(variable.presentationHint && (variable.presentationHint.attributes || []).indexOf("readOnly") >= 0);

// A value's parts, asked for again when the row's reference is new (every stop gives new ones).
function useChildren(context, reference, start, count) {
  const [state, setState] = useState({ reference: 0, rows: null, error: "" });
  useEffect(() => {
    let live = true;
    if (!reference || context.stale) return undefined;
    const args = { variablesReference: reference, format: { hex: context.hex } };
    if (count !== undefined) Object.assign(args, { filter: "indexed", start, count });
    context.controller.client.ask("variables", args).then((answer) => {
      if (!live) return;
      setState("body" in answer ? { reference, rows: answer.body.variables, error: "" } : { reference, rows: [], error: answer.refused });
    });
    return () => {
      live = false;
    };
  }, [reference, start, count, context.stale, context.hex, context.controller]);
  return state;
}

function Children({ reference, path, level, guides, start, count }) {
  const context = useContext(TreeContext);
  const { rows, error } = useChildren(context, reference, start, count);
  if (error) return <li role="none" className="debug-tree__note" style={{ paddingLeft: column(level) + INDENT }}>{error}</li>;
  if (!rows) return null;
  return rows.map((variable, i) => (
    <ValueRow key={variable.name + "#" + i} variable={variable} index={i} path={childPath(path, variable.name)} level={level} parent={reference} guides={guides} last={i === rows.length - 1} />
  ));
}

// A long array opens to groups of a hundred elements: [0..99], [100..199], ...
function Groups({ variable, path, level, guides }) {
  const context = useContext(TreeContext);
  const groups = [];
  for (let start = 0; start < variable.indexedVariables; start += PAGE) groups.push({ start, count: Math.min(PAGE, variable.indexedVariables - start) });
  return groups.map((group, i) => {
    const name = "[" + group.start + ".." + (group.start + group.count - 1) + "]";
    const groupPath = childPath(path, name);
    const open = context.expanded.has(groupPath);
    const last = i === groups.length - 1;
    return (
      <React.Fragment key={name}>
        <Row path={groupPath} level={level} guides={guides} last={last} open={open} expandable name={name} />
        {open && <Children reference={variable.variablesReference} path={groupPath} level={level + 1} guides={guides.concat(!last)} start={group.start} count={group.count} />}
      </React.Fragment>
    );
  });
}

function Row({ path, index, level, guides, last, open, expandable, editable, name, title, changed, was, onContextMenu, onDoubleClick, children }) {
  const context = useContext(TreeContext);
  const selected = context.selected === path;
  const lines = [];
  for (let at = 1; at < level; at++) if (guides[at - 1]) lines.push(<span key={at} className="debug-tree__line debug-tree__line--through" style={{ left: column(at) }} />);
  if (level > 1) {
    lines.push(<span key="up" className="debug-tree__line debug-tree__line--up" style={{ left: column(level - 1) }} />);
    if (!last) lines.push(<span key="down" className="debug-tree__line debug-tree__line--down" style={{ left: column(level - 1) }} />);
    lines.push(<span key="across" className="debug-tree__line debug-tree__line--across" style={{ left: column(level - 1) + 1 }} />);
  }
  return (
    <li
      role="treeitem"
      aria-level={level}
      aria-expanded={expandable ? !!open : undefined}
      aria-selected={selected}
      aria-description={changed ? "changed, was " + was : undefined}
      tabIndex={selected || (!context.selected && path === context.first) ? 0 : -1}
      data-path={path}
      data-index={index}
      data-editable={editable ? "" : undefined}
      className={"debug-tree__row" + (selected ? " debug-tree__row--selected" : "")}
      onFocus={() => context.select(path)}
      onMouseDown={() => context.select(path)}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
    >
      <span className="debug-tree__indent" style={{ width: (level - 1) * INDENT + 14 }} aria-hidden="true">
        {lines}
        {expandable && (
          <span className="debug-tree__toggle-slot" style={{ left: column(level) - 4 }}>
            <TreeToggle className="debug-tree__toggle" expanded={!!open} onToggle={() => context.toggle(path)} />
          </span>
        )}
      </span>
      <span className="debug-tree__name" title={title}>
        {name}
      </span>
      {children}
    </li>
  );
}

function ValueRow({ variable, index, path, level, parent, guides, last }) {
  const context = useContext(TreeContext);
  const expandable = variable.variablesReference > 0;
  const open = expandable && context.expanded.has(path);
  const editable = !readOnly(variable) && !context.stale;
  const paged = (variable.indexedVariables || 0) > PAGE;

  context.values.current.current.set(path, variable.value);
  const was = context.values.current.previous.get(path);
  // changed since the previous stop: only while the values are the session's own, not the last ones kept
  const changed = !context.stale && was !== undefined && was !== variable.value;
  const title = (variable.type || "") + (variable.memoryReference ? (variable.type ? " at " : "at ") + variable.memoryReference.replace(/^0x/, "") + "h" : "");

  return (
    <>
      <Row
        path={path}
        index={index}
        level={level}
        guides={guides}
        last={last}
        open={open}
        expandable={expandable}
        editable={editable}
        name={variable.name}
        title={title || undefined}
        changed={changed}
        was={was}
        onContextMenu={(event) => {
          event.preventDefault();
          context.select(path);
          context.openMenu({ variable, parent, editable, index, level }, path, event.clientX, event.clientY);
        }}
        onDoubleClick={() => editable && context.setEditing(path)}
      >
        {context.editing === path ? (
          <ValueEditor variable={variable} parent={parent} path={path} />
        ) : (
          <span className={"debug-tree__value" + (changed ? " debug-tree__value--changed" : "")} title={changed ? "was " + was : variable.value}>
            {variable.value}
          </span>
        )}
        {variable.memoryReference && context.selected === path && <ViewMemoryButton address={variable.memoryReference} />}
      </Row>
      {open && !paged && <Children reference={variable.variablesReference} path={path} level={level + 1} guides={guides.concat(!last)} />}
      {open && paged && <Groups variable={variable} path={path} level={level + 1} guides={guides.concat(!last)} />}
    </>
  );
}

export default ValueRow;
