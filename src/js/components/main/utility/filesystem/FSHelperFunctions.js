import { Inode, fromBuffer } from "./inode";
import { Buffer } from "buffer";
import { getStorageAdapter } from "./StorageAdapter.js";

// Storage adapter init promise (memoized so concurrent callers share ONE init;
// see StorageAdapter.getStorageAdapter for the race this prevents)
let storagePromise = null;

/**
 * Initialize the storage system
 * Call this before using any storage functions
 * @param {string} type - 'localstorage' or 'indexeddb' (default: 'indexeddb')
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

/**
 * Get storage adapter (initializes if needed)
 */
export function getStorage() {
  return initStorage();
}

/**
 * Get ALL [key, value] entries from the backing store (IndexedDB). Used to seed a
 * synchronous in-memory cache on startup.
 * @returns {Promise<Array<[string, string]>>}
 */
export const getAllEntries = async () => {
  const storage = await getStorage();
  return storage.getAll();
};

//Access keys from storage (now async to support both localStorage and IndexedDB)
export const getFromLocalStorage = async (key) => {
  const storage = await getStorage();
  return await storage.getItem(key);
};

export const setInLocalStorage = async (key, value, encoder) => {
  const storage = await getStorage();
  const encodedValue = encoder(value);
  return await storage.setItem(key, encodedValue);
};

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

//pull data (now async)
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

// Synchronous fallback for backward compatibility (uses localStorage only)
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
