import { describe, it, expect } from 'vitest';
import { toDateInputValue, fromDateInputValue, daysOffRoast } from './roastDate';

describe('roast date input values', () => {
  it('keeps the calendar day through a round trip', () => {
    const iso = fromDateInputValue('2026-09-10');
    expect(iso).toBeDefined();
    expect(toDateInputValue(iso)).toBe('2026-09-10');
  });
  it('stores the local midnight of the picked day', () => {
    const d = new Date(fromDateInputValue('2026-09-10')!);
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 8, 10, 0]);
  });
  it('gives an empty value for no date and undefined for an empty input', () => {
    expect(toDateInputValue(undefined)).toBe('');
    expect(fromDateInputValue('')).toBeUndefined();
    expect(fromDateInputValue('not-a-date')).toBeUndefined();
  });
});

describe('daysOffRoast', () => {
  const now = new Date(2026, 8, 23, 7, 30);
  it('counts calendar days, not 24-hour blocks', () => {
    expect(daysOffRoast('2026-09-22', now)).toBe(1);
    expect(daysOffRoast('2026-09-23', now)).toBe(0);
    expect(daysOffRoast('2026-08-24', now)).toBe(30);
  });
  it('gives a negative count for a future date and null for no date', () => {
    expect(daysOffRoast('2026-09-25', now)).toBe(-2);
    expect(daysOffRoast('', now)).toBeNull();
  });
});
