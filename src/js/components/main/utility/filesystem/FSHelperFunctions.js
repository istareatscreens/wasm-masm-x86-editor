import { Inode, fromBuffer } from "./inode";
import { Buffer } from "buffer";
import { getStorageAdapter } from "./StorageAdapter.js";

// one init shared by concurrent callers (see StorageAdapter.getStorageAdapter)
let storagePromise = null;

/**
 * @param {string} type - 'localstorage' or 'indexeddb'; only the first call's type counts
 */
export function initStorage(type = 'indexeddb') {
  if (!storagePromise) {
    storagePromise = getStorageAdapter(type).then((adapter) => {
      console.log('[FSHelperFunctions] Storage initialized with:', type);
      return adapter;
    });
  }
  return storagePromise;
}

export function getStorage() {
  return initStorage();
}

export const getAllEntries = async () => {
  const storage = await getStorage();
  return storage.getAll();
};

export const getFromLocalStorage = async (key) => {
  const storage = await getStorage();
  return await storage.getItem(key);
};

export const setInLocalStorage = async (key, value, encoder) => {
  const storage = await getStorage();
  const encodedValue = encoder(value);
  return await storage.setItem(key, encodedValue);
};

//Decode and Encode Data
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

export const getFileMetaData = async (key) => {
  if (!key) return null;
  const data = await getFromLocalStorage(key);
  if (!data) return null;
  return decodeFileMetaData(data);
};
export const getFileData = async (key) => {
  if (!key) return '';
  const data = await getFromLocalStorage(key);
  if (!data) return '';
  return decodeFileData(data);
};

// These read localStorage only, never the IndexedDB store.
export const getFileMetaDataSync = (key) => {
  if (!key) return null;
  try {
    const data = window.localStorage.getItem(key);
    if (!data) return null;
    return decodeFileMetaData(data);
  } catch (error) {
    console.error('Error getting file metadata (sync):', error);
    return null;
  }
};

export const getFileDataSync = (key) => {
  if (!key) return '';
  try {
    const data = window.localStorage.getItem(key);
    if (!data) return '';
    return decodeFileData(data);
  } catch (error) {
    console.error('Error getting file data (sync):', error);
    return '';
  }
};
