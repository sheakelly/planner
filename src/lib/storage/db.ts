import {  openDB } from 'idb';
import type {IDBPDatabase} from 'idb';
import type { Block, Day } from '../../types';

const DB_NAME = 'planner-db';
const DB_VERSION = 1;

interface PlannerDB {
  days: {
    key: string;
    value: Day;
    indexes: { date: string };
  };
  blocks: {
    key: string;
    value: Block;
    indexes: { dayId: string; start: string };
  };
}

let dbInstance: IDBPDatabase<PlannerDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<PlannerDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<PlannerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Days store
      if (!db.objectStoreNames.contains('days')) {
        const dayStore = db.createObjectStore('days', { keyPath: 'id' });
        dayStore.createIndex('date', 'date', { unique: true });
      }

      // Blocks store
      if (!db.objectStoreNames.contains('blocks')) {
        const blockStore = db.createObjectStore('blocks', { keyPath: 'id' });
        blockStore.createIndex('dayId', 'dayId', { unique: false });
        blockStore.createIndex('start', 'start', { unique: false });
      }
    },
  });

  return dbInstance;
}
