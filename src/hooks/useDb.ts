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

    // ── Paginated Queries ─────────────────────────────────────────
    async getBeansPage(query: {
      status: 'active' | 'finished' | 'wishlist';
      q?: string;
      roastFilter?: 'all' | 'light' | 'medium' | 'dark';
      sort: 'nameAsc' | 'nameDesc' | 'roastedDesc' | 'roastedAsc' | 'createdDesc';
      page: number;
      limit: number;
    }): Promise<{ items: Bean[]; total: number }> {
      const collection = db.beans.where('status').equals(query.status);
      let list = await collection.toArray();
      
      if (query.roastFilter && query.roastFilter !== 'all') {
        list = list.filter(b => b.roast === query.roastFilter);
      }
      
      if (query.q) {
        const ql = query.q.toLowerCase();
        list = list.filter(b => 
          b.name.toLowerCase().includes(ql) ||
          b.roaster.toLowerCase().includes(ql) ||
          (b.origin ?? '').toLowerCase().includes(ql) ||
          (b.process ?? '').toLowerCase().includes(ql) ||
          (b.notes ?? '').toLowerCase().includes(ql)
        );
      }
      
      list.sort((a, b) => {
        if (query.sort === 'nameAsc') return a.name.localeCompare(b.name);
        if (query.sort === 'nameDesc') return b.name.localeCompare(a.name);
        if (query.sort === 'roastedDesc') {
          const da = a.roastedAt ? new Date(a.roastedAt).getTime() : 0;
          const db = b.roastedAt ? new Date(b.roastedAt).getTime() : 0;
          return db - da;
        }
        if (query.sort === 'roastedAsc') {
          const da = a.roastedAt ? new Date(a.roastedAt).getTime() : 0;
          const db = b.roastedAt ? new Date(b.roastedAt).getTime() : 0;
          return da - db;
        }
        const ca = new Date(a.createdAt).getTime();
        const cb = new Date(b.createdAt).getTime();
        return cb - ca;
      });
      
      const total = list.length;
      const offset = (query.page - 1) * query.limit;
      const items = list.slice(offset, offset + query.limit);
      return { items, total };
    },

    async getBeansCountByStatus(status: 'active' | 'finished' | 'wishlist'): Promise<number> {
      return db.beans.where('status').equals(status).count();
    },

    async getBeansTotalCount(): Promise<number> {
      return db.beans.count();
    },

    async getEquipmentPage(query: {
      typeFilter: string;
      q?: string;
      sort: 'nameAsc' | 'nameDesc' | 'usesDesc' | 'usesAsc' | 'createdDesc';
      page: number;
      limit: number;
    }): Promise<{ items: Equipment[]; total: number }> {
      let list = await db.equipment.toArray();
      
      if (query.typeFilter && query.typeFilter !== 'all') {
        list = list.filter(e => e.type === query.typeFilter);
      }
      
      if (query.q) {
        const ql = query.q.toLowerCase();
        list = list.filter(e => 
          e.name.toLowerCase().includes(ql) ||
          (e.model ?? '').toLowerCase().includes(ql) ||
          (e.notes ?? '').toLowerCase().includes(ql)
        );
      }
      
      list.sort((a, b) => {
        if (query.sort === 'nameAsc') return a.name.localeCompare(b.name);
        if (query.sort === 'nameDesc') return b.name.localeCompare(a.name);
        if (query.sort === 'usesDesc') return (b.usage ?? 0) - (a.usage ?? 0);
        if (query.sort === 'usesAsc') return (a.usage ?? 0) - (b.usage ?? 0);
        const ca = new Date(a.createdAt).getTime();
        const cb = new Date(b.createdAt).getTime();
        return cb - ca;
      });
      
      const total = list.length;
      const offset = (query.page - 1) * query.limit;
      const items = list.slice(offset, offset + query.limit);
      return { items, total };
    },

    async getEquipmentTotalCount(): Promise<number> {
      return db.equipment.count();
    },

    async getRecipesPage(query: {
      method: string;
      q?: string;
      sort: 'recent' | 'name' | 'fastest' | 'doseDesc' | 'yieldDesc' | 'createdDesc';
      page: number;
      limit: number;
    }): Promise<{ items: Recipe[]; total: number }> {
      let list = await db.recipes.toArray();
      
      if (query.method && query.method !== 'all') {
        list = list.filter(r => r.method === query.method);
      }
      
      if (query.q) {
        const ql = query.q.toLowerCase();
        list = list.filter(r => r.name.toLowerCase().includes(ql));
      }
      
      list.sort((a, b) => {
        if (query.sort === 'name') return a.name.localeCompare(b.name);
        if (query.sort === 'fastest') return (a.time || 0) - (b.time || 0);
        if (query.sort === 'doseDesc') return (b.dose || 0) - (a.dose || 0);
        if (query.sort === 'yieldDesc') return (b.yield || 0) - (a.yield || 0);
        if (query.sort === 'createdDesc') {
          const ca = new Date(a.createdAt).getTime();
          const cb = new Date(b.createdAt).getTime();
          return cb - ca;
        }
        const ax = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
        const bx = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
        return bx - ax;
      });
      
      const total = list.length;
      const offset = (query.page - 1) * query.limit;
      const items = list.slice(offset, offset + query.limit);
      return { items, total };
    },

    async getRecipesTotalCount(): Promise<number> {
      return db.recipes.count();
    },

    async getRecipeMethods(): Promise<string[]> {
      return db.recipes.orderBy('method').uniqueKeys() as Promise<string[]>;
    },

    async getExtractionsPage(query: {
      q?: string;
      methodFilter: string;
      flagFilter: string;
      ratingFilter: number;
      sort: 'dateDesc'|'dateAsc'|'ratingDesc'|'ratingAsc'|'timeDesc'|'timeAsc'|'ratioDesc'|'ratioAsc';
      page: number;
      limit: number;
    }): Promise<{ items: Extraction[]; total: number }> {
      const beans = await db.beans.toArray();
      let list = await db.extractions.toArray();
      
      if (query.methodFilter && query.methodFilter !== 'all') {
        list = list.filter(e => e.method === query.methodFilter);
      }
      
      if (query.flagFilter && query.flagFilter !== 'all') {
        list = list.filter(e => e.flag === query.flagFilter);
      }
      
      if (query.ratingFilter && query.ratingFilter > 0) {
        list = list.filter(e => (e.rating ?? 0) >= query.ratingFilter);
      }
      
      if (query.q) {
        const ql = query.q.toLowerCase();
        list = list.filter(e => {
          const bean = beans.find(b => b.id === e.beanId);
          const text = `${bean?.name ?? ''} ${bean?.roaster ?? ''} ${e.notes ?? ''} ${(e.flavours ?? []).join(' ')}`.toLowerCase();
          return text.includes(ql);
        });
      }
      
      list.sort((a, b) => {
        if (query.sort === 'dateDesc') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (query.sort === 'dateAsc') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (query.sort === 'ratingDesc') {
          return (b.rating ?? 0) - (a.rating ?? 0);
        }
        if (query.sort === 'ratingAsc') {
          return (a.rating ?? 0) - (b.rating ?? 0);
        }
        if (query.sort === 'timeDesc') {
          return (b.timeS ?? 0) - (a.timeS ?? 0);
        }
        if (query.sort === 'timeAsc') {
          return (a.timeS ?? 0) - (b.timeS ?? 0);
        }
        if (query.sort === 'ratioDesc') {
          return (b.ratio ?? 0) - (a.ratio ?? 0);
        }
        if (query.sort === 'ratioAsc') {
          return (a.ratio ?? 0) - (b.ratio ?? 0);
        }
        return 0;
      });
      
      const total = list.length;
      const offset = (query.page - 1) * query.limit;
      const items = list.slice(offset, offset + query.limit);
      return { items, total };
    },

    async getExtractionsTotalCount(): Promise<number> {
      return db.extractions.count();
    },

    async getExtractionMethods(): Promise<string[]> {
      return db.extractions.orderBy('method').uniqueKeys() as Promise<string[]>;
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
    async updateRecipe(data: Partial<Recipe> & { id: number }): Promise<void> {
      const existing = await db.recipes.get(data.id);
      if (!existing) return;
      await db.recipes.put({ ...existing, ...data, updatedAt: now() });
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
