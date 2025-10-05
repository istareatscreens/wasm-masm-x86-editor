import { Inode, fromBuffer } from "./inode";
import { Buffer } from "buffer";
//Helper functions, that should be typed in the future

//Access keys from storage
export const getFromLocalStorage = (key) => window.localStorage.getItem(key);
export const setInLocalStorage = (key, value, encoder) =>
  window.localStorage.setItem(key, encoder(value));

//Decode and Encode Data from LocalStorage
export const decodeFileMetaData = (data) => {
  if (!data || typeof data !== 'string') return null;
  try {
    return fromBuffer(Buffer.from(data, "base64"));
  } catch (error) {
    console.error('Error decoding file metadata:', error);
    return null;
  }
};
export const encodeFileMetaData = (data) => data.toBuffer().toString("base64");
export const decodeFileData = (value) => {
  if (!value || typeof value !== 'string') return '';
  try {
    return atob(value);
  } catch (error) {
    console.error('Error decoding file data:', error);
    return '';
  }
};
export const encodeFileData = (value) => btoa(value);

//pull data
export const getFileMetaData = (key) => {
  if (!key) return null;
  const data = getFromLocalStorage(key);
  if (!data) return null;
  return decodeFileMetaData(data);
};
export const getFileData = (key) => {
  if (!key) return '';
  const data = getFromLocalStorage(key);
  if (!data) return '';
  return decodeFileData(data);
};
