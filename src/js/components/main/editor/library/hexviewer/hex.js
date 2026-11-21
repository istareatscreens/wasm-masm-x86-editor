import React, { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { List } from "react-window";
import { useEditing } from "./editing/useEditing.js";
import { Header } from "./header.js";
import { useRowLength } from "./layout/useRowLength.js";
import { Row } from "./row.js";

const OVERSCAN_COUNT = 5;
const LIST_STYLE = { flex: "1 1 0", minHeight: 0, maxHeight: "none" };

// react-window draws each row with this, and the row's own props
const RowRenderer = ({ index, style, ...props }) => {
  const offset = index * props.rowLength;
  const count = Math.min(props.rowLength, props.source.length - offset);
  if (count <= 0) return null;
  const inRow = (at) => (at !== null && at >= offset && at < offset + props.rowLength ? at - offset : -1);
  const caret = props.caret ? inRow(props.caret.offset) : -1;
  const selection = props.selection;
  const selStart = selection && selection.start < offset + count && selection.end > offset ? Math.max(0, selection.start - offset) : -1;
  const selEnd = selStart >= 0 ? Math.min(count, selection.end - offset) : -1;
  return (
    <Row
      index={index}
      style={{ ...style, width: "max-content", minWidth: "100%", lineHeight: props.rowHeight + "px" }}
      source={props.source}
      version={props.version}
      offset={offset}
      count={count}
      rowLength={props.rowLength}
      setLength={props.setLength}
      unit={props.unit}
      showAscii={props.showAscii}
      showOffsets={props.showOffsets}
      headingWidth={props.headingWidth}
      caret={caret}
      caretColumn={caret >= 0 ? props.caret.column : ""}
      selStart={selStart}
      selEnd={selEnd}
      pending={caret >= 0 ? props.pending : ""}
      hoverable={props.hoverable}
      idOf={props.idOf}
    />
  );
};

// The viewer: a header row over a virtual list of rows, a grid with a caret. Only the rows on screen exist.
export const Hex = forwardRef(function Hex(props, ref) {
  const {
    source,
    rowLength: requested = 16,
    setLength = 4,
    unit = 1,
    rowHeight = 25,
    showHeader = true,
    offsetHeader,
    showAscii = true,
    showOffsets = true,
    highlightOnHover = true,
    disabled = false,
    historyKey,
    onVisibleRangeChange,
    onEditError,
    attachScrollbars,
    label = "Bytes",
    hostRef,
  } = props;
  const version = useSyncExternalStore(source.subscribe, source.getVersion, source.getVersion);
  const [list, setList] = useState(null);
  const listElement = list ? list.element : null;
  const header = useRef(null);
  const templates = useMemo(() => ({ eight: React.createRef(), sixteen: React.createRef() }), []);
  const rowLength = useRowLength(requested, listElement, templates);
  const rows = Math.ceil(source.length / rowLength);
  const visible = useRef({ start: 0, stop: 0 });
  const prefix = useId().replace(/:/g, "");
  const idOf = useCallback((column, offset) => prefix + column + offset, [prefix]);

  // the heading column is as wide as the longest label
  const headingWidth = useMemo(
    () => (source.length ? Math.max(source.label(0).length, source.label((rows - 1) * rowLength).length) : 8),
    [source, rows, rowLength, version],
  );

  const view = useMemo(
    () => ({
      firstVisible: () => Math.min(visible.current.start * rowLength, Math.max(0, source.length - 1)),
      pageRows: () => Math.max(1, visible.current.stop - visible.current.start),
      showAscii: () => showAscii,
      reveal: (offset) => {
        if (list && rows) list.scrollToRow({ index: Math.min(rows - 1, Math.floor(offset / rowLength)), align: "auto" });
      },
    }),
    [list, rows, rowLength, source, showAscii],
  );
  const editing = useEditing({ source, rowLength, unit, disabled, historyKey, onEditError, view });

  useImperativeHandle(
    ref,
    () => ({
      scrollToOffset(offset, align = "start") {
        if (list && rows) list.scrollToRow({ index: Math.max(0, Math.min(rows - 1, Math.floor(offset / rowLength))), align });
      },
      setCaret(offset, column = "hex") {
        editing.placeCaret(offset, column);
      },
      getCaret() {
        return editing.caret;
      },
      get rowLength() {
        return rowLength;
      },
      focus() {
        if (listElement) listElement.focus({ preventScroll: true });
      },
      get element() {
        return listElement;
      },
    }),
    [list, listElement, rows, rowLength, editing.placeCaret, editing.caret],
  );

  // the host's scrollbars, if it gives any; the browser's otherwise
  useEffect(() => {
    if (!attachScrollbars || !listElement || !hostRef.current) return undefined;
    const attached = attachScrollbars(listElement, hostRef.current);
    return () => attached && attached.destroy();
  }, [attachScrollbars, listElement, hostRef]);

  // the header scrolls sideways with the rows
  useEffect(() => {
    if (!listElement) return undefined;
    const follow = () => {
      if (header.current) header.current.scrollLeft = listElement.scrollLeft;
    };
    listElement.addEventListener("scroll", follow, { passive: true });
    return () => listElement.removeEventListener("scroll", follow);
  }, [listElement]);

  const onRowsRendered = useCallback(
    (shown) => {
      visible.current = { start: shown.startIndex, stop: shown.stopIndex };
      if (onVisibleRangeChange) onVisibleRangeChange({ start: shown.startIndex * rowLength, end: Math.min(source.length, (shown.stopIndex + 1) * rowLength) });
    },
    [onVisibleRangeChange, rowLength, source],
  );

  const caret = editing.caret;
  const rowProps = useMemo(
    () => ({
      source,
      version,
      rowLength,
      setLength,
      unit,
      showAscii,
      showOffsets,
      headingWidth,
      caret,
      selection: editing.selection,
      pending: editing.pending,
      hoverable: highlightOnHover && !disabled,
      idOf,
      rowHeight,
    }),
    [source, version, rowLength, setLength, unit, showAscii, showOffsets, headingWidth, caret, editing.selection, editing.pending, highlightOnHover, disabled, idOf, rowHeight],
  );
  const shape = { setLength, unit, showAscii, showOffsets, headingWidth, offsetHeader, height: rowHeight };

  return (
    <>
      {showHeader && <Header ref={header} rowLength={rowLength} {...shape} />}
      <List
        listRef={setList}
        className="hexviewer__list"
        rowComponent={RowRenderer}
        rowCount={rows}
        rowHeight={rowHeight}
        rowProps={rowProps}
        overscanCount={OVERSCAN_COUNT}
        onRowsRendered={onRowsRendered}
        style={LIST_STYLE}
        role="grid"
        aria-label={label}
        aria-rowcount={rows + 1}
        aria-readonly={!source.write || disabled || undefined}
        aria-disabled={disabled || undefined}
        aria-activedescendant={caret ? idOf(caret.column === "hex" ? "h" : "a", caret.offset) : undefined}
        tabIndex={0}
        {...editing.handlers}
      />
      {requested === "auto" && (
        <div className="hexviewer__measure" aria-hidden="true">
          <Header ref={null} rowRef={templates.eight} rowLength={8} {...shape} offsetHeader={{ text: "" }} />
          <Header ref={null} rowRef={templates.sixteen} rowLength={16} {...shape} offsetHeader={{ text: "" }} />
        </div>
      )}
    </>
  );
});
