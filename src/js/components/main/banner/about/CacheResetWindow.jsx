import React, { useEffect, useState } from "react";

import Button from "../../../common/ImageButton.jsx";
import CheckOption from "../../../common/CheckOption.jsx";
import Window from "../../../common/Window.jsx";
import PixelIcon from "../../../common/PixelIcon.jsx";
import useMediaQuery from "../../../common/useMediaQuery.js";
import useStoredState from "../../../common/useStoredState.js";
import ConfirmWindow from "../../filedrawer/dialogs/ConfirmWindow.jsx";
import FileSystem from "../../utility/FileSystem.js";
import { isResetKey } from "./resetKeys";
import { LAYOUT_KEY, parseLayout, serializeLayout, isDefaultLayout, resetLayout } from "../../layout/layoutStorage";
import { DEBUG_KEY, dropBreakpoints, updateDebug } from "../../debugger/session/debugStorage";
import { HEX_OFFSETS_KEY } from "../../editor/hexOffsets.js";
import { driveName, driveRoot, rootOf } from "../../utility/filesystem/drives";
import accept from "../../../../../images/accept.png";
import acceptDisabled from "../../../../../images/accept-disabled.png";
import stopIcon from "../../../../../images/msgError.png";
import resizeHandles from "../../../../../images/resizeHandles.png";
import deleteFile from "../../../../../images/deleteFile.png";

// Factory reset of the terminal ENVIRONMENT: deletes the instant-start snapshot, the guest overlays older builds
// left and the emulator's localStorage records, then reloads into a cold boot. The user's files (D:, every drive,
// legacy localStorage files) are KEPT unless "also delete all my files" is ticked; settings are always kept.
const EMULATOR_DATABASES = ["bw-snapshot", "/root", "/d_drive"];
const DRAWER_DATABASE = "BoxedwineFileSystem";

const deleteDatabase = (name, onBlocked) =>
  new Promise((resolve) => {
    try {
      const req = indexedDB.deleteDatabase(name);
      req.onsuccess = () => resolve({ name, ok: true });
      req.onerror = () => resolve({ name, ok: false, why: String(req.error) });
      // another tab holds it open: the delete completes when that tab releases it (at once for
      // this build, on close or reload for older ones); reloading first would wait forever
      req.onblocked = () => {
        if (onBlocked) onBlocked(name);
      };
    } catch (e) {
      resolve({ name, ok: false, why: String(e) });
    }
  });

// the keys "also delete all my files" keeps: preferences, not files
const KEPT_KEYS = ["settings", LAYOUT_KEY, DEBUG_KEY, HEX_OFFSETS_KEY];

export const factoryReset = async ({ deleteFiles = false, onBlocked = null } = {}) => {
  const report = { keysRemoved: [], databases: [] };
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i++)
      keys.push(window.localStorage.key(i));
    // with "delete all my files", every key but the preferences (the legacy files with them)
    const remove = deleteFiles ? (k) => KEPT_KEYS.indexOf(k) < 0 : isResetKey;
    for (const k of keys) {
      if (remove(k)) {
        window.localStorage.removeItem(k);
        report.keysRemoved.push(k);
      }
    }
    // the breakpoints were in the files that go
    if (deleteFiles && window.localStorage.getItem(DEBUG_KEY) !== null) updateDebug((record) => dropBreakpoints(record, () => true));
  } catch (e) {
    console.warn("[factoryReset] localStorage", e);
  }
  if (typeof indexedDB !== "undefined") {
    const names = deleteFiles
      ? EMULATOR_DATABASES.concat([DRAWER_DATABASE])
      : EMULATOR_DATABASES;
    if (deleteFiles) await FileSystem.closeStore(); // this tab's own connection would block the delete
    report.databases = await Promise.all(
      names.map((name) => deleteDatabase(name, onBlocked)),
    );
  }
  // the asset cache is build-keyed and harmless, but a factory reset means factory
  try {
    if (window.caches) {
      const ks = await window.caches.keys();
      await Promise.all(
        ks.filter((k) => /^bw-/.test(k)).map((k) => window.caches.delete(k)),
      );
    }
  } catch (e) {}
  console.warn(
    "[factoryReset] " +
      (deleteFiles ? "environment + files" : "environment") +
      " reset: " +
      JSON.stringify(report),
  ); // critical log, kept in production
  return report;
};

const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");

