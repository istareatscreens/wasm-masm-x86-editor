import React, { useMemo, useRef, useState } from "react";

import ConfirmWindow from "../filedrawer/dialogs/ConfirmWindow.jsx";
import { guestPath, isAsm } from "../utility/filesystem/paths";
import { driveName, driveRoot, withRoot } from "../utility/filesystem/drives";
import iconFileAsm from "../../../../images/fileAsm.png";
import iconFileText from "../../../../images/fileText.png";
import iconFileBinary from "../../../../images/fileBinary.png";
import { plural } from "./format.js";

const bytes = (n) => plural(n, "byte");
// the drawer's binary icon for the toolchain's outputs and other binary names (links carry every file)
const BINARY_NAME = /\.(exe|obj|dll|bin|lib|res)$/i;
// "1 new file, 2 changed files and 3 unchanged files"
const listed = (parts) => (parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] : parts[0] || "no files");

// The questions an import asks (ShareService.importLink's `ui`), one window at a time, as Windows asks them.
// Each resolves with the answer; the title bar's X and Escape answer Cancel (No for the Replace confirmation).
export default function useImportQuestions() {
  const [question, setQuestion] = useState(null);
  const [forAll, setForAll] = useState(false);
  const live = useRef(null);
  const ui = useMemo(() => {
    const ask = (kind, info) =>
      new Promise((resolve) => {
        live.current = resolve;
        setForAll(false);
        setQuestion({ kind, info });
      });
    return {
      driveExists: (info) => ask("driveExists", info),
      fileReplace: (info) => ask("fileReplace", info),
      confirmDriveReplace: (info) => ask("confirmDriveReplace", info),
    };
  }, []);
  const answer = (value) => {
    const resolve = live.current;
    live.current = null;
    setQuestion(null);
    if (resolve) resolve(value);
  };

  let element = null;
  if (question && question.kind === "driveExists") {
    const { drive, label, comparison, batch } = question.info;
    const counts = [[comparison.added, "new file"], [comparison.changed, "changed file"], [comparison.same, "unchanged file"]]
      .filter(([files]) => files.length)
      .map(([files, word]) => plural(files.length, word));
    const only = comparison.driveOnly.length;
    const pick = (choice) => () => answer({ choice, forAll });
    element = (
      <ConfirmWindow
        title="Drive Already Exists"
        icon="question"
        message={[
          "The drive " + driveName(drive) + " already holds a link from " + label + ".",
          "This link has " + listed(counts) + "." + (only ? " " + plural(only, "file") + (only === 1 ? " is" : " are") + " only on the drive." : ""),
          "Merge adds the new files and asks before replacing each changed one. Replace deletes the drive's files first. Create new puts the link on a new drive.",
        ]}
        option={batch ? { label: "Do this for every remaining link whose drive exists", checked: forAll, onChange: setForAll } : null}
        choices={[{ label: "Merge", onSelect: pick("merge") }, { label: "Replace", onSelect: pick("replace") }, { label: "Create new", onSelect: pick("new") }, { label: "Cancel", onSelect: pick("cancel") }]}
        close={() => {}}
        dismiss={() => answer({ choice: "cancel", forAll: false })}
      />
    );
  } else if (question && question.kind === "fileReplace") {
    const { drive, path, existingSize, incomingSize } = question.info;
    const file = (size) => (
      <span className="window__confirm__file">
        <img src={isAsm(path) ? iconFileAsm : BINARY_NAME.test(path) ? iconFileBinary : iconFileText} alt="" width={16} height={16} />
        {bytes(size)}
      </span>
    );
    element = (
      <ConfirmWindow
        title="Confirm File Replace"
        icon="question"
        message={[
          "This drive already contains a file named '" + guestPath(withRoot(driveRoot(drive.id), path)) + "'.",
          <>
            Would you like to replace the existing file
            {file(existingSize)}
            with the link's?
            {file(incomingSize)}
          </>,
        ]}
        choices={[["Yes", "No", "Keep Both"], ["Yes to All", "No to All"], ["Cancel"]].map((group) =>
          group.map((label) => ({
            label,
            onSelect: () => answer({ Yes: "yes", No: "no", "Keep Both": "keepBoth", "Yes to All": "yesAll", "No to All": "noAll", Cancel: "cancel" }[label]),
          })),
        )}
        defaultChoice="No"
        close={() => {}}
        dismiss={() => answer("cancel")}
      />
    );
  } else if (question && question.kind === "confirmDriveReplace") {
    const { drive, existingCount, incomingCount } = question.info;
    element = (
      <ConfirmWindow
        title="Confirm Drive Replace"
        icon="warning"
        message={"Delete the " + plural(existingCount, "file") + " on " + driveName(drive) + " and put the link's " + plural(incomingCount, "file") + " there instead?"}
        choices={[{ label: "Yes", onSelect: () => answer(true) }, { label: "No", onSelect: () => answer(false) }]}
        close={() => {}}
        dismiss={() => answer(false)}
      />
    );
  }
  return { ui, element };
}
