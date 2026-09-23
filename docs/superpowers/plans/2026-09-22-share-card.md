# Share Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user share a brew or a recipe as a PNG card, and share a recipe as a link that another BrewLog user opens and saves. All of it works offline, with no backend.

**Architecture:** A recipe link carries the recipe as base64url JSON in the URL hash (`/recipes/import#r=…`). The browser never sends the hash to a server. `src/utils/shareCodec.ts` encodes the link and checks every field on decode, because a link is untrusted input. `src/utils/shareCard.ts` builds a card model (pure, tested). `src/utils/renderCard.ts` draws the model on a canvas with the live theme tokens and the self-hosted fonts. A `ShareActions` component renders the PNG **before** the tap, so `navigator.share()` runs inside the user gesture (Safari needs this).

**Tech Stack:** React 19, TypeScript 6 (strict), Canvas 2D, Web Share API (files and URL), Clipboard API, React Router 7, Vitest 4, react-i18next.

**Spec:** the "Feature spec" section below. It comes from the 2026-09-22 feature review (feature 5 of 5).

**Branch:** `feat/share-card`, made from `main` at `02e91cb`.

**Verified:** the code in this plan was compiled (`npx tsc -b`), linted (no new errors), tested (19 tests pass), and built (`npm run build`) against `main` on 2026-09-22. The browser checks in Task 6 were not run.

## Feature spec

1. The extraction detail screen has "Share image". The recipe detail screen has "Share image" and "Share link".
2. The image is a 1080 × 1350 PNG (Instagram portrait size) in the current theme. A brew card shows the method, bean name, roaster and origin, up to 6 stats, the stars, the flavours, the notes, and the date. A recipe card shows the method, name, 5 stats, and the pour stages in time order.
3. Where the Web Share API can share files (iOS Safari, Android Chrome), the system share sheet opens. Elsewhere, the PNG downloads.
4. "Share link" opens the share sheet with the URL. Where that is not possible, it copies the URL and shows "Link copied."
5. The link opens `/recipes/import`, which shows a preview and a "Save recipe" button. An invalid link shows an error screen.
6. On iOS, a home-screen PWA and Safari have **separate storage**. A link opens in Safari, not in the PWA. So the Recipes screen also has "Import": the user pastes the link (or the bare code) and the PWA opens the same preview.
7. The decoder accepts only version 1, a known method id, numbers in range, a name of 1–80 characters, and 0–20 stages. It trims labels to 40 characters and gives the stages new ids.

## Global Constraints

- Node 24.x LTS (pin from `.nvmrc` and `package.json` `engines`). npm only.
- TypeScript `strict`. No `any`, no `as any`, no `as unknown as X`. Give explicit parameter and return types. Parse untrusted JSON as `unknown` and narrow it.
- No backend, no network call (CLAUDE.md constraint 1). The share link needs no server: the hash stays in the browser.
- Components never call Dexie. Use `useDb()` from `src/hooks/useDb.ts`.
- No hardcoded user-facing text. Add every key to all three files: `src/i18n/locales/en.json`, `es.json`, `fr.json`. (CLAUDE.md says `public/locales`. That is out of date. The real files are in `src/i18n/locales/`.) The word "BrewLog" on the card is the app name and stays as is.
- No inline `style` attribute. Component styles go in a co-located `styles.module.css`. Colours come only from CSS variables. The canvas reads them with `getComputedStyle`, so it never hardcodes a hex value.
- Icons: add new icons to the existing `Icon` component in `src/components/Icons.tsx`. The code does not use `lucide-react`.
- Commits: Conventional Commits, English, lowercase subject, no `Co-authored-by` trailer.
- Lint: `main` has 2 old lint errors (`src/context/AppContext.tsx:83`, `src/screens/Home/HomeScreen.tsx:98`). Do not fix them. Do not add new errors. Check with `npx eslint <changed files>`. The `react-hooks` plugin rejects a synchronous `setState` inside `useEffect`.
- Do not import `src/utils/formatters.ts` or `src/i18n` into a module that a `*.test.ts` file imports. `formatters.ts` starts i18next, and the tests run in Node.

## Review Focus

1. A crafted link with a huge payload, wrong types, a script in a label, or an unknown method → the import screen shows "not valid". Nothing reaches Dexie. React escapes the label text.
2. iOS Safari: tap "Share image" → the share sheet opens. If the PNG rendered inside the click handler, Safari would reject `share()` with `NotAllowedError`. The button stays disabled ("Preparing image…") until the PNG is ready.
3. The user closes the share sheet → no error message (`AbortError` means "cancelled").
4. A desktop browser with no Web Share API → the image downloads and the link copies to the clipboard, each with a status message.
5. The app is offline → the card still renders with DM Serif Display and DM Mono (fontsource files are in the service worker cache), and the import route still loads (Workbox serves `index.html` for navigation).

---

### Task 1: Test harness

**Files:**
- Modify: `package.json` (the `scripts` block)
- Modify: `vite.config.ts`

**Interfaces:**
- Produces: the command `npm test` (runs `vitest run` on `src/**/*.test.ts` in the Node environment).

- [ ] **Step 1: Install the locked dependencies**

