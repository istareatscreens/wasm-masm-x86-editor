import React, { useEffect, useRef, useState } from "react";

import Window from "../../common/Window.jsx";
import GroupBox from "../../common/GroupBox.jsx";
import ListBox from "../../common/ListBox.jsx";
import RetroTextArea from "../../common/RetroTextArea.jsx";
import iconShare from "../../../../images/shareLink32.png";
import { plural, fileSize } from "./format.js";
import { guestPath, folderLabel } from "../utility/filesystem/paths";
import {
  withRoot,
  rootOf,
  driveRoot,
  normalizeLabel,
  labelProblem,
} from "../utility/filesystem/drives";
import {
  prepareShare,
  newWorkspaceName,
} from "../utility/share/ShareService.js";
import { MAX_SHARE_URL, MAX_CONTAINER } from "../utility/share/shareLink";
import { loadBrotli } from "../utility/share/brotli";

const REACH = {
  chat: "It fits a chat message almost anywhere (Discord allows 2,000 characters).",
  email: "It fits an email, Slack (40,000 characters) and any browser.",
  browser:
    "Only browsers open a link this long: send it by email or a file, or send a .zip download instead.",
  notFirefox: (
    <>
      Chrome, Edge and Safari open a link this long, but{" "}
      <b>Firefox cannot open it</b>: in Firefox, paste it into Import by URL.
      Send it by email or a file, or send a .zip download instead.
    </>
  ),
};
const MIB = 1048576;
// an unpacked size past the limit, never shown as the limit itself
const unpackedText = (bytes) => {
  const shown = (bytes / MIB).toFixed(1);
  return shown === (MAX_CONTAINER / MIB).toFixed(1) ? "just over " + MAX_CONTAINER / MIB + " MiB" : shown + " MiB";
};

// What an INCLUDE line found, for the window.
const FINDING = {
  letter: (f, root) =>
    "the link's copy reads " +
    f.argument.slice(2) +
    " instead of " +
    f.argument +
    ", so it is found on the drive the program is built on",
  outside: (f, root) =>
    "needs " + guestPath(withRoot(root, f.target)) + ", which is not shared",
  missing: () =>
    "names a file the drawer does not have (fine if the program does not need it)",
};

