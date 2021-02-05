import React, { useRef, useState, useEffect } from "react";
import FileSystem from "../utility/FileSystem";

import newFile from "../../../../images/newFile.png";
import uploadFile from "../../../../images/uploadFile.png";
import saveFile from "../../../../images/saveFile.png";

import { postMessage } from "../../../utility/utilityFunctions.ts";

import FilenameEditableListElement from "./FilenameEditableListElement.jsx";
import { writeCommandToCMD } from "../../../utility/utilityFunctions";

const FileDrawer = React.memo(function FileDrawer({
  fileList,
  fileSelected,
  switchFile,
  createFile,
  refreshFileList,
  setEditorLock,
}) {
  const fileUploadInput = useRef(null);
  const selectAllCheckbox = useRef(null);
  const [filesSelected, setFilesSelected] = useState([]);
  //checkbox logic
  const [numberOfCheckboxsSelected, setNumberCheckboxsSelected] = useState(0);

  useEffect(() => {
    setFilesSelected(
      fileList
        .filter((filename, id) => checkIfFileIsAsm(filename)) //consider moving filter outside component
        .map((filename, id) => ({
          id: id,
          filename: filename,
          isSelected: false,
        }))
    );
  }, [fileList]);

  //New file creation function
  const handleNewFileButtonClick = () => {
    let filename = "";
    let error = "";
    do {
      //TODO: replace prompt with page popup
      filename = prompt("Please enter a filename: ", error);
      if (!/.asm$/.test(filename)) {
        filename += ".asm";
      }
      //TODO: possibly add prompt to use to allow overwritting
      error = "file already exists, please try again";
    } while (
      fileList.includes(filename) ||
      filename == error + ".asm" || //clicked ok on error message
      filename == ".asm" || //wrote just a file extension
      filename == "null.asm" //entered no input but clicked ok
    );
    createFile(filename);
  };

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
        }
      }
    );
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

    setNumberCheckboxsSelected(() => (checked ? filesSelected.length : 0));
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

    setNumberCheckboxsSelected(numberChecked);
    setFilesSelected(updatedFilesSelected);
  };

  const turnOffAllCheckboxes = () => {
    selectAllCheckbox.current.checked = false;
    setFilesSelected(
      filesSelected.map((file) => {
        file.isSelected = false;
        return file;
      })
    );
  };

  //Save file
  const saveFiles = () => {
    //handle case where Multiple files are checked
    if (numberOfCheckboxsSelected != 1 && numberOfCheckboxsSelected) {
      FileSystem.saveFiles(filesSelected.map((file) => file.filename));
    } else {
      //handle case where single file is checked
      if (numberOfCheckboxsSelected) {
        FileSystem.saveFile(
          filesSelected.filter((file) => file.isSelected)[0].filename
        );
        //handle case where no file is checked
      } else {
        FileSystem.saveFile(fileSelected);
      }
    }
  };

  //Delete files
  //Handle multiselection deletion
  const deleteFiles = () => {
    return filesSelected.filter(({ filename, isSelected }) => {
      console.log(filename, isSelected);
      if (isSelected) {
        if (fileSelected == filename) {
          return true;
        } else {
          FileSystem.deleteFile(filename);
        }
      }
      return false;
    });
  };

  const findFileByName = (cFilename) =>
    filesSelected.find(({ filename }) => cFilename == filename);

  const handleDeleteFile = () => {
    const findFileByID = (cId) => filesSelected.find(({ id }) => cId == id);

    if (numberOfCheckboxsSelected != 0) {
      if (!deleteFiles().length) {
        //delete checked files
        // if file selected to edit was not selected just refresh and finish
        refreshFileList();
        return;
      }
    }

    setEditorLock(true);
    //Handle general case
    if (
      filesSelected.length > 1 && //there is a file to switch to
      numberOfCheckboxsSelected != filesSelected.length //all files were not selected
    ) {
      console.log("IN SELECTED FILE DELETE");
      const selectedFileID = findFileByName(fileSelected).id;
      if (selectedFileID == 0) {
        switchFile(findFileByID(selectedFileID + 1).filename);
      } else {
        console.log(findFileByID(selectedFileID - 1).filename);
        switchFile(findFileByID(selectedFileID - 1).filename);
      }

      FileSystem.deleteFile(fileSelected);
      refreshFileList();
    } else {
      //Handle deleting one file
      FileSystem.deleteFile(fileSelected);
      refreshFileList(true);
    }
    setEditorLock(false);
  };

  //Handle rename
  //fix double click single click confusion

  const handleRenameFile = (filename, newFilename) => {
    //check if filename exists
    if (!findFileByName(newFilename)) {
      FileSystem.renameFile(filename, newFilename);
      //writeCommandToCMD(`echo.>${newFilename}`); //using run command rather than writing to console for greater reliability
      setTimeout(() => {
        postMessage("run-command", { data: `echo.>${newFilename}` });
      }, 4000);
      //
      refreshFileList();
      return true;
    }
    return false;
  };

  //TODO: Refactor FileDrawer Menu to its own component, change how filelists are handled to provide more efficent filtering
  //console.log({ size: fileList.length, fileList, info: "FILEDRAWER" });
  return (
    <div className="FileDrawer">
      <div className="FileDrawer__menu">
        <input
          type="checkbox"
          className="FileDrawer__menu__btn FileDrawer__selectAll"
          onClick={(event) => handleSelectAllCheckBox(event.target.checked)}
          ref={selectAllCheckbox}
        />
        <img
          className="FileDrawer__menu__btn FileDrawer__menu__btn--newFile windows--btn"
          src={newFile}
          alt="create new assembly (.asm) text file"
          onClick={handleNewFileButtonClick}
        />
        <img
          className="FileDrawer__menu__btn FileDrawer__menu__btn--loadFiles windows--btn"
          src={uploadFile}
          alt="upload file to boxedwine for use in testing"
          onClick={() => document.getElementById("uploadFilesInput").click()}
        />
        <input
          onClick={(event) => handleUploadFiles(event)}
          id="uploadFilesInput"
          ref={fileUploadInput}
          type="file"
          multiple
          style={{
            width: "0px",
            height: "0px",
            opacity: 0,
          }}
        />
        <img
          className="FileDrawer__menu__btn FileDrawer__menu__btn--saveFile windows--btn"
          src={saveFile}
          alt="save selected file(s)"
          onClick={saveFiles}
        />
        <img
          className="FileDrawer__menu__btn FileDrawer__menu__btn--loadFiles windows--btn"
          src={uploadFile}
          alt="delete selected file(s)"
          onClick={handleDeleteFile}
        />
      </div>
      <ul className="FileDrawer__list tree-view">
        {filesSelected.length
          ? filesSelected
              .filter((file) => checkIfFileIsAsm(file.filename)) //remove all non assembly files
              .map((file) => (
                <div key={file.id} className="FileDrawer__Item">
                  <input
                    type="checkbox"
                    checked={file.isSelected}
                    onChange={(event) => {
                      fileIsChecked(event.target.checked, file);
                    }}
                    className="FileDrawer__listItemCheckbox"
                  />
                  <FilenameEditableListElement
                    className={
                      file.filename == fileSelected
                        ? "FileDrawer__listItem FileDrawer__listItem--selected"
                        : "FileDrawer__listItem"
                    }
                    filename={file.filename}
                    handleRename={handleRenameFile}
                    switchFile={switchFile}
                    isFileSelected={fileSelected == file.filename}
                  />
                </div>
              ))
          : ""}
      </ul>
    </div>
  );
});

export default FileDrawer;
