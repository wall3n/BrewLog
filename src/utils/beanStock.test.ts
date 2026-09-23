import { describe, it, expect } from 'vitest';
import {
  planStock, nextInitialWeight, averageDose, servingsLeft,
  brewKind, getFreshness, summariseUsage, beanStockView,
} from './beanStock';

const w = (entries: [number, number | undefined][]): Map<number, number | undefined> => new Map(entries);

describe('planStock', () => {
  it('takes the dose of a new brew and stores it as used', () => {
    const plan = planStock(null, { beanId: 1, dose: 18 }, w([[1, 250]]));
    expect([...plan.weights]).toEqual([[1, 232]]);
    expect(plan.stockUsedG).toBe(18);
  });

  it('stores only what was really taken when the bean runs out', () => {
    const plan = planStock(null, { beanId: 1, dose: 18 }, w([[1, 10]]));
    expect([...plan.weights]).toEqual([[1, 0]]);
    expect(plan.stockUsedG).toBe(10);
  });

  it('gives back only what was taken when a clamped brew is deleted (10 g bean, 18 g brew)', () => {
    const added = planStock(null, { beanId: 1, dose: 18 }, w([[1, 10]]));
    const deleted = planStock(
      { beanId: 1, dose: 18, stockUsedG: added.stockUsedG },
      null,
      w([[1, added.weights.get(1)]]),
    );
    expect([...deleted.weights]).toEqual([[1, 10]]);
  });

  it('takes nothing from a bean with no weight', () => {
    const plan = planStock(null, { beanId: 1, dose: 18 }, w([[1, undefined]]));
    expect([...plan.weights]).toEqual([]);
    expect(plan.stockUsedG).toBe(0);
  });

  it('gives nothing back for a brew logged while the bean had no weight', () => {
    const added = planStock(null, { beanId: 1, dose: 18 }, w([[1, undefined]]));
    const deleted = planStock({ beanId: 1, dose: 18, stockUsedG: added.stockUsedG }, null, w([[1, 250]]));
    expect([...deleted.weights]).toEqual([]);
  });

  it('gives nothing back for an old brew with no stockUsedG', () => {
    const deleted = planStock({ beanId: 1, dose: 18 }, null, w([[1, 250]]));
    expect([...deleted.weights]).toEqual([]);
  });

  it('changes nothing for a notes-only edit', () => {
    const plan = planStock({ beanId: 1, dose: 18, stockUsedG: 18 }, { beanId: 1, dose: 18 }, w([[1, 232]]));
    expect([...plan.weights]).toEqual([]);
    expect(plan.stockUsedG).toBe(18);
  });

  it('keeps stockUsedG empty for a notes-only edit of an old brew', () => {
    const plan = planStock({ beanId: 1, dose: 18 }, { beanId: 1, dose: 18 }, w([[1, 250]]));
    expect([...plan.weights]).toEqual([]);
    expect(plan.stockUsedG).toBeUndefined();
  });

  it('applies the new dose for an edit on the same bean', () => {
    const plan = planStock({ beanId: 1, dose: 18, stockUsedG: 18 }, { beanId: 1, dose: 20 }, w([[1, 232]]));
    expect([...plan.weights]).toEqual([[1, 230]]);
    expect(plan.stockUsedG).toBe(20);
  });

  it('moves the brew to another bean', () => {
    const plan = planStock(
      { beanId: 1, dose: 18, stockUsedG: 18 },
      { beanId: 2, dose: 20 },
      w([[1, 232], [2, 100]]),
    );
    expect(Object.fromEntries(plan.weights)).toEqual({ 1: 250, 2: 80 });
    expect(plan.stockUsedG).toBe(20);
  });

  it('gives back only what was used when a clamped brew moves bean', () => {
    const plan = planStock(
      { beanId: 1, dose: 18, stockUsedG: 10 },
      { beanId: 2, dose: 20 },
      w([[1, 0], [2, 15]]),
    );
    expect(Object.fromEntries(plan.weights)).toEqual({ 1: 10, 2: 0 });
    expect(plan.stockUsedG).toBe(15);
  });

  it('rounds to 0.1 g', () => {
    const plan = planStock(null, { beanId: 1, dose: 18.25 }, w([[1, 250]]));
    expect([...plan.weights]).toEqual([[1, 231.8]]);
    expect(plan.stockUsedG).toBe(18.2);
  });
});

describe('nextInitialWeight', () => {
  it('uses the first weight as the bag size', () => {
    expect(nextInitialWeight(undefined, undefined, 250)).toBe(250);
  });
  it('keeps the bag size when the weight goes down', () => {
    expect(nextInitialWeight(250, 200, 180)).toBe(250);
  });
  it('uses the old weight as the bag size for an old bean', () => {
    expect(nextInitialWeight(undefined, 200, 150)).toBe(200);
  });
  it('starts a new bag when the weight is larger than the bag size', () => {
    expect(nextInitialWeight(250, 10, 1000)).toBe(1000);
  });
  it('clears the bag size when the weight is removed', () => {
    expect(nextInitialWeight(250, 100, undefined)).toBeUndefined();
  });
});

