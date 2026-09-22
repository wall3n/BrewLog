import { describe, it, expect } from 'vitest';
import {
  stockChanges, applyStockChange, nextInitialWeight, averageDose, servingsLeft,
} from './beanStock';

describe('stockChanges', () => {
  it('subtracts the dose of a new brew', () => {
    expect(stockChanges(null, { beanId: 1, dose: 18 })).toEqual([{ beanId: 1, deltaG: -18 }]);
  });

  it('gives the dose back for a deleted brew', () => {
    expect(stockChanges({ beanId: 1, dose: 18 }, null)).toEqual([{ beanId: 1, deltaG: 18 }]);
  });

  it('applies only the difference for an edit on the same bean', () => {
    expect(stockChanges({ beanId: 1, dose: 18 }, { beanId: 1, dose: 18.5 })).toEqual([{ beanId: 1, deltaG: -0.5 }]);
  });

  it('returns nothing when the dose and bean do not change', () => {
    expect(stockChanges({ beanId: 1, dose: 18 }, { beanId: 1, dose: 18 })).toEqual([]);
  });

  it('moves the dose when the brew changes bean', () => {
    expect(stockChanges({ beanId: 1, dose: 18 }, { beanId: 2, dose: 20 })).toEqual([
      { beanId: 1, deltaG: 18 },
      { beanId: 2, deltaG: -20 },
    ]);
  });

  it('rounds to 0.1 g', () => {
    expect(stockChanges({ beanId: 1, dose: 18.1 }, { beanId: 1, dose: 18.3 })).toEqual([{ beanId: 1, deltaG: -0.2 }]);
  });
});

describe('applyStockChange', () => {
  it('leaves a bean with no weight alone', () => {
    expect(applyStockChange(undefined, -18)).toBeUndefined();
  });
  it('never goes below 0', () => {
    expect(applyStockChange(10, -18)).toBe(0);
  });
  it('rounds to 0.1 g', () => {
    expect(applyStockChange(250, -18.25)).toBe(231.8);
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
