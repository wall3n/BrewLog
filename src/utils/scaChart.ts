export function calculateEY(dose: number, yieldG: number, tds: number): number {
  return (tds * yieldG) / dose;
}

// Spent filter grounds keep about 2 g of water for each gram of coffee.
export const ABSORPTION_G_PER_G = 2;

// For filter methods, BrewLog stores the water poured as "yield". Espresso, moka and
// cold brew store the drink weight.
export function isFilterMethod(method: string): boolean {
  return method !== 'espresso' && method !== 'moka-pot' && method !== 'cold-brew';
}

export function beverageWeight(method: string, dose: number, yieldG: number): number {
  return isFilterMethod(method) ? yieldG - ABSORPTION_G_PER_G * dose : yieldG;
}

// EY % of one brew: the single source of truth for the wizard and the analytics.
// Returns null when the inputs cannot give a real EY.
export function brewEY(method: string, dose: number, yieldG: number, tds: number): number | null {
  if (dose <= 0 || tds <= 0) return null;
  const beverage = beverageWeight(method, dose, yieldG);
  if (beverage <= 0) return null;
  return calculateEY(dose, beverage, tds);
}

export type SCAZone = 'ideal' | 'under' | 'over' | 'weak' | 'strong' | 'underdeveloped';

export function getSCAZone(ey: number, tds: number): SCAZone {
  const inIdealEY = ey >= 18 && ey <= 22;
  const inIdealTDS = tds >= 1.15 && tds <= 1.35;
  if (inIdealEY && inIdealTDS) return 'ideal';
  if (ey < 18 && tds < 1.15) return 'underdeveloped';
  if (ey < 18) return 'under';
  if (ey > 22) return 'over';
  if (tds < 1.15) return 'weak';
  return 'strong';
}

// The classic SCA Coffee Brewing Control Chart: extraction (EY %) across, strength (TDS %) up.
export interface ChartBox { ey: readonly [number, number]; tds: readonly [number, number]; }
export const CHART_BOX: ChartBox = { ey: [14, 26], tds: [0.8, 1.6] };
export const IDEAL_EY: readonly [number, number] = [18, 22];
export const IDEAL_TDS: readonly [number, number] = [1.15, 1.35];
// The diagonal brew ratio lines of the classic chart, in grams of coffee per litre of water.
export const RATIO_LINES_G_PER_L: readonly number[] = [40, 45, 50, 55, 60, 65, 70];

export type ControlZone =
  | 'strongUnder' | 'strong' | 'strongBitter'
  | 'under' | 'ideal' | 'bitter'
  | 'weakUnder' | 'weak' | 'weakBitter';

const ZONE_GRID: readonly (readonly [ControlZone, ControlZone, ControlZone])[] = [
  ['strongUnder', 'strong', 'strongBitter'],
  ['under', 'ideal', 'bitter'],
  ['weakUnder', 'weak', 'weakBitter'],
];

// One of the nine zones of the classic chart. The ideal edges count as ideal.
export function controlZone(ey: number, tds: number): ControlZone {
  const row = tds > IDEAL_TDS[1] ? 0 : tds < IDEAL_TDS[0] ? 2 : 1;
  const col = ey < IDEAL_EY[0] ? 0 : ey > IDEAL_EY[1] ? 2 : 1;
  return ZONE_GRID[row][col];
}

export interface ChartPoint { ey: number; tds: number; }

// At a fixed brew ratio, TDS rises in a straight line with EY:
// TDS = EY × dose / beverage, with 1000 g of water and the wet grounds keeping 2 g per gram.
// Returns the part of that line inside the box, or null when the line misses it.
export function ratioSegment(gPerL: number, box: ChartBox): readonly [ChartPoint, ChartPoint] | null {
  const beverage = 1000 - ABSORPTION_G_PER_G * gPerL;
  if (gPerL <= 0 || beverage <= 0) return null;
  const slope = gPerL / beverage;
  const eyStart = Math.max(box.ey[0], box.tds[0] / slope);
  const eyEnd = Math.min(box.ey[1], box.tds[1] / slope);
  if (eyStart >= eyEnd) return null;
  const at = (ey: number, edgeTds: number | null): ChartPoint => ({ ey, tds: edgeTds ?? ey * slope });
  return [
    at(eyStart, eyStart === box.ey[0] ? null : box.tds[0]),
    at(eyEnd, eyEnd === box.ey[1] ? null : box.tds[1]),
  ];
}
