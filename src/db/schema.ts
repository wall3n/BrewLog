import Dexie, { type Table } from 'dexie';
import type { Bean, Equipment, Recipe, Extraction, AppSettings, Water } from './types';

export class AppDB extends Dexie {
  beans!: Table<Bean, number>;
  equipment!: Table<Equipment, number>;
  recipes!: Table<Recipe, number>;
  extractions!: Table<Extraction, number>;
  settings!: Table<AppSettings, number>;
  waters!: Table<Water, number>;

  constructor() {
    super('BrewLog');
    this.version(1).stores({
      beans: '++id, status, roastedAt, createdAt',
      equipment: '++id, type, createdAt',
      recipes: '++id, method, createdAt',
      extractions: '++id, method, beanId, flag, rating, createdAt',
      settings: '++id',
    });
    this.version(2).stores({
      beans: '++id, status, roastedAt, createdAt',
      equipment: '++id, type, createdAt',
      recipes: '++id, method, createdAt',
      extractions: '++id, method, beanId, flag, rating, createdAt',
      settings: '++id',
    }).upgrade(tx => {
      return tx.table('settings').toCollection().modify((s: AppSettings) => {
        if (s.language === undefined) s.language = 'auto';
      });
    });
    this.version(3).stores({
      beans: '++id, status, roastedAt, createdAt',
      equipment: '++id, type, createdAt',
      recipes: '++id, method, createdAt',
      extractions: '++id, method, beanId, recipeId, flag, rating, createdAt',
      settings: '++id',
    }).upgrade(() => {
      // recipeId is optional. Existing extractions keep it undefined, so no data changes.
    });
    this.version(4).stores({
      beans: '++id, status, roastedAt, createdAt',
      equipment: '++id, type, createdAt',
      recipes: '++id, method, createdAt',
      extractions: '++id, method, beanId, recipeId, flag, rating, createdAt',
      settings: '++id',
      waters: '++id, brand, createdAt',
    }).upgrade(() => {
      // New empty waters table. waterId on recipes is optional, so no data changes.
    });
  }
}

export const db = new AppDB();
