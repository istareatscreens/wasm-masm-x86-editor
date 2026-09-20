/**
 * Storage Adapter Pattern - Provides unified interface for LocalStorage and IndexedDB
 * 
 * This adapter allows seamless switching between storage backends without
 * modifying the FileSystem.js code.
 */

const DB_NAME = 'BoxedwineFileSystem';
const DB_VERSION = 1;
const STORE_NAME = 'files';

class StorageAdapter {
  constructor() {
    this.storageType = null; // 'localstorage' or 'indexeddb'
    this.db = null;
  }

  /**
   * Initialize the storage adapter
   * @param {string} type - 'localstorage' or 'indexeddb'
   * @returns {Promise<void>}
   */
  async init(type = 'indexeddb') {
    this.storageType = type.toLowerCase();
    
    if (this.storageType === 'indexeddb') {
      await this._initIndexedDB();
      console.log('[StorageAdapter] Initialized with IndexedDB');
    } else {
      console.log('[StorageAdapter] Initialized with LocalStorage');
    }
  }

  /**
   * Initialize IndexedDB connection
   * @private
   */
  async _initIndexedDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.warn('[StorageAdapter] IndexedDB not supported, falling back to LocalStorage');
        this.storageType = 'localstorage';
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[StorageAdapter] IndexedDB open error:', request.error);
        // Fallback to LocalStorage
        this.storageType = 'localstorage';
        resolve();
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('[StorageAdapter] IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          console.log('[StorageAdapter] Created object store:', STORE_NAME);
        }
      };
    });
  }

  /**
   * Get item from storage
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  async getItem(key) {
    if (this.storageType === 'indexeddb') {
      return this._getItemIndexedDB(key);
    } else {
      return Promise.resolve(this._getItemLocalStorage(key));
    }
  }

  /**
   * Set item in storage
   * @param {string} key
   * @param {string} value
   * @returns {Promise<void>}
   */
  async setItem(key, value) {
    if (this.storageType === 'indexeddb') {
      return this._setItemIndexedDB(key, value);
    } else {
      return Promise.resolve(this._setItemLocalStorage(key, value));
    }
  }

  /**
   * Remove item from storage
   * @param {string} key
   * @returns {Promise<void>}
   */
  async removeItem(key) {
    if (this.storageType === 'indexeddb') {
      return this._removeItemIndexedDB(key);
    } else {
      return Promise.resolve(this._removeItemLocalStorage(key));
    }
  }

  /**
   * Get all keys from storage
   * @returns {Promise<string[]>}
   */
  async keys() {
    if (this.storageType === 'indexeddb') {
      return this._keysIndexedDB();
    } else {
      return Promise.resolve(this._keysLocalStorage());
    }
  }

  /**
   * Clear all storage
   * @returns {Promise<void>}
   */
  async clear() {
    if (this.storageType === 'indexeddb') {
      return this._clearIndexedDB();
    } else {
      return Promise.resolve(this._clearLocalStorage());
    }
  }

  /**
   * Get ALL [key, value] entries. Used to seed a synchronous in-memory cache from
   * IndexedDB on startup so the existing synchronous FileSystem code can read
   * without awaiting.
   * @returns {Promise<Array<[string, string]>>}
   */
  async getAll() {
    if (this.storageType === 'indexeddb') {
      return this._getAllIndexedDB();
    } else {
      return Promise.resolve(this._getAllLocalStorage());
    }
  }

  async _getAllIndexedDB() {
    return new Promise((resolve) => {
      try {
        const transaction = this.db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onsuccess = () => resolve((request.result || []).map((r) => [r.key, r.value]));
        request.onerror = () => {
          console.error('[StorageAdapter] IndexedDB getAll error:', request.error);
          resolve([]);
        };
      } catch (error) {
        console.error('[StorageAdapter] IndexedDB getAll threw:', error);
        resolve([]);
      }
    });
  }

  _getAllLocalStorage() {
    const out = [];
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        out.push([k, window.localStorage.getItem(k)]);
      }
    } catch (error) {
      console.error('[StorageAdapter] LocalStorage getAll error:', error);
    }
    return out;
  }

  // IndexedDB implementations
  
  async _getItemIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };

      request.onerror = () => {
        console.error('[StorageAdapter] IndexedDB getItem error:', request.error);
        resolve(null);
      };
    });
  }

  async _setItemIndexedDB(key, value) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();

      request.onerror = () => {
        console.error('[StorageAdapter] IndexedDB setItem error:', request.error);
        reject(request.error);
      };
    });
  }

  async _removeItemIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onsuccess = () => resolve();

      request.onerror = () => {
        console.error('[StorageAdapter] IndexedDB removeItem error:', request.error);
        reject(request.error);
      };
    });
  }

  async _keysIndexedDB() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAllKeys();

      request.onsuccess = () => resolve(request.result || []);

      request.onerror = () => {
        console.error('[StorageAdapter] IndexedDB keys error:', request.error);
        resolve([]);
      };
    });
  }

  async _clearIndexedDB() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();

      request.onerror = () => {
        console.error('[StorageAdapter] IndexedDB clear error:', request.error);
        reject(request.error);
      };
    });
  }

  // LocalStorage implementations (synchronous fallbacks)
  
  _getItemLocalStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.error('[StorageAdapter] LocalStorage getItem error:', error);
      return null;
    }
  }

  _setItemLocalStorage(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.error('[StorageAdapter] LocalStorage setItem error:', error);
      throw error;
    }
  }

  _removeItemLocalStorage(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error('[StorageAdapter] LocalStorage removeItem error:', error);
      throw error;
    }
  }

  _keysLocalStorage() {
    try {
      return Object.keys(window.localStorage);
    } catch (error) {
      console.error('[StorageAdapter] LocalStorage keys error:', error);
      return [];
    }
  }

  _clearLocalStorage() {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error('[StorageAdapter] LocalStorage clear error:', error);
      throw error;
    }
  }
}

// Singleton: memoize the INIT PROMISE, not the instance. The previous version
// published the instance synchronously and then awaited init(), so a second
// concurrent caller (App settings save / file-list seed both run at mount)
// received an adapter whose `db` was still null and threw
// "Cannot read properties of null (reading 'transaction')" — an unhandled
// rejection that silently dropped that read/write. Every caller now awaits the
// same fully-initialised adapter.
let storageAdapterPromise = null;

/**
 * Get the storage adapter instance
 * @param {string} type - 'localstorage' or 'indexeddb'
 * @returns {Promise<StorageAdapter>}
 */
export function getStorageAdapter(type = 'indexeddb') {
  if (!storageAdapterPromise) {
    const instance = new StorageAdapter();
    storageAdapterPromise = instance.init(type).then(() => instance);
  }
  return storageAdapterPromise;
}

/**
 * Reset the storage adapter (for testing)
 */
export function resetStorageAdapter() {
  storageAdapterPromise = null;
}

export default StorageAdapter;
