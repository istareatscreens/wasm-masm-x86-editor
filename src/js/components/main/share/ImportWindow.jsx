import React, { useEffect, useRef, useState } from "react";

import Window from "../../common/Window.jsx";
import RetroScrollArea from "../../common/RetroScrollArea.jsx";
import GroupBox from "../../common/GroupBox.jsx";
import ListBox from "../../common/ListBox.jsx";
import TextField from "../../common/TextField.jsx";
import iconImport from "../../../../images/importLink32.png";
import { plural, fileSize } from "./format.js";
import { driveName } from "../utility/filesystem/drives";
import { checkLinkText, importLink } from "../utility/share/ShareService.js";
import { splitLinks, MAX_LINKS, MAX_LIST_BYTES } from "../utility/share/shareLink";
import { preloadDecoder } from "../utility/share/brotli";

let nextId = 1;
const newRow = (text = "") => ({ id: nextId++, text, check: null, expanded: false, result: null });

// One line for an import's result.
export const resultText = (result) => {
  switch (result.status) {
    case "created":
      return "imported as the drive " + driveName(result.drive);
    case "created-new":
      return "imported as the new drive " + driveName(result.drive);
    case "merged":
      return "merged into " + driveName(result.drive);
    case "replaced":
      return "replaced the files of " + driveName(result.drive);
    case "cancelled":
      return "cancelled: nothing of this link was written, and the import stopped";
    case "stopped":
      return "not imported: the import was cancelled";
    case "skipped":
      return result.reason ? "skipped: " + result.reason : "skipped";
    default:
      return "failed: " + result.reason;
  }
};