Run: `npm ci`
Expected: ends without an error.

- [ ] **Step 2: Add the test script**

In `package.json`, change the `scripts` block to:

```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run"
  },
```

- [ ] **Step 3: Add the Vitest config**

In `vite.config.ts`, add this as line 1:

```ts
/// <reference types="vitest/config" />
```

Then add a `test` key directly after the `define` block, inside `defineConfig({ ... })`:

```ts
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
```

- [ ] **Step 4: Make sure the harness runs**

Run: `npx vitest run --passWithNoTests`
Expected: `No test files found, exiting with code 0`.

Run: `npx tsc -b`
Expected: no output, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add package.json vite.config.ts
git commit -m "test: add vitest run script and config"
```

---

### Task 2: Recipe link codec

**Files:**
- Create: `src/utils/shareCodec.ts`
- Test: `src/utils/shareCodec.test.ts`

**Interfaces:**
- Consumes: `Recipe`, `PourStage` from `src/db/types.ts`. `METHODS` from `src/utils/methodDefaults.ts`.
- Produces:
  - `type SharedRecipe = Pick<Recipe, 'name' | 'method' | 'ratio' | 'dose' | 'yield' | 'temp' | 'time' | 'stages'>` — assignable to `useDb().addRecipe()`.
  - `toSharedRecipe(r: Recipe): SharedRecipe`
  - `encodeRecipe(recipe: SharedRecipe): string`
  - `decodeRecipe(payload: string): SharedRecipe | null`
  - `buildRecipeShareUrl(origin: string, recipe: SharedRecipe): string`
  - `readPayloadFromText(text: string): string | null` (accepts a full link, `#r=…`, or the bare code)
  - `IMPORT_PATH = '/recipes/import'`, `MAX_PAYLOAD_CHARS = 4000`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/shareCodec.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests and make sure they fail**

Run: `npx vitest run src/utils/shareCodec.test.ts`
Expected: FAIL with `Failed to resolve import "./shareCodec"`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/shareCodec.ts`:

```ts
import type { PourStage, Recipe } from '../db/types';
import { METHODS } from './methodDefaults';

// A recipe travels in the URL hash (#r=...). The browser never sends the hash to a server.
export const SHARE_VERSION = 1;
export const IMPORT_PATH = '/recipes/import';
export const MAX_PAYLOAD_CHARS = 4000;
export const MAX_NAME_LENGTH = 80;
export const MAX_LABEL_LENGTH = 40;
export const MAX_STAGES = 20;

export type SharedRecipe = Pick<Recipe, 'name' | 'method' | 'ratio' | 'dose' | 'yield' | 'temp' | 'time' | 'stages'>;

export function toSharedRecipe(r: Recipe): SharedRecipe {
  return {
    name: r.name, method: r.method, ratio: r.ratio, dose: r.dose, yield: r.yield, temp: r.temp, time: r.time,
    stages: r.stages.map(s => ({ id: s.id, label: s.label, timeS: s.timeS, weightG: s.weightG })),
  };
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

export function encodeRecipe(recipe: SharedRecipe): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify({ v: SHARE_VERSION, r: recipe })));
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function num(v: unknown, min: number, max: number): number | null {
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null;
}

// Treat every link as untrusted input: check each field and its range.
function parseRecipe(v: unknown): SharedRecipe | null {
  if (!isRecord(v) || v.v !== SHARE_VERSION || !isRecord(v.r)) return null;
  const r = v.r;
  const name = typeof r.name === 'string' ? r.name.trim().slice(0, MAX_NAME_LENGTH) : '';
  const method = typeof r.method === 'string' && METHODS.some(m => m.id === r.method) ? r.method : null;
  const ratio = num(r.ratio, 1, 30);
  const dose = num(r.dose, 1, 200);
  const yieldG = num(r.yield, 1, 3000);
  const temp = num(r.temp, 0, 100);
  const time = num(r.time, 0, 86_400);
  if (!name || !method || ratio === null || dose === null || yieldG === null || temp === null || time === null) return null;
  if (!Array.isArray(r.stages) || r.stages.length > MAX_STAGES) return null;
  const stages: PourStage[] = [];
  for (const [i, s] of r.stages.entries()) {
    if (!isRecord(s) || typeof s.label !== 'string') return null;
    const timeS = num(s.timeS, 0, 86_400);
    const weightG = num(s.weightG, 0, 3000);
    if (timeS === null || weightG === null) return null;
    stages.push({ id: `s${i + 1}`, label: s.label.trim().slice(0, MAX_LABEL_LENGTH), timeS, weightG });
  }
  return { name, method, ratio, dose, yield: yieldG, temp, time, stages };
}

export function decodeRecipe(payload: string): SharedRecipe | null {
  if (!payload || payload.length > MAX_PAYLOAD_CHARS) return null;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
    return parseRecipe(parsed);
  } catch {
    return null;
  }
}

export function buildRecipeShareUrl(origin: string, recipe: SharedRecipe): string {
  return `${origin}${IMPORT_PATH}#r=${encodeRecipe(recipe)}`;
}

