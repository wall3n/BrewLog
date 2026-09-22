import type { Bean, Extraction } from '../db/types';

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

export type BrewKind = 'espresso' | 'filter';
export type FreshnessState = 'resting' | 'peak' | 'fading' | 'stale' | 'unknown';

export interface Freshness {
  days: number | null;
  state: FreshnessState;
  daysUntilPeak: number | null;
  daysLeftInPeak: number | null;
}

export interface BeanUsage { doses: number[]; lastMethod: string; }   // doses newest first

export interface BeanStockView {
  freshness: Freshness;
  servings: number | null;
  isLow: boolean;
  isEmpty: boolean;
}

// Days off roast. Espresso needs more rest for the CO2 to leave the bean.
export const REST_WINDOWS: Readonly<Record<BrewKind, readonly [number, number]>> = {
  espresso: [7, 21],
  filter: [5, 14],
};

const DEFAULT_DOSE_G: Readonly<Record<BrewKind, number>> = { espresso: 18, filter: 15 };
const DAY_MS = 86_400_000;
const UNKNOWN: Freshness = { days: null, state: 'unknown', daysUntilPeak: null, daysLeftInPeak: null };

export function brewKind(method: string): BrewKind {
  return method === 'espresso' || method === 'moka-pot' ? 'espresso' : 'filter';
}

export function getFreshness(roastedAt: string | undefined, kind: BrewKind, now: Date): Freshness {
  if (!roastedAt) return UNKNOWN;
  const roasted = new Date(roastedAt).getTime();
  if (Number.isNaN(roasted)) return UNKNOWN;
  const days = Math.max(0, Math.floor((now.getTime() - roasted) / DAY_MS));
  const [start, end] = REST_WINDOWS[kind];
  if (days < start) return { days, state: 'resting', daysUntilPeak: start - days, daysLeftInPeak: null };
  if (days <= end) return { days, state: 'peak', daysUntilPeak: null, daysLeftInPeak: end - days };
  const state: FreshnessState = days <= end * 2 ? 'fading' : 'stale';
  return { days, state, daysUntilPeak: null, daysLeftInPeak: null };
}

export function summariseUsage(
  extractions: readonly Pick<Extraction, 'beanId' | 'dose' | 'method' | 'createdAt'>[],
): Map<number, BeanUsage> {
  const newestFirst = [...extractions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const usage = new Map<number, BeanUsage>();
  for (const e of newestFirst) {
    const entry = usage.get(e.beanId) ?? { doses: [], lastMethod: e.method };
    entry.doses.push(e.dose);
    usage.set(e.beanId, entry);
  }
  return usage;
}

export function beanStockView(
  bean: Pick<Bean, 'roastedAt' | 'weightG'>,
  usage: BeanUsage | undefined,
  fallbackMethod: string,
  now: Date,
): BeanStockView {
  const kind = brewKind(usage?.lastMethod ?? fallbackMethod);
  const servings = servingsLeft(bean.weightG, averageDose(usage?.doses ?? [], DEFAULT_DOSE_G[kind]));
  return {
    freshness: getFreshness(bean.roastedAt, kind, now),
    servings,
    isLow: servings !== null && servings <= LOW_STOCK_SERVINGS,
    isEmpty: bean.weightG === 0,
  };
}
