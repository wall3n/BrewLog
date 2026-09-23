import type { Bean, Extraction } from '../db/types';

// A brew as the stock sees it. stockUsedG = grams really taken from the bean (undefined for old brews).
export interface StockBrew { beanId: number; dose: number; stockUsedG?: number; }

export interface StockPlan {
  weights: ReadonlyMap<number, number>;   // new weight of each bean that changes
  stockUsedG: number | undefined;         // value to store on the brew
}

export const LOW_STOCK_SERVINGS = 3;
const DOSE_SAMPLE = 5;

const round1 = (n: number): number => Math.round(n * 10) / 10;

// prev = the brew before the write (null for a new brew). next = after it (null for a delete).
// weightsBefore = current weight of the beans involved (undefined = bean not tracked).
// A bean gets back only what the brew really took, and never goes below 0.
export function planStock(
  prev: StockBrew | null,
  next: Omit<StockBrew, 'stockUsedG'> | null,
  weightsBefore: ReadonlyMap<number, number | undefined>,
): StockPlan {
  if (prev && next && prev.beanId === next.beanId && prev.dose === next.dose) {
    return { weights: new Map(), stockUsedG: prev.stockUsedG };
  }
  const weights = new Map(weightsBefore);
  if (prev) {
    const weight = weights.get(prev.beanId);
    if (weight != null) weights.set(prev.beanId, round1(weight + (prev.stockUsedG ?? 0)));
  }
  let stockUsedG: number | undefined;
  if (next) {
    stockUsedG = 0;
    const weight = weights.get(next.beanId);
    if (weight != null) {
      const after = Math.max(0, round1(weight - next.dose));
      stockUsedG = round1(weight - after);
      weights.set(next.beanId, after);
    }
  }
  const changed = new Map<number, number>();
  for (const [beanId, weight] of weights) {
    if (weight != null && weight !== weightsBefore.get(beanId)) changed.set(beanId, weight);
  }
  return { weights: changed, stockUsedG };
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

// Days off roast, inclusive. The peak starts on day 15 and lasts two weeks, for every method.
export const PEAK_WINDOW: readonly [number, number] = [15, 28];

const DEFAULT_DOSE_G: Readonly<Record<BrewKind, number>> = { espresso: 18, filter: 15 };
const DAY_MS = 86_400_000;
const UNKNOWN: Freshness = { days: null, state: 'unknown', daysUntilPeak: null, daysLeftInPeak: null };

export function brewKind(method: string): BrewKind {
  return method === 'espresso' || method === 'moka-pot' ? 'espresso' : 'filter';
}

export function getFreshness(roastedAt: string | undefined, now: Date): Freshness {
  if (!roastedAt) return UNKNOWN;
  const roasted = new Date(roastedAt).getTime();
  if (Number.isNaN(roasted)) return UNKNOWN;
  const days = Math.max(0, Math.floor((now.getTime() - roasted) / DAY_MS));
  const [start, end] = PEAK_WINDOW;
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
    freshness: getFreshness(bean.roastedAt, now),
    servings,
    isLow: servings !== null && servings <= LOW_STOCK_SERVINGS,
    isEmpty: bean.weightG === 0,
  };
}
