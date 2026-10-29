import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import FileSystem from "../utility/FileSystem";
import { joinPath, parentOf, baseOf, isAsm, isWithin, nameProblem, folderLabel, rebase } from "../utility/filesystem/paths";
import { indexTree, buildRows, reuseRows, checkState, toggleChecked, resolveTargets, planMove, allDescendants } from "./model/tree";
import useTreeState from "./hooks/useTreeState.js";
import FileTree from "./tree/FileTree.jsx";
import FileDrawerToolbar from "./toolbar/FileDrawerToolbar.jsx";
import NameWindow from "./dialogs/NameWindow.jsx";
import ConfirmWindow from "./dialogs/ConfirmWindow.jsx";

import iconDrive from "../../../../images/drive.png";
import iconFolderClosed from "../../../../images/folderClosed.png";
import iconFolderOpen from "../../../../images/folderOpen.png";
import iconFileAsm from "../../../../images/fileAsm.png";
import iconFileText from "../../../../images/fileText.png";
import iconFileBinary from "../../../../images/fileBinary.png";

const BINARY_EXTENSIONS = /\.(exe|obj|dll|bin)$/i;
const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");

// Upload helper (as before): a File -> {fileMetaData, data: data URL}.
const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve({ fileMetaData: file, data: event.target.result });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

