import React, { useRef, useState, useEffect, useCallback } from "react";
import FilenameEditableListElement from "./FilenameEditableListElement.jsx";

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
  //checkbox logic
  const [numberOfCheckboxesSelected, setNumberCheckboxesSelected] = useState(0);
  const saveDebounceRef = useRef(false);
  const [showAsm, setShowAsm] = useState(true);
  const [showCreateFile, setShowCreateFile] = useState(false);

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
        }))
    );
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
      }
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
    const filesSelectedUpdate = filesSelected.map((file) => {
      file.isSelected = checked;
      return file;
    });

    setNumberCheckboxesSelected(() => (checked ? filesSelected.length : 0));
    setFilesSelected(filesSelectedUpdate);
  };

  const fileIsChecked = (checked, file) => {
    let numberChecked = filesSelected.length;
    const updatedFilesSelected = filesSelected.map((cFile) => {
      if (!cFile.isSelected) {
        numberChecked--;
      }
      if (file.id == cFile.id) {
        cFile.isSelected = checked;
        if (checked) {
          numberChecked++;
        }
      }
      return cFile;
    });

    if (numberChecked == filesSelected.length && checked) {
      selectAllCheckbox.current.checked = true;
    } else {
      selectAllCheckbox.current.checked = false;
    }

    setNumberCheckboxesSelected(numberChecked);
    setFilesSelected(updatedFilesSelected);
  };

  const turnOffAllCheckboxes = () => {
    setFilesSelected(
      filesSelected.map((file) => {
        file.isSelected = false;
        return file;
      })
    );
    selectAllCheckbox.current.checked = false;
    setNumberCheckboxesSelected(0);
  };

  //Save file
  const saveFiles = useCallback((event) => {
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
      const singleFile = filesSelected.filter((file) => file.isSelected)[0].filename;
      FileSystem.saveFile(singleFile);
    } else {
      //handle case where no file is checked
      FileSystem.saveFile(fileSelected);
    }
  }, [numberOfCheckboxesSelected, filesSelected, fileSelected]);

  //Delete files
  //Handle multiselection deletion
  const deleteFiles = () => {
    return filesSelected.filter(({ filename, isSelected }) => {
      if (isSelected) {
        if (fileSelected == filename) {
          return true;
        } else {
          FileSystem.queueFilesToDelete(filename);
        }
      }
      return false;
    });
  };

  const findFileByName = (cFilename) =>
    filesSelected.find(({ filename }) => cFilename == filename);

  const handleDeleteFile = () => {
    const findFileByID = (cId) => filesSelected.find(({ id }) => cId == id);
    if (numberOfCheckboxesSelected != 0 && !deleteFiles().length) {
      if (!deleteFiles().length) {
        //delete checked files
        // if file selected to edit was not selected just refresh and finish
        FileSystem.deleteFiles();
        refreshFileList();
        return;
      }
    }

    setEditorLock(true);
    //Handle general case
    if (
      filesSelected.length > 1 && //there is a file to switch to
      numberOfCheckboxesSelected != filesSelected.length //all files were not selected
    ) {
      const selectedFileID = findFileByName(fileSelected).id;
      if (selectedFileID == 0) {
        switchFile(findFileByID(selectedFileID + 1).filename);
      } else {
        switchFile(findFileByID(selectedFileID - 1).filename);
      }

      FileSystem.queueFilesToDelete(fileSelected);
      FileSystem.deleteFiles();
      refreshFileList(true);
    } else {
      //Handle deleting one file
      FileSystem.queueFilesToDelete(fileSelected);
      FileSystem.deleteFiles();
      refreshFileList(true);
    }

    turnOffAllCheckboxes();
    setEditorLock(false); //TODO: this probably doesnt work either fix it or remove it
    rerenderEditor();
  };

  //Handle rename
  //fix double click single click confusion
  const handleRenameFile = (filename, newFilename) => {
    //check if filename exists
    if (!findFileByName(newFilename)) {
      const renamingSelected = filename == fileSelected; //check if file being renamed is one selected
      FileSystem.renameFile(filename, newFilename);
      writeCommandToCMD(`echo.>${newFilename}`); //using run command rather than writing to console for greater reliability
      /*
      setTimeout(() => {
        postMessage("run-command", { data: `echo.>${newFilename}` });
      }, 4000);
      //
      */
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
      />
      <ul
        className={`file-drawer__list tree-view ${lightMode ? "" : "file-drawer__list--dark"
          }`}
      >
        {filesSelected.length
          ? filesSelected
            //.filter((file) => checkIfFileIsAsm(file.filename)) //remove all non assembly files
            .map((file) => (
              <li
                key={file.id}
                className={`file-drawer__list__group ${lightMode ? "" : "file-drawer__list__group--dark"
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
    </>
  );
};

export default FileDrawer;
