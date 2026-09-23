import type { Water } from '../db/types';

export const MAX_WATER_BRAND_LENGTH = 60;
export const WATER_TDS_RANGE: readonly [number, number] = [0, 1000];

// Empty text: no TDS (undefined). Text that is not a number in range: null.
export function parseTds(text: string): number | undefined | null {
  if (text.trim() === '') return undefined;
  const n = Number(text);
  return Number.isFinite(n) && n >= WATER_TDS_RANGE[0] && n <= WATER_TDS_RANGE[1] ? n : null;
}

// Brands compare without case and outer spaces. exceptId skips the water being edited.
export function isDuplicateWater(waters: readonly Water[], brand: string, exceptId?: number): boolean {
  const key = brand.trim().toLowerCase();
  return waters.some(w => w.id !== exceptId && w.brand.trim().toLowerCase() === key);
}