describe('averageDose', () => {
  it('uses the fallback with no brews', () => {
    expect(averageDose([], 18)).toBe(18);
  });
  it('averages the 5 newest positive doses', () => {
    expect(averageDose([20, 20, 20, 20, 20, 5, 5], 18)).toBe(20);
    expect(averageDose([0, 16, 18], 18)).toBe(17);
  });
});

describe('servingsLeft', () => {
  it('rounds down', () => {
    expect(servingsLeft(100, 18)).toBe(5);
  });
  it('returns null with no weight or no dose', () => {
    expect(servingsLeft(undefined, 18)).toBeNull();
    expect(servingsLeft(100, 0)).toBeNull();
  });
});

const NOW = new Date('2026-09-22T12:00:00.000Z');
const daysAgo = (n: number): string => new Date(NOW.getTime() - n * 86_400_000).toISOString();

describe('brewKind', () => {
  it('treats espresso and moka pot as espresso, all else as filter', () => {
    expect(brewKind('espresso')).toBe('espresso');
    expect(brewKind('moka-pot')).toBe('espresso');
    expect(brewKind('pour-over')).toBe('filter');
    expect(brewKind('custom')).toBe('filter');
  });
});

describe('getFreshness', () => {
  it('is unknown with no or an invalid roast date', () => {
    expect(getFreshness(undefined, 'espresso', NOW).state).toBe('unknown');
    expect(getFreshness('not a date', 'espresso', NOW)).toEqual({
      days: null, state: 'unknown', daysUntilPeak: null, daysLeftInPeak: null,
    });
  });

  it('is resting before the window', () => {
    expect(getFreshness(daysAgo(3), 'espresso', NOW)).toEqual({
      days: 3, state: 'resting', daysUntilPeak: 4, daysLeftInPeak: null,
    });
  });

  it('is at peak in the window, with the days left', () => {
    expect(getFreshness(daysAgo(10), 'espresso', NOW)).toEqual({
      days: 10, state: 'peak', daysUntilPeak: null, daysLeftInPeak: 11,
    });
    expect(getFreshness(daysAgo(5), 'filter', NOW).state).toBe('peak');
  });

  it('is fading up to 2× the window end, then stale', () => {
    expect(getFreshness(daysAgo(30), 'espresso', NOW).state).toBe('fading');
    expect(getFreshness(daysAgo(43), 'espresso', NOW).state).toBe('stale');
    expect(getFreshness(daysAgo(20), 'filter', NOW).state).toBe('fading');
  });

  it('treats a future roast date as day 0', () => {
    expect(getFreshness(daysAgo(-5), 'espresso', NOW).days).toBe(0);
  });
});

describe('summariseUsage', () => {
  it('groups doses by bean, newest first, with the newest method', () => {
    const usage = summariseUsage([
      { beanId: 1, dose: 18, method: 'espresso', createdAt: daysAgo(3) },
      { beanId: 1, dose: 15, method: 'pour-over', createdAt: daysAgo(1) },
      { beanId: 2, dose: 20, method: 'espresso', createdAt: daysAgo(2) },
    ]);
    expect(usage.get(1)).toEqual({ doses: [15, 18], lastMethod: 'pour-over' });
    expect(usage.get(2)).toEqual({ doses: [20], lastMethod: 'espresso' });
  });
});

describe('beanStockView', () => {
  it('uses the fallback method and dose when the bean has no brews', () => {
    const view = beanStockView({ roastedAt: daysAgo(10), weightG: 45 }, undefined, 'espresso', NOW);
    expect(view.servings).toBe(2);   // 45 / 18
    expect(view.isLow).toBe(true);
    expect(view.freshness.state).toBe('peak');
  });

  it('uses the filter default dose for a filter method', () => {
    expect(beanStockView({ weightG: 150 }, undefined, 'pour-over', NOW).servings).toBe(10);   // 150 / 15
  });

  it('marks an empty bag', () => {
    const view = beanStockView({ weightG: 0 }, { doses: [18], lastMethod: 'espresso' }, 'espresso', NOW);
    expect(view.isEmpty).toBe(true);
    expect(view.servings).toBe(0);
  });

  it('is not low when the weight is unknown', () => {
    const view = beanStockView({}, undefined, 'espresso', NOW);
    expect(view.servings).toBeNull();
    expect(view.isLow).toBe(false);
    expect(view.isEmpty).toBe(false);
  });
});