// Accepts a full link, a bare hash, or the payload alone.
export function readPayloadFromText(text: string): string | null {
  const trimmed = text.trim();
  const inLink = /#r=([A-Za-z0-9_-]+)/.exec(trimmed);
  if (inLink) return inLink[1];
  return /^[A-Za-z0-9_-]+$/.test(trimmed) ? trimmed : null;
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/utils/shareCodec.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/shareCodec.ts src/utils/shareCodec.test.ts
git commit -m "feat(share): add recipe link codec with input checks"
```

---

### Task 3: Card model

**Files:**
- Create: `src/utils/shareCard.ts`
- Test: `src/utils/shareCard.test.ts`

**Interfaces:**
- Consumes: `SharedRecipe` (Task 2). `Bean`, `Extraction` from `src/db/types.ts`.
- Produces:
  - `type Translate = (key: string, options?: Record<string, unknown>) => string` — the `t` from `useTranslation()` fits this type.
  - `interface CardFormat { t: Translate; time: (seconds: number) => string; date: (iso: string) => string }`
  - `interface CardModel { eyebrow: string; title: string; subtitle: string; stats: readonly CardStat[]; lines: readonly string[]; footer: string }`
  - `extractionCard(ext: Extraction, bean: Bean | undefined, f: CardFormat): CardModel`
  - `recipeCard(recipe: SharedRecipe, f: CardFormat): CardModel`
  - `wrapLines(text: string, maxWidth: number, measure: (s: string) => number, maxLines: number): string[]`
  - `ratingStars(rating: number): string`

The formatters come in through `CardFormat`, so this module does not import `formatters.ts` and runs in the Node tests.

- [ ] **Step 1: Write the failing tests**

Create `src/utils/shareCard.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests and make sure they fail**

Run: `npx vitest run src/utils/shareCard.test.ts`
Expected: FAIL with `Failed to resolve import "./shareCard"`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/shareCard.ts`:

```ts
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
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm test`
Expected: PASS, 19 tests in 2 files.

- [ ] **Step 5: Commit**

```bash
git add src/utils/shareCard.ts src/utils/shareCard.test.ts
git commit -m "feat(share): add card model for brews and recipes"
```

---

### Task 4: Canvas renderer, share helpers, `ShareActions`, icons, translations

**Files:**
- Create: `src/utils/renderCard.ts`
- Create: `src/utils/shareFile.ts`
- Create: `src/components/ShareActions/index.tsx`
- Create: `src/components/ShareActions/styles.module.css`
- Modify: `src/components/Icons.tsx` (two icons)
- Modify: `src/components/UI.tsx` (one export)
- Modify: `src/i18n/locales/en.json`, `es.json`, `fr.json`

**Interfaces:**
- Consumes: `CardModel`, `wrapLines` (Task 3). `Button` from `src/components/Button`.
- Produces:
  - `renderCardPng(model: CardModel): Promise<Blob>`
  - `type ShareOutcome = 'shared' | 'downloaded' | 'copied' | 'cancelled'`
  - `shareImage(blob: Blob, fileName: string, title: string): Promise<ShareOutcome>`
  - `shareLink(url: string, title: string): Promise<ShareOutcome>`
  - `ShareActions({ model, fileName, link }: { model: CardModel | null; fileName: string; link?: string })`, exported from `src/components/UI.tsx`
  - `Icon` names `share` and `link`
  - i18n keys `share.*`

These modules call browser APIs (canvas, fonts, share, clipboard). They have no unit tests. Task 6 checks them in real browsers.

- [ ] **Step 1: Write the canvas renderer**

Create `src/utils/renderCard.ts`:

```ts
import { wrapLines, type CardModel } from './shareCard';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
const PAD = 88;

interface CardTheme {
  bg: string; primary: string; secondary: string; tertiary: string; accent: string; border: string;
  serif: string; mono: string;
}

// Reads the live design tokens, so the image follows the light or dark theme.
function readCardTheme(): CardTheme {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string): string => css.getPropertyValue(name).trim();
  return {
    bg: v('--bg-surface'), primary: v('--text-primary'), secondary: v('--text-secondary'),
    tertiary: v('--text-tertiary'), accent: v('--accent'), border: v('--border'),
    serif: v('--serif'), mono: v('--mono'),
  };
}

