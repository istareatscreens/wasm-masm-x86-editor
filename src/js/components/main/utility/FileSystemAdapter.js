/**
 * FileSystem Adapter - Maintains backward compatibility for FileSystem.js
 * 
 * This adapter wraps FileSystem methods to handle both sync and async storage operations,
 * ensuring existing code continues to work without modifications while supporting the
 * new IndexedDB storage backend.
 */

import * as hf from './filesystem/FSHelperFunctions.js';

/**
 * Storage Adapter Wrapper
 * Provides both sync and async interfaces for storage operations
 */
class StorageAdapterWrapper {
  constructor() {
    this.initialized = false;
    this.storageType = null;
    // In-memory mirror of the IndexedDB store. Seeded once on init() so the
    // existing SYNCHRONOUS FileSystem code can read without awaiting, while the
    // durable store is IndexedDB (NOT localStorage — localStorage is reserved for
    // legacy files only, which the "download legacy" button detects).
    this.cache = new Map();
    this._initPromise = null;
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
      // Seed the sync cache with everything already in the durable store.
      try {
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

  /**
   * Get value from storage (sync-compatible)
   * Uses localStorage directly for synchronous access
   * @param {string} key
   * @returns {string|null}
   */
  getFromLocalStorageSync(key) {
    // Sync read from the in-memory cache (mirror of IndexedDB). Returns null when
    // absent, matching localStorage.getItem semantics.
    return this.cache.has(key) ? this.cache.get(key) : null;
  }

  /**
   * Get value from storage (async)
   * Uses IndexedDB for async access
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  async getFromLocalStorageAsync(key) {
    await this.init();
    return await hf.getFromLocalStorage(key);
  }

  /**
   * Set value in storage (sync-compatible). Applies the optional encoder (the
   * existing FileSystem code passes btoa / encodeFileData / encodeFileMetaData as
   * the 3rd arg and relies on it), writes to localStorage for immediate sync
   * reads, AND write-throughs to IndexedDB in the background so the durable
   * migration target stays populated.
   * @param {string} key
   * @param {*} value
   * @param {(v:*)=>string} [encoder]
   */
  setInLocalStorageSync(key, value, encoder) {
    try {
      const encoded = encoder ? encoder(value) : value;
      // Update the sync cache immediately, and durably persist to IndexedDB in the
      // background. Deliberately does NOT write window.localStorage — the new
      // version keeps files out of localStorage so the "download legacy files"
      // button only fires for genuine pre-migration files.
      this.cache.set(key, encoded);
      this.setInLocalStorageAsync(key, encoded).catch(() => {});
    } catch (error) {
      console.error('[FileSystemAdapter] Sync set failed:', error);
    }
  }

  /**
   * Set value in storage (async)
   * Uses IndexedDB for async access
   * @param {string} key
   * @param {string} value
   * @returns {Promise<void>}
   */
  async setInLocalStorageAsync(key, value) {
    await this.init();
    return await hf.setInLocalStorage(key, value, (v) => v);
  }

  /**
   * Get file metadata (sync-compatible)
   * @param {string} key
   * @returns {Object|null}
   */
  getFileMetaDataSync(key) {
    if (!key) return null;
    const data = this.getFromLocalStorageSync(key);
    if (!data) return null;
    return hf.decodeFileMetaData(data);
  }

  /**
   * Get file metadata (async)
   * @param {string} key
   * @returns {Promise<Object|null>}
   */
  async getFileMetaDataAsync(key) {
    await this.init();
    return await hf.getFileMetaData(key);
  }

  /**
   * Get file data (sync-compatible)
   * @param {string} key
   * @returns {string}
   */
  getFileDataSync(key) {
    if (!key) return '';
    const data = this.getFromLocalStorageSync(key);
    if (!data) return '';
    return hf.decodeFileData(data);
  }

  /**
   * Get file data (async)
   * @param {string} key
   * @returns {Promise<string>}
   */
  async getFileDataAsync(key) {
    await this.init();
    return await hf.getFileData(key);
  }

  /**
   * Check if key exists (sync)
   * @param {string} key
   * @returns {boolean}
   */
  hasKey(key) {
    return this.getFromLocalStorageSync(key) !== null;
  }

  /**
   * Delete key (sync)
   * @param {string} key
   */
  deleteKeySync(key) {
    try {
      this.cache.delete(key);
      // Keep IndexedDB in sync (non-blocking).
      this.deleteKeyAsync(key).catch(() => {});
    } catch (error) {
      console.error('[FileSystemAdapter] Sync delete failed:', error);
    }
  }

  /**
   * Delete key (async)
   * @param {string} key
   * @returns {Promise<void>}
   */
  async deleteKeyAsync(key) {
    await this.init();
    const storage = await hf.getStorage();
    return await storage.removeItem(key);
  }
}

// Create singleton instance
const storageAdapter = new StorageAdapterWrapper();

/**
 * Wrapped FileSystem helper functions that maintain backward compatibility
 */
export const FSAdapter = {
  // Synchronous methods (localStorage for immediate reads; writes also mirror to
  // IndexedDB). Names/signatures match FSHelperFunctions so FileSystem.js can use
  // this as a drop-in `hf` without call-site changes.
  getFromLocalStorage: (key) => storageAdapter.getFromLocalStorageSync(key),
  setInLocalStorage: (key, value, encoder) => storageAdapter.setInLocalStorageSync(key, value, encoder),
  getFileMetaData: (key) => storageAdapter.getFileMetaDataSync(key),
  getFileMetaDataSync: (key) => storageAdapter.getFileMetaDataSync(key),
  getFileData: (key) => storageAdapter.getFileDataSync(key),
  getFileDataSync: (key) => storageAdapter.getFileDataSync(key),
  hasKey: (key) => storageAdapter.hasKey(key),
  deleteKey: (key) => storageAdapter.deleteKeySync(key),

  // Async methods (IndexedDB directly — for callers that can await)
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

  // Initialize storage
  init: (type = 'indexeddb') => storageAdapter.init(type),
  
  // Get storage type
  getStorageType: () => storageAdapter.storageType,
  isInitialized: () => storageAdapter.initialized
};

/**
 * Auto-initialize on import (async, non-blocking)
 */
if (typeof window !== 'undefined') {
  // Initialize storage in background
  storageAdapter.init().catch((error) => {
    console.error('[FileSystemAdapter] Auto-init failed:', error);
  });
}

export default FSAdapter;

/**
 * Usage Examples:
 * 
 * // Existing synchronous code (works unchanged):
 * import FSAdapter from './FileSystemAdapter';
 * const data = FSAdapter.getFromLocalStorage('/');
 * FSAdapter.setInLocalStorage('/myfile', 'data');
 * 
 * // New async code (for better performance):
 * import FSAdapter from './FileSystemAdapter';
 * await FSAdapter.init('indexeddb');
 * const data = await FSAdapter.getFromLocalStorageAsync('/');
 * await FSAdapter.setInLocalStorageAsync('/myfile', 'data');
 * 
 * // FileSystem.js can use sync methods without changes:
 * import * as hf from './filesystem/FSHelperFunctions.js';
 * // or:
 * import FSAdapter as hf from './FileSystemAdapter.js';
 * // Both work the same way!
 */
