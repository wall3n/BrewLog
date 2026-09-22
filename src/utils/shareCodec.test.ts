import { describe, it, expect } from 'vitest';
import {
  encodeRecipe, decodeRecipe, toSharedRecipe, buildRecipeShareUrl, readPayloadFromText,
  MAX_PAYLOAD_CHARS, type SharedRecipe,
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