// Import by URL: an expandable list of links (typed, pasted several at once, or read from a .csv or .txt list),
// each with what it holds or why it cannot be imported; Import all imports them in order.
function ImportWindow({ ui, before, onStart, onImported, close }) {
  const [rows, setRows] = useState(() => [newRow()]);
  const [message, setMessage] = useState("");
  const [running, setRunning] = useState(false);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;
  const listInput = useRef(null);
  const timers = useRef(new Map());

  useEffect(() => () => timers.current.forEach((timer) => clearTimeout(timer)), []);
  // the Brotli decoder links of version 2 need, unless the browser has its own
  useEffect(() => {
    preloadDecoder();
  }, []);

  const update = (id, change) => setRows((list) => list.map((row) => (row.id === id ? { ...row, ...change } : row)));
  // what a row's text is: checked a moment after it stops changing
  const check = (id, text) => {
    clearTimeout(timers.current.get(id));
    if (!text.trim()) return update(id, { check: null, result: null });
    update(id, { check: { state: "checking" }, result: null });
    timers.current.set(
      id,
      setTimeout(async () => {
        const found = await checkLinkText(text);
        if ((rowsRef.current.find((row) => row.id === id) || {}).text !== text) return;
        update(id, { check: found.problem ? { state: "bad", problem: found.problem, link: found.link || null } : { state: "ok", link: found.link, label: found.label } });
      }, 300),
    );
  };
  const setText = (id, text) => {
    update(id, { text });
    check(id, text);
  };
  // Links added as rows (repeats of a row left out, at most MAX_LINKS rows). Pasted into row `intoId`, the
  // first takes that row; empty rows give way to the others.
  const addLinks = (items, intoId = null) => {
    const current = rowsRef.current;
    const present = new Set(current.map((row) => row.text.trim()).filter(Boolean));
    const fresh = items.filter((item) => !present.has(item));
    const kept = current.filter((row) => row.text.trim() || row.id === intoId);
    const taken = fresh.slice(0, Math.max(0, MAX_LINKS - kept.length + (intoId === null ? 0 : 1)));
    const into = intoId !== null && taken.length ? { id: intoId, text: taken[0] } : null;
    const added = (into ? taken.slice(1) : taken).map((item) => newRow(item));
    const next = kept.map((row) => (into && row.id === into.id ? { ...row, text: into.text, check: null, result: null } : row)).concat(added);
    setRows(next.length ? next : [newRow()]);
    (into ? [into] : []).concat(added).forEach((row) => check(row.id, row.text));
    setMessage(fresh.length > taken.length ? plural(fresh.length - taken.length, "link") + " not added: at most " + MAX_LINKS + " links an import." : "");
  };

  const onPaste = (id, event) => {
    const items = splitLinks(event.clipboardData.getData("text"));
    if (items.length < 2) return;
    event.preventDefault();
    addLinks(items, id);
  };

  const loadList = (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_LIST_BYTES) return setMessage("'" + file.name + "' is larger than " + MAX_LIST_BYTES / 1048576 + " MiB: it is not read.");
    const reader = new FileReader();
    reader.onload = () => {
      const items = splitLinks(String(reader.result));
      if (!items.length) return setMessage("'" + file.name + "' holds no links.");
      addLinks(items);
    };
    reader.onerror = () => setMessage("'" + file.name + "' could not be read.");
    reader.readAsText(file, "utf-8");
  };

  const importAll = async () => {
    if (running) return;
    setRunning(true);
    setMessage("");
    onStart();
    const batch = { choice: null };
    const results = [];
    let stopped = false;
    for (const row of rowsRef.current) {
      if (!row.text.trim()) continue;
      if (stopped) {
        update(row.id, { result: { status: "stopped" } });
        continue;
      }
      if (!row.check || row.check.state !== "ok") {
        update(row.id, { result: { status: "skipped", reason: row.check && row.check.problem ? row.check.problem : "not checked yet" } });
        continue;
      }
      const result = await importLink(row.text, ui, { batch, before });
      results.push(result);
      update(row.id, { result });
      if (result.status === "cancelled") stopped = true;
    }
    setRunning(false);
    onImported(results);
  };

  const usable = rows.filter((row) => row.check && row.check.state === "ok").length;
  return (
    <Window
      onClose={() => !running && close()}
      className="window__import"
      title="Import by URL"
      width="56rem"
      footer={
        <div className="window__confirm__buttons">
          <button type="button" className="btn btn--text window__confirm__btn" disabled={running || rows.length >= MAX_LINKS} onClick={() => setRows((list) => list.concat([newRow()]))}>
            Add a link
          </button>
          <button type="button" className="btn btn--text window__confirm__btn" disabled={running} onClick={() => listInput.current.click()}>
            Load a list...
          </button>
          <input ref={listInput} type="file" accept=".csv,.txt,text/csv,text/plain" className="file-upload-input file-upload-input--hidden" onChange={loadList} />
          <button type="button" className="btn btn--text window__confirm__btn" disabled={running || !usable} onClick={importAll}>
            {running ? "Importing…" : "Import all"}
          </button>
          <button type="button" className="btn btn--text window__confirm__btn" disabled={running} onClick={close}>
            Close
          </button>
        </div>
      }
    >
      <div className="window__dialog">
        <img className="window__dialog__icon" src={iconImport} alt="" width={32} height={32} />
        <div className="window__dialog__content">
          <p>
            Paste share links, one per row (several pasted at once fill several rows), or load a .csv or .txt list of them. Each link becomes a drive of its own,
            labelled with the sender's workspace name. Nothing is built or run.
          </p>
          <GroupBox caption="Links">
            <RetroScrollArea label="Links to import" vertical="auto" className="window__scroll-area window__import__list">
              <ol className="window__import__rows">
                {rows.map((row, i) => {
                  const link = row.check && row.check.link;
                  const details = link ? link.files.length + link.skipped.length + link.warnings.length : 0;
                  return (
                    <li key={row.id} className="window__import__row">
                      <span className="window__import__toggle-slot">
                        {details > 0 && (
                          <button
                            type="button"
                            className={"window__import__toggle" + (row.expanded ? " window__import__toggle--open" : "")}
                            aria-expanded={row.expanded}
                            aria-label={(row.expanded ? "hide" : "show") + " what link " + (i + 1) + " holds"}
                            onClick={() => update(row.id, { expanded: !row.expanded })}
                          />
                        )}
                      </span>
                      <div className="window__import__main">
                        <TextField
                          className="window__import__text"
                          value={row.text}
                          aria-label={"link " + (i + 1)}
                          placeholder="https://…#share=…"
                          disabled={running}
                          onChange={(event) => setText(row.id, event.target.value)}
                          onPaste={(event) => onPaste(row.id, event)}
                        />
                        <span className={"window__import__status" + (row.check && row.check.state === "bad" ? " window__import__status--bad" : "")}>
                          {row.result
                            ? resultText(row.result)
                            : !row.check
                              ? "\u00a0"
                              : row.check.state === "checking"
                                ? "checking…"
                                : row.check.state === "bad"
                                  ? row.check.problem
                                  : "from " + row.check.label + ": " + plural(link.files.length, "file") + ", " + fileSize(link.bytes) +
                                    (link.skipped.length ? ", " + plural(link.skipped.length, "entry") + " left out" : "") +
                                    (link.warnings.length ? ", " + plural(link.warnings.length, "warning") : "")}
                        </span>
                        {row.expanded && link && (
                          <ListBox
                            label={"What link " + (i + 1) + " holds"}
                            className="window__import__details"
                            items={link.files
                              .map((file) => file.path.split("/").join("\\") + " (" + fileSize(file.bytes.length) + ")")
                              .concat(link.skipped.map((skip) => "left out: " + skip.name.split("/").join("\\") + ": " + skip.reason))
                              .concat(link.warnings.map((path) => "warning: " + path.split("/").join("\\") + " has invisible characters that reorder text (it may not read as it runs)"))}
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </RetroScrollArea>
          </GroupBox>
          <p aria-live="polite">{message || "\u00a0"}</p>
        </div>
      </div>
    </Window>
  );
}

export default ImportWindow;
