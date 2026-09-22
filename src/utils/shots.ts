import type { Extraction } from '../db/types';

/** Lab-sheet sample number, e.g. 42 → "0042". */
export function sampleNo(n: number | undefined): string {
  return String(n ?? 0).padStart(4, '0');
}

/** Most recent shot before `ref` with the same bean and method. `list` is newest first. */
export function previousShot(
  list: readonly Extraction[],
  ref: { id?: number; beanId: number | null; method: string; createdAt?: string },
): Extraction | null {
  const refTime = ref.createdAt ? new Date(ref.createdAt).getTime() : Infinity;
  return list.find(e =>
    e.id !== ref.id &&
    e.beanId === ref.beanId &&
    e.method === ref.method &&
    new Date(e.createdAt).getTime() < refTime,
  ) ?? null;
}

/** Signed delta text with a real minus sign, or null when there is no reference. */
export function fmtDelta(value: number, prev: number | undefined | null, decimals = 1): string | null {
  if (prev == null) return null;
  const f = 10 ** decimals;
  const d = Math.round((value - prev) * f) / f;
  if (d === 0) return '±0';
  return `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(decimals)}`;
}

/** Numeric grind settings step by 1, or by 0.1 when the setting already has decimals. */
export function grindStep(grind: string): number {
  return grind.includes('.') || grind.includes(',') ? 0.1 : 1;
}

/** Fields to carry into the next shot: parameters stay, tasting resets. */
export function nextShotFrom(e: Extraction): Partial<Extraction> {
  return {
    method: e.method,
    beanId: e.beanId,
    equipmentIds: e.equipmentIds,
    grindSetting: e.grindSetting,
    dose: e.dose,
    yield: e.yield,
    ratio: e.ratio,
    timeS: e.timeS,
    temp: e.temp,
    pressure: e.pressure,
  };
}

const FLAG_ICON: Record<Extraction['flag'], string> = {
  dialled: 'check',
  adjust: 'delta',
  fail: 'x',
};

/** Icon name for an outcome flag: tick, delta, cross. */
export function flagIcon(flag: Extraction['flag']): string {
  return FLAG_ICON[flag];
}
