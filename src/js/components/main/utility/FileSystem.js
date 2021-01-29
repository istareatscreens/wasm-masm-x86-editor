import { Inode, fromBuffer } from "./inode";
import { Buffer } from "buffer";
import { generateRandomID } from "../../../utility/utilityFunctions.ts";
import * as hf from "./FSHelperFunctions.js";

import {
  writeCommandToCMD,
  postMessage,
} from "../../../utility/utilityFunctions.ts";

//Helper functions:
export default class FileSystem {
  static locked = false;
  static fileListKey = "";

  static async init(callback) {
    //check to see if local storage was loaded
    await FileSystem.checkIfLocalStorageInitiated(callback);
    //FileSystem._readFileListKey();
  }

  static checkIfLocalStorageInitiated(callback) {
    const timer = () =>
      window.setTimeout(() => {
        if (hf.getFromLocalStorage("/") == null) {
          clearTimeout(timer);
          timer();
        } else {
          FileSystem._readFileListKey();
          window.addEventListener("storage", () => callback());
          callback(true); //first run so set to true
        }
      }, 100);
    timer();
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

  static createDataFile(files) {
    console.log("in create DATA FILE");
    console.log(files);
    /*
    const { name, size, type, lastModified } = fileData;
    console.log(fileData);
    FileSystem.createFile(name, "type", data, lastModified);
    */
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

  static createFile(filename, data, time, isInitial = false) {
    console.log({ CreatedFile: filename, data: data });
    let fileList = FileSystem._readFileList();
    //generate keys and creation time
    const id = generateRandomID();
    const fileID = generateRandomID();

    //Add file to list of files
    fileList[filename] = fileID;

    //store file data in local storage
    hf.setInLocalStorage(id, data, hf.encodeFileData);
    //console.log(Module.writableStorage.store.put(id, template, true));

    //store file meta data
    const metaData = new Inode(id, data.length, 33206, time, time, time);
    console.log(metaData);
    hf.setInLocalStorage(fileID, metaData, hf.encodeFileMetaData);

    //store in file list
    hf.setInLocalStorage(
      FileSystem.fileListKey,
      JSON.stringify(fileList),
      btoa
    );

    //TODO MOVE THIS TO APP
    if (!isInitial) {
      //Write to console
      writeCommandToCMD(`echo.>${filename}`);
      //this._createFileInConsole(filename);
    }
  }

  /*
  static _createFileInConsole(command, filename) {
    filename = filename.split("\\.");
    filenameCharacters = [];
    for (text of filename) {
      filenameCharacters.push(...text);
      filenameCharacters.push("period");
    }
    filenameCharacters.pop(); //remove final period
    postMessage("write-command", {
      data: [..."echo", "period", "shift", "period", "/shift"]
        .concat(filenameCharacters)
        .concat(["enter"]),
    });
  }
  */

  static deleteFile({ filename }) {
    let fileList = FileSystem._readFileList();
    if (`${filename}.asm` in fileList) {
      Module.pauseMainLoop();
      const id = fileList[`${filename}.asm`];
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
      Module.resumeMainLoop();
    }
  }
}