// Share by URL: what the link holds, what is left out, what the programs include, and the link itself.
// targets: { files, folders } (drawer paths, the download button's selection).
function ShareWindow({
  targets: initialTargets,
  drives,
  workspaceName,
  setWorkspaceName,
  openFile,
  close,
}) {
  const [targets, setTargets] = useState(initialTargets);
  const [state, setState] = useState(null);
  // The link's name, the label of the drive it makes: the shared drive's own label. D: has none, so its links
  // carry the workspace name, made at its first share and kept for the next.
  const [sharedRoot] = useState(() =>
    rootOf(initialTargets.files.concat(initialTargets.folders)[0] || ""),
  );
  const [name, setName] = useState(() => {
    const drive = sharedRoot
      ? drives.find((d) => driveRoot(d.id) === sharedRoot)
      : null;
    return drive ? drive.label : workspaceName || newWorkspaceName();
  });
  const [nameText, setNameText] = useState(name);
  const [copied, setCopied] = useState("");
  const linkBox = useRef(null);

  useEffect(() => {
    if (!sharedRoot && name !== workspaceName) setWorkspaceName(name);
  }, [name]);

  // the Brotli module, while the window shows what the link will hold
  useEffect(() => {
    loadBrotli().catch(() => {});
  }, []);

  useEffect(() => {
    let current = true;
    setState(null);
    setCopied("");
    prepareShare(targets, name, openFile).then(
      (result) => current && setState(result),
      (error) =>
        current &&
        setState({
          problem: "The link could not be made (" + error.message + ").",
        }),
    );
    return () => {
      current = false;
    };
  }, [targets, name]);

  const nameProblem = labelProblem(normalizeLabel(nameText));
  const commitName = () => {
    const next = normalizeLabel(nameText);
    if (labelProblem(next)) return;
    setNameText(next);
    setName(next);
  };

  const copy = async () => {
    if (!state || !state.link) return;
    try {
      await navigator.clipboard.writeText(state.link);
      setCopied("The link is copied.");
    } catch (error) {
      // no clipboard access: the link is selected for Ctrl+C
      if (linkBox.current) {
        linkBox.current.focus();
        linkBox.current.select();
      }
      setCopied("Press Ctrl+C to copy the selected link.");
    }
  };

  const plan = state && state.plan;
  const root = plan ? plan.root : "";
  const findings =
    state && state.findings
      ? state.findings.filter(
          (f) => f.kind !== "shared" && f.kind !== "toolchain",
        )
      : [];
  const addToShare = (path) =>
    setTargets((t) => ({ files: t.files.concat([path]), folders: t.folders }));

  return (
    <Window
      onClose={close}
      className="window__share"
      title="Share by URL"
      width="56rem"
      footer={
        <div className="window__confirm__buttons">
          <button
            type="button"
            className="btn btn--text window__confirm__btn"
            disabled={!state || !state.link}
            onClick={copy}
          >
            Copy link
          </button>
          <button
            type="button"
            className="btn btn--text window__confirm__btn"
            onClick={close}
          >
            Close
          </button>
        </div>
      }
    >
      <div className="window__dialog">
        <img
          className="window__dialog__icon"
          src={iconShare}
          alt=""
          width={32}
          height={32}
        />
        <div className="window__dialog__content">
          <p>
            <b>Anyone with this link can read these files.</b> Nothing is
            uploaded: the files travel inside the link itself.
          </p>
          <label className="window__share__name">
            <span>Workspace name:</span>
            <input
              type="text"
              className="input-box"
              value={nameText}
              aria-invalid={!!nameProblem}
              title={
                nameProblem ||
                "the label of the drive people who open the link get"
              }
              onChange={(event) => setNameText(event.target.value)}
              onBlur={commitName}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitName();
                }
              }}
            />
          </label>
          <p className="window__name-problem" aria-live="polite">
            {nameProblem
              ? nameProblem
              : normalizeLabel(nameText) !== nameText.trim()
                ? "Spaces become underscores: " + normalizeLabel(nameText)
                : " "}
          </p>
          {!state && <p>Making the link…</p>}
          {state && state.problem && (
            <p className="window__problem">{state.problem}</p>
          )}
          {plan && !plan.problem && (
            <GroupBox caption="Files in the link">
              <p>
                From {folderLabel(root)}:{" "}
                {plural(plan.content.files.length, "file")}
                {plan.content.folders.length
                  ? " and " +
                    plural(plan.content.folders.length, "empty folder")
                  : ""}
                .
              </p>
              <ListBox
                label="Files in the link"
                className="window__list"
                items={plan.drawerPaths.map(
                  (path, i) =>
                    guestPath(path) +
                    " (" +
                    fileSize(plan.content.files[i].bytes.length) +
                    ")",
                )}
              />
              {plan.left.length > 0 && (
                <>
                  <p>Left out:</p>
                  <ListBox
                    label="Left out"
                    className="window__list"
                    items={plan.left.map(
                      (item) => guestPath(item.path) + ": " + item.reason,
                    )}
                  />
                </>
              )}
            </GroupBox>
          )}
          {findings.length > 0 && (
            <GroupBox caption="What the programs include">
              {findings.map((f, i) => (
                <p key={i}>
                  {guestPath(withRoot(root, f.file))}, line {f.line}:{" "}
                  {f.directive} {f.argument}: {FINDING[f.kind](f, root)}
                  {f.kind === "outside" && (
                    <>
                      {" "}
                      <button
                        type="button"
                        className="btn btn--text window__share__add"
                        onClick={() => addToShare(withRoot(root, f.target))}
                      >
                        Add to share
                      </button>
                    </>
                  )}
                </p>
              ))}
            </GroupBox>
          )}
          {state && state.link && (
            <GroupBox caption="Link">
              <RetroTextArea
                ref={linkBox}
                label="the link"
                className="window__share__link"
                readOnly
                value={state.link}
                rows={4}
                onFocus={(event) => event.target.select()}
              />
              <p>
                {plural(state.length, "character")}. {REACH[state.reach]}{" "}
                <span aria-live="polite">{copied}</span>
              </p>
            </GroupBox>
          )}
          {state && !state.problem && state.unpacked > MAX_CONTAINER && (
            <p className="window__problem">
              These files unpack to {unpackedText(state.unpacked)}; a link can
              carry at most {MAX_CONTAINER / MIB} MiB. Send them as a .zip
              instead: the file explorer's "Save selected file(s)" button.
            </p>
          )}
          {state && !state.problem && state.tooLong && (
            <p className="window__problem">
              This link would be longer than{" "}
              {MAX_SHARE_URL.toLocaleString("en-US")} characters, the most a
              link may have. Send these files as a .zip instead: the file
              explorer's "Save selected file(s)" button.
            </p>
          )}
        </div>
      </div>
    </Window>
  );
}

export default ShareWindow;
