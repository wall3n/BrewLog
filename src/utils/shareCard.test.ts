import { describe, it, expect } from 'vitest';
import { extractionCard, recipeCard, ratingStars, wrapLines, type CardFormat } from './shareCard';
import type { Bean, Extraction } from '../db/types';

const f: CardFormat = {
  t: (key, options) => (options && typeof options.defaultValue === 'string' ? `${key}|${options.defaultValue}` : key),
  time: s => `${s}s`,
  date: iso => iso.slice(0, 10),
};

const ext: Extraction = {
  id: 1, method: 'espresso', beanId: 2, equipmentIds: [], grindSetting: '12',
  dose: 18, yield: 36, ratio: 2, timeS: 28, temp: 93, tds: null,
  flag: 'dialled', rating: 4, acidity: 3, sweetness: 4, bitterness: 2, body: 4, balance: 4,
  flavours: ['cherry', 'cocoa'], notes: 'Sweet',
  createdAt: '2026-09-20T08:00:00.000Z', updatedAt: '2026-09-20T08:00:00.000Z',
};

const bean: Bean = {
  id: 2, name: 'Kenya AA', roaster: 'Nomad', origin: 'Nyeri', roast: 'light', status: 'active',
  createdAt: 'a', updatedAt: 'b',
};

describe('ratingStars', () => {
  it('draws five stars and clamps the value', () => {
    expect(ratingStars(4)).toBe('★★★★☆');
    expect(ratingStars(9)).toBe('★★★★★');
    expect(ratingStars(-1)).toBe('☆☆☆☆☆');
  });
});

describe('extractionCard', () => {
  it('builds the card for a brew', () => {
    expect(extractionCard(ext, bean, f)).toEqual({
      eyebrow: 'methods.espresso|espresso',
      title: 'Kenya AA',
      subtitle: 'Nomad · Nyeri',
      stats: [
        { label: 'extraction.fields.dose', value: '18 g' },
        { label: 'extraction.fields.yield', value: '36 g' },
        { label: 'extraction.fields.ratio', value: '1:2.0' },
        { label: 'extraction.fields.time', value: '28s' },
        { label: 'extraction.fields.temp', value: '93 °C' },
        { label: 'extraction.fields.grind', value: '12' },
      ],
      lines: ['★★★★☆', 'cherry · cocoa', '“Sweet”'],
      footer: '2026-09-20',
    });
  });

  it('prefers TDS over grind and skips empty parts', () => {
    const card = extractionCard({ ...ext, tds: 9.2, rating: 0, flavours: [], notes: undefined }, undefined, f);
    expect(card.stats[5]).toEqual({ label: 'extraction.fields.tds', value: '9.2%' });
    expect(card.title).toBe('extraction.unknownBean');
    expect(card.subtitle).toBe('');
    expect(card.lines).toEqual([]);
  });
});

describe('recipeCard', () => {
  it('lists the stages in time order', () => {
    const card = recipeCard({
      name: 'V60', method: 'pour-over', ratio: 16.7, dose: 15, yield: 250, temp: 94, time: 210,
      stages: [
        { id: 'b', label: 'Pour', timeS: 45, weightG: 250 },
        { id: 'a', label: 'Bloom', timeS: 0, weightG: 50 },
      ],
    }, f);
    expect(card.lines).toEqual(['1 · Bloom @ 0s → 50 g', '2 · Pour @ 45s → 250 g']);
    expect(card.stats).toHaveLength(5);
  });
});

describe('wrapLines', () => {
  const measure = (s: string): number => s.length;

  it('wraps on word boundaries', () => {
    expect(wrapLines('one two three four', 9, measure, 5)).toEqual(['one two', 'three', 'four']);
  });

  it('keeps a word that is longer than the width on its own line', () => {
    expect(wrapLines('extraordinarily long', 5, measure, 5)).toEqual(['extraordinarily', 'long']);
  });

  it('cuts the last line with an ellipsis', () => {
    expect(wrapLines('aa bb cc dd ee', 5, measure, 2)).toEqual(['aa bb', 'cc d…']);
  });

  it('returns nothing for empty text', () => {
    expect(wrapLines('   ', 10, measure, 3)).toEqual([]);
  });
});
