import { Inode, fromBuffer } from "./filesystem/inode";
import { Buffer } from "buffer";
import {
  generateRandomID,
  renameObjectKey,
  getFileExtension,
} from "../../../utility/utilityFunctions.ts";
// Storage helpers via the compatibility adapter: synchronous reads/writes go to
// localStorage (so the existing synchronous FileSystem code works unchanged) and
// every write also mirrors through to IndexedDB. See FileSystemAdapter.js.
import hf from "./FileSystemAdapter.js";
import { saveAs } from "file-saver";

import { crlf } from "eol";
import dataURItoBlob from "./filesystem/dataURItoBlob.js";

import {
  writeCommandToCMD,
  postMessage,
  syncFileToEmulator,
  renameFileInEmulator,
  deleteFileFromEmulator,
} from "../../../utility/utilityFunctions.ts";

const mimeType = (fileExtension) => {
  if (fileExtension == null) {
    return createMime("application/octet-stream");
  }

  const createMime = (mimeType) => {
    return "data:" + mimeType + "base64,";
  };
  switch (fileExtension) {
    case ".txt":
    case ".text":
    case ".asm":
      return createMime("text/plain");
    case ".exe":
      return createMime("application/x-msdownload");
    case ".jpg":
    case ".jpeg":
      return createMime("image/jpeg");
    case ".bmp":
      return createMime("image/bmp");
    case ".png":
      return createMime("image/png");
    case ".gif":
      return createMime("image/gif");
    case ".wav":
      return createMime("audio/wav");
    case ".zip":
      return createMime("application/zip");
    case ".obj":
    case ".bin":
    case ".bin":
    default:
      return createMime("application/octet-stream");
  }
};

function getFormatedDate() {
  const date = new Date();
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  ]
    .map((value) => {
      const format = String(value);
      return format.length < 2 ? "0" + format : format;
    })
    .join("_");
}

const callBackIsTrue = async (
  callback,
  delay,
  resolutionFunction = () => { }
) => {
  return new Promise((resolve) => {
    if (callback()) resolve(resolutionFunction());
    let wait = setInterval(function () {
      if (callback()) {
        clearInterval(wait);
        resolve(resolutionFunction());
      }
    }, delay);
  });
};

/*
FileSystem for mananging changes to Boxedwine files
*/
export default class FileSystem {
  static locked = false;
  static fileListKey = "";
  static _eventAttached = false;
  static deleteFileQueue = [];

  static async init() {
    // Seed the synchronous cache from IndexedDB BEFORE any sync read below,
    // otherwise the "/" check would miss an existing root and re-bootstrap it.
    await hf.init();
    // Bootstrap the root "/" node if missing. "/" holds an Inode whose `id` is the
    // fileListKey — the key under which the {filename -> dataKey} map is stored.
    // The old browserfs layer used to create this; it was removed in the storage
    // migration, so create it here on first run (returning users already have it).
    if (hf.getFromLocalStorage("/") == null) {
      const listKey = generateRandomID();
      const now = new Date().getTime();
      const rootInode = new Inode(listKey, 0, 16877 /* dir */, now, now, now);
      hf.setInLocalStorage("/", rootInode, hf.encodeFileMetaData);
      hf.setInLocalStorage(listKey, JSON.stringify({}), btoa);
    }
    //check to see if local storage was loaded
    return callBackIsTrue(
      () => hf.getFromLocalStorage("/") != null,
      100,
      () => FileSystem._readFileListKey()
    );
  }

  //reads file list
  static _readFileList() {
    try {
      const data = hf.getFromLocalStorage(FileSystem.fileListKey);
      if (!data) return {};
      return JSON.parse(atob(data));
    } catch (error) {
      console.error('Error reading file list:', error);
      return {};
    }
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
    const fileList = FileSystem._readFileList();
    const fileKey = fileList[filename];
    if (!fileKey) return null;
    return hf.getFileMetaData(fileKey);
  }

