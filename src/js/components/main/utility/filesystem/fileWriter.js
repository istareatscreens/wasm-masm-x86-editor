import { Inode, fromBuffer } from "./inode";
import { Buffer } from "buffer";

//Helper functions:

//Access keys from storage
const getFromLocalStorage = (key) => window.localStorage.getItem(key);
const setInLocalStorage = (key, value, encoder) =>
  window.localStorage.setItem(key, encoder(value));

//Decode and Encode Data from LocalStorage
const decodeFileMetaData = (data) => fromBuffer(Buffer.from(data, "base64"));
const encodeFileMetaData = (data) => data.toBuffer().toString("base64");
const decodeFileData = (value) => atob(value);
const encodeFileData = (value) => btoa(value);

//pull data
const getFileMetaData = (key) => decodeFileMetaData(getFromLocalStorage(key));
const getFileData = (key) => decodeFileData(getFromLocalStorage(key));

/*
ToDo:
Move to an object or apply a functional state
Improve performance by saving current file name/key being edited to skip directory check
Remove encoding/decoding of every file
Refactory Inode to only encode/decoding key and value 
Introduce writelock
*/

/**
 * @description finds file in local storage and replaces its text
 * @param {string} fileName name of assembly file exlcuding the .asm filename suffix
 * @param {string?} text text to be written to the file
 * @returns void
 * @Example writeToAssemblyFile("file", "assembly code here")
 */
export const writeToAssemblyFile = (filename, text) => {
  filename += ".asm";

  //get rootData
  const rootData = decodeFileMetaData(getFromLocalStorage("/"));
  console.log(rootData);
  const fileKeyList = JSON.parse(atob(getFromLocalStorage(rootData.id)));
  console.log(fileKeyList);

  //Can be cleaned up
  //convert to object to list
  const data = Object.entries(fileKeyList);
  console.log(data);
  //convert Keys to Data
  const newData = data.map((arr) => [
    arr[0].toString(),
    getFileMetaData(arr[1]),
  ]);
  console.log(newData);

  //convert Return Object structure
  const fileMetaData = newData.reduce(
    (acc, [k, v]) => ({ ...acc, [k]: v }),
    {}
  );
  console.log(fileMetaData);

  //get list of files
  let fileData = {};
  for (const key in fileMetaData) {
    fileData[key] = getFileData(fileMetaData[key].id);
  }

  //Append changes
  fileData[filename] = text;
  fileMetaData[filename].size = fileData[filename].length;

  //save file
  setInLocalStorage(
    fileMetaData[filename].id,
    fileData[filename],
    encodeFileData
  );
  setInLocalStorage(
    fileKeyList[filename],
    fileMetaData[filename],
    encodeFileMetaData
  );
};
