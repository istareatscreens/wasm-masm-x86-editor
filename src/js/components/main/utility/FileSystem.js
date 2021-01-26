import { Inode, fromBuffer } from "./inode";
import { Buffer } from "buffer";
import { generateRandomID } from "../../../utility/utilityFunctions.ts";
import * as hf from "./FSHelperFunctions.js";

//Helper functions:
export class FileSystem {
  static locked = false;
  static fileListKey;

  static init() {
    FileSystem._readFileListKey();
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
  static getFileData(filename) {
    return hf.getFileMetaData(FileSystem._readFileList()[filename + ".asm"]);
  }

  static createFile({ filename }) {
    let fileList = FileSystem._readFileList();
    if (!(`${filename}.asm` in fileList)) {
      const template = `INCLUDE D:/irvine/Irvine32.inc

  .data                          ;data decleration

  
  .code                          ;code decleration

  
  main PROC                      ;main method starts
  
     call DumpRegs
  
     exit                        ;Exit program
  main ENDP
  END main`;
      //generate keys and creation time
      const time = new Date().getTime();
      const id = generateRandomID();
      const fileID = generateRandomID();

      //Add file to list of files
      fileList[`${filename}.asm`] = fileID;

      //store file data in local storage
      hf.setInLocalStorage(id, template, hf.encodeFileData);
      //console.log(Module.writableStorage.store.put(id, template, true));

      //store file meta data
      const metaData = new Inode(id, template.length, 33206, time, time, time);
      hf.setInLocalStorage(fileID, metaData, hf.encodeFileMetaData);

      //store in file list
      hf.setInLocalStorage(
        FileSystem.fileListKey,
        JSON.stringify(fileList),
        btoa
      );

      window.dispatchEvent(
        new CustomEvent("write-command", {
          detail: [
            "enter",
            ..."echo",
            "period",
            "spacebar",
            "shift",
            "period",
            "/shift",
            "spacebar",
            ...filename,
            "period",
            ..."asm",
            "enter",
          ],
        })
      );
    }
  }

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