  static getRawFileData(filename) {
    const fileList = FileSystem._readFileList();
    const fileKey = fileList[filename];
    if (!fileKey) return '';
    const fileMetaData = hf.getFileMetaData(fileKey);
    if (!fileMetaData) return '';
    return hf.getFromLocalStorage(fileMetaData.id) || '';
  }

  static getFileData(filename) {
    const fileList = FileSystem._readFileList();
    const fileKey = fileList[filename];
    if (!fileKey) return '';
    const fileMetaData = hf.getFileMetaData(fileKey);
    if (!fileMetaData || !fileMetaData.id) return '';
    return hf.getFileData(fileMetaData.id) || '';
  }

  // Synchronous content read straight from localStorage (the backing store).
  // Used to hand the current file's text to the emulator for direct file sync
  // (Module.bwWriteFile) without depending on the async storage path.
  static getFileContentSync(filename) {
    try {
      const listRaw = window.localStorage.getItem(FileSystem.fileListKey);
      if (!listRaw) return '';
      const list = JSON.parse(atob(listRaw));
      const fileKey = list[filename];
      if (!fileKey) return '';
      const meta = hf.getFileMetaDataSync(fileKey);
      if (!meta || !meta.id) return '';
      return hf.getFileDataSync(meta.id) || '';
    } catch (error) {
      console.error('getFileContentSync error:', error);
      return '';
    }
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
    if (!fileMetaDataKey) {
      console.error(`File ${filename} not found in file list`);
      return;
    }
    
    const fileMetaData = hf.getFileMetaData(fileMetaDataKey);
    if (!fileMetaData) {
      console.error(`File metadata for ${filename} not found`);
      return;
    }

    //Append changes
    fileMetaData.size = text.length;

    //save file
    hf.setInLocalStorage(fileMetaDataKey, fileMetaData, hf.encodeFileMetaData); //meta data
    hf.setInLocalStorage(fileMetaData.id, text, hf.encodeFileData); //file data

    // Mirror the (editor-debounced) save into the guest D: so the terminal copy
    // never diverges from the drawer copy (bwWriteFile, verified, no keystrokes).
    syncFileToEmulator(filename, text);
  }

  static renameFile(filename, newFileName) {
    let fileList = FileSystem._readFileList();
    // Rename inside the guest FIRST (Module.bwRenameFile: the node's own rename,
    // so cmd's next `dir` shows only the new name). The app's copy of the content
    // is passed along for the delete+write fallback. No `ren`/`echo` keystrokes.
    let content = "";
    // getFileData reads the IndexedDB-backed cache (getFileContentSync only sees the
    // retired localStorage store and returns "" for every new-storage user)
    try { content = FileSystem.getFileData(filename) || FileSystem.getFileContentSync(filename) || ""; } catch (e) {}
    const isBinary = !/\.(asm|inc|txt|text|bat|lst|map)$/i.test(filename);
    renameFileInEmulator(filename, newFileName, isBinary ? FileSystem.getRawFileData(filename) || "" : content, isBinary);
    //rename file in list

    fileList = renameObjectKey(fileList, filename, newFileName);
    hf.setInLocalStorage(
      FileSystem.fileListKey,
      JSON.stringify(fileList),
      btoa
    );
  }

  //TODO change INCLUDE Irvine import to correct one
  static createDataFile(files, callback) {
    files.forEach((file) => {
      const { fileMetaData } = file;
      const { name, lastModified } = fileMetaData;
      let { size } = fileMetaData;
      let data = file.data.split(",").pop(); //remove MIME
      let isEncoded = true;
      if (/.(asm|text|txt)$/.test(name)) {
        data = crlf(atob(data)); //convert end of line (eol) to dos/win32 compatiable crlf
        size = data.length;
        isEncoded = false;
      }

      const isDuplicate = name in FileSystem._readFileList();

      // shouldWriteCommand=false -> createFile places the file into the guest FS
      // DIRECTLY via Module.bwWriteFile (no `echo.>name` keystrokes). Text uploads
      // get their real content; the file shows in `dir` with no echo command.
      FileSystem.createFile(
        name,
        data,
        lastModified,
        false,
        isEncoded,
        size,
        isDuplicate
      );
    });

    callback(); //refresh code if file is already selected
  }

