import type { Extraction } from '../db/types';
import { calculateEY, getSCAZone, type SCAZone } from './scaChart';

// Spent filter grounds keep about 2 g of water for each gram of coffee.
export const ABSORPTION_G_PER_G = 2;
export const MIN_DRIVER_SAMPLES = 5;
export const DRIVER_THRESHOLD = 0.3;

export type DriverKey = 'dose' | 'ratio' | 'timeS' | 'temp' | 'grind';
export const DRIVER_KEYS: readonly DriverKey[] = ['dose', 'ratio', 'timeS', 'temp', 'grind'];

export interface ControlPoint {
  id: number;
  ey: number;
  tds: number;
  zone: SCAZone;
  rating: number;
  createdAt: string;
}

export interface Driver { key: DriverKey; r: number; n: number; }

export interface TimelinePoint {
  id: number;
  n: number;              // 1 = the oldest brew of the bean
  createdAt: string;
  grind: number | null;
  timeS: number;
  rating: number;
}

const round = (value: number, digits: number): number => {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
};

// The SCA chart is for brewed coffee at filter strength. Espresso, moka and cold brew concentrate are off its scale.
export function onControlChart(method: string): boolean {
  return method !== 'espresso' && method !== 'moka-pot' && method !== 'cold-brew';
}

// For filter methods, BrewLog stores the water poured as "yield". The cup weighs less.
export function beverageWeight(e: Pick<Extraction, 'method' | 'dose' | 'yield'>): number {
  return onControlChart(e.method) ? e.yield - ABSORPTION_G_PER_G * e.dose : e.yield;
}

export function toControlPoints(extractions: readonly Extraction[]): readonly ControlPoint[] {
  return extractions.flatMap(e => {
    if (e.id == null || !onControlChart(e.method) || e.tds == null || e.tds <= 0 || e.dose <= 0) return [];
    const beverage = beverageWeight(e);
    if (beverage <= 0) return [];
    const ey = round(calculateEY(e.dose, beverage, e.tds), 1);
    return [{ id: e.id, ey, tds: e.tds, zone: getSCAZone(ey, e.tds), rating: e.rating, createdAt: e.createdAt }];
  });
}

export function parseGrind(setting: string | undefined): number | null {
  const n = parseFloat((setting ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function pearson(xs: readonly number[], ys: readonly number[]): number | null {
  const n = xs.length;
  if (n !== ys.length || n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

function driverValue(e: Extraction, key: DriverKey): number | null {
  const v = key === 'grind' ? parseGrind(e.grindSetting) : e[key];
  return v !== null && Number.isFinite(v) ? v : null;
}

// Correlation between each parameter and the rating, for one method only:
// an espresso ratio and a filter ratio are not on the same scale.
export function ratingDrivers(extractions: readonly Extraction[], method: string): readonly Driver[] {
  const rated = extractions.filter(e => e.method === method && e.rating > 0);
  const out: Driver[] = [];
  for (const key of DRIVER_KEYS) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const e of rated) {
      const v = driverValue(e, key);
      if (v !== null) { xs.push(v); ys.push(e.rating); }
    }
    if (xs.length < MIN_DRIVER_SAMPLES) continue;
    const r = pearson(xs, ys);
    if (r !== null) out.push({ key, r: round(r, 2), n: xs.length });
  }
  return out.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
}

export function driverStrength(r: number): 'positive' | 'negative' | 'weak' {
  if (r >= DRIVER_THRESHOLD) return 'positive';
  if (r <= -DRIVER_THRESHOLD) return 'negative';
  return 'weak';
}

// Methods that have enough rated brews for ratingDrivers, most brews first.
export function driverMethods(extractions: readonly Extraction[]): readonly string[] {
  const counts = new Map<string, number>();
  for (const e of extractions) if (e.rating > 0) counts.set(e.method, (counts.get(e.method) ?? 0) + 1);
  return [...counts].filter(([, c]) => c >= MIN_DRIVER_SAMPLES).sort((a, b) => b[1] - a[1]).map(([m]) => m);
}

export function beanTimeline(extractions: readonly Extraction[], beanId: number): readonly TimelinePoint[] {
  return extractions
    .filter(e => e.beanId === beanId && e.id != null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((e, i) => ({
      id: e.id!, n: i + 1, createdAt: e.createdAt,
      grind: parseGrind(e.grindSetting), timeS: e.timeS, rating: e.rating,
    }));
}

// Bean ids with 2 or more brews, most brews first.
export function timelineBeanIds(extractions: readonly Extraction[]): readonly number[] {
  const counts = new Map<number, number>();
  for (const e of extractions) counts.set(e.beanId, (counts.get(e.beanId) ?? 0) + 1);
  return [...counts].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
