import { db } from './schema';
import type { Bean, Equipment, Recipe, Extraction, AppSettings } from './types';

const now = () => new Date().toISOString();
const daysAgo = (n: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
};
const uid = () => Math.random().toString(36).slice(2, 10);

export async function seedDemoData(): Promise<void> {
  const count = await db.beans.count();
  if (count > 0) return;

  const beanIds = await db.beans.bulkAdd([
    { name: 'Ethiopia Yirgacheffe', roaster: 'Sample Roasters', origin: 'Yirgacheffe, ETH', process: 'Washed', roast: 'light', roastedAt: daysAgo(10), notes: 'Jasmine, lemon zest, white tea finish.', status: 'active', weightG: 250, createdAt: now(), updatedAt: now() } as Bean,
    { name: 'Colombia Huila', roaster: 'Demo Coffee', origin: 'Huila, COL', process: 'Natural', roast: 'medium', roastedAt: daysAgo(22), notes: 'Red berry, dark chocolate, syrupy body.', status: 'active', weightG: 340, createdAt: now(), updatedAt: now() } as Bean,
    { name: 'Kenya Nyeri AA', roaster: 'Field Roastery', origin: 'Nyeri, KEN', process: 'Washed', roast: 'light', roastedAt: daysAgo(45), notes: 'Blackcurrant, tomato, grapefruit.', status: 'finished', weightG: 0, createdAt: now(), updatedAt: now() } as Bean,
    { name: 'Guji Anaerobic', roaster: 'Onyx Coffee Lab', origin: 'Guji, ETH', process: 'Anaerobic Natural', roast: 'light', status: 'wishlist', createdAt: now(), updatedAt: now() } as Bean,
  ], { allKeys: true });

  const eqIds = await db.equipment.bulkAdd([
    { type: 'Grinder', name: 'DF64', model: 'Gen 2 SSP MP', notes: '64mm flat burrs', usage: 12, createdAt: now(), updatedAt: now() } as Equipment,
    { type: 'Scale', name: 'Acaia Pearl', model: 'S', usage: 27, createdAt: now(), updatedAt: now() } as Equipment,
    { type: 'WDT', name: 'Normcore WDT', usage: 8, createdAt: now(), updatedAt: now() } as Equipment,
    { type: 'Machine', name: 'Lelit Bianca', model: 'V3', usage: 18, createdAt: now(), updatedAt: now() } as Equipment,
    { type: 'Kettle', name: 'Fellow Stagg EKG', usage: 6, createdAt: now(), updatedAt: now() } as Equipment,
  ], { allKeys: true });

  const b1 = beanIds[0] as number;
  const b2 = beanIds[1] as number;
  const eq1 = eqIds[0] as number;
  const eq2 = eqIds[1] as number;
  const eq4 = eqIds[3] as number;
  const eq5 = eqIds[4] as number;

  await db.recipes.bulkAdd([
    { name: 'Classic Espresso 1:2', method: 'espresso', ratio: 2.0, dose: 18, yield: 36, temp: 93, time: 28, stages: [], lastUsedAt: daysAgo(2), createdAt: now(), updatedAt: now() } as Recipe,
    { name: 'V60 Tetsu 4:6', method: 'pour-over', ratio: 16, dose: 20, yield: 320, temp: 92, time: 210, stages: [
      { id: uid(), label: 'Bloom', timeS: 0, weightG: 60 },
      { id: uid(), label: 'Pour 2 — Sweetness', timeS: 45, weightG: 120 },
      { id: uid(), label: 'Pour 3', timeS: 90, weightG: 200 },
      { id: uid(), label: 'Pour 4', timeS: 130, weightG: 260 },
      { id: uid(), label: 'Pour 5 — Finish', timeS: 170, weightG: 320 },
    ], lastUsedAt: daysAgo(5), createdAt: now(), updatedAt: now() } as Recipe,
  ]);

  const base: Omit<Extraction, 'beanId' | 'createdAt'> = {
    method: 'espresso', equipmentIds: [eq1, eq2, eq4], grindSetting: '2.3',
    dose: 18, yield: 36, ratio: 2.0, timeS: 28, temp: 93, pressure: 9,
    tds: null, flag: 'dialled', rating: 4,
    acidity: 4, sweetness: 4, bitterness: 2, body: 4, balance: 4,
    flavours: ['chocolate', 'cherry'], notes: '', updatedAt: now(),
  };

  await db.extractions.bulkAdd([
    { ...base, rating: 5, flag: 'dialled', method: 'pour-over', beanId: b1, dose: 20, yield: 320, ratio: 16, timeS: 210, temp: 92, equipmentIds: [eq1, eq2, eq5], grindSetting: '6.5', tds: 1.42, flavours: ['floral', 'jasmine', 'honey'], notes: 'Best one all week. Hold this dial.', createdAt: daysAgo(1) } as Extraction,
    { ...base, rating: 4, flag: 'dialled', beanId: b1, dose: 18, yield: 38, ratio: 2.1, timeS: 30, grindSetting: '2.2', tds: 9.4, flavours: ['chocolate', 'caramel'], notes: 'Solid. Slight bitterness on finish.', createdAt: daysAgo(2) } as Extraction,
    { ...base, rating: 3, flag: 'adjust', beanId: b1, dose: 18, yield: 41, timeS: 22, ratio: 2.3, grindSetting: '2.5', flavours: ['nutty', 'earthy'], notes: 'Pulled fast. Tighten grind one notch.', createdAt: daysAgo(3) } as Extraction,
    { ...base, rating: 2, flag: 'fail', beanId: b2, dose: 19, yield: 28, timeS: 42, ratio: 1.5, grindSetting: '1.8', flavours: ['bitter'], notes: 'Choked, sour finish. Wrong basket.', createdAt: daysAgo(5) } as Extraction,
    { ...base, rating: 4, flag: 'dialled', beanId: b2, dose: 18, yield: 36, timeS: 29, ratio: 2.0, grindSetting: '2.4', flavours: ['cherry', 'cocoa', 'molasses'], notes: 'Lush body. Light retro nasal.', createdAt: daysAgo(7) } as Extraction,
    { ...base, rating: 3, flag: 'adjust', beanId: b2, dose: 18, yield: 36, timeS: 26, ratio: 2.0, grindSetting: '2.5', flavours: ['nutty'], notes: '', createdAt: daysAgo(9) } as Extraction,
    { ...base, rating: 5, flag: 'dialled', method: 'aeropress', beanId: b1, dose: 15, yield: 210, ratio: 14, timeS: 90, temp: 88, equipmentIds: [eq1, eq2], grindSetting: '8.5', flavours: ['bergamot', 'apricot'], notes: 'Sweet, juicy. Repeat with same dial.', createdAt: daysAgo(11) } as Extraction,
    { ...base, rating: 4, flag: 'dialled', method: 'french-press', beanId: b2, dose: 30, yield: 480, ratio: 16, timeS: 240, temp: 94, equipmentIds: [eq1, eq2], grindSetting: '15', flavours: ['stone fruit', 'honey'], notes: '', createdAt: daysAgo(13) } as Extraction,
  ]);

  await db.settings.add({
    weightUnit: 'g', tempUnit: 'C', volumeUnit: 'ml',
    ratingScale: '5', defaultMethod: 'espresso', theme: 'system',
    createdAt: now(), updatedAt: now(),
  } as AppSettings & { createdAt: string; updatedAt: string });
}