function drawCard(ctx: CanvasRenderingContext2D, model: CardModel, th: CardTheme): void {
  const inner = CARD_WIDTH - PAD * 2;
  ctx.fillStyle = th.bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.textBaseline = 'alphabetic';

  let y = PAD + 30;
  ctx.fillStyle = th.accent;
  ctx.font = `30px ${th.mono}`;
  ctx.fillText(model.eyebrow.toUpperCase(), PAD, y);

  ctx.fillStyle = th.primary;
  ctx.font = `84px ${th.serif}`;
  for (const line of wrapLines(model.title, inner, s => ctx.measureText(s).width, 3)) {
    y += 96;
    ctx.fillText(line, PAD, y);
  }

  if (model.subtitle) {
    y += 56;
    ctx.fillStyle = th.secondary;
    ctx.font = `30px ${th.mono}`;
    ctx.fillText(model.subtitle, PAD, y, inner);
  }

  y += 56;
  ctx.fillStyle = th.border;
  ctx.fillRect(PAD, y, inner, 2);

  const colW = inner / 3;
  model.stats.forEach((stat, i) => {
    const x = PAD + (i % 3) * colW;
    const rowY = y + 100 + Math.floor(i / 3) * 150;
    ctx.fillStyle = th.primary;
    ctx.font = `60px ${th.mono}`;
    ctx.fillText(stat.value, x, rowY, colW - 16);
    ctx.fillStyle = th.tertiary;
    ctx.font = `24px ${th.mono}`;
    ctx.fillText(stat.label.toUpperCase(), x, rowY + 44, colW - 16);
  });
  y += 100 + Math.ceil(model.stats.length / 3) * 150;

  ctx.fillStyle = th.secondary;
  ctx.font = `30px ${th.mono}`;
  const footerTop = CARD_HEIGHT - PAD - 60;
  for (const text of model.lines) {
    for (const line of wrapLines(text, inner, s => ctx.measureText(s).width, 2)) {
      if (y + 46 > footerTop) break;
      y += 46;
      ctx.fillText(line, PAD, y);
    }
  }

  ctx.fillStyle = th.accent;
  ctx.font = `40px ${th.serif}`;
  ctx.fillText('BrewLog', PAD, CARD_HEIGHT - PAD);
  if (model.footer) {
    ctx.fillStyle = th.tertiary;
    ctx.font = `26px ${th.mono}`;
    ctx.textAlign = 'right';
    ctx.fillText(model.footer, CARD_WIDTH - PAD, CARD_HEIGHT - PAD);
    ctx.textAlign = 'left';
  }
}

export async function renderCardPng(model: CardModel): Promise<Blob> {
  const theme = readCardTheme();
  // The fonts are self-hosted (fontsource), so this works offline.
  await Promise.all([document.fonts.load(`84px ${theme.serif}`), document.fonts.load(`30px ${theme.mono}`)]);
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is not available');
  drawCard(ctx, model, theme);
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png');
  });
}
```

- [ ] **Step 2: Write the share helpers**

Create `src/utils/shareFile.ts`:

```ts
export type ShareOutcome = 'shared' | 'downloaded' | 'copied' | 'cancelled';

function isAbort(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError';
}

// Call from a click handler with a blob that is already rendered.
// Safari rejects navigator.share() if the page awaits other work first.
export async function shareImage(blob: Blob, fileName: string, title: string): Promise<ShareOutcome> {
  const file = new File([blob], fileName, { type: 'image/png' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (e) {
      if (isAbort(e)) return 'cancelled';
      throw e;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}

export async function shareLink(url: string, title: string): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, url });
      return 'shared';
    } catch (e) {
      if (isAbort(e)) return 'cancelled';
      // Some desktop browsers expose share() but fail. Copy the link instead.
    }
  }
  await navigator.clipboard.writeText(url);
  return 'copied';
}
```

- [ ] **Step 3: Write `ShareActions`**

Create `src/components/ShareActions/index.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { renderCardPng } from '../../utils/renderCard';
import { shareImage, shareLink, type ShareOutcome } from '../../utils/shareFile';
import type { CardModel } from '../../utils/shareCard';
import s from './styles.module.css';

export interface ShareActionsProps {
  model: CardModel | null;
  fileName: string;
  link?: string;
}

type Status = ShareOutcome | 'failed' | null;

