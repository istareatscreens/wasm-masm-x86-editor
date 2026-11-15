// Sharing and importing by link: what the windows call. The format, limits and checks are in shareLink.ts;
// this file reads and writes the drawer (FileSystem.js) and the page's address.
import FileSystem from "../FileSystem.js";
import { nameKey, nameProblem, parentOf, baseOf } from "../filesystem/paths";
import { bytesToBase64 } from "../filesystem/textEncoding";
import { splitDrive, driveRoot, withRoot, rootOf, letterOf, labelFor, createNewLabel, randomSuffix } from "../filesystem/drives";
import {
  SHARE_KEY, MAX_SHARE_URL, MAX_CONTAINER, canMakeLinks, makeLink, readLink, planShare, checkIncludes, dropLetters, checkLink,
  compareWithDrive, containerSize, mergeStep, reachOf, workspaceNameFrom, keepBothName, baseRoute,
} from "./shareLink";

// The desktop app (file://) has no address of its own: its links open the web app. On the web, links start with
// the page's base route.
export const isDesktop = () => typeof location !== "undefined" && location.protocol === "file:";
export const appAddress = () => (isDesktop() ? "https://masm.isas.dev/" : location.origin + baseRoute(location.pathname));

export const newWorkspaceName = () => workspaceNameFrom(crypto.getRandomValues(new Uint8Array(2)));

// --- sharing ---------------------------------------------------------------------------------------------------
// Everything the share window shows: the plan (what goes, what is left out), what the programs include, the
// unpacked size, and the link (null when there is nothing to share, or it would unpack past what an import
// takes, or it would be too long).
export async function prepareShare(targets, workspaceName, openFile) {
  if (!canMakeLinks()) return { problem: "This browser cannot make links (it has no WebAssembly)." };
  const files = FileSystem.getFileList(), folders = FileSystem.getAllFolders();
  const plan = planShare(targets, files, folders, (path) => FileSystem.getBytes(path), workspaceName, openFile);
  if (plan.problem) return { plan, problem: plan.problem };
  const driveFiles = files.filter((path) => rootOf(path) === plan.root).map((path) => splitDrive(path).rel);
  const findings = checkIncludes(plan.content, driveFiles, letterOf(plan.root));
  const content = dropLetters(plan.content, findings);
  const unpacked = containerSize(content);
  if (unpacked > MAX_CONTAINER) return { plan, findings, link: null, unpacked, problem: null };
  const link = await makeLink(appAddress(), content, MAX_SHARE_URL);
  if (!link) return { plan, findings, link: null, tooLong: true, unpacked, problem: null };
  return { plan, findings, link, length: link.length, unpacked, reach: reachOf(link.length), problem: null };
}

// --- importing -------------------------------------------------------------------------------------------------
// The text of the link in this page's address, or null.
export const fragmentLink = () => (typeof location !== "undefined" && location.hash.indexOf("#" + SHARE_KEY + "=") === 0 ? location.href : null);
// The address back to the base route once a link from it is handled (a reload never imports the link again).
export const clearFragment = () => {
  try {
    const base = baseRoute(location.pathname);
    if (location.hash || location.search || base !== location.pathname) history.replaceState(history.state, "", base);
  } catch (e) {}
};

// A link's content checked, or why it cannot be imported.
export async function checkLinkText(text) {
  const read = await readLink(text);
  if (read.problem) return { problem: read.problem };
  const link = checkLink(read.value);
  if (!link.files.length && !link.folders.length) return { link, problem: "nothing in this link can be imported" };
  return { link, label: labelFor(link.name, "shared") };
}

const driveFilesOf = (drive) => {
  const root = driveRoot(drive.id);
  return FileSystem.getFileList().filter((path) => rootOf(path) === root).map((path) => splitDrive(path).rel);
};

// The link's folders and files written on `drive` byte for byte; `only` limits the files (Merge), and `beside`
// gives a file the path Keep Both chose for it. A file is written under the spelling the drive already has for it
// (names compare in any letter case).
function writeLink(drive, link, only = null, beside = new Map()) {
  const root = driveRoot(drive.id);
  const existing = {};
  driveFilesOf(drive).forEach((rel) => (existing[nameKey(rel)] = rel));
  link.folders.forEach((folder) => FileSystem.ensureFolder(withRoot(root, folder)));
  let written = 0;
  for (const file of link.files) {
    if (only && !only.has(file.path) && !beside.has(file.path)) continue;
    const there = beside.has(file.path) ? null : existing[nameKey(file.path)];
    FileSystem.createFile(withRoot(root, beside.get(file.path) || there || file.path), bytesToBase64(file.bytes), Date.now(), false, true, file.bytes.length, !!there);
    written++;
  }
  return written;
}

