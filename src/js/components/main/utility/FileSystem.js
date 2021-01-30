import { Inode, fromBuffer } from "./inode";
import { Buffer } from "buffer";
import { generateRandomID } from "../../../utility/utilityFunctions.ts";
import * as hf from "./FSHelperFunctions.js";

import { crlf } from "eol";

import {
  writeCommandToCMD,
  postMessage,
} from "../../../utility/utilityFunctions.ts";

//Helper functions:
export default class FileSystem {
  static locked = false;
  static fileListKey = "";

  static init(callback) {
    //check to see if local storage was loaded
    FileSystem.checkIfLocalStorageInitiated(callback);
  }

  static checkIfLocalStorageInitiated(callback) {
    const initiateFileSystem = (callback) => {
      FileSystem._readFileListKey();
      callback(true);
      window.addEventListener("storage", () => callback());
    };

    if (hf.getFromLocalStorage("/") == null) {
      const waitForKeys = () =>
        setTimeout(() => {
          if (hf.getFromLocalStorage("/") == null) {
            clearTimeout(waitForKeys);
            waitForKeys();
          } else {
            initiateFileSystem(callback);
          }
        }, 100);
      waitForKeys();
    } else {
      initiateFileSystem(callback);
    }
  }

  //reads file list
  static _readFileList() {
    return JSON.parse(atob(hf.getFromLocalStorage(FileSystem.fileListKey)));
  }

  //Gets file list key
  static _readFileListKey() {
    FileSystem.fileListKey = hf.decodeFileMetaData(
      hf.getFromLocalStorage("/")
    ).id;
  }

  //gets all stored files
  static getFileList() {
    return Object.keys(FileSystem._readFileList());
  }

  //gets data from file
  static getFileMetaData(filename) {
    return hf.getFileMetaData(FileSystem._readFileList()[filename]);
  }

  static getFileData(filename) {
    return hf.getFileData(
      hf.getFileMetaData(FileSystem._readFileList()[filename]).id
    );
  }
  /**
   * @description finds file in local storage and replaces its text
   * @param {string} fileName name of assembly file exlcuding the .asm filename suffix
   * @param {string?} text text to be written to the file
   * @returns void
   * @Example writeToAssemblyFile("file", "assembly code here")
   */
  static writeToFile(filename, text) {
    //get data
    const fileMetaDataKey = FileSystem._readFileList()[filename];
    const fileMetaData = hf.getFileMetaData(fileMetaDataKey);

    //Append changes
    fileMetaData.size = text.length;

    //save file
    hf.setInLocalStorage(fileMetaDataKey, fileMetaData, hf.encodeFileMetaData); //meta data
    hf.setInLocalStorage(fileMetaData.id, text, hf.encodeFileData); //file data
  }

  static createDataFile(files, callback) {
    console.log("in create DATA FILE");
    console.log(files);

    const command = files
      .map((file) => {
        const { fileMetaData, data } = file;
        const { name, size, type, lastModified } = fileMetaData;
        data = data.split(",").pop(); //remove MIME
        let isEncoded = true;
        if (/.(asm|text|txt)$/.test(name)) {
          data = crlf(atob(data)); //convert end of line (eol) to dos/win32 compatiable crlf
          size = data.length;
          isEncoded = false;
        }

        const isDuplicate = name in FileSystem._readFileList();

        FileSystem.createFile(
          name,
          data,
          lastModified,
          true,
          isEncoded,
          size,
          isDuplicate
        );

        if (isDuplicate) {
          return "";
        }

        return ` echo.>${name} &`;
      })
      .join("");

    if (!command == "") {
      writeCommandToCMD(command);
    }
    callback(); //refresh code if file is already selected
  }

  static createAssemblyFile(filename, isInitial = false) {
    //if (!(`${filename}.asm` in fileList)) { //turn this into a call back or something
    const template = `INCLUDE D:/irvine/Irvine32.inc

  .data                          ;data decleration

  
  .code                          ;code decleration

  
  main PROC                      ;main method starts
  
     call DumpRegs
  
     exit                        ;Exit program
  main ENDP
  END main`;
    FileSystem.createFile(filename, template, new Date().getTime(), isInitial);
    //}
  }

  static createFile(
    filename,
    data,
    time,
    shouldWriteCommand = false,
    dataIsEncoded = false,
    size = 0,
    isDuplicate = false
  ) {
    //console.log({ CreatedFile: filename, data: data });
    let fileList = FileSystem._readFileList();

    //generate keys and creation time
    const id = isDuplicate
      ? hf.getFileMetaData(fileList[filename]).id
      : generateRandomID();
    const fileID = isDuplicate ? fileList[filename] : generateRandomID();

    /*
    console.log({ isDuplicate, id, fileID });
    if (isDuplicate)
      console.log({
        id: window.localStorage.getItem(id),
        fileID: window.localStorage.getItem(fileID),
      });
      */

    //Delete old keys if duplicate
    if (isDuplicate) {
      localStorage.removeItem(id); //delete file metaData
      localStorage.removeItem(fileID); //delete file Data
    }

    //Add file to list of files if not duplicate
    if (!isDuplicate) {
      fileList[filename] = fileID;

      //store in file list
      hf.setInLocalStorage(
        FileSystem.fileListKey,
        JSON.stringify(fileList),
        btoa
      );
    }

    //store file data in local storage
    hf.setInLocalStorage(
      id,
      data,
      dataIsEncoded ? (data) => data : hf.encodeFileData //only encode data that needs to be
    );

    //store file meta data
    const metaData = new Inode(
      id,
      size ? size : data.length,
      33206,
      time,
      time,
      time
    );
    hf.setInLocalStorage(fileID, metaData, hf.encodeFileMetaData);

    if (!shouldWriteCommand && !isDuplicate) {
      //Write to console
      writeCommandToCMD(`echo.>${filename}`);
    }
  }

  static deleteFile(filename) {
    let fileList = FileSystem._readFileList();
    if (`${filename}` in fileList) {
      const id = fileList[filename];
      console.log(hf.getFileMetaData(id));
      localStorage.removeItem(hf.getFileMetaData(id).id); //delete file contents
      localStorage.removeItem(id); //delete file metaData
      delete fileList[`${filename}.asm`];
      //remove file from file list
      hf.setInLocalStorage(
        FileSystem.fileListKey,
        JSON.stringify(fileList),
        btoa
      );
    }
  }
}
