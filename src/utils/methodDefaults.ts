import type { MethodConfig } from '../db/types';

export const METHODS: MethodConfig[] = [
  { id: 'espresso',    name: 'Espresso',    icon: 'espresso',    defaultRatio: 2.0 },
  { id: 'french-press', name: 'French Press', icon: 'frenchPress', defaultRatio: 16 },
  { id: 'pour-over',  name: 'Pour Over',   icon: 'pourOver',    defaultRatio: 16.5 },
  { id: 'aeropress',  name: 'AeroPress',   icon: 'aeropress',   defaultRatio: 14 },
  { id: 'moka-pot',   name: 'Moka Pot',    icon: 'mokaPot',     defaultRatio: 10 },
  { id: 'cold-brew',  name: 'Cold Brew',   icon: 'coldBrew',    defaultRatio: 8 },
  { id: 'drip',       name: 'Drip',        icon: 'drip',        defaultRatio: 17 },
  { id: 'siphon',     name: 'Siphon',      icon: 'siphon',      defaultRatio: 15 },
  { id: 'custom',     name: 'Custom',      icon: 'custom',      defaultRatio: 16 },
];

export const FLAVOUR_PRESETS = [
  'blueberry', 'chocolate', 'floral', 'nutty', 'citrus', 'caramel',
  'earthy', 'spicy', 'stone fruit', 'jasmine', 'honey', 'cocoa',
  'apricot', 'cherry', 'molasses', 'almond', 'bergamot', 'fig',
];

export function methodById(id: string): MethodConfig {
  return METHODS.find(m => m.id === id) ?? METHODS[METHODS.length - 1];
}

export function getTargets(method: string): Record<string, string> {
  switch (method) {
    case 'espresso':    return { ratio: '1:2 — 1:2.5', time: '25 – 32 s', temp: '92 – 96 °C', pressure: '7 – 9 bar', ey: '18 – 22%' };
    case 'pour-over':  return { ratio: '1:15 — 1:17', time: '2:30 – 4:00', temp: '90 – 96 °C', ey: '18 – 22%' };
    case 'french-press': return { ratio: '1:15 — 1:17', time: '4:00', temp: '92 – 96 °C' };
    case 'aeropress':  return { ratio: '1:12 — 1:16', time: '1:30 – 2:30', temp: '80 – 92 °C' };
    case 'moka-pot':   return { ratio: '1:7 — 1:10', time: '4:00 – 5:00', temp: 'on stove' };
    case 'cold-brew':  return { ratio: '1:7 — 1:10', time: '12 – 18 hrs', temp: 'room / 4 °C' };
    case 'drip':       return { ratio: '1:16 — 1:18', time: '4:00 – 6:00', temp: '92 – 96 °C' };
    default:           return {};
  }
}

export function extractionZone(ey: number): { label: string; color: string; position: number } {
  const pos = Math.max(0, Math.min(100, ((ey - 12) / 16) * 100));
  if (ey < 16) return { label: 'UNDER-EXTRACTED', color: 'var(--danger)', position: pos };
  if (ey < 18) return { label: 'WEAK', color: 'var(--warning)', position: pos };
  if (ey <= 22) return { label: 'IDEAL ✓', color: 'var(--success)', position: pos };
  if (ey <= 24) return { label: 'STRONG', color: 'var(--warning)', position: pos };
  return { label: 'OVER-EXTRACTED', color: 'var(--danger)', position: pos };
}