// Keep Both's path for the link's `path` on `drive`, from a time and four random characters (keepBothName), drawn
// again while the name is taken there, by the link or by an earlier Keep Both; null when no name fits.
function besidePath(drive, path, now, taken) {
  const root = driveRoot(drive.id);
  const existing = FileSystem.getFileList().concat(FileSystem.getAllFolders());
  for (let tries = 0; tries < 50; tries++) {
    const random = randomSuffix(crypto.getRandomValues(new Uint8Array(16)));
    if (!random) continue;
    const candidate = keepBothName(path, now, random);
    if (!taken.has(nameKey(candidate)) && !nameProblem(baseOf(candidate), withRoot(root, parentOf(candidate)), existing)) return candidate;
  }
  return null;
}

const freshLabel = (label) => {
  for (;;) {
    const random = randomSuffix(crypto.getRandomValues(new Uint8Array(16)));
    if (random) return createNewLabel(label, new Date(), random);
  }
};

// Import one link onto a drive of its own. `ui` asks the questions (each resolves with the answer):
//   driveExists({ drive, label, comparison, batch }) -> { choice: "merge"|"replace"|"new"|"cancel", forAll }
//   fileReplace({ drive, path, existingSize, incomingSize }) -> "yes"|"yesAll"|"no"|"noAll"|"keepBoth"|"cancel"
//   confirmDriveReplace({ drive, existingCount, incomingCount }) -> true|false
// `batch` ({ choice }) carries a "do this for every remaining link" answer between links.
// Nothing is written before a choice; nothing is built or run.
export async function importLink(text, ui, { batch = null, before = () => {} } = {}) {
  const checked = await checkLinkText(text);
  if (checked.problem) return { status: "failed", reason: checked.problem, link: checked.link || null };
  const { link, label } = checked;
  const same = FileSystem.getDrives().filter((drive) => nameKey(drive.label) === nameKey(label))[0];
  if (!same) {
    before();
    const drive = FileSystem.createDrive(label);
    writeLink(drive, link);
    return { status: "created", drive, link };
  }
  const comparison = compareWithDrive(link, driveFilesOf(same), (rel) => FileSystem.getBytes(withRoot(driveRoot(same.id), rel)));
  let answer = batch && batch.choice ? { choice: batch.choice } : await ui.driveExists({ drive: same, label, comparison, link, batch: !!batch });
  if (batch && answer.forAll) batch.choice = answer.choice;
  if (answer.choice === "merge") {
    // every question first (nothing is written before the answers); Cancel writes nothing of this link
    const only = new Set(comparison.added);
    const keepBoth = [];
    let state = { all: null };
    for (const change of comparison.changed) {
      const step = mergeStep(state, state.all ? null : await ui.fileReplace({ drive: same, path: change.existing, existingSize: change.existingSize, incomingSize: change.incomingSize }));
      if (step.stop) return { status: "cancelled", drive: same, link };
      state = step.state;
      if (step.replace) only.add(change.path);
      if (step.keepBoth) keepBoth.push(change.path);
    }
    // the names Keep Both gives, from the time the merge is planned
    const now = new Date();
    const taken = new Set(link.files.map((file) => nameKey(file.path)));
    const beside = new Map();
    for (const path of keepBoth) {
      const to = besidePath(same, path, now, taken);
      if (!to) continue; // no name fits there: the drive's file stays, as with No
      taken.add(nameKey(to));
      beside.set(path, to);
    }
    before();
    FileSystem.useDrive(same.id);
    writeLink(same, link, only, beside);
    return { status: "merged", drive: FileSystem.getDrives().find((drive) => drive.id === same.id), link, written: only.size + beside.size, keptBoth: Array.from(beside.values()) };
  }
  if (answer.choice === "replace") {
    if (!(await ui.confirmDriveReplace({ drive: same, existingCount: driveFilesOf(same).length, incomingCount: link.files.length }))) return { status: "skipped", drive: same, link };
    before();
    FileSystem.useDrive(same.id);
    const root = driveRoot(same.id);
    const everything = FileSystem.getFileList().filter((path) => rootOf(path) === root);
    const folders = FileSystem.getAllFolders().filter((path) => rootOf(path) === root && splitDrive(path).rel.indexOf("/") < 0);
    FileSystem.deleteEntries(everything.concat(folders));
    writeLink(same, link);
    return { status: "replaced", drive: FileSystem.getDrives().find((drive) => drive.id === same.id), link };
  }
  if (answer.choice === "new") {
    before();
    const drive = FileSystem.createDrive(freshLabel(label));
    writeLink(drive, link);
    return { status: "created-new", drive, link };
  }
  return { status: "skipped", drive: same, link };
}

// The drawer path of the file a link opens on `drive` (its own spelling there), or "".
export const openPathOf = (result) => {
  if (!result || !result.drive || !result.link || !result.link.open) return "";
  const root = driveRoot(result.drive.id);
  const want = nameKey(withRoot(root, result.link.open));
  return FileSystem.getFileList().filter((path) => nameKey(path) === want)[0] || "";
};
