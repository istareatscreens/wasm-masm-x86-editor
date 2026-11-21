import { useCallback, useEffect, useRef, useState } from "react";
import { copyText } from "../format/cellText.js";
import { caretAfterKey, lastOffset } from "./caret.js";
import { createHistory } from "./history.js";
import { selectionRange } from "./selection.js";
import { charByte, isHexDigit, typeDigit } from "./typing.js";

const messageOf = (error) => (error && error.message) || String(error || "The bytes were not written");

// The caret, the selection and the edits of one viewer. Typing and Ctrl+Z need a source with `write` and are off
// while `disabled`. `view` gives the first row on screen, the rows on screen, whether there is a character column,
// and a way to keep the caret's row in sight.
export function useEditing({ source, rowLength, unit, disabled, historyKey, onEditError, view }) {
  const [caret, setCaret] = useState(null); // { offset, column }
  const [anchor, setAnchor] = useState(null); // where a selection started
  const [pending, setPending] = useState(""); // hex digits typed into the caret's cell so far
  const latest = useRef({ caret: null, anchor: null });
  latest.current = { caret, anchor };
  const history = useRef(createHistory());
  const queue = useRef(Promise.resolve());
  const dragging = useRef(null);
  const writable = !!source.write && !disabled;

  useEffect(() => {
    history.current.use(historyKey);
    setPending("");
  }, [historyKey]);

  // another source, or another row layout: the caret stays where it still can be
  useEffect(() => {
    setCaret((current) => (current && current.offset < source.length ? current : null));
    setAnchor(null);
    setPending("");
  }, [source, rowLength, unit]);

  const stepOf = (column) => (column === "hex" ? unit : 1);
  const placeCaret = useCallback(
    (offset, column = "hex", extend = false) => {
      if (!source.length) return;
      const step = column === "hex" ? unit : 1;
      const at = Math.max(0, Math.min(lastOffset(source.length, step), offset - (offset % step)));
      const { caret: before, anchor: started } = latest.current;
      setAnchor(extend ? (started !== null ? started : before ? before.offset : at) : null);
      setCaret({ offset: at, column });
      setPending("");
      view.reveal(at);
    },
    [source, unit, view],
  );

  // One edit after another, in the order typed. A refused one is told to the host, is not remembered, and leaves
  // the caret on the cell it was typed over.
  const write = (offset, bytes, remember, column) => {
    queue.current = queue.current.then(async () => {
      const before = new Int16Array(bytes.length);
      source.read(offset, before);
      try {
        await source.write(offset, bytes);
      } catch (error) {
        if (onEditError) onEditError(messageOf(error));
        placeCaret(offset, column);
        return;
      }
      if (remember && before.every((value) => value >= 0)) history.current.push(offset, Uint8Array.from(before), bytes);
    });
  };

  const selection = caret && anchor !== null && anchor !== caret.offset ? selectionRange(anchor, caret.offset, stepOf(caret.column), source.length) : null;

  const copy = () => {
    const range = selection || (caret ? { start: caret.offset, end: Math.min(source.length, caret.offset + stepOf(caret.column)) } : null);
    if (!range || !navigator.clipboard) return;
    const values = new Int16Array(range.end - range.start);
    source.read(range.start, values);
    navigator.clipboard.writeText(copyText(values, caret && caret.column === "hex" ? unit : 1)).catch(() => {});
  };

  const onKeyDown = (event) => {
    if (!source.length) return;
    const current = caret || { offset: view.firstVisible(), column: "hex" };
    const key = event.key;
    const handled = () => {
      event.preventDefault();
      event.stopPropagation();
    };
    const layout = { ...current, length: source.length, rowLength, unit, pageRows: view.pageRows() };
    if (event.ctrlKey || event.metaKey) {
      if (key === "c" || key === "C") {
        copy();
        handled();
      } else if ((key === "z" || key === "Z") && writable) {
        const edit = history.current.pop();
        if (edit) {
          write(edit.offset, edit.before, false, current.column);
          placeCaret(edit.offset, current.column);
        }
        handled();
      } else if (key === "Home" || key === "End") {
        placeCaret(caretAfterKey(key, { ...layout, ctrl: true }), current.column, event.shiftKey);
        handled();
      }
      return;
    }
    if (key === "Tab" && view.showAscii()) {
      // Tab goes from the bytes to the characters, Shift+Tab back; from there the focus leaves as usual
      const to = event.shiftKey ? "hex" : "ascii";
      if (current.column === to) return;
      placeCaret(current.offset, to);
      return handled();
    }
    if (key === "Escape") {
      if (pending) {
        setPending("");
        handled();
      } else if (selection) {
        setAnchor(null);
        handled();
      }
      return;
    }
    const moved = caretAfterKey(key, layout);
    if (moved !== null) {
      placeCaret(moved, current.column, event.shiftKey);
      return handled();
    }
    if (event.altKey || !writable) return;
    if (current.column === "hex" && isHexDigit(key)) {
      const typed = typeDigit(pending, key, unit);
      if (typed.bytes) {
        write(current.offset, typed.bytes, true, "hex");
        placeCaret(Math.min(lastOffset(source.length, unit), current.offset + unit), "hex");
      } else {
        if (!caret) setCaret(current);
        setPending(typed.pending);
      }
      return handled();
    }
    const byte = current.column === "ascii" ? charByte(key) : null;
    if (byte !== null) {
      write(current.offset, Uint8Array.of(byte), true, "ascii");
      placeCaret(Math.min(source.length - 1, current.offset + 1), "ascii");
      handled();
    }
  };

  const cellAt = (target) => {
    const cell = target && target.closest ? target.closest("[data-offset]") : null;
    return cell ? { offset: Number(cell.getAttribute("data-offset")), column: cell.getAttribute("data-column") } : null;
  };
  const onPointerDown = (event) => {
    if (event.button !== 0) return;
    const at = cellAt(event.target);
    if (!at) return;
    dragging.current = at.column;
    placeCaret(at.offset, at.column, event.shiftKey);
  };
  const onPointerMove = (event) => {
    if (!dragging.current || !(event.buttons & 1)) return;
    const at = cellAt(event.target);
    if (!at || at.column !== dragging.current) return;
    const offset = at.offset - (at.offset % stepOf(at.column));
    if (caret && offset === caret.offset) return;
    if (anchor === null && caret) setAnchor(caret.offset);
    setCaret({ offset, column: at.column });
  };
  const onPointerUp = () => {
    dragging.current = null;
  };
  const onFocus = () => {
    if (!caret && source.length) setCaret({ offset: view.firstVisible(), column: "hex" });
  };

  return { caret, selection, pending, placeCaret, handlers: { onKeyDown, onPointerDown, onPointerMove, onPointerUp, onFocus } };
}
