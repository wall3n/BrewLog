import { describe, it, expect } from 'vitest';
import { sortStages, getStageProgress, cueBetween, pickDefaultRecipe } from './brewStages';
import type { PourStage, Recipe } from '../db/types';

const stages: PourStage[] = [
  { id: 'a', label: 'Bloom',  timeS: 0,  weightG: 50 },
  { id: 'b', label: 'Pour 1', timeS: 45, weightG: 150 },
  { id: 'c', label: 'Pour 2', timeS: 90, weightG: 250 },
];

function recipe(p: Partial<Recipe>): Recipe {
  return {
    id: 1, name: 'R', method: 'pour-over', ratio: 16, dose: 15, yield: 250, temp: 94, time: 180,
    stages: [], createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z', ...p,
  };
}

describe('sortStages', () => {
  it('sorts by time and does not change the input', () => {
    const shuffled = [stages[2], stages[0], stages[1]];
    expect(sortStages(shuffled).map(s => s.id)).toEqual(['a', 'b', 'c']);
    expect(shuffled[0].id).toBe('c');
  });
});

describe('getStageProgress', () => {
  it('is before the first stage when the first stage is later than 0 s', () => {
    const late = [{ ...stages[1] }];
    expect(getStageProgress(late, 10)).toEqual({
      activeIndex: -1, nextIndex: 0, secondsToNext: 35, targetWeightG: null, isLastStage: false,
    });
  });

  it('activates a stage at 0 s immediately', () => {
    expect(getStageProgress(stages, 0).activeIndex).toBe(0);
    expect(getStageProgress(stages, 0).targetWeightG).toBe(50);
  });

  it('counts down to the next stage', () => {
    expect(getStageProgress(stages, 60)).toEqual({
      activeIndex: 1, nextIndex: 2, secondsToNext: 30, targetWeightG: 150, isLastStage: false,
    });
  });

  it('marks the last stage', () => {
    expect(getStageProgress(stages, 200)).toEqual({
      activeIndex: 2, nextIndex: null, secondsToNext: null, targetWeightG: 250, isLastStage: true,
    });
  });

  it('handles an empty stage list', () => {
    expect(getStageProgress([], 10)).toEqual({
      activeIndex: -1, nextIndex: null, secondsToNext: null, targetWeightG: null, isLastStage: false,
    });
  });
});

describe('cueBetween', () => {
  it('plays no cue for a stage at 0 s', () => {
    expect(cueBetween(stages, 0, 1)).toBeNull();
  });

  it('plays a warning 3 s before a stage', () => {
    expect(cueBetween(stages, 41, 42)).toBe('warning');
  });

  it('plays a stage cue when a stage starts', () => {
    expect(cueBetween(stages, 44, 45)).toBe('stage');
  });

  it('prefers the stage cue when one tick crosses both', () => {
    expect(cueBetween(stages, 40, 46)).toBe('stage');
  });

  it('plays nothing when time does not move forward', () => {
    expect(cueBetween(stages, 45, 45)).toBeNull();
    expect(cueBetween(stages, 50, 0)).toBeNull();
  });
});

describe('pickDefaultRecipe', () => {
  const a = recipe({ id: 1, createdAt: '2026-01-01T00:00:00.000Z' });
  const b = recipe({ id: 2, lastUsedAt: '2026-09-10T00:00:00.000Z' });
  const c = recipe({ id: 3, lastUsedAt: '2026-09-12T00:00:00.000Z' });
  const other = recipe({ id: 4, method: 'espresso', lastUsedAt: '2026-09-20T00:00:00.000Z' });

  it('uses the preferred recipe when it matches the method', () => {
    expect(pickDefaultRecipe([a, b, c], 'pour-over', 1)?.id).toBe(1);
  });

  it('ignores a preferred recipe of another method', () => {
    expect(pickDefaultRecipe([a, b, c, other], 'pour-over', 4)?.id).toBe(3);
  });

  it('uses the most recently used recipe', () => {
    expect(pickDefaultRecipe([a, b, c], 'pour-over', null)?.id).toBe(3);
  });

  it('falls back to the oldest recipe when none was used', () => {
    const d = recipe({ id: 5, createdAt: '2026-05-01T00:00:00.000Z' });
    expect(pickDefaultRecipe([d, a], 'pour-over', null)?.id).toBe(1);
  });

  it('returns undefined when no recipe matches', () => {
    expect(pickDefaultRecipe([other], 'pour-over', null)).toBeUndefined();
  });
});
