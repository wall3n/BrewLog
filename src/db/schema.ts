import Dexie, { type Table } from 'dexie';
import type { Bean, Equipment, Recipe, Extraction, AppSettings } from './types';

export class AppDB extends Dexie {
  beans!: Table<Bean, number>;
  equipment!: Table<Equipment, number>;
  recipes!: Table<Recipe, number>;
  extractions!: Table<Extraction, number>;
  settings!: Table<AppSettings, number>;

  constructor() {
    super('BrewLog');
    this.version(1).stores({
      beans: '++id, status, roastedAt, createdAt',
      equipment: '++id, type, createdAt',
      recipes: '++id, method, createdAt',
      extractions: '++id, method, beanId, flag, rating, createdAt',
      settings: '++id',
    });
  }
}

export const db = new AppDB();
