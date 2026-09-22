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
