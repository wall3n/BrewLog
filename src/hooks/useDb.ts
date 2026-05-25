import { db } from '../db/schema';
import { useApp } from '../context/AppContext';
import type { Bean, Equipment, Recipe, Extraction, AppSettings } from '../db/types';

const now = () => new Date().toISOString();

export function useDb() {
  const { dispatch } = useApp();

  return {
    // Extractions
    async addExtraction(data: Omit<Extraction, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
      const ts = now();
      const id = await db.extractions.add({ ...data, createdAt: ts, updatedAt: ts });
      const saved = await db.extractions.get(id as number);
      if (saved) dispatch({ type: 'ADD_EXTRACTION', payload: saved });
      return id as number;
    },
    async updateExtraction(data: Extraction): Promise<void> {
      await db.extractions.put({ ...data, updatedAt: now() });
      dispatch({ type: 'UPDATE_EXTRACTION', payload: data });
    },
    async deleteExtraction(id: number): Promise<void> {
      await db.extractions.delete(id);
      dispatch({ type: 'DELETE_EXTRACTION', id });
    },

    // Beans
    async addBean(data: Omit<Bean, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bean> {
      const ts = now();
      const id = await db.beans.add({ ...data, createdAt: ts, updatedAt: ts });
      const saved = await db.beans.get(id as number);
      if (saved) dispatch({ type: 'ADD_BEAN', payload: saved });
      return saved!;
    },
    async updateBean(data: Bean): Promise<void> {
      await db.beans.put({ ...data, updatedAt: now() });
      dispatch({ type: 'UPDATE_BEAN', payload: data });
    },
    async deleteBean(id: number): Promise<void> {
      await db.beans.delete(id);
      dispatch({ type: 'DELETE_BEAN', id });
    },

    // Equipment
    async addEquipment(data: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
      const ts = now();
      const id = await db.equipment.add({ ...data, createdAt: ts, updatedAt: ts });
      const saved = await db.equipment.get(id as number);
      if (saved) dispatch({ type: 'ADD_EQUIPMENT', payload: saved });
    },
    async deleteEquipment(id: number): Promise<void> {
      await db.equipment.delete(id);
      dispatch({ type: 'DELETE_EQUIPMENT', id });
    },

    // Recipes
    async addRecipe(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
      const ts = now();
      const id = await db.recipes.add({ ...data, createdAt: ts, updatedAt: ts });
      const saved = await db.recipes.get(id as number);
      if (saved) dispatch({ type: 'ADD_RECIPE', payload: saved });
    },
    async deleteRecipe(id: number): Promise<void> {
      await db.recipes.delete(id);
      dispatch({ type: 'DELETE_RECIPE', id });
    },

    // Settings
    async updateSettings(data: Partial<AppSettings>): Promise<void> {
      const ts = now();
      const existing = await db.settings.toArray();
      if (existing[0]?.id) {
        await db.settings.update(existing[0].id, data as Partial<AppSettings>);
      } else {
        const base: AppSettings = { weightUnit: 'g', tempUnit: 'C', volumeUnit: 'ml', ratingScale: '5', defaultMethod: 'espresso', theme: 'system' };
        await db.settings.add({ ...base, ...data, createdAt: ts, updatedAt: ts } as AppSettings & { createdAt: string; updatedAt: string });
      }
      dispatch({ type: 'UPDATE_SETTINGS', payload: data });
    },

    // Export / Import
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
  };
}