// Besides the reset, the window restores the default layout and deletes the extra drives, at once and without a reload.
function CacheResetWindow({ close, drives, fileList, deleteExtraDrives }) {
  const formatCountDown = (count) => ` ( ${count} )`;
  const defaultCount = 3;

  const [cannotExecute, setCannotExecute] = useState(true);
  const [countDown, setCountDown] = useState(formatCountDown(defaultCount));
  const [deleteFiles, setDeleteFiles] = useState(false);
  const [askDrives, setAskDrives] = useState(false);
  const [layout] = useStoredState(LAYOUT_KEY, parseLayout, serializeLayout);
  // the narrow page's layout (_window.scss): the icon above the text
  const narrow = useMediaQuery("(max-width: 480px)");
  const [running, setRunning] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const hasDrives = drives.length > 0;

  useEffect(() => {
    let count = defaultCount;

    const timer = setInterval(() => {
      switch (true) {
        case 1 < count:
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
    try {
      await factoryReset({
        deleteFiles,
        onBlocked: () => setWaiting(true),
      });
    } catch (e) {
      console.error("[factoryReset]", e);
    }
    location.reload();
  };

  // "alice (E:) — 3 files", or "alice — 3 files" for a drive without a letter
  const driveLines = () =>
    drives.map((drive) => driveName(drive) + " — " + plural(fileList.filter((path) => rootOf(path) === driveRoot(drive.id)).length, "file"));

  return (
    <>
      <Window
        onClose={close}
        className={"window__reset-cache"}
        title={"Hard Reset Everything"}
        width="50rem"
        scrollLabel={"Hard reset"}
        footer={
          <div className="external-buttons">
            <Button
              src={cannotExecute || running ? acceptDisabled : accept}
              className={"window__reset-cache--btn"}
              imageClass={"window__reset-cache__icon"}
              alt={"Hard Reset Everything"}
              disabled={cannotExecute || running}
              id={"hardResetConfirm"}
              onClick={run}
            >
              <span>{running ? "Resetting…" : `Hard Reset${countDown}`}</span>
            </Button>
          </div>
        }
      >
        <div className="window__reset-cache__content">
          <PixelIcon className="window__reset-cache__content__image" src={stopIcon} pixels={32} rem={narrow ? 4 : 6} alt="Warning Image" />
          <div className="window__reset-cache__content__text">
            <h1 className="window__reset-cache__content__text--warning">
              {"RESET THE TERMINAL TO ITS FACTORY STATE"}
            </h1>
            <br />
            <p>
              {"If the MASM terminal is broken this fixes it: the saved instant-start state, the terminal's " +
                "cached environment and its settings are deleted, and the page reloads into a fresh terminal " +
                "(the first start takes a little longer)."}
            </p>
            <br />
            <p>
              <b>
                {deleteFiles
                  ? "All your files are deleted, on D: and on every other drive. The layout and the editor settings are kept."
                  : hasDrives
                    ? "Your files are kept, on D: and on every other drive, and so are the layout and the editor settings."
                    : "Your files in the file drawer are kept, and so are the layout and the editor settings."}
              </b>
            </p>
            <br />
            <CheckOption id="resetDeleteFiles" checked={deleteFiles} onChange={setDeleteFiles}>
              {"Also delete all my files (the file drawer, every extra drive and any files left from the previous version). "}
              <b>{"This cannot be undone — download a backup first."}</b>
            </CheckOption>
            <div className="window__reset-cache__actions">
              <Button
                src={resizeHandles}
                className={"window__reset-cache__action"}
                imageClass={"window__reset-cache__icon"}
                id={"restoreDefaultLayout"}
                title={"put every pane back in its default place and size, now"}
                disabled={isDefaultLayout(layout)}
                onClick={resetLayout}
              >
                <span>{"Restore Default Layout"}</span>
              </Button>
              <Button
                src={deleteFile}
                className={"window__reset-cache__action"}
                imageClass={"window__reset-cache__icon"}
                id={"deleteExtraDrives"}
                title={"delete every drive but D:, with its files"}
                disabled={!hasDrives}
                onClick={() => setAskDrives(true)}
              >
                <span>{"Delete Extra Drives..."}</span>
              </Button>
            </div>
            {waiting && (
              <p className="window__reset-cache__content__text--warning">
                {
                  "Another tab of this app still holds your files: close or reload it, and the reset continues."
                }
              </p>
            )}
            <br />
          </div>
        </div>
      </Window>
      {askDrives && (
        <ConfirmWindow
          title="Delete Extra Drives"
          icon="warning"
          message={"Delete these " + plural(drives.length, "drive") + " and all their files? Your D: drive is kept. This cannot be undone — download a backup first."}
          details={driveLines()}
          choices={[{ label: "Yes", onSelect: deleteExtraDrives }, { label: "No" }]}
          defaultChoice="No"
          close={() => setAskDrives(false)}
        />
      )}
    </>
  );
}

export default CacheResetWindow;