  static createAssemblyFile(filename, isInitial = false) {
    //if (!(`${filename}.asm` in fileList)) { //turn this into a call back or something
    const template = `INCLUDE Irvine32.inc

  .data                          ;data decleration

  
  .code                          ;code decleration

  
  main PROC                      ;main method starts
  
     call DumpRegs
  
     exit                        ;Exit program
  main ENDP
  END main`;
    // always placed on the guest D: too (before the emulator is up the sync is a
    // no-op and the start-up reconcile covers it; after it - e.g. the test.asm
    // recreated when the last .asm was deleted - cmd must see it right away)
    FileSystem.createFile(filename, template, new Date().getTime(), false);
    //}
  }

  /*TODO Fix BUG should create file first in boxedwine then append (promise) to it to prevent ghost files*/
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

    if (!shouldWriteCommand) {
      // Place the file directly on the guest D: drive (no echo command) so it
      // shows in the terminal `dir` — for NEW files and for uploads that replace
      // an existing one (the guest copy must follow the app copy). Encoded
      // (binary) uploads go through the binary-safe bwWriteFileBytes path with
      // their real bytes (they used to be written as EMPTY guest files).
      syncFileToEmulator(filename, data, !!dataIsEncoded);
    }
  }

  static queueFilesToDelete(...filenames) {
    let fileList = FileSystem._readFileList();
    filenames.forEach(filename => {
      if (`${filename}` in fileList) {
        FileSystem.deleteFileQueue.push(filename);
      }
    });
  }

  static deleteFiles() {
    if (0 === FileSystem.deleteFileQueue.length) {
      return;
    }
    // Delete each file DIRECTLY through BoxedWine (Module.bwDeleteFile) instead of
    // typing a `del` command into cmd — more efficient + reliable, and it stays
    // cmd-synced because bwDeleteFile removes the FsNode from the guest tree so the
    // running `dir` no longer lists it. Also remove it from app storage so the file
    // drawer updates (the old flow relied on a console-write handler that is no
    // longer wired, so deletes did not persist in storage).
    // One file's failure must not stop the others, and the queue is always drained.
    const queue = FileSystem.deleteFileQueue;
    FileSystem.deleteFileQueue = [];
    queue.forEach((filename) => {
      try { deleteFileFromEmulator(filename); } catch (e) { console.warn("[FileSystem] guest delete of " + filename + " failed", e); } // guest FS (no keystrokes)
      FileSystem.deleteFile(filename);  // app storage + file list
    });
    // (a deleted test.asm is NOT recreated here any more: App.refreshFileList creates
    // one only when no .asm is left, so deleting it stays deleted)
  }

  static handleConsoleWriteEvent(event) {
    FileSystem.deleteLocalStorageFilesAndClearDeleteQueue(event);
  }

  static transformStringDelString(input) {
    if (input.startsWith('del')) {
      input = input.slice(3);
    }
    if (input.endsWith('enter')) {
      input = input.slice(0, -5);
    }

    input = input.replace(/spacebar/g, ' ').replace(/period/g, '.');

    return input;
  }

  static deleteFile(filename) {
    let fileList = FileSystem._readFileList();
    if (`${filename}` in fileList) {
      const id = fileList[filename];
      // Remove through the storage adapter (IndexedDB-primary + sync cache) rather
      // than raw localStorage, so the delete actually persists under the current
      // storage (new files never touch localStorage).
      try { hf.deleteKey(hf.getFileMetaData(id).id); } catch (e) {} //file contents (adapter: sync cache + IndexedDB)
      try { hf.deleteKey(id); } catch (e) {}                        //file metaData
      delete fileList[`${filename}`];
      //remove file from file list
      hf.setInLocalStorage(
        FileSystem.fileListKey,
        JSON.stringify(fileList),
        btoa
      );
    }
  }

  /*
  Save file feature should be cealled from MAIN components only not Boxedwine components
  as it uses postMessage
  */
  // Raw (base64) bytes of a file from the app's storage (IndexedDB-backed cache),
  // regardless of whether it was stored as text (encoded on read) or binary.
  static _fileBase64(filename) {
    const raw = FileSystem.getRawFileData(filename);
    return raw || "";
  }

  // JSZip lives in the emulator iframe (jszip.min.js is served with the app);
  // borrow it cross-frame (same origin) or load it on demand — no bundle growth.
  static async _getJSZip() {
    try {
      const iframe = document.getElementById("boxedwine");
      if (iframe && iframe.contentWindow && iframe.contentWindow.JSZip) return iframe.contentWindow.JSZip;
    } catch (e) {}
    if (window.JSZip) return window.JSZip;
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "jszip.min.js"; s.async = true; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
    return window.JSZip;
  }

  // Zip [{filename, base64}] in the PARENT and download it. The old flow posted
  // "zip-files" to the iframe, whose handler no longer exists — downloads silently
  // never happened.
  static async _zipAndSave(entries, zipName) {
    const JSZip = await FileSystem._getJSZip();
    if (!JSZip) throw new Error("JSZip unavailable");
    const zip = new JSZip();
    for (const e of entries) {
      if (!e || !e.filename) continue;
      zip.file(e.filename, e.base64 || "", { base64: true });
    }
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, zipName);
  }

  static saveFile(filename) {
    const fileExtension = getFileExtension(filename);
    // read from the app's storage (IndexedDB-backed), not the retired localStorage
    saveAs(
      dataURItoBlob(mimeType(fileExtension) + FileSystem._fileBase64(filename)),
      filename.substring(0, filename.length - fileExtension.length) +
      getFormatedDate() +
      fileExtension
    );
  }

  static async saveFiles(filenames) {
    const zipName = "MASMProjectFiles_" + getFormatedDate() + ".zip";
    const entries = filenames.map((filename) => ({ filename, base64: FileSystem._fileBase64(filename) }));
    await FileSystem._zipAndSave(entries, zipName);
  }

  // --- Legacy localStorage migration --------------------------------------
  // The app is moving its filesystem to the emulator (D:); files that still
  // live in browser localStorage are "legacy". These let the UI offer a
  // one-click backup of them as a .zip before they are eventually retired.

  // Resolve the LEGACY (old-app) file list straight from window.localStorage,
  // independent of the new IndexedDB-backed storage. The old app stored a root
  // "/" Inode whose `id` is the fileListKey holding {filename -> metaKey}. The new
  // storage never writes localStorage, so anything found here is genuinely legacy.
  static _legacyList() {
    try {
      const rootRaw = window.localStorage.getItem("/");
      if (!rootRaw) return null;
      const rootInode = hf.decodeFileMetaData(rootRaw);
      if (!rootInode || !rootInode.id) return null;
      const listRaw = window.localStorage.getItem(rootInode.id);
      if (!listRaw) return null;
      return { fileListKey: rootInode.id, list: JSON.parse(atob(listRaw)) };
    } catch (error) {
      return null;
    }
  }

  // Sync check (reads localStorage directly): does the user have legacy files?
  static hasLegacyFiles() {
    const legacy = FileSystem._legacyList();
    return !!(
      legacy &&
      Object.keys(legacy.list).filter((n) => n && n.length > 0).length > 0
    );
  }

  // Zip every legacy localStorage file (read straight from localStorage, never
  // the new IndexedDB cache) and download it, byte-for-byte.
  static async downloadLegacyFiles() {
    const legacy = FileSystem._legacyList();
    if (!legacy) return;
    const list = legacy.list;
    const entries = Object.keys(list)
      .filter((n) => n && n.length > 0)
      .map((filename) => {
        const metaRaw = window.localStorage.getItem(list[filename]);
        const meta = hf.decodeFileMetaData(metaRaw);
        if (!meta || !meta.id) return null;
        const base64 = window.localStorage.getItem(meta.id);
        return base64 == null ? null : { filename, base64 };
      })
      .filter(Boolean);
    if (entries.length === 0) return;
    await FileSystem._zipAndSave(entries, "MASM_legacy_files_" + getFormatedDate() + ".zip");
  }
}
