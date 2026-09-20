import React, { useRef, useState, useEffect, useCallback } from "react";
import FilenameEditableListElement from "./FilenameEditableListElement.jsx";
import { attachRetroScrollbars } from "../../common/retroScrollbars.js";

import CreateFileWindow from "./CreateFileWindow.jsx";

import FileDrawerMenu from "./FileDrawerMenu.jsx";

import FileSystem from "../utility/FileSystem";
import {
  writeCommandToCMD,
  checkFileExtension,
} from "../../../utility/utilityFunctions";

//TODO: REFACTOR CODE move things to seperate components
const FileDrawer = function FileDrawer({
  fileList,
  fileSelected,
  switchFile,
  createFile,
  refreshFileList,
  setEditorLock,
  forceUpdate,
  //theme
  lightMode,
}) {
  const [filesSelected, setFilesSelected] = useState([]);
  const scrollHost = useRef(null);
  const scrollSurface = useRef(null);
  useEffect(() => {
    const controls = attachRetroScrollbars(
      scrollSurface.current,
      scrollHost.current,
      "Files",
    );
    return () => controls.destroy();
  }, []);
  //checkbox logic: the count is derived from the rows of the CURRENT view, never kept
  //separately (a separate counter went stale after a checkbox-delete and made every
  //later delete with no checkbox a no-op)
  const numberOfCheckboxesSelected = filesSelected.filter(
    (file) => file.isSelected,
  ).length;
  const saveDebounceRef = useRef(false);
  const [showAsm, setShowAsm] = useState(true);
  const [showCreateFile, setShowCreateFile] = useState(false);
  // Legacy-migration affordance: only show the "download legacy files" button
  // if the user actually has files in browser localStorage.
  const [showLegacyDownload, setShowLegacyDownload] = useState(false);

  useEffect(() => {
    setShowLegacyDownload(FileSystem.hasLegacyFiles());
  }, [fileList]);

  const handleDownloadLegacy = useCallback(() => {
    FileSystem.downloadLegacyFiles();
  }, []);

  //TODO: rename these to have ref prefix for consistancy
  const selectAllCheckbox = useRef(null);
  const fileUploadInput = useRef(null);

  useEffect(() => {
    setFilesSelected(
      fileList
        .filter((filename) => {
          const isAsm = checkFileExtension(".asm", filename);
          return showAsm ? isAsm : !isAsm; //filter depending on mode
        })
        .map((filename, id) => ({
          id: id,
          filename: filename,
          isSelected: false,
        })),
    );
    if (selectAllCheckbox.current) selectAllCheckbox.current.checked = false;
  }, [fileList, showAsm]);

  //File Upload functions
  const processFile = (file) => {
    return () =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({ fileMetaData: file, data: event.target.result });
          //localStorage.setItem(name, event.target.result);
        };
        reader.readAsDataURL(file);
      });
  };

  const handleUploadFiles = async function (event) {
    let fileList = [];
    let isCurrentSelectedFile = false;
    for (const file of event.target.files) {
      fileList.push(processFile(file)); //pushes functions to list
      console.log(file);
      if (file.name == fileSelected) {
        isCurrentSelectedFile = true;
      }
    }
    FileSystem.createDataFile(
      await Promise.all(fileList.map((getFile) => getFile())),
      () => {
        refreshFileList(); // the uploaded files show in the drawer at once
        if (isCurrentSelectedFile) {
          switchFile(fileSelected);
          console.log({
            fileUploadInput,
            current: fileUploadInput.current,
            value: fileUploadInput.current.value,
          });
          fileUploadInput.current.value = "";
          rerenderEditor();
        }
      },
    );
  };

  const rerenderEditor = () => {
    forceUpdate.setRefreshFile(!forceUpdate.refreshFile); //refresh editor by flipping boolean
  };

  //Filter function
  const checkIfFileIsAsm = (filename) => {
    return /.asm$/.test(filename);
  };

  //Checkbox logic
  const handleSelectAllCheckBox = (checked) => {
    setFilesSelected(
      filesSelected.map((file) => ({ ...file, isSelected: checked })),
    );
  };

  const fileIsChecked = (checked, file) => {
    const updatedFilesSelected = filesSelected.map((cFile) =>
      file.id == cFile.id ? { ...cFile, isSelected: checked } : cFile,
    );
    const numberChecked = updatedFilesSelected.filter(
      (cFile) => cFile.isSelected,
    ).length;
    if (selectAllCheckbox.current) {
      selectAllCheckbox.current.checked =
        numberChecked == updatedFilesSelected.length && checked;
    }
    setFilesSelected(updatedFilesSelected);
  };

  const turnOffAllCheckboxes = () => {
    setFilesSelected(
      filesSelected.map((file) => ({ ...file, isSelected: false })),
    );
    if (selectAllCheckbox.current) selectAllCheckbox.current.checked = false;
  };

  //Save file
  const saveFiles = useCallback(
    (event) => {
      // Prevent event propagation and default behavior
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Debounce: prevent rapid clicks
      if (saveDebounceRef.current) return;

      saveDebounceRef.current = true;
      setTimeout(() => {
        saveDebounceRef.current = false;
      }, 500);

      //handle case where Multiple files are checked
      if (numberOfCheckboxesSelected > 1) {
        // Filter to only selected files
        const selectedFiles = filesSelected
          .filter((file) => file.isSelected)
          .map((file) => file.filename);
        FileSystem.saveFiles(selectedFiles);
      } else if (numberOfCheckboxesSelected === 1) {
        //handle case where single file is checked
        const singleFile = filesSelected.filter((file) => file.isSelected)[0]
          .filename;
        FileSystem.saveFile(singleFile);
      } else {
        //handle case where no file is checked
        FileSystem.saveFile(fileSelected);
      }
    },
    [numberOfCheckboxesSelected, filesSelected, fileSelected],
  );

  //Delete files. What gets deleted: the checked rows of the current view; with nothing
  //checked, the file that is open (asm in the editor or a binary in the hex viewer) -
  //whichever view it belongs to. When the open file goes, the editor moves to its
  //nearest remaining neighbour in the view, else to the first remaining .asm (App
  //creates test.asm when none is left). Storage + guest D: are updated together
  //(FileSystem.deleteFiles -> bwDeleteFile), then the list is refreshed at once.
  const findFileByName = (cFilename) =>
    filesSelected.find(({ filename }) => cFilename == filename);

  const handleDeleteFile = () => {
    const checked = filesSelected
      .filter((file) => file.isSelected)
      .map((file) => file.filename);
    const targets = checked.length
      ? checked
      : fileSelected
        ? [fileSelected]
        : [];
    if (!targets.length) return;
    const deletingOpenFile = targets.includes(fileSelected);
    let next = null;
    if (deletingOpenFile) {
      const idx = filesSelected.findIndex(
        ({ filename }) => filename == fileSelected,
      );
      const keep = (file) => !targets.includes(file.filename);
      const before = filesSelected
        .slice(0, Math.max(idx, 0))
        .reverse()
        .find(keep);
      const after = filesSelected.slice(idx + 1).find(keep);
      next = (before || after || null) && (before || after).filename;
    }
    setEditorLock(true);
    FileSystem.queueFilesToDelete(...targets);
    FileSystem.deleteFiles();
    turnOffAllCheckboxes();
    if (deletingOpenFile) {
      if (next) switchFile(next);
      refreshFileList(!next); //no neighbour in this view: App picks/creates an .asm
    } else {
      refreshFileList();
    }
    setEditorLock(false);
    rerenderEditor();
  };

  //Handle rename
  //fix double click single click confusion
  const handleRenameFile = (filename, newFilename) => {
    //check if filename exists
    if (!findFileByName(newFilename)) {
      const renamingSelected = filename == fileSelected; //check if file being renamed is one selected
      FileSystem.renameFile(filename, newFilename); // renames in the guest too (bwRenameFile), no keystrokes
      if (renamingSelected) {
        switchFile(newFilename);
      }
      refreshFileList();

      return true;
    }
    return false;
  };

  //Handle file view change
  const switchFileView = (event) => {
    const switchStatus = !event.target.checked;
    const result = fileList.find((file) => {
      const isAsm = checkFileExtension(".asm", file);
      switchStatus ? isAsm : !isAsm;
    });

    //doesnt work but doesnt break anything
    if (result) {
      //not undefined
      switchFile(result);
    }
    //no file to switch to stay on current asm file
    setShowAsm(switchStatus);
  };

  //TODO: Refactor FileDrawer Menu to its own component, change how filelists are handled to provide more efficent filtering
  return (
    <>
      {showCreateFile ? (
        <CreateFileWindow
          closeFileWindow={() => setShowCreateFile(false)}
          createFile={createFile}
          fileList={fileList}
        />
      ) : (
        ""
      )}
      <FileDrawerMenu
        fileUploadInput={fileUploadInput}
        selectAllCheckbox={selectAllCheckbox}
        handleSelectAllCheckBox={handleSelectAllCheckBox}
        handleNewFileButtonClick={() => {
          setShowCreateFile(!showCreateFile);
        }}
        handleUploadFiles={handleUploadFiles}
        saveFiles={saveFiles}
        handleDeleteFile={handleDeleteFile}
        switchFileView={switchFileView}
        showLegacyDownload={showLegacyDownload}
        handleDownloadLegacy={handleDownloadLegacy}
      />
      <div className="file-drawer-scroll retro-scroll-host" ref={scrollHost}>
        <ul
          ref={scrollSurface}
          className={`file-drawer__list tree-view ${
            lightMode ? "" : "file-drawer__list--dark"
          }`}
        >
          {filesSelected.length
            ? filesSelected
                //.filter((file) => checkIfFileIsAsm(file.filename)) //remove all non assembly files
                .map((file) => (
                  <li
                    key={file.id}
                    className={`file-drawer__list__group ${
                      lightMode ? "" : "file-drawer__list__group--dark"
                    } `}
                  >
                    <input
                      label=""
                      type="checkbox"
                      checked={file.isSelected}
                      onChange={(event) => {
                        fileIsChecked(event.target.checked, file);
                      }}
                      className={"checkbox"}
                    />
                    <FilenameEditableListElement
                      filename={file.filename}
                      handleRename={handleRenameFile}
                      switchFile={switchFile}
                      isFileSelected={fileSelected == file.filename}
                      lightMode={lightMode}
                    />
                  </li>
                ))
            : ""}
        </ul>
      </div>
    </>
  );
};

export default FileDrawer;
