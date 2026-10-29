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
import { toAsciiJson, joinPath, parentOf, baseOf, ancestorsOf, isWithin, splitPath, nameKey } from "./filesystem/paths";
import { detectEncoding, decodeText, encodeText, canEncode, byteOrderMark, ASSEMBLER_SOURCE, bytesToBase64, base64ToBytes, bytesToBinaryString } from "./filesystem/textEncoding";
import { isBinary, BINARY_SNIFF_BYTES } from "./filesystem/binaryDetect";
import { planImport, planExport, decodeEntryName, MAX_ARCHIVE_BYTES } from "./filesystem/archive";

import {
  writeCommandToCMD,
  postMessage,
  syncFileToEmulator,
  renameFileInEmulator,
  deleteFileFromEmulator,
  makeDirInEmulator,
  removeDirFromEmulator,
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
  static _encodings = new Map(); // path -> text encoding the editor saves it in

  static async init() {
    // Seed the synchronous cache from IndexedDB BEFORE any sync read below,
    // otherwise the "/" check would miss an existing root and re-bootstrap it.
    await hf.init();
    // another tab's "also delete all my files" reset deletes the store: the connection is
    // closed so the delete goes through, and this tab starts over on the new store (a
    // moment later, so the resetting tab has made it)
    hf.onStoreDeleted(() => setTimeout(() => window.location.reload(), 1500));
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

  // Before this tab deletes the store (the Hard Reset window): a connection of its own
  // would block the delete.
  static closeStore() {
    return hf.closeStore();
  }

  //reads file list
  // The file list is read by nearly every operation: its parse is kept with the stored
  // string it came from (a write stores a new one), and each caller gets its own copy.
  static _listMemo = { raw: null, list: null };

  static _readFileList() {
    try {
      const data = hf.getFromLocalStorage(FileSystem.fileListKey);
      if (!data) return {};
      if (data !== FileSystem._listMemo.raw) FileSystem._listMemo = { raw: data, list: JSON.parse(atob(data)) };
      return { ...FileSystem._listMemo.list };
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

  // Lists are ASCII JSON (every non-ASCII character escaped), so btoa accepts names in
  // any language and earlier builds still parse them.
  static _writeFileList(fileList) {
    hf.setInLocalStorage(FileSystem.fileListKey, toAsciiJson(fileList), btoa);
  }

  // Folder registry: every folder of the drawer, empty ones included, stored next to the
  // file list.
  static _foldersKey() {
    return FileSystem.fileListKey + ":folders";
  }

  static getFolderList() {
    try {
      const data = hf.getFromLocalStorage(FileSystem._foldersKey());
      return data ? JSON.parse(atob(data)) : [];
    } catch (error) {
      console.error("Error reading folder list:", error);
      return [];
    }
  }

  static _writeFolderList(folders) {
    const unique = Array.from(new Set(folders.filter(Boolean))).sort();
    hf.setInLocalStorage(FileSystem._foldersKey(), toAsciiJson(unique), btoa);
  }

  // Every folder: the registry plus the folders above every file.
  static getAllFolders() {
    const folders = new Set(FileSystem.getFolderList());
    for (const file of FileSystem.getFileList()) ancestorsOf(file).forEach((folder) => folders.add(folder));
    return Array.from(folders);
  }

  // Register a folder and its parents; inGuest also creates them on D: (bwMakeDir is
  // mkdir -p). Known folders cost nothing.
  static ensureFolder(folder, inGuest = true) {
    if (!folder) return;
    const known = FileSystem.getFolderList();
    const missing = ancestorsOf(folder).concat(folder).filter((path) => known.indexOf(path) < 0);
    if (!missing.length) return;
    FileSystem._writeFolderList(known.concat(missing));
    if (inGuest) makeDirInEmulator(folder);
  }

  static createFolder(folder) {
    FileSystem.ensureFolder(folder);
  }

  // The stored key of `path` when a file of that name exists in any letter case (the
  // guest compares names case-insensitively), else `path`.
  static _existingKey(path) {
    const key = nameKey(path);
    return FileSystem.getFileList().find((existing) => nameKey(existing) === key) || path;
  }

  // A byte string that starts with a UTF-16 byte-order mark.
  static _isUtf16(raw) {
    const b0 = raw.charCodeAt(0), b1 = raw.charCodeAt(1);
    return (b0 === 0xff && b1 === 0xfe) || (b0 === 0xfe && b1 === 0xff);
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

  // A file's stored bytes (storage keeps base64).
  static getBytes(filename) {
    return base64ToBytes(FileSystem.getRawFileData(filename));
  }

  // isbinaryfile's verdict on the file's first bytes (only those are decoded).
  static isBinaryFile(filename) {
    const raw = FileSystem.getRawFileData(filename);
    return isBinary(base64ToBytes(raw.slice(0, 4 * Math.ceil(BINARY_SNIFF_BYTES / 3))));
  }

  // A file as text: a binary shown as text byte for byte (Windows-1252: every byte
  // round-trips), anything else in its own encoding. writeToFile saves it the same way.
  static readText(filename, asBinary = false) {
    const bytes = FileSystem.getBytes(filename);
    const encoding = asBinary ? "windows-1252" : detectEncoding(bytes);
    FileSystem._encodings.set(filename, encoding);
    return { text: decodeText(bytes, encoding), encoding };
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
    let encoding = FileSystem._encodings.get(filename) || "utf-8";
    if (ASSEMBLER_SOURCE.test(filename) && encoding !== "utf-8" && encoding !== "windows-1252") {
      encoding = "utf-8"; // no byte order mark in an assembler source
      FileSystem._encodings.set(filename, encoding);
    }
    if (!canEncode(text, encoding)) {
      console.warn("[FileSystem] " + filename + " now holds characters " + encoding + " cannot store; it is saved as UTF-8");
      encoding = "utf-8";
      FileSystem._encodings.set(filename, encoding);
    }
    FileSystem.writeBytes(filename, encodeText(text, encoding));
  }

  // Before a build: every assembler source that starts with a byte order mark (one never
  // saved since it was imported) is rewritten as plain UTF-8, so the source and whatever
  // it includes are read as Microsoft MASM reads them.
  static stripByteOrderMarks() {
    for (const name of FileSystem.getFileList()) {
      if (!ASSEMBLER_SOURCE.test(name)) continue;
      const raw = FileSystem.getRawFileData(name);
      const mark = byteOrderMark(base64ToBytes(raw.slice(0, 4)));
      if (!mark) continue;
      FileSystem.writeBytes(name, encodeText(decodeText(base64ToBytes(raw), mark), "utf-8"));
      if (FileSystem._encodings.has(name)) FileSystem._encodings.set(name, "utf-8");
      console.log("[FileSystem] " + name + " started with a byte order mark, which MASM rejects: saved as plain UTF-8");
    }
  }

  static writeBytes(filename, bytes) {
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
    const base64 = bytesToBase64(bytes);
    fileMetaData.size = bytes.length;

    //save file
    hf.setInLocalStorage(fileMetaDataKey, fileMetaData, hf.encodeFileMetaData); //meta data
    hf.setInLocalStorage(fileMetaData.id, base64, (data) => data); //file data

    // Mirror the (editor-debounced) save into the guest D: byte for byte so the terminal
    // copy never diverges from the drawer copy (bwWriteFileBytes, verified, no keystrokes).
    syncFileToEmulator(filename, base64, true);
  }

  static renameFile(filename, newFileName) {
    let fileList = FileSystem._readFileList();
    // Rename inside the guest FIRST (Module.bwRenameFile: the node's own rename,
    // so cmd's next `dir` shows only the new name; into another folder as well).
    // The stored bytes are passed along for the delete+write fallback. No `ren`/`echo`
    // keystrokes.
    FileSystem.ensureFolder(parentOf(newFileName));
    renameFileInEmulator(filename, newFileName, FileSystem.getRawFileData(filename) || "", true);
    //rename file in list

    fileList = renameObjectKey(fileList, filename, newFileName);
    FileSystem._writeFileList(fileList);
    if (FileSystem._encodings.has(filename)) {
      FileSystem._encodings.set(newFileName, FileSystem._encodings.get(filename));
      FileSystem._encodings.delete(filename);
    }
  }

  //TODO change INCLUDE Irvine import to correct one
  // Uploads go into `folder` (a drawer path, "" = D:\); a name that exists in another
  // letter case replaces that file.
  static createDataFile(files, callback, folder = "") {
    files.forEach((file) => {
      const { fileMetaData } = file;
      const { lastModified } = fileMetaData;
      const name = FileSystem._existingKey(joinPath(folder, fileMetaData.name.normalize("NFC")));
      let { size } = fileMetaData;
      let data = file.data.split(",").pop(); //remove MIME
      let isEncoded = true;
      if (/.(asm|text|txt)$/.test(name)) {
        const raw = atob(data);
        if (!FileSystem._isUtf16(raw)) {
          data = crlf(raw); //convert end of line (eol) to dos/win32 compatiable crlf (on the bytes; UTF-16 is left alone)
          size = data.length;
          isEncoded = false;
        }
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
      FileSystem._writeFileList(fileList);
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

    // its folder is registered (and made on D: unless the file is already there)
    FileSystem.ensureFolder(parentOf(filename), !shouldWriteCommand);
    FileSystem._encodings.delete(filename); // detected again when the editor opens it
    if (!shouldWriteCommand) {
      // Place the file directly on the guest D: drive (no echo command) so it
      // shows in the terminal `dir` — for NEW files and for uploads that replace
      // an existing one (the guest copy must follow the app copy). Always the
      // stored bytes, through the binary-safe bwWriteFileBytes path (the text path
      // re-encoded every byte >= 0x80 as UTF-8: uploaded UTF-8 text arrived
      // double-encoded).
      syncFileToEmulator(filename, dataIsEncoded ? data : btoa(data), true);
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
      FileSystem._writeFileList(fileList);
      FileSystem._encodings.delete(filename);
    }
  }

  // Delete files and folders (a folder with everything in it) from storage and the guest
  // D: together: the files first, then the folders deepest first.
  static deleteEntries(paths) {
    const list = FileSystem._readFileList();
    const allFolders = FileSystem.getAllFolders();
    const files = new Set(), folders = new Set();
    for (const path of paths) {
      if (path in list) {
        files.add(path);
        continue;
      }
      folders.add(path);
      Object.keys(list).forEach((file) => isWithin(file, path) && files.add(file));
      allFolders.forEach((sub) => isWithin(sub, path) && folders.add(sub));
    }
    FileSystem.queueFilesToDelete(...files);
    FileSystem.deleteFiles();
    Array.from(folders).sort((a, b) => splitPath(b).length - splitPath(a).length).forEach((folder) => removeDirFromEmulator(folder));
    if (folders.size) FileSystem._writeFolderList(FileSystem.getFolderList().filter((folder) => !folders.has(folder)));
  }

  // Move files and folders into `folder` (the drawer checked the move with planMove).
  static moveEntries(paths, folder) {
    paths.forEach((path) => FileSystem._relocate(path, joinPath(folder, baseOf(path))));
  }

  static renameEntry(path, newName) {
    FileSystem._relocate(path, joinPath(parentOf(path), newName));
  }

  // A file is renamed in place. A folder is rebuilt under its new path file by file: the
  // guest cannot rename a directory with contents (its children would keep stale paths).
  static _relocate(from, to) {
    const list = FileSystem._readFileList();
    if (from in list) return FileSystem.renameFile(from, to);
    const moved = (path) => to + path.slice(from.length);
    const folders = FileSystem.getAllFolders().filter((sub) => isWithin(sub, from));
    folders.forEach((sub) => FileSystem.ensureFolder(moved(sub)));
    Object.keys(list).filter((file) => isWithin(file, from)).forEach((file) => FileSystem.renameFile(file, moved(file)));
    folders.sort((a, b) => splitPath(b).length - splitPath(a).length).forEach((sub) => removeDirFromEmulator(sub));
    FileSystem._writeFolderList(FileSystem.getFolderList().filter((sub) => !isWithin(sub, from)).concat(folders.map(moved)));
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
      baseOf(filename).substring(0, baseOf(filename).length - fileExtension.length) +
      getFormatedDate() +
      fileExtension
    );
  }

  // Download entries ({files, folders}: a folder with everything in it) as one zip that
  // keeps the folder structure: files under their paths relative to D:\, every folder
  // (empty ones included) as a directory entry. JSZip writes non-ASCII names in UTF-8.
  static async saveEntries(targets) {
    const plan = planExport(targets, FileSystem.getFileList(), FileSystem.getAllFolders());
    const JSZip = await FileSystem._getJSZip();
    if (!JSZip) throw new Error("JSZip unavailable");
    const zip = new JSZip();
    plan.folders.forEach((folder) => zip.folder(folder));
    plan.files.forEach((file) => zip.file(file, FileSystem._fileBase64(file), { base64: true }));
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, (plan.name || "MASMProjectFiles") + "_" + getFormatedDate() + ".zip");
  }

  // Import a .zip under `folder` keeping its folders (planImport: safe names, existing
  // spellings, limits). Resolves to {refused, skipped, count}.
  static async importArchive(blob, folder) {
    const JSZip = await FileSystem._getJSZip();
    if (!JSZip) throw new Error("JSZip unavailable");
    const zip = await JSZip.loadAsync(blob, { decodeFileName: decodeEntryName });
    const entries = [];
    zip.forEach((relativePath, entry) => entries.push({ name: entry.name, dir: entry.dir, size: (entry._data && entry._data.uncompressedSize) || 0, entry }));
    const plan = planImport(entries, folder, FileSystem.getFileList(), FileSystem.getAllFolders());
    if (plan.refused) return { refused: plan.refused, skipped: [], count: 0 };
    plan.folders.forEach((path) => FileSystem.ensureFolder(path));
    let total = 0, count = 0;
    for (const { index, path } of plan.files) {
      const bytes = await entries[index].entry.async("uint8array");
      total += bytes.length;
      // the declared sizes passed; an archive that lies about them stops here
      if (total > MAX_ARCHIVE_BYTES) return { refused: "the archive unpacks to more than " + MAX_ARCHIVE_BYTES / 1048576 + " MiB", skipped: plan.skipped, count };
      FileSystem.storeImported(path, bytes);
      count++;
    }
    return { refused: null, skipped: plan.skipped, count };
  }

  // Import the files of a picked directory under `folder` with their relative paths
  // (webkitRelativePath). A browser that gives no paths (older mobile pickers) gets a
  // flat import, reported by `flat`.
  static async importDirectoryFiles(files, folder) {
    const list = Array.from(files);
    const flat = list.some((file) => !file.webkitRelativePath);
    const entries = list.map((file) => ({ name: flat ? file.name : file.webkitRelativePath, dir: false, size: file.size }));
    const plan = planImport(entries, folder, FileSystem.getFileList(), FileSystem.getAllFolders());
    if (plan.refused) return { refused: plan.refused, skipped: [], count: 0, flat };
    plan.folders.forEach((path) => FileSystem.ensureFolder(path));
    for (const { index, path } of plan.files) FileSystem.storeImported(path, await FileSystem._readFileBytes(list[index]));
    return { refused: null, skipped: plan.skipped, count: plan.files.length, flat };
  }

  // Today's upload rules for one imported file: .asm/.txt/.text stored as text with CRLF
  // line ends (UTF-16 left alone), everything else byte for byte.
  static storeImported(path, bytes) {
    const isDuplicate = path in FileSystem._readFileList();
    const raw = bytesToBinaryString(bytes);
    if (/.(asm|text|txt)$/.test(path) && !FileSystem._isUtf16(raw)) {
      const text = crlf(raw);
      FileSystem.createFile(path, text, Date.now(), false, false, text.length, isDuplicate);
    } else {
      FileSystem.createFile(path, btoa(raw), Date.now(), false, true, bytes.length, isDuplicate);
    }
  }

  static _readFileBytes(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(new Uint8Array(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
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
