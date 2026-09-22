export interface StockChange { beanId: number; deltaG: number; }   // negative = coffee used
export interface DoseRef { beanId: number; dose: number; }

export const LOW_STOCK_SERVINGS = 3;
const DOSE_SAMPLE = 5;

const round1 = (n: number): number => Math.round(n * 10) / 10;

// prev = the brew before the write (null for a new brew). next = after it (null for a delete).
export function stockChanges(prev: DoseRef | null, next: DoseRef | null): readonly StockChange[] {
  const deltas = new Map<number, number>();
  const add = (beanId: number, delta: number): void => {
    deltas.set(beanId, (deltas.get(beanId) ?? 0) + delta);
  };
  if (prev) add(prev.beanId, prev.dose);
  if (next) add(next.beanId, -next.dose);
  return [...deltas]
    .map(([beanId, delta]) => ({ beanId, deltaG: round1(delta) }))
    .filter(change => change.deltaG !== 0);
}

export function applyStockChange(weightG: number | undefined, deltaG: number): number | undefined {
  if (weightG == null) return undefined;
  return Math.max(0, round1(weightG + deltaG));
}

export function nextInitialWeight(
  prevInitial: number | undefined,
  prevWeight: number | undefined,
  newWeight: number | undefined,
): number | undefined {
  if (newWeight == null) return undefined;
  const bag = prevInitial ?? prevWeight;
  if (bag == null || newWeight > bag) return newWeight;
  return bag;
}

export function averageDose(dosesNewestFirst: readonly number[], fallback: number): number {
  const recent = dosesNewestFirst.filter(d => d > 0).slice(0, DOSE_SAMPLE);
  if (recent.length === 0) return fallback;
  return recent.reduce((sum, d) => sum + d, 0) / recent.length;
}

export function servingsLeft(weightG: number | undefined, avgDoseG: number): number | null {
  if (weightG == null || avgDoseG <= 0) return null;
  return Math.floor(weightG / avgDoseG);
}
