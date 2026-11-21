/**
 * Synchronous storage for FileSystem.js: an in-memory copy of the IndexedDB store, written through in the background.
 */

import * as hf from './filesystem/FSHelperFunctions.js';

// The store's version: a token in localStorage that every tab of the app renews once its writes are in the
// store. A tab whose cache is from another version reads the store again (utility/session/tabSync.js).
export const VERSION_KEY = 'masm-files-version';
const readVersion = () => {
  try {
    return window.localStorage.getItem(VERSION_KEY);
  } catch (error) {
    return null;
  }
};

class StorageAdapterWrapper {
  constructor() {
    this.initialized = false;
    this.storageType = null;
    // Seeded by init(). Files go to IndexedDB, so files found in localStorage are legacy (the "download legacy
    // files" button).
    this.cache = new Map();
    this._initPromise = null;
    // database writes not finished yet (flush awaits them)
    this.pending = new Set();
    // the store's version the cache is from; behind: another tab's list was merged with a write of this tab
    this.version = null;
    this.behind = false;
    this.onBehind = null;
    // a list key's three-way merge (FileSystem), or null: the write replaces what is stored
    this.mergerFor = () => null;
    // writes made while reload() reads the store
    this.overlay = null;
  }

  _track(promise) {
    this.pending.add(promise);
    const done = () => {
      this.pending.delete(promise);
      if (!this.pending.size) this._stamp();
    };
    promise.then(done, done);
    return promise;
  }

  // a new version, once this tab's writes are in the store (other tabs hear of it through the storage event)
  _stamp() {
    const version = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    try {
      window.localStorage.setItem(VERSION_KEY, version);
      this.version = version;
    } catch (error) {}
  }

  async flush() {
    while (this.pending.size) await Promise.all(Array.from(this.pending, (promise) => promise.catch(() => {})));
  }

  isBehind() {
    return this.behind || readVersion() !== this.version;
  }

  // The cache read again from the store, with this tab's writes made meanwhile on top. A store that cannot
  // be read leaves the cache as it is. Another tab writing meanwhile leaves this tab behind again.
  async reload() {
    await this.init();
    await this.flush();
    const version = readVersion();
    this.behind = false;
    this.overlay = new Map();
    try {
      const storage = await hf.getStorage();
      const cache = new Map(await storage.readAll());
      if (!cache.has('/')) throw new Error('the store has no root entry');
      this.overlay.forEach((value, key) => (value === undefined ? cache.delete(key) : cache.set(key, value)));
      this.cache = cache;
      this.version = version;
    } catch (error) {
      this.behind = true;
      throw error;
    } finally {
      this.overlay = null;
    }
  }

  async _merge(key, base, value, merge) {
    await this.init();
    const storage = await hf.getStorage();
    if (await storage.mergeItem(key, base, value, merge)) {
      this.behind = true;
      if (this.onBehind) this.onBehind();
    }
  }

