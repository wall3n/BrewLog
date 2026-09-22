import { describe, it, expect } from 'vitest';
import {
  encodeRecipe, decodeRecipe, toSharedRecipe, buildRecipeShareUrl, readPayloadFromText,
  shareProblems, MAX_PAYLOAD_CHARS, MAX_STAGES, SHARE_LIMITS, type SharedRecipe,
} from './shareCodec';
import type { Recipe } from '../db/types';

const recipe: SharedRecipe = {
  name: 'Hoffmann V60 — café ☕', method: 'pour-over', ratio: 16.7, dose: 15, yield: 250, temp: 94, time: 210,
  stages: [
    { id: 's1', label: 'Bloom', timeS: 0, weightG: 50 },
    { id: 's2', label: 'Pour', timeS: 45, weightG: 250 },
  ],
};

function b64url(json: string): string {
  let bin = '';
  new TextEncoder().encode(json).forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('encodeRecipe / decodeRecipe', () => {
  it('round-trips a recipe, including non-ASCII text', () => {
    expect(decodeRecipe(encodeRecipe(recipe))).toEqual(recipe);
  });

  it('makes a URL-safe payload', () => {
    expect(encodeRecipe(recipe)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('gives new stage ids and trims labels', () => {
    const odd = { ...recipe, stages: [{ id: '<script>', label: '  Bloom  ', timeS: 0, weightG: 50 }] };
    expect(decodeRecipe(encodeRecipe(odd))?.stages[0]).toEqual({ id: 's1', label: 'Bloom', timeS: 0, weightG: 50 });
  });

  it('rejects garbage, empty text and oversize payloads', () => {
    expect(decodeRecipe('')).toBeNull();
    expect(decodeRecipe('!!!not-base64')).toBeNull();
    expect(decodeRecipe(b64url('not json'))).toBeNull();
    expect(decodeRecipe('A'.repeat(MAX_PAYLOAD_CHARS + 1))).toBeNull();
  });

  it('rejects a wrong version, an unknown method, and values out of range', () => {
    expect(decodeRecipe(b64url(JSON.stringify({ v: 2, r: recipe })))).toBeNull();
    expect(decodeRecipe(encodeRecipe({ ...recipe, method: 'teleport' }))).toBeNull();
    expect(decodeRecipe(encodeRecipe({ ...recipe, dose: -5 }))).toBeNull();
    expect(decodeRecipe(encodeRecipe({ ...recipe, temp: 500 }))).toBeNull();
    expect(decodeRecipe(encodeRecipe({ ...recipe, name: '   ' }))).toBeNull();
  });

  it('rejects wrong field types', () => {
    expect(decodeRecipe(b64url(JSON.stringify({ v: 1, r: { ...recipe, dose: '15' } })))).toBeNull();
    expect(decodeRecipe(b64url(JSON.stringify({ v: 1, r: { ...recipe, stages: 'x' } })))).toBeNull();
    expect(decodeRecipe(b64url(JSON.stringify({ v: 1, r: { ...recipe, stages: [{ label: 3, timeS: 0, weightG: 1 }] } })))).toBeNull();
  });

  it('rejects more than 20 stages and cuts a long name', () => {
    const many = { ...recipe, stages: Array.from({ length: 21 }, (_, i) => ({ id: `${i}`, label: 'P', timeS: i, weightG: i })) };
    expect(decodeRecipe(encodeRecipe(many))).toBeNull();
    expect(decodeRecipe(encodeRecipe({ ...recipe, name: 'x'.repeat(200) }))?.name).toHaveLength(80);
  });
});

describe('toSharedRecipe', () => {
  it('drops the database fields', () => {
    const full: Recipe = { ...recipe, id: 9, lastUsedAt: '2026-09-01T00:00:00.000Z', createdAt: 'a', updatedAt: 'b' };
    expect(toSharedRecipe(full)).toEqual(recipe);
  });
});

describe('buildRecipeShareUrl / readPayloadFromText', () => {
  it('puts the payload in the hash of the import route', () => {
    const url = buildRecipeShareUrl('https://brewlog.app', recipe);
    expect(url.startsWith('https://brewlog.app/recipes/import#r=')).toBe(true);
    expect(decodeRecipe(readPayloadFromText(url) ?? '')).toEqual(recipe);
  });

  it('accepts a bare hash or a bare payload, with spaces around it', () => {
    expect(readPayloadFromText('#r=abc_-1')).toBe('abc_-1');
    expect(readPayloadFromText('  abc_-1\n')).toBe('abc_-1');
  });

  it('rejects text that is not a payload', () => {
    expect(readPayloadFromText('hello world')).toBeNull();
    expect(readPayloadFromText('')).toBeNull();
  });
});

describe('shareProblems', () => {
  it('finds no problem in a valid recipe', () => {
    expect(shareProblems(recipe)).toEqual([]);
  });

  it('flags a dose of 0', () => {
    expect(shareProblems({ ...recipe, dose: 0 })).toEqual([{ field: 'dose' }]);
  });

  it('flags more than 20 stages', () => {
    const stages = Array.from({ length: MAX_STAGES + 1 }, (_, i) => ({ id: `${i}`, label: 'P', timeS: i, weightG: i }));
    expect(shareProblems({ ...recipe, stages })).toEqual([{ field: 'stages' }]);
  });

  it('flags a temperature of 101', () => {
    expect(shareProblems({ ...recipe, temp: 101 })).toEqual([{ field: 'temp' }]);
  });

  it('flags a payload over the size limit', () => {
    // Long non-ASCII labels grow the payload without breaking any single field limit.
    const stages = Array.from({ length: MAX_STAGES }, (_, i) => ({ id: `${i}`, label: '☕'.repeat(40), timeS: i, weightG: i }));
    const big = { ...recipe, name: '☕'.repeat(80), stages };
    expect(encodeRecipe(big).length).toBeGreaterThan(MAX_PAYLOAD_CHARS);
    expect(shareProblems(big)).toEqual([{ field: 'payload' }]);
  });

  it('flags an empty name, a long name and a long stage label', () => {
    expect(shareProblems({ ...recipe, name: '  ' })).toEqual([{ field: 'name' }]);
    expect(shareProblems({ ...recipe, name: 'x'.repeat(81) })).toEqual([{ field: 'name' }]);
    const stages = [{ id: 's1', label: 'x'.repeat(41), timeS: 0, weightG: 50 }];
    expect(shareProblems({ ...recipe, stages })).toEqual([{ field: 'stageLabel', stage: 0 }]);
  });

  it('flags an unknown method and ratio, yield, time and stage values out of range', () => {
    expect(shareProblems({ ...recipe, method: 'teleport' })).toEqual([{ field: 'method' }]);
    expect(shareProblems({ ...recipe, ratio: 31 })).toEqual([{ field: 'ratio' }]);
    expect(shareProblems({ ...recipe, yield: 3001 })).toEqual([{ field: 'yield' }]);
    expect(shareProblems({ ...recipe, time: -1 })).toEqual([{ field: 'time' }]);
    expect(shareProblems({ ...recipe, dose: Number.NaN })).toEqual([{ field: 'dose' }]);
    const stages = [{ id: 's1', label: 'A', timeS: 0, weightG: -1 }, { id: 's2', label: 'B', timeS: 86_401, weightG: 1 }];
    expect(shareProblems({ ...recipe, stages })).toEqual([{ field: 'stageWeight', stage: 0 }, { field: 'stageTime', stage: 1 }]);
  });

  it('round-trips every recipe that has no problem', () => {
    const [ratioMin, ratioMax] = SHARE_LIMITS.ratio;
    const [doseMin, doseMax] = SHARE_LIMITS.dose;
    const [yieldMin, yieldMax] = SHARE_LIMITS.yield;
    const [tempMin, tempMax] = SHARE_LIMITS.temp;
    const [timeMin, timeMax] = SHARE_LIMITS.time;
    const edges: SharedRecipe[] = [
      { ...recipe, ratio: ratioMin, dose: doseMin, yield: yieldMin, temp: tempMin, time: timeMin, stages: [] },
      { ...recipe, ratio: ratioMax, dose: doseMax, yield: yieldMax, temp: tempMax, time: timeMax },
      { ...recipe, name: ' x'.repeat(40), stages: Array.from({ length: MAX_STAGES }, (_, i) => ({ id: `id${i}`, label: ` ${'p'.repeat(38)} `, timeS: i, weightG: i })) },
    ];
    let seed = 7;
    const rand = (): number => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const pick = ([lo, hi]: readonly [number, number]): number => Math.round((lo + rand() * (hi - lo)) * 10) / 10;
    for (let i = 0; i < 200; i++) {
      edges.push({
        ...recipe, ratio: pick([ratioMin - 1, ratioMax + 1]), dose: pick([doseMin - 1, doseMax + 1]), yield: pick([yieldMin - 1, yieldMax + 1]),
        temp: pick([tempMin - 1, tempMax + 1]), time: pick([timeMin - 1, timeMax + 1]),
        stages: Array.from({ length: Math.floor(rand() * (MAX_STAGES + 2)) }, (_, j) => ({ id: `${j}`, label: 'Pour', timeS: j * 30, weightG: pick([-1, 3001]) })),
      });
    }
    let checked = 0;
    for (const r of edges) {
      if (shareProblems(r).length > 0) {
        expect(decodeRecipe(encodeRecipe(r))).toBeNull();
        continue;
      }
      checked++;
      expect(decodeRecipe(encodeRecipe(r))).toEqual({
        ...r, name: r.name.trim(), stages: r.stages.map((st, j) => ({ ...st, id: `s${j + 1}`, label: st.label.trim() })),
      });
    }
    expect(checked).toBeGreaterThan(3);
  });
});
