import { openDB } from 'idb';

const DB_NAME = 'usana-empire-tools';
const DB_VERSION = 1;

/**
 * Initializes IndexedDB with the required entity stores.
 */
export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('customers')) {
        db.createObjectStore('customers', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('purchases')) {
        db.createObjectStore('purchases', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('ledger')) {
        db.createObjectStore('ledger', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('prospects')) {
        db.createObjectStore('prospects', { keyPath: 'id' });
      }
    },
  });
}

/**
 * Shared storage interface enforcing the "no direct IndexedDB calls outside adapter" rule.
 */
export const storageAdapter = {
  async get(storeName, id) {
    const db = await initDB();
    return db.get(storeName, id);
  },
  async list(storeName) {
    const db = await initDB();
    return db.getAll(storeName);
  },
  async set(storeName, item) {
    const db = await initDB();
    return db.put(storeName, item);
  },
  async delete(storeName, id) {
    const db = await initDB();
    return db.delete(storeName, id);
  }
};