// The file drawer: the Windows 98 Explorer tree of D:, its toolbar and its dialogs. Every
// change goes through FileSystem (storage + the guest D: together) and then
// refreshFileList; the tree is rebuilt from storage (model/tree.ts).
const FileDrawer = function FileDrawer({ fileList, fileSelected, switchFile, createFile, refreshFileList, setEditorLock, forceUpdate, lightMode }) {
  const files = useMemo(() => fileList.filter((name) => name && name !== "/"), [fileList]);
  const index = useMemo(() => indexTree(files, FileSystem.getFolderList()), [files]);
  const [asmOnly, setAsmOnly] = useState(false);
  const [checked, setChecked] = useState(() => new Set());
  const [cut, setCut] = useState(() => new Set());
  const [renaming, setRenaming] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [showLegacyDownload, setShowLegacyDownload] = useState(false);
  const { expanded, toggle, relocate, forget, selected, setSelected, focused, setFocused } = useTreeState(fileSelected);
  const fileUploadInput = useRef(null);
  const folderUploadInput = useRef(null);
  const saveDebounce = useRef(false);
  const tree = useRef(null);
  const focusBack = useRef(null);

  // Legacy-migration affordance: only shown when browser localStorage holds legacy files.
  useEffect(() => {
    setShowLegacyDownload(FileSystem.hasLegacyFiles());
  }, [fileList]);

  const previousRows = useRef(new Map());
  const rows = useMemo(() => {
    const next = reuseRows(previousRows.current, buildRows(index, expanded, asmOnly));
    previousRows.current = new Map(next.map((row) => [row.path, row]));
    return next;
  }, [index, expanded, asmOnly]);
  const allPaths = useMemo(() => files.concat(Array.from(index.folders)), [files, index]);

  // marks of entries that no longer exist are dropped
  useEffect(() => {
    const exists = (path) => index.folders.has(path) || files.includes(path);
    setChecked((prev) => ([...prev].every(exists) ? prev : new Set([...prev].filter(exists))));
    setCut((prev) => ([...prev].every(exists) ? prev : new Set([...prev].filter(exists))));
  }, [index, files]);

  // a row's checkbox state, worked out when the row is drawn (the tree draws only the rows
  // in view)
  const checkFor = useMemo(() => {
    const states = new Map();
    return (row) => {
      if (!states.has(row.path)) states.set(row.path, checkState(row.path, row.kind, checked, index, asmOnly));
      return states.get(row.path);
    };
  }, [checked, index, asmOnly]);

  // the toolbar's select-all box mirrors the whole view (checked, partly, or not)
  const selectAll = useMemo(() => checkState("", "folder", checked, index, asmOnly), [checked, index, asmOnly]);

  // a row's icon, worked out when the row is drawn; binary or not decides a file's icon,
  // and only a file that is not .asm and has no known binary extension is sniffed
  const iconFor = useMemo(() => {
    const binary = new Map();
    return (row) => {
      if (row.kind === "root") return iconDrive;
      if (row.kind === "folder") return row.expanded ? iconFolderOpen : iconFolderClosed;
      if (isAsm(row.path)) return iconFileAsm;
      if (!binary.has(row.path)) binary.set(row.path, BINARY_EXTENSIONS.test(row.path) || FileSystem.isBinaryFile(row.path));
      return binary.get(row.path) ? iconFileBinary : iconFileText;
    };
  }, [fileList]);

  // New items go to the selected folder, else the open file's folder, else D:\.
  const targetFolder = selected !== null && (selected === "" || index.folders.has(selected)) ? selected : parentOf(fileSelected || "");

  // Everything the stable ops below need, current at each render.
  const live = useRef({});
  live.current = { index, rows, files, allPaths, checked, cut, asmOnly, fileSelected, switchFile, createFile, refreshFileList, setEditorLock, forceUpdate };

  const ops = useMemo(() => {
    const current = () => live.current;
    const rerenderEditor = () => current().forceUpdate.setRefreshFile(!current().forceUpdate.refreshFile);
    const notice = (message, details) => setDialog({ kind: "notice", message, details });
    // the entries a checkbox selection stands for, as a flat list of paths
    const checkedTargets = () => {
      const { files, folders } = resolveTargets(current().checked, current().index, current().asmOnly);
      return folders.concat(files);
    };
    const itemsFor = (path) => {
      const marked = checkedTargets();
      return marked.includes(path) || marked.some((item) => isWithin(path, item)) ? marked : [path];
    };
    // the open file follows its folder (or itself) when moved or renamed
    const follow = (from, to) => {
      const open = current().fileSelected;
      if (open && isWithin(open, from)) current().switchFile(to + open.slice(from.length));
      relocate(from, to);
      setSelected((sel) => (sel !== null && isWithin(sel, from) ? to + sel.slice(from.length) : sel));
      setFocused((foc) => (isWithin(foc, from) ? to + foc.slice(from.length) : foc));
    };
    const move = (items, target) => {
      const plan = planMove(items, target, current().index);
      if (plan.problem) return notice(plan.problem);
      FileSystem.moveEntries(plan.moves, target);
      for (const item of plan.moves) follow(item, rebase(item, item, target));
      if (target) toggle(target, true);
      setChecked(new Set());
      setCut(new Set());
      current().refreshFileList();
    };
    const doDelete = (paths) => {
      const { rows, fileSelected, setEditorLock, switchFile, refreshFileList } = current();
      const gone = (path) => paths.some((target) => isWithin(path, target));
      const deletingOpenFile = !!fileSelected && gone(fileSelected);
      let next = null;
      if (deletingOpenFile) {
        // the nearest remaining file in the tree's order (before, then after)
        const fileRows = rows.filter((row) => row.kind === "file");
        const at = fileRows.findIndex((row) => row.path === fileSelected);
        const keep = (row) => !gone(row.path);
        const before = fileRows.slice(0, Math.max(at, 0)).reverse().find(keep);
        const after = at >= 0 ? fileRows.slice(at + 1).find(keep) : null;
        next = (before || after || null) && (before || after).path;
      }
      setEditorLock(true);
      FileSystem.deleteEntries(paths);
      forget(paths);
      setChecked(new Set());
      if (deletingOpenFile) {
        if (next) switchFile(next);
        refreshFileList(!next); // nothing left to open: App picks (or creates) an .asm
      } else {
        refreshFileList();
      }
      setEditorLock(false);
      rerenderEditor();
    };
    // a selection with a folder that holds anything asks first
    const requestDelete = (paths) => {
      if (!paths.length) return;
      const { index } = current();
      const folders = paths.filter((path) => index.folders.has(path));
      const inside = folders.map((folder) => allDescendants(index, folder));
      const nested = inside.reduce((n, below) => n + below.files.length + below.folders.length, 0);
      if (!nested) return doDelete(paths);
      const fileCount = inside.reduce((n, below) => n + below.files.length, 0);
      const loose = paths.length - folders.length;
      const message =
        folders.length === 1 && !loose
          ? "Delete the folder '" + baseOf(folders[0]) + "' and the " + plural(fileCount, "file") + " in it?"
          : "Delete " + plural(folders.length, "folder") + " and the " + plural(fileCount, "file") + " in them" + (loose ? ", and " + plural(loose, "other file") : "") + "?";
      setDialog({ kind: "confirm", title: "Confirm Folder Delete", message, choices: [{ label: "Yes", onSelect: () => doDelete(paths) }, { label: "No" }] });
    };
    return {
      notice,
      activate: (row, viaKeyboard) => {
        setSelected(row.path);
        if (row.kind === "file") current().switchFile(row.path);
        else if (viaKeyboard && row.kind === "folder") toggle(row.path);
      },
      doubleActivate: (row) => {
        if (row.kind === "file") setRenaming(row.path);
        else if (row.kind === "folder") toggle(row.path);
      },
      toggle: (path, open) => toggle(path, open),
      check: (row, value) => {
        const { index, asmOnly } = current();
        if (row.kind === "root") setChecked(value ? toggleChecked("", "folder", true, new Set(), index, asmOnly) : new Set());
        else setChecked((prev) => toggleChecked(row.path, row.kind, value, prev, index, asmOnly));
      },
      selectAll: (value) => {
        const { index, asmOnly } = current();
        setChecked(value ? toggleChecked("", "folder", true, new Set(), index, asmOnly) : new Set());
      },
      renameStart: (path) => setRenaming(path),
      renameCancel: () => setRenaming(null),
      renameProblem: (path, name) => nameProblem(name, parentOf(path), current().allPaths, path),
      rename: (path, name) => {
        setRenaming(null);
        const to = joinPath(parentOf(path), name);
        FileSystem.renameEntry(path, name);
        follow(path, to);
        setChecked(new Set());
        setCut(new Set());
        current().refreshFileList();
      },
      dragItems: itemsFor,
      moveProblem: (items, target) => planMove(items, target, current().index).problem,
      move,
      cut: (row) => setCut(new Set(itemsFor(row.path))),
      clearCut: () => setCut(new Set()),
      paste: (folder) => {
        const items = Array.from(current().cut);
        if (items.length) move(items, folder);
      },
      newFile: (folder) => setDialog({ kind: "newFile", folder }),
      newFolder: (folder) => setDialog({ kind: "newFolder", folder }),
      deleteRow: (row) => {
        const marked = checkedTargets();
        requestDelete(marked.length ? marked : [row.path]);
      },
      deleteSelection: () => {
        const marked = checkedTargets();
        const open = current().fileSelected;
        requestDelete(marked.length ? marked : open ? [open] : []);
      },
      save: () => {
        const { checked, index, asmOnly, fileSelected } = current();
        const targets = resolveTargets(checked, index, asmOnly);
        if (!targets.folders.length && targets.files.length <= 1) {
          const file = targets.files[0] || fileSelected;
          if (file) FileSystem.saveFile(file);
        } else {
          FileSystem.saveEntries(targets).catch((error) => notice("The archive could not be created: " + error.message));
        }
      },
    };
  }, [toggle, relocate, forget, setSelected, setFocused]);

  const uploadFiles = async (event) => {
    const input = event.target;
    const picked = Array.from(input.files || []);
    input.value = ""; // the same file can be picked again
    const folder = targetFolder;
    const zips = picked.filter((file) => /\.zip$/i.test(file.name));
    const plain = picked.filter((file) => !/\.zip$/i.test(file.name));
    const add = async (list) => {
      if (!list.length) return;
      const open = fileSelected;
      const replacingOpen = list.some((file) => joinPath(folder, file.name.normalize("NFC")).toLowerCase() === (open || "").toLowerCase());
      FileSystem.createDataFile(await Promise.all(list.map(readAsDataUrl)), () => {
        if (folder) toggle(folder, true);
        refreshFileList(); // the uploaded files show in the drawer at once
        if (replacingOpen) {
          switchFile(open);
          live.current.forceUpdate.setRefreshFile(!live.current.forceUpdate.refreshFile);
        }
      }, folder);
    };
    await add(plain);
    // one question per archive: extract it with its folders, or keep it as a file
    const ask = (i) => {
      if (i >= zips.length) return;
      const zip = zips[i];
      setDialog({
        kind: "confirm",
        title: "Zip Archive",
        message: "'" + zip.name + "' is a zip archive. Extract it into " + folderLabel(folder) + " with its folders, or add the .zip file itself?",
        choices: [
          { label: "Extract here", onSelect: () => extract(zip, folder).then(() => ask(i + 1)) },
          { label: "Add the .zip file", onSelect: () => add([zip]).then(() => ask(i + 1)) },
          { label: "Cancel", onSelect: () => ask(i + 1) },
        ],
      });
    };
    ask(0);
  };

  const report = (what, result) => {
    refreshFileList();
    const details = result.skipped.map((skip) => skip.name + " - " + skip.reason);
    if (result.refused) ops.notice(what + " refused: " + result.refused + ".");
    else if (result.flat) ops.notice("This browser gave no folder paths, so the " + plural(result.count, "file") + " were added to " + folderLabel(targetFolder) + " without their folders. A .zip keeps folders.", details);
    else if (details.length) ops.notice(what + ": " + plural(result.count, "file") + " added, " + plural(details.length, "entry") + " skipped:", details);
  };

  const extract = (zip, folder) =>
    FileSystem.importArchive(zip, folder)
      .then((result) => {
        if (folder) toggle(folder, true);
        report("Extracting '" + zip.name + "'", result);
      })
      .catch((error) => ops.notice("'" + zip.name + "' could not be read as a zip archive (" + error.message + ")."));

  const importFolder = (event) => {
    const input = event.target;
    const picked = Array.from(input.files || []);
    input.value = "";
    if (!picked.length) return;
    const folder = targetFolder;
    FileSystem.importDirectoryFiles(picked, folder)
      .then((result) => {
        if (folder) toggle(folder, true);
        report("Importing the folder", result);
      })
      .catch((error) => ops.notice("The folder could not be imported (" + error.message + ")."));
  };

  const save = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (saveDebounce.current) return;
    saveDebounce.current = true;
    setTimeout(() => {
      saveDebounce.current = false;
    }, 500);
    ops.save();
  };

  // A dialog hands the focus back when it closes: to the control that had it when the
  // dialog opened or, when that was a tree row, to the tree's tab stop (the row may be
  // gone). A layout effect, so it runs before the dialog's own effect focuses it.
  useLayoutEffect(() => {
    if (dialog) {
      if (!focusBack.current) {
        const active = document.activeElement;
        focusBack.current = { element: active, inTree: !!(active && active.closest && active.closest('[role="tree"]')) };
      }
      return;
    }
    const back = focusBack.current;
    focusBack.current = null;
    if (!back || (document.activeElement && document.activeElement !== document.body)) return;
    if (back.inTree) {
      if (tree.current) tree.current.focus();
    } else if (back.element && back.element !== document.body && back.element.isConnected) back.element.focus();
  }, [dialog]);

  const closeDialog = () => setDialog(null);
  const assemblyName = (name) => (isAsm(name) ? name : name + ".asm"); // a name typed without .asm gets it

  return (
    <>
      {dialog && dialog.kind === "newFile" && (
        <NameWindow
          title={"Create file in " + folderLabel(dialog.folder)}
          label="create file(s)"
          problemFor={(name) => nameProblem(assemblyName(name), dialog.folder, allPaths)}
          onCreate={(name) => {
            if (dialog.folder) toggle(dialog.folder, true);
            createFile(joinPath(dialog.folder, assemblyName(name)));
          }}
          close={closeDialog}
        />
      )}
      {dialog && dialog.kind === "newFolder" && (
        <NameWindow
          title={"Create folder in " + folderLabel(dialog.folder)}
          label="create folder"
          problemFor={(name) => nameProblem(name, dialog.folder, allPaths)}
          onCreate={(name) => {
            const path = joinPath(dialog.folder, name);
            FileSystem.createFolder(path);
            if (dialog.folder) toggle(dialog.folder, true);
            setSelected(path);
            setFocused(path);
            refreshFileList();
          }}
          close={closeDialog}
        />
      )}
      {dialog && dialog.kind === "confirm" && <ConfirmWindow title={dialog.title} message={dialog.message} choices={dialog.choices} close={closeDialog} />}
      {dialog && dialog.kind === "notice" && <ConfirmWindow title="File Drawer" message={dialog.message} details={dialog.details} choices={[{ label: "OK" }]} close={closeDialog} />}
      <FileDrawerToolbar
        fileUploadInput={fileUploadInput}
        folderUploadInput={folderUploadInput}
        selectAll={selectAll}
        onSelectAll={ops.selectAll}
        onNewFile={() => ops.newFile(targetFolder)}
        onNewFolder={() => ops.newFolder(targetFolder)}
        onUploadFiles={uploadFiles}
        onImportFolder={importFolder}
        onSave={save}
        onDelete={ops.deleteSelection}
        asmOnly={asmOnly}
        onAsmOnly={setAsmOnly}
        showLegacyDownload={showLegacyDownload}
        onDownloadLegacy={() => FileSystem.downloadLegacyFiles()}
      />
      <FileTree
        ref={tree}
        rows={rows}
        iconFor={iconFor}
        checkFor={checkFor}
        openFile={fileSelected}
        selected={selected}
        focused={focused}
        setFocused={setFocused}
        cut={cut}
        renaming={renaming}
        lightMode={lightMode}
        ops={ops}
      />
    </>
  );
};

export default FileDrawer;
