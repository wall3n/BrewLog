import { db } from '../db/schema';
import { useApp } from '../context/AppContext';
import type { Bean, Equipment, Recipe, Extraction, AppSettings } from '../db/types';

const now = () => new Date().toISOString();

export function useDb() {
  const { dispatch } = useApp();

  return {
    // ── Read ──────────────────────────────────────────────────────
    async getAllExtractions(): Promise<Extraction[]> {
      return db.extractions.orderBy('createdAt').reverse().toArray();
    },
    async getExtraction(id: number): Promise<Extraction | undefined> {
      return db.extractions.get(id);
    },
    async getAllBeans(): Promise<Bean[]> {
      return db.beans.orderBy('createdAt').toArray();
    },
    async getBean(id: number): Promise<Bean | undefined> {
      return db.beans.get(id);
    },
    async getActiveBeans(): Promise<Bean[]> {
      return db.beans.where('status').equals('active').toArray();
    },
    async getAllEquipment(): Promise<Equipment[]> {
      return db.equipment.orderBy('createdAt').toArray();
    },
    async getAllRecipes(): Promise<Recipe[]> {
      return db.recipes.orderBy('createdAt').toArray();
    },
    async getRecipe(id: number): Promise<Recipe | undefined> {
      return db.recipes.get(id);
    },

    // ── Extractions ───────────────────────────────────────────────
    async addExtraction(data: Omit<Extraction, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
      const ts = now();
      const id = await db.extractions.add({ ...data, createdAt: ts, updatedAt: ts });
      return id as number;
    },
    async updateExtraction(data: Extraction): Promise<void> {
      await db.extractions.put({ ...data, updatedAt: now() });
    },
    async deleteExtraction(id: number): Promise<void> {
      await db.extractions.delete(id);
    },

    // ── Beans ─────────────────────────────────────────────────────
    async addBean(data: Omit<Bean, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bean> {
      const ts = now();
      const id = await db.beans.add({ ...data, createdAt: ts, updatedAt: ts });
      const saved = await db.beans.get(id as number);
      const activeBeans = await db.beans.where('status').equals('active').toArray();
      dispatch({ type: 'ACTIVE_BEANS_CHANGED', payload: activeBeans });
      return saved!;
    },
    async updateBean(data: Bean): Promise<void> {
      await db.beans.put({ ...data, updatedAt: now() });
      const activeBeans = await db.beans.where('status').equals('active').toArray();
      dispatch({ type: 'ACTIVE_BEANS_CHANGED', payload: activeBeans });
    },
    async deleteBean(id: number): Promise<void> {
      await db.beans.delete(id);
      const activeBeans = await db.beans.where('status').equals('active').toArray();
      dispatch({ type: 'ACTIVE_BEANS_CHANGED', payload: activeBeans });
    },

    // ── Equipment ─────────────────────────────────────────────────
    async addEquipment(data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
      const ts = now();
      await db.equipment.add({ ...data, createdAt: ts, updatedAt: ts });
    },
    async deleteEquipment(id: number): Promise<void> {
      await db.equipment.delete(id);
    },

    // ── Recipes ───────────────────────────────────────────────────
    async addRecipe(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
      const ts = now();
      await db.recipes.add({ ...data, createdAt: ts, updatedAt: ts });
    },
    async deleteRecipe(id: number): Promise<void> {
      await db.recipes.delete(id);
    },

    // ── Settings ──────────────────────────────────────────────────
    async updateSettings(data: Partial<AppSettings>): Promise<void> {
      const ts = now();
      const existing = await db.settings.toArray();
      if (existing[0]?.id) {
        await db.settings.update(existing[0].id, data as Partial<AppSettings>);
      } else {
        const base: AppSettings = { weightUnit: 'g', tempUnit: 'C', volumeUnit: 'ml', ratingScale: '5', defaultMethod: 'espresso', theme: 'system', language: 'auto' };
        await db.settings.add({ ...base, ...data, createdAt: ts, updatedAt: ts } as AppSettings & { createdAt: string; updatedAt: string });
      }
      dispatch({ type: 'UPDATE_SETTINGS', payload: data });
    },

    // ── Export / Import ───────────────────────────────────────────
    async exportAll() {
      const [beans, equipment, recipes, extractions, settings] = await Promise.all([
        db.beans.toArray(),
        db.equipment.toArray(),
        db.recipes.toArray(),
        db.extractions.toArray(),
        db.settings.toArray(),
      ]);
      return { beans, equipment, recipes, extractions, settings };
    },

    async importAll(data: {
      beans?: Bean[];
      equipment?: Equipment[];
      recipes?: Recipe[];
      extractions?: Extraction[];
    }): Promise<void> {
      await db.beans.clear();       await db.beans.bulkAdd(data.beans ?? []);
      await db.equipment.clear();   await db.equipment.bulkAdd(data.equipment ?? []);
      await db.recipes.clear();     await db.recipes.bulkAdd(data.recipes ?? []);
      await db.extractions.clear(); await db.extractions.bulkAdd(data.extractions ?? []);
    },

    async clearAll(): Promise<void> {
      await db.beans.clear();
      await db.equipment.clear();
      await db.recipes.clear();
      await db.extractions.clear();
      await db.settings.clear();
    },
  };
}