export function ShareActions({ model, fileName, link }: ShareActionsProps) {
  const { t } = useTranslation();
  const [rendered, setRendered] = useState<{ model: CardModel; blob: Blob } | null>(null);
  const [status, setStatus] = useState<Status>(null);
  // A blob for an older model is stale. Treat it as "not ready".
  const blob = rendered !== null && rendered.model === model ? rendered.blob : null;

  // Render the image before the tap, so share() runs inside the user gesture.
  useEffect(() => {
    if (!model) return;
    let cancelled = false;
    renderCardPng(model)
      .then(b => { if (!cancelled) setRendered({ model, blob: b }); })
      .catch(() => { if (!cancelled) setStatus('failed'); });
    return () => { cancelled = true; };
  }, [model]);

  const run = async (action: () => Promise<ShareOutcome>): Promise<void> => {
    try {
      setStatus(await action());
    } catch {
      setStatus('failed');
    }
  };

  const title = model?.title ?? '';
  const message =
    status === 'copied' ? t('share.copied')
    : status === 'downloaded' ? t('share.downloaded')
    : status === 'failed' ? t('share.failed')
    : null;

  return (
    <div className={s.root}>
      <div className={s.buttons}>
        <Button variant="ghost" full leftIcon="share" disabled={!blob}
          onClick={() => { if (blob) void run(() => shareImage(blob, fileName, title)); }}>
          {blob ? t('share.image') : t('share.preparing')}
        </Button>
        {link && (
          <Button variant="ghost" full leftIcon="link" onClick={() => void run(() => shareLink(link, title))}>
            {t('share.link')}
          </Button>
        )}
      </div>
      <span className={`t-sec t-mono ${s.status}`} aria-live="polite">{message}</span>
    </div>
  );
}
```

Create `src/components/ShareActions/styles.module.css`:

```css
.root    { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.buttons { display: flex; gap: 12px; }
.status  { min-height: 16px; font-size: 11px; text-align: center; }
```

- [ ] **Step 4: Add the icons and the export**

Make these exact changes:

```diff
--- a/src/components/Icons.tsx
+++ b/src/components/Icons.tsx
@@ -8,7 +8,7 @@ type IconName =
   | 'flame' | 'thermo' | 'scale' | 'espresso' | 'frenchPress' | 'pourOver'
   | 'aeropress' | 'mokaPot' | 'coldBrew' | 'drip' | 'siphon' | 'custom'
   | 'user' | 'download' | 'upload' | 'chevronRight' | 'chevronDown' | 'chevronUp'
-  | 'sparkles' | 'refractometer' | 'grid' | 'list' | 'more' | 'sun' | 'moon';
+  | 'sparkles' | 'refractometer' | 'grid' | 'list' | 'more' | 'sun' | 'moon' | 'share' | 'link';
 
 interface IconProps extends SVGProps<SVGSVGElement> {
   name: IconName | string;
@@ -68,6 +68,8 @@ const PATHS: Record<string, React.ReactNode> = {
   more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
   sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
   moon: <><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></>,
+  share: <><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="m16 6-4-4-4 4"/><path d="M12 2v13"/></>,
+  link: <><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></>,
 };
 
 export function Icon({ name, size = 18, ...rest }: IconProps) {
```

```diff
--- a/src/components/UI.tsx
+++ b/src/components/UI.tsx
@@ -14,5 +14,6 @@ export { FAB } from './FAB';
 export { SegToggle } from './SegToggle';
 export { Pagination } from './Pagination';
 export { FilterBar } from './FilterBar';
+export { ShareActions } from './ShareActions';
 
 
```

- [ ] **Step 5: Add the translations**

In each locale file, add a new top-level key `"share"` directly after the `"recipes"` block. Keep valid JSON (add a comma after the closing `}` of `"recipes"`).

`en.json`:

```json
  "share": {
    "image": "Share image",
    "link": "Share link",
    "preparing": "Preparing image…",
    "copied": "Link copied.",
    "downloaded": "Image saved.",
    "failed": "Could not share. Try again.",
    "recipeSubtitle": "Recipe",
    "import": {
      "open": "Import",
      "title": "Import recipe",
      "pasteLabel": "Recipe link",
      "paste": "Paste a BrewLog recipe link",
      "go": "Open",
      "invalid": "This recipe link is not valid.",
      "invalidBody": "Ask the sender for a new link.",
      "from": "Shared recipe",
      "save": "Save recipe",
      "failed": "Could not save the recipe. Try again."
    }
  }
```

`es.json`:

```json
  "share": {
    "image": "Compartir imagen",
    "link": "Compartir enlace",
    "preparing": "Preparando imagen…",
    "copied": "Enlace copiado.",
    "downloaded": "Imagen guardada.",
    "failed": "No se pudo compartir. Inténtalo de nuevo.",
    "recipeSubtitle": "Receta",
    "import": {
      "open": "Importar",
      "title": "Importar receta",
      "pasteLabel": "Enlace de la receta",
      "paste": "Pega un enlace de receta de BrewLog",
      "go": "Abrir",
      "invalid": "Este enlace de receta no es válido.",
      "invalidBody": "Pide un enlace nuevo a quien te lo envió.",
      "from": "Receta compartida",
      "save": "Guardar receta",
      "failed": "No se pudo guardar la receta. Inténtalo de nuevo."
    }
  }
```

`fr.json`:

```json
  "share": {
    "image": "Partager l’image",
    "link": "Partager le lien",
    "preparing": "Préparation de l’image…",
    "copied": "Lien copié.",
    "downloaded": "Image enregistrée.",
    "failed": "Partage impossible. Réessayez.",
    "recipeSubtitle": "Recette",
    "import": {
      "open": "Importer",
      "title": "Importer une recette",
      "pasteLabel": "Lien de la recette",
      "paste": "Collez un lien de recette BrewLog",
      "go": "Ouvrir",
      "invalid": "Ce lien de recette n’est pas valide.",
      "invalidBody": "Demandez un nouveau lien à l’expéditeur.",
      "from": "Recette partagée",
      "save": "Enregistrer la recette",
      "failed": "Impossible d’enregistrer la recette. Réessayez."
    }
  }
```

Run: `node -e "for (const l of ['en','es','fr']) { const d = JSON.parse(require('fs').readFileSync('src/i18n/locales/'+l+'.json','utf8')); if (!d.share.import.save) throw new Error(l) }"`
Expected: no output.

- [ ] **Step 6: Check the types and lint, then commit**

Run: `npx tsc -b && npx eslint src/utils/renderCard.ts src/utils/shareFile.ts src/components`
Expected: no errors.

```bash
git add src/utils/renderCard.ts src/utils/shareFile.ts src/components src/i18n/locales
git commit -m "feat(share): add share card renderer and share actions"
```

---

### Task 5: Share buttons, import route, and paste import

**Files:**
- Create: `src/screens/Recipes/RecipeImport.tsx`
- Modify: `src/router.tsx`
- Modify: `src/screens/Recipes/RecipesScreen.tsx`
- Modify: `src/screens/Recipes/RecipeDetail.tsx`
- Modify: `src/screens/History/ExtractionDetail.tsx`
- Modify: `src/screens/Recipes/styles.module.css`

**Interfaces:**
- Consumes: `decodeRecipe`, `readPayloadFromText`, `toSharedRecipe`, `buildRecipeShareUrl`, `IMPORT_PATH` (Task 2). `extractionCard`, `recipeCard` (Task 3). `ShareActions` (Task 4). `useDb().addRecipe(data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>): Promise<void>`. `fmtDate`, `fmtTime` from `src/utils/formatters.ts`.

- [ ] **Step 1: Write the import screen**

Create `src/screens/Recipes/RecipeImport.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, BackBar, MethodBadge, Empty } from '../../components/UI';
import { fmtTime } from '../../utils/formatters';
import { decodeRecipe, readPayloadFromText } from '../../utils/shareCodec';
import s from './styles.module.css';

export function RecipeImport() {
  const location = useLocation();
  const navigate = useNavigate();
  const db = useDb();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const recipe = useMemo(() => {
    const payload = readPayloadFromText(location.hash);
    return payload ? decodeRecipe(payload) : null;
  }, [location.hash]);

  const back = <BackBar onClick={() => navigate('/recipes')} label={t('recipes.backToRecipes')} />;

  if (!recipe) {
    return <div>{back}<Empty icon="recipe" title={t('share.import.invalid')} body={t('share.import.invalidBody')} /></div>;
  }

  const save = async (): Promise<void> => {
    setSaving(true);
    setFailed(false);
    try {
      await db.addRecipe(recipe);
      navigate('/recipes');
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  return (
    <div>
      {back}
      <div className={`page-head ${s.detailHead}`}>
        <div className={`row row-gap-12 ${s.headRow}`}>
          <MethodBadge method={recipe.method} />
          <span className="t-upper">{t('share.import.from')}</span>
        </div>
        <h1>{recipe.name}</h1>
      </div>

      <div className={`card ${s.detailCard}`}>
        <div className="grid grid-3">
          {[
            { v: `${recipe.dose}g`, l: t('recipes.fields.dose') },
            { v: `${recipe.yield}g`, l: t('recipes.fields.yield') },
            { v: `1:${recipe.ratio.toFixed(1)}`, l: t('recipes.fields.ratio') },
            { v: fmtTime(recipe.time), l: t('recipes.fields.time') },
            { v: `${recipe.temp}°C`, l: t('recipes.fields.temp') },
          ].map(item => (
            <div key={item.l} className="stat">
              <div className="v t-mono">{item.v}</div>
              <div className="l">{item.l}</div>
            </div>
          ))}
        </div>
      </div>

      {recipe.stages.length > 0 && (
        <div className={`card ${s.detailCard}`}>
          <div className={`t-upper ${s.pourLabel}`}>{t('recipes.pourSchedule')}</div>
          <div className="col col-gap-8">
            {recipe.stages.map((stage, i) => (
              <div key={stage.id} className="pour-stage">
                <span className="pn">{i + 1}</span>
                <span className="pl">{stage.label}</span>
                <span className="pt">@ {fmtTime(stage.timeS)} → {stage.weightG}g</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button full size="lg" leftIcon="download" disabled={saving} onClick={() => void save()}>
        {t('share.import.save')}
      </Button>
      {failed && <p className={`t-sec ${s.importError}`} role="alert">{t('share.import.failed')}</p>}
    </div>
  );
}
```

Append to `src/screens/Recipes/styles.module.css`:

```css
.importError  { margin-top: 12px; font-size: 12px; }
```

- [ ] **Step 2: Add the route**

`recipes/import` is a static segment, so React Router 7 ranks it above `recipes/:id`. Put it first anyway, for the reader.

```diff
--- a/src/router.tsx
+++ b/src/router.tsx
@@ -8,6 +8,7 @@ import { BeansScreen } from './screens/Beans/BeansScreen';
 import { BeanDetail } from './screens/Beans/BeanDetail';
 import { RecipesScreen } from './screens/Recipes/RecipesScreen';
 import { RecipeDetail } from './screens/Recipes/RecipeDetail';
+import { RecipeImport } from './screens/Recipes/RecipeImport';
 import { EquipmentScreen } from './screens/Equipment/EquipmentScreen';
 import { AnalyticsScreen } from './screens/Analytics/AnalyticsScreen';
 import { SettingsScreen } from './screens/Settings/SettingsScreen';
@@ -24,6 +25,7 @@ export const router = createBrowserRouter([
       { path: 'beans', element: <BeansScreen /> },
       { path: 'beans/:id', element: <BeanDetail /> },
       { path: 'recipes', element: <RecipesScreen /> },
+      { path: 'recipes/import', element: <RecipeImport /> },
       { path: 'recipes/:id', element: <RecipeDetail /> },
       { path: 'equipment', element: <EquipmentScreen /> },
       { path: 'analytics', element: <AnalyticsScreen /> },
```

- [ ] **Step 3: Add "Import" to the recipe list**

```diff
--- a/src/screens/Recipes/RecipesScreen.tsx
+++ b/src/screens/Recipes/RecipesScreen.tsx
@@ -3,10 +3,11 @@ import { useNavigate } from 'react-router-dom';
 import { useTranslation } from 'react-i18next';
 import { useDb } from '../../hooks/useDb';
 import { useDebounce } from '../../hooks/useDebounce';
-import { Button, StagList, Empty, MethodBadge, Sheet, Pagination, FilterBar } from '../../components/UI';
+import { Button, StagList, Empty, MethodBadge, Sheet, Pagination, FilterBar, Field, Input } from '../../components/UI';
 import { Icon } from '../../components/Icons';
 import { fmtRelDate, fmtTime } from '../../utils/formatters';
 import { METHODS } from '../../utils/methodDefaults';
+import { decodeRecipe, readPayloadFromText, IMPORT_PATH } from '../../utils/shareCodec';
 import { RecipeForm } from './RecipeForm';
 import type { Recipe } from '../../db/types';
 import s from './styles.module.css';
@@ -18,6 +19,9 @@ export function RecipesScreen() {
 
   const [recipes, setRecipes] = useState<Recipe[]>([]);
   const [creating, setCreating] = useState(false);
+  const [importing, setImporting] = useState(false);
+  const [importText, setImportText] = useState('');
+  const [importError, setImportError] = useState(false);
   const [method, setMethod] = useState('all');
   const [inputQ, setInputQ] = useState('');
   const q = useDebounce(inputQ, 500);
@@ -88,6 +92,14 @@ export function RecipesScreen() {
     }
   ];
 
+  const openImport = (): void => {
+    const payload = readPayloadFromText(importText);
+    if (!payload || !decodeRecipe(payload)) { setImportError(true); return; }
+    setImporting(false);
+    setImportText('');
+    navigate(`${IMPORT_PATH}#r=${payload}`);
+  };
+
   return (
     <div>
       <div className={`row row-between ${s.pageRow}`}>
@@ -98,9 +110,12 @@ export function RecipesScreen() {
             {(method !== 'all' || q) && ` · ${t('recipes.shown', { count: totalCount })}`}
           </p>
         </div>
-        <Button variant="primary" leftIcon="plus" onClick={() => setCreating(true)}>
-          {t('recipes.new')}
-        </Button>
+        <div className="row row-gap-8">
+          <Button variant="ghost" leftIcon="download" onClick={() => setImporting(true)}>{t('share.import.open')}</Button>
+          <Button variant="primary" leftIcon="plus" onClick={() => setCreating(true)}>
+            {t('recipes.new')}
+          </Button>
+        </div>
       </div>
 
       <div className="row row-gap-8 mb-4">
@@ -182,6 +197,17 @@ export function RecipesScreen() {
       <Sheet open={creating} onClose={() => setCreating(false)} title={t('recipes.new')}>
         <RecipeForm onSave={handleSave} />
       </Sheet>
+
+      <Sheet open={importing} onClose={() => setImporting(false)} title={t('share.import.title')}>
+        <div className="col col-gap-16">
+          <Field label={t('share.import.pasteLabel')}>
+            <Input value={importText} placeholder={t('share.import.paste')}
+              onChange={e => { setImportText(e.target.value); setImportError(false); }} />
+          </Field>
+          {importError && <p className={`t-sec ${s.importError}`} role="alert">{t('share.import.invalid')}</p>}
+          <Button full onClick={openImport}>{t('share.import.go')}</Button>
+        </div>
+      </Sheet>
     </div>
   );
 }
```

- [ ] **Step 4: Add the share buttons to the two detail screens**

The `useMemo` must come before the early `return` lines, because hooks must run in the same order on every render.

```diff
--- a/src/screens/Recipes/RecipeDetail.tsx
+++ b/src/screens/Recipes/RecipeDetail.tsx
@@ -1,9 +1,11 @@
-import { useState, useEffect } from 'react';
+import { useState, useEffect, useMemo } from 'react';
 import { useNavigate, useParams } from 'react-router-dom';
 import { useTranslation } from 'react-i18next';
 import { useDb } from '../../hooks/useDb';
-import { Button, BackBar, MethodBadge, Empty, Sheet } from '../../components/UI';
-import { fmtRelDate, fmtTime } from '../../utils/formatters';
+import { Button, BackBar, MethodBadge, Empty, Sheet, ShareActions } from '../../components/UI';
+import { fmtDate, fmtRelDate, fmtTime } from '../../utils/formatters';
+import { recipeCard } from '../../utils/shareCard';
+import { buildRecipeShareUrl, toSharedRecipe } from '../../utils/shareCodec';
 import { RecipeForm } from './RecipeForm';
 import type { Recipe } from '../../db/types';
 import s from './styles.module.css';
@@ -26,6 +28,11 @@ export function RecipeDetail() {
     });
   }, [id]);
 
+  const shareModel = useMemo(
+    () => (r ? recipeCard(toSharedRecipe(r), { t, time: fmtTime, date: fmtDate }) : null),
+    [r, t],
+  );
+
   if (notFound) return <div><BackBar onClick={() => navigate('/recipes')} label={t('recipes.backToRecipes')} /><Empty icon="recipe" title={t('recipes.notFound')} /></div>;
   if (!r) return null;
 
@@ -76,6 +83,11 @@ export function RecipeDetail() {
         {t('recipes.startBrew')}
       </Button>
       <div className={s.spacer12} />
+      <ShareActions
+        model={shareModel}
+        fileName={`brewlog-recipe-${r.id}.png`}
+        link={buildRecipeShareUrl(window.location.origin, toSharedRecipe(r))}
+      />
       <div className={s.actionRow}>
         <Button variant="ghost" full leftIcon="edit" onClick={() => setEditing(true)}>{t('common.edit')}</Button>
         <Button variant="danger" leftIcon="trash" onClick={async () => {
```

```diff
--- a/src/screens/History/ExtractionDetail.tsx
+++ b/src/screens/History/ExtractionDetail.tsx
@@ -1,9 +1,10 @@
-import { useState, useEffect } from 'react';
+import { useState, useEffect, useMemo } from 'react';
 import { useNavigate, useParams } from 'react-router-dom';
 import { useTranslation } from 'react-i18next';
 import { useDb } from '../../hooks/useDb';
-import { Button, BackBar, Stars, Tag, MethodBadge, Empty } from '../../components/UI';
-import { fmtRelDate, fmtTime } from '../../utils/formatters';
+import { Button, BackBar, Stars, Tag, MethodBadge, Empty, ShareActions } from '../../components/UI';
+import { fmtDate, fmtRelDate, fmtTime } from '../../utils/formatters';
+import { extractionCard } from '../../utils/shareCard';
 import type { Extraction, Bean, Equipment } from '../../db/types';
 import s from './styles.module.css';
 
@@ -71,6 +72,11 @@ export function ExtractionDetail() {
     load();
   }, [id]);
 
+  const shareModel = useMemo(
+    () => (ext ? extractionCard(ext, bean, { t, time: fmtTime, date: fmtDate }) : null),
+    [ext, bean, t],
+  );
+
   if (notFound) return <div><BackBar onClick={() => navigate('/history')} label={t('extraction.backToHistory')} /><Empty icon="flask" title={t('extraction.notFound')} /></div>;
   if (!ext) return null;
 
@@ -144,6 +150,8 @@ export function ExtractionDetail() {
         </div>
       )}
 
+      <ShareActions model={shareModel} fileName={`brewlog-${ext.id}.png`} />
+
       <div className={`row row-gap-12 ${s.actionRow}`}>
         <Button variant="ghost" full leftIcon="edit" onClick={() => navigate('/log', { state: { ...ext, isEditing: true } })}>{t('common.edit')}</Button>
         <Button variant="ghost" full leftIcon="copy" onClick={() => navigate('/log', { state: ext })}>{t('extraction.duplicate')}</Button>
```

- [ ] **Step 5: Run all checks, then commit**

Run: `npm test && npx tsc -b && npx eslint src && npm run build`
Expected: 19 tests pass, no type errors, lint shows only the 2 old errors, build ends with `files generated`.

```bash
git add src/router.tsx src/screens
git commit -m "feat(share): add share buttons and recipe import by link"
```

---

### Task 6: Check the feature in real browsers

**Files:** none.

- [ ] **Step 1: Desktop browser**

Run: `npm run dev`. Open a brew. Wait until "Share image" is enabled. Press it. In Chrome on macOS the share sheet opens. In Firefox the PNG downloads and "Image saved." shows. Open the PNG. Make sure the fonts are DM Serif Display and DM Mono, and the colours match the theme. Switch the theme and repeat.

- [ ] **Step 2: Recipe link round trip**

Open a recipe. Press "Share link". Where the link is copied, paste it into a new tab. Make sure the import screen shows the same name, stats, and stages. Press "Save recipe". Make sure the recipe list shows the new recipe.

- [ ] **Step 3: Bad links**

Open `http://localhost:5173/recipes/import#r=abc`. Make sure "This recipe link is not valid." shows. In Recipes → Import, paste `hello`. Make sure the error shows and nothing opens.

- [ ] **Step 4: Phone**

Run: `npm run dev -- --host`. On an iPhone (Safari) and an Android phone (Chrome), open a brew and press "Share image". Make sure the system share sheet opens with the PNG. Close the sheet. Make sure no error shows.

- [ ] **Step 5: Offline**

Run: `npm run build && npm run preview`. Open the app once, then set DevTools → Network → Offline. Reload `/recipes/import#r=<a valid code>`. Make sure the preview shows. Share a brew image. Make sure it still renders with the correct fonts.

---

## Merge notes

- This plan changes no Dexie schema version.
- `feat/dial-in-assistant` and `feat/guided-brew` also edit `src/screens/History/ExtractionDetail.tsx`. Keep all changes on merge: each branch adds different lines.
- `feat/guided-brew` also edits the "Start brew" button in `RecipeDetail.tsx`. This plan adds `ShareActions` after the spacer below that button. Keep both.
- The other 4 feature branches also add Task 1 with the same bytes. Git merges identical changes without a conflict.
