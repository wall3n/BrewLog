import { describe, it, expect } from 'vitest';
import { parseTds, isDuplicateWater } from './water';
import type { Water } from '../db/types';

const waters: Water[] = [
  { id: 1, brand: 'Volvic', tdsPpm: 130, createdAt: 'a', updatedAt: 'a' },
  { id: 2, brand: 'Third Wave Water', createdAt: 'a', updatedAt: 'a' },
];

describe('parseTds', () => {
  it('gives undefined for an empty value', () => {
    expect(parseTds('')).toBeUndefined();
    expect(parseTds('   ')).toBeUndefined();
  });
  it('reads a number in range', () => {
    expect(parseTds('0')).toBe(0);
    expect(parseTds('150')).toBe(150);
    expect(parseTds('1000')).toBe(1000);
  });
  it('gives null for a value out of range or not a number', () => {
    expect(parseTds('-1')).toBeNull();
    expect(parseTds('1001')).toBeNull();
    expect(parseTds('abc')).toBeNull();
  });
});

describe('isDuplicateWater', () => {
  it('ignores case and outer spaces', () => {
    expect(isDuplicateWater(waters, '  volvic ')).toBe(true);
    expect(isDuplicateWater(waters, 'Evian')).toBe(false);
  });
  it('skips the water being edited', () => {
    expect(isDuplicateWater(waters, 'Volvic', 1)).toBe(false);
    expect(isDuplicateWater(waters, 'Volvic', 2)).toBe(true);
  });
});
