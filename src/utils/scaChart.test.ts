import { describe, it, expect } from 'vitest';
import { brewEY } from './scaChart';

describe('brewEY', () => {
  it('subtracts the water the grounds keep for filter methods', () => {
    // 1.3 × (250 − 2 × 15) / 15 = 19.07
    expect(brewEY('pour-over', 15, 250, 1.3)).toBeCloseTo(19.067, 3);
  });
  it('uses the yield as is for espresso', () => {
    // 9.4 × 38 / 18 = 19.84
    expect(brewEY('espresso', 18, 38, 9.4)).toBeCloseTo(19.844, 3);
  });
  it('returns null when dose is zero or less', () => {
    expect(brewEY('pour-over', 0, 250, 1.3)).toBeNull();
    expect(brewEY('espresso', -1, 36, 9)).toBeNull();
  });
  it('returns null when tds is zero or less', () => {
    expect(brewEY('pour-over', 15, 250, 0)).toBeNull();
  });
  it('returns null when the beverage weight is zero or less', () => {
    expect(brewEY('pour-over', 20, 30, 1.3)).toBeNull();
    expect(brewEY('pour-over', 20, 40, 1.3)).toBeNull();
    expect(brewEY('espresso', 18, 0, 9)).toBeNull();
  });
});
