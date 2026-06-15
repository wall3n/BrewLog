export function calculateEY(dose: number, yieldG: number, tds: number): number {
  return (tds * yieldG) / dose;
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
