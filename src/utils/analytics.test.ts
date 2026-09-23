import { describe, it, expect } from 'vitest';
import {
  beverageWeight, toControlPoints, parseGrind, pearson, ratingDrivers, driverStrength,
  driverMethods, beanTimeline, timelineBeanIds, MIN_DRIVER_SAMPLES,
} from './analytics';
import type { Extraction } from '../db/types';

function ext(p: Partial<Extraction>): Extraction {
  return {
    id: 1, method: 'pour-over', beanId: 1, equipmentIds: [], grindSetting: '20',
    dose: 15, yield: 250, ratio: 16.7, timeS: 180, temp: 94, tds: 1.3,
    flag: 'adjust', rating: 3, acidity: 3, sweetness: 3, bitterness: 3, body: 3, balance: 3,
    flavours: [], createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z',
    ...p,
  };
}

describe('beverageWeight', () => {
  it('subtracts the water the grounds keep for filter', () => {
    expect(beverageWeight({ method: 'pour-over', dose: 15, yield: 250 })).toBe(220);
  });
  it('uses the yield as is for espresso', () => {
    expect(beverageWeight({ method: 'espresso', dose: 18, yield: 36 })).toBe(36);
  });
});

describe('toControlPoints', () => {
  it('calculates EY from the beverage weight', () => {
    // 1.3 × 220 / 15 = 19.07 → 19.1
    expect(toControlPoints([ext({})])).toEqual([
      { id: 1, ey: 19.1, tds: 1.3, zone: 'ideal', rating: 3, createdAt: '2026-09-01T08:00:00.000Z' },
    ]);
  });

  it('skips espresso, moka pot and cold brew', () => {
    expect(toControlPoints([ext({ method: 'espresso' }), ext({ method: 'moka-pot' }), ext({ method: 'cold-brew' })])).toEqual([]);
  });

  it('skips a brew with no TDS, a zero dose, or no beverage left', () => {
    expect(toControlPoints([
      ext({ tds: null }), ext({ tds: 0 }), ext({ dose: 0 }), ext({ dose: 20, yield: 30 }),
    ])).toEqual([]);
  });
});

describe('parseGrind', () => {
  it('reads numbers and decimal commas', () => {
    expect(parseGrind('12')).toBe(12);
    expect(parseGrind('2,5')).toBe(2.5);
    expect(parseGrind('14 clicks')).toBe(14);
  });
  it('returns null for text or nothing', () => {
    expect(parseGrind('fine')).toBeNull();
    expect(parseGrind(undefined)).toBeNull();
  });
});

describe('pearson', () => {
  it('is 1 and -1 for perfect lines', () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(pearson([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1);
  });
  it('is null with fewer than 3 points, mismatched lengths, or zero variance', () => {
    expect(pearson([1, 2], [1, 2])).toBeNull();
    expect(pearson([1, 2, 3], [1, 2])).toBeNull();
    expect(pearson([5, 5, 5], [1, 2, 3])).toBeNull();
  });
});

describe('ratingDrivers', () => {
  const brews = [1, 2, 3, 4, 5].map(i => ext({ id: i, temp: 90 + i, rating: i, dose: 15, grindSetting: 'medium' }));

  it('finds the parameter that follows the rating', () => {
    const drivers = ratingDrivers(brews, 'pour-over');
    expect(drivers[0]).toEqual({ key: 'temp', r: 1, n: 5 });
  });

  it('skips a constant parameter and a text grind', () => {
    const keys = ratingDrivers(brews, 'pour-over').map(d => d.key);
    expect(keys).not.toContain('dose');
    expect(keys).not.toContain('grind');
  });

  it('ignores unrated brews and other methods', () => {
    const mixed = [...brews.slice(0, 4), ext({ id: 9, rating: 0, temp: 99 }), ext({ id: 10, method: 'espresso', temp: 99, rating: 5 })];
    expect(ratingDrivers(mixed, 'pour-over')).toEqual([]);
  });

  it('needs MIN_DRIVER_SAMPLES brews', () => {
    expect(MIN_DRIVER_SAMPLES).toBe(5);
  });
});

describe('driverStrength', () => {
  it('uses a 0.3 threshold', () => {
    expect(driverStrength(0.5)).toBe('positive');
    expect(driverStrength(-0.3)).toBe('negative');
    expect(driverStrength(0.1)).toBe('weak');
  });
});

describe('driverMethods', () => {
  it('lists methods with enough rated brews, most first', () => {
    const list = [
      ...[1, 2, 3, 4, 5].map(i => ext({ id: i, method: 'espresso' })),
      ...[6, 7, 8, 9, 10, 11].map(i => ext({ id: i })),
      ...[12, 13].map(i => ext({ id: i, method: 'aeropress' })),
    ];
    expect(driverMethods(list)).toEqual(['pour-over', 'espresso']);
  });
});

describe('beanTimeline', () => {
  it('orders the brews of one bean oldest first and numbers them', () => {
    const list = [
      ext({ id: 2, createdAt: '2026-09-03T08:00:00.000Z', grindSetting: '18' }),
      ext({ id: 1, createdAt: '2026-09-01T08:00:00.000Z', grindSetting: 'fine' }),
      ext({ id: 3, beanId: 2 }),
    ];
    expect(beanTimeline(list, 1).map(p => [p.n, p.id, p.grind])).toEqual([[1, 1, null], [2, 2, 18]]);
  });
});

describe('timelineBeanIds', () => {
  it('lists beans with 2 or more brews, most first', () => {
    const list = [ext({ beanId: 1 }), ext({ beanId: 2 }), ext({ beanId: 2 }), ext({ beanId: 2 }), ext({ beanId: 3 }), ext({ beanId: 3 })];
    expect(timelineBeanIds(list)).toEqual([2, 3]);
  });
});
