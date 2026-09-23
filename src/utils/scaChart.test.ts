import { describe, it, expect } from 'vitest';
import { brewEY, controlZone, ratioSegment, CHART_BOX } from './scaChart';

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

describe('controlZone', () => {
  it('places a brew in one of the nine zones of the classic chart', () => {
    expect(controlZone(20, 1.25)).toBe('ideal');
    expect(controlZone(16, 1.25)).toBe('under');
    expect(controlZone(24, 1.25)).toBe('bitter');
    expect(controlZone(20, 1.5)).toBe('strong');
    expect(controlZone(16, 1.5)).toBe('strongUnder');
    expect(controlZone(24, 1.5)).toBe('strongBitter');
    expect(controlZone(20, 1.0)).toBe('weak');
    expect(controlZone(16, 1.0)).toBe('weakUnder');
    expect(controlZone(24, 1.0)).toBe('weakBitter');
  });
  it('counts the zone edges as ideal', () => {
    expect(controlZone(18, 1.15)).toBe('ideal');
    expect(controlZone(22, 1.35)).toBe('ideal');
  });
});

describe('ratioSegment', () => {
  it('clips a ratio line where it enters and leaves the chart box', () => {
    // 55 g/L: TDS = EY × 55 / 890. Enters on the left edge, leaves on the top edge.
    const seg = ratioSegment(55, CHART_BOX);
    expect(seg).not.toBeNull();
    expect(seg![0].ey).toBe(14);
    expect(seg![0].tds).toBeCloseTo(0.865, 3);
    expect(seg![1].ey).toBeCloseTo(25.891, 3);
    expect(seg![1].tds).toBe(1.6);
  });
  it('enters on the bottom edge and leaves on the right edge for a weak ratio', () => {
    // 40 g/L: TDS = EY × 40 / 920
    const seg = ratioSegment(40, CHART_BOX);
    expect(seg![0].ey).toBeCloseTo(18.4, 3);
    expect(seg![0].tds).toBe(0.8);
    expect(seg![1].ey).toBe(26);
    expect(seg![1].tds).toBeCloseTo(1.13, 3);
  });
  it('returns null when the line misses the box', () => {
    expect(ratioSegment(10, CHART_BOX)).toBeNull();
  });
});
