import React, { useEffect, useState } from "react";

import Button from "../../../common/ImageButton.jsx";
import Window from "../../../common/Window.jsx";
import accept from "../../../../../images/accept.png";
import acceptDisabled from "../../../../../images/accept-disabled.png";
import errorImage from "../../../../../images/error.png";

// Factory reset of the terminal ENVIRONMENT. Deletes everything the
// emulator persists — the instant-start snapshot (heap + overlay), the legacy
// guest overlays of earlier builds, and every emulator preference/failure record
// in localStorage — then reloads into a cold boot that captures a fresh factory
// image. The user's files (the file drawer's IndexedDB) and their unsaved legacy
// localStorage files are KEPT unless "also delete all my files" is ticked: a
// broken environment must be recoverable without any data loss.
const EMULATOR_DATABASES = ["bw-snapshot", "/root", "/d_drive"];
const DRAWER_DATABASE = "BoxedwineFileSystem";
const isEmulatorKey = (key) => /^bw-/.test(key) || /^bwsnapmark\|/.test(key);

const deleteDatabase = (name) =>
  new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => resolve({ name, ok: true });
      req.onerror = () => resolve({ name, ok: false, why: String(req.error) });
      // another tab holds it open: the delete completes when that tab closes;
      // the reload below still cold-boots (the marker keys are gone)
      req.onblocked = () => resolve({ name, ok: false, why: "blocked" });
    } catch (e) {
      resolve({ name, ok: false, why: String(e) });
    }
  });

export const factoryReset = async ({ deleteFiles = false } = {}) => {
  const report = { keysRemoved: [], databases: [] };
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++) keys.push(window.localStorage.key(i));
    if (deleteFiles) {
      // the old "wipe everything": every key but the editor settings
      const settings = window.localStorage.getItem("settings");
      window.localStorage.clear();
      if (settings) window.localStorage.setItem("settings", settings);
      report.keysRemoved = keys.filter((k) => k !== "settings");
    } else {
      for (const k of keys) {
        if (isEmulatorKey(k)) { window.localStorage.removeItem(k); report.keysRemoved.push(k); }
      }
    }
  } catch (e) { console.warn("[factoryReset] localStorage", e); }
  if (typeof indexedDB !== "undefined") {
    const names = deleteFiles ? EMULATOR_DATABASES.concat([DRAWER_DATABASE]) : EMULATOR_DATABASES;
    report.databases = await Promise.all(names.map(deleteDatabase));
  }
  // the asset cache is build-keyed and harmless, but a factory reset means factory
  try { if (window.caches) { const ks = await window.caches.keys(); await Promise.all(ks.filter((k) => /^bw-/.test(k)).map((k) => window.caches.delete(k))); } } catch (e) {}
  console.warn("[factoryReset] " + (deleteFiles ? "environment + files" : "environment") + " reset: " + JSON.stringify(report)); // critical log, kept in production
  return report;
};

function CacheResetWindow({ close }) {
  const formatCountDown = (count) => ` ( ${count} )`;
  const defaultCount = 3;

  const [cannotExecute, setCannotExecute] = useState(true);
  const [countDown, setCountDown] = useState(formatCountDown(defaultCount));
  const [deleteFiles, setDeleteFiles] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let count = defaultCount;

    const timer = setInterval(() => {
      switch (true) {
        case (1 < count):
          setCountDown(formatCountDown(--count));
          return;
        case 1 === count:
          setCountDown(formatCountDown(--count));
          setCannotExecute(false);
          return;
      }
      setCountDown("");
      setCannotExecute(false);
      clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const run = async () => {
    if (running) return;
    setRunning(true);
    try { await factoryReset({ deleteFiles }); } catch (e) { console.error("[factoryReset]", e); }
    location.reload();
  };

  return (
    <Window
      closeWindow={close}
      windowClass={"window__reset-cache"}
      titlebarClass={"title-bar__about"}
      titlebarText={"Hard Reset Everything"}
    >
      <div className="window__reset-cache__content">
        <img
          className="window__reset-cache__content__image"
          src={errorImage}
          alt="Warning Image"
        />
        <div
          className="window__reset-cache__content__text"
        >
          <h1 className="window__reset-cache__content__text--warning">
            {"RESET THE TERMINAL TO ITS FACTORY STATE"}
          </h1>
          <br />
          <p>
            {
              "If the MASM terminal is broken this fixes it: the saved instant-start state, the terminal's " +
              "cached environment and its settings are deleted, and the page reloads into a fresh terminal " +
              "(the first start takes a little longer)."
            }
          </p>
          <br />
          <p>
            <b>{"Your files in the file drawer are kept."}</b>
            {" They are put back into the terminal automatically after the reset."}
          </p>
          <br />
          <label className="window__reset-cache__content__option">
            <input
              type="checkbox"
              id="resetDeleteFiles"
              checked={deleteFiles}
              onChange={(event) => setDeleteFiles(event.target.checked)}
            />
            <span>
              {" Also delete all my files (the file drawer and any files left from the previous version). "}
              <b>{"This cannot be undone — download a backup first."}</b>
            </span>
          </label>
          <br />
        </div>
      </div>
      <div className="external-buttons">
        <Button
          src={cannotExecute || running ? acceptDisabled : accept}
          className={"btn--text btn--window window__reset-cache--btn"}
          alt={"Hard Reset Everything"}
          disabled={cannotExecute || running}
          id={"hardResetConfirm"}
          onClick={run}
        >
          <span>{running ? "Resetting…" : `Hard Reset${countDown}`}</span>
        </Button>
      </div>
    </Window>
  );
}

export default CacheResetWindow;