  /**
   * Initialize storage and seed the sync cache from IndexedDB (idempotent).
   * @param {string} type - 'indexeddb' or 'localstorage'
   */
  async init(type = 'indexeddb') {
    if (this.initialized) return;
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      try {
        await hf.initStorage(type);
        this.storageType = type;
      } catch (error) {
        console.error('[FileSystemAdapter] Failed to initialize storage:', error);
        await hf.initStorage('localstorage');
        this.storageType = 'localstorage';
      }
      try {
        this.version = readVersion();
        const entries = await hf.getAllEntries();
        for (const [k, v] of entries) this.cache.set(k, v);
      } catch (error) {
        console.error('[FileSystemAdapter] Cache seed failed:', error);
      }
      this.initialized = true;
      console.log('[FileSystemAdapter] Storage initialized:', this.storageType, '(cache:', this.cache.size, 'entries)');
    })();
    return this._initPromise;
  }

  // null when absent, as localStorage.getItem
  getFromLocalStorageSync(key) {
    return this.cache.has(key) ? this.cache.get(key) : null;
  }

  async getFromLocalStorageAsync(key) {
    await this.init();
    return await hf.getFromLocalStorage(key);
  }

  /**
   * Updates the cache at once and IndexedDB in the background.
   * @param {(v:*)=>string} [encoder] applied to `value` before it is stored (btoa, encodeFileData, ...)
   */
  setInLocalStorageSync(key, value, encoder) {
    try {
      const encoded = encoder ? encoder(value) : value;
      const base = this.cache.has(key) ? this.cache.get(key) : null;
      this.cache.set(key, encoded);
      if (this.overlay) this.overlay.set(key, encoded);
      const merge = this.mergerFor(key);
      this._track(merge ? this._merge(key, base, encoded, merge) : this.setInLocalStorageAsync(key, encoded)).catch(() => {});
    } catch (error) {
      console.error('[FileSystemAdapter] Sync set failed:', error);
    }
  }

  async setInLocalStorageAsync(key, value) {
    await this.init();
    return await hf.setInLocalStorage(key, value, (v) => v);
  }

  getFileMetaDataSync(key) {
    if (!key) return null;
    const data = this.getFromLocalStorageSync(key);
    if (!data) return null;
    return hf.decodeFileMetaData(data);
  }

  async getFileMetaDataAsync(key) {
    await this.init();
    return await hf.getFileMetaData(key);
  }

  getFileDataSync(key) {
    if (!key) return '';
    const data = this.getFromLocalStorageSync(key);
    if (!data) return '';
    return hf.decodeFileData(data);
  }

  async getFileDataAsync(key) {
    await this.init();
    return await hf.getFileData(key);
  }

  hasKey(key) {
    return this.getFromLocalStorageSync(key) !== null;
  }

  deleteKeySync(key) {
    try {
      this.cache.delete(key);
      if (this.overlay) this.overlay.set(key, undefined);
      this._track(this.deleteKeyAsync(key)).catch(() => {});
    } catch (error) {
      console.error('[FileSystemAdapter] Sync delete failed:', error);
    }
  }

  async deleteKeyAsync(key) {
    await this.init();
    const storage = await hf.getStorage();
    return await storage.removeItem(key);
  }
}

const storageAdapter = new StorageAdapterWrapper();

export const FSAdapter = {
  // Synchronous methods (the cache), named and called as in FSHelperFunctions
  getFromLocalStorage: (key) => storageAdapter.getFromLocalStorageSync(key),
  setInLocalStorage: (key, value, encoder) => storageAdapter.setInLocalStorageSync(key, value, encoder),
  getFileMetaData: (key) => storageAdapter.getFileMetaDataSync(key),
  getFileMetaDataSync: (key) => storageAdapter.getFileMetaDataSync(key),
  getFileData: (key) => storageAdapter.getFileDataSync(key),
  getFileDataSync: (key) => storageAdapter.getFileDataSync(key),
  hasKey: (key) => storageAdapter.hasKey(key),
  deleteKey: (key) => storageAdapter.deleteKeySync(key),

  // Async methods (IndexedDB directly)
  getFromLocalStorageAsync: (key) => storageAdapter.getFromLocalStorageAsync(key),
  setInLocalStorageAsync: (key, value) => storageAdapter.setInLocalStorageAsync(key, value),
  getFileMetaDataAsync: (key) => storageAdapter.getFileMetaDataAsync(key),
  getFileDataAsync: (key) => storageAdapter.getFileDataAsync(key),
  deleteKeyAsync: (key) => storageAdapter.deleteKeyAsync(key),

  // Encoding/decoding functions (pass-through from hf)
  encodeFileMetaData: hf.encodeFileMetaData,
  decodeFileMetaData: hf.decodeFileMetaData,
  encodeFileData: hf.encodeFileData,
  decodeFileData: hf.decodeFileData,

  // The store's connection: closed before this tab deletes the store; the callback runs
  // when another tab deletes it (the connection is closed first, so the delete goes through)
  closeStore: () => hf.getStorage().then((storage) => storage.close()),
  onStoreDeleted: (fn) => hf.getStorage().then((storage) => { storage.onVersionChange = fn; }),

  // Tabs: every write made so far, in the database; the store read again; whether another tab wrote since
  // (markBehind: the storage event said so), and its callback when a list write of this tab merged theirs
  flush: () => storageAdapter.flush(),
  reload: () => storageAdapter.reload(),
  isBehind: () => storageAdapter.isBehind(),
  markBehind: () => { storageAdapter.behind = true; },
  onBehind: (fn) => { storageAdapter.onBehind = fn; },
  setMerger: (mergerFor) => { storageAdapter.mergerFor = mergerFor; },

  init: (type = 'indexeddb') => storageAdapter.init(type),

  getStorageType: () => storageAdapter.storageType,
  isInitialized: () => storageAdapter.initialized
};

if (typeof window !== 'undefined') {
  // initialized on import, in the background
  storageAdapter.init().catch((error) => {
    console.error('[FileSystemAdapter] Auto-init failed:', error);
  });
}

export default FSAdapter;
