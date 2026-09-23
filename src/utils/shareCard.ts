import type { Bean, Extraction } from '../db/types';
import type { SharedRecipe } from './shareCodec';

export type Translate = (key: string, options?: Record<string, unknown>) => string;

export interface CardFormat {
  t: Translate;
  time: (seconds: number) => string;
  date: (iso: string) => string;
}

export interface CardStat { label: string; value: string; }

export interface CardModel {
  eyebrow: string;
  title: string;
  subtitle: string;
  stats: readonly CardStat[];
  lines: readonly string[];
  footer: string;
}

export const MAX_CARD_STATS = 6;
export const MAX_CARD_LINES = 8;

export function ratingStars(rating: number): string {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

export function extractionCard(ext: Extraction, bean: Bean | undefined, f: CardFormat): CardModel {
  const stats: CardStat[] = [
    { label: f.t('extraction.fields.dose'), value: `${ext.dose} g` },
    { label: f.t('extraction.fields.yield'), value: `${ext.yield} g` },
    { label: f.t('extraction.fields.ratio'), value: `1:${ext.ratio.toFixed(1)}` },
    { label: f.t('extraction.fields.time'), value: f.time(ext.timeS) },
    { label: f.t('extraction.fields.temp'), value: `${ext.temp} °C` },
  ];
  if (ext.tds) stats.push({ label: f.t('extraction.fields.tds'), value: `${ext.tds}%` });
  else if (ext.grindSetting) stats.push({ label: f.t('extraction.fields.grind'), value: ext.grindSetting });

  const lines: string[] = [];
  if (ext.rating > 0) lines.push(ratingStars(ext.rating));
  if (ext.flavours.length > 0) lines.push(ext.flavours.join(' · '));
  if (ext.notes) lines.push(`“${ext.notes}”`);

  return {
    eyebrow: f.t(`methods.${ext.method}`, { defaultValue: ext.method }),
    title: bean?.name ?? f.t('extraction.unknownBean'),
    subtitle: [bean?.roaster, bean?.origin].filter(Boolean).join(' · '),
    stats: stats.slice(0, MAX_CARD_STATS),
    lines: lines.slice(0, MAX_CARD_LINES),
    footer: f.date(ext.createdAt),
  };
}

export function recipeCard(recipe: SharedRecipe, f: CardFormat): CardModel {
  const stages = [...recipe.stages].sort((a, b) => a.timeS - b.timeS);
  return {
    eyebrow: f.t(`methods.${recipe.method}`, { defaultValue: recipe.method }),
    title: recipe.name,
    subtitle: f.t('share.recipeSubtitle'),
    stats: [
      { label: f.t('recipes.fields.dose'), value: `${recipe.dose} g` },
      { label: f.t('recipes.fields.yield'), value: `${recipe.yield} g` },
      { label: f.t('recipes.fields.ratio'), value: `1:${recipe.ratio.toFixed(1)}` },
      { label: f.t('recipes.fields.time'), value: f.time(recipe.time) },
      { label: f.t('recipes.fields.temp'), value: `${recipe.temp} °C` },
    ],
    lines: stages.slice(0, MAX_CARD_LINES).map((s, i) => `${i + 1} · ${s.label} @ ${f.time(s.timeS)} → ${s.weightG} g`),
    footer: '',
  };
}

// Greedy word wrap. The last line ends with "…" when the text needs more lines than maxLines.
export function wrapLines(text: string, maxWidth: number, measure: (s: string) => number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (measure(next) <= maxWidth || !current) { current = next; continue; }
    lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1];
  while (last.length > 1 && measure(`${last}…`) > maxWidth) last = last.slice(0, -1);
  kept[maxLines - 1] = `${last}…`;
  return kept;
}
