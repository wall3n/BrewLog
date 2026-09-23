# Dial-in Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three analytics cards that explain *why* a brew tasted good: the SCA brewing control chart (EY against TDS), a "What moves your rating" card (the correlation of each parameter with the rating), and a dial-in timeline for each bean (time and grind for each brew).

**Architecture:** One pure module, `src/utils/analytics.ts`, prepares all data (control chart points, Pearson correlation, bean timeline). It has unit tests. Three presentational components in `src/screens/Analytics/` draw the data with recharts 3 (already installed, not used yet). `AnalyticsScreen.tsx` already loads all extractions and beans, so no new `useDb()` method and no schema change.

**Tech Stack:** React 19, TypeScript 6 (strict), recharts 3.8, Vitest 4, react-i18next.

**Spec:** the "Feature spec" section below. It comes from the 2026-09-22 feature review (feature 4 of 5).

**Branch:** `feat/dial-in-analytics`, made from `main` at `02e91cb`.

**Verified:** the code in Tasks 2, 4, and 5 was compiled (`npx tsc -b`), linted, tested (17 tests pass), and built (`npm run build`) against `main` on 2026-09-22.

## Feature spec

1. **Control chart.** One dot for each filter brew with a TDS reading. X axis: EY % (14–26). Y axis: TDS % (0.9–1.7). A shaded box marks the SCA ideal zone (EY 18–22 %, TDS 1.15–1.35 %). A tap on a dot opens that brew.
2. The chart leaves out espresso, moka pot, and cold brew. Their TDS is off the scale of this chart.
3. For filter methods, BrewLog stores the water poured as "yield". The chart uses the beverage weight = water − 2 × dose (the spent grounds keep about 2 g of water per gram of coffee). A note under the chart says this.
4. **Rating drivers.** For one method at a time, show the Pearson correlation r (−1 to 1) between the rating and each of: dose, ratio, time, temperature, grind (only if the grind setting is a number). Use only rated brews (rating > 0). Show a parameter only if it has 5 or more values and some variance. Sort by |r|. A sentence names the strongest parameter if |r| ≥ 0.3.
5. A method selector shows when 2 or more methods have 5 or more rated brews. The default is the method with the most rated brews.
6. **Bean timeline.** A bean selector lists beans with 2 or more brews (most brews first). The chart shows brew number (oldest = 1) on the X axis, time on the left axis, and grind on the right axis (only if at least one grind is a number).
7. Every card has an empty state that tells the user what to log.

## Global Constraints

- Node 24.x LTS (pin from `.nvmrc` and `package.json` `engines`). npm only.
- TypeScript `strict`. No `any`, no `as any`, no `as unknown as X`. Give explicit parameter and return types. Read untyped recharts payloads as `unknown` and narrow them with a type guard.
- recharts is the only chart library (CLAUDE.md constraint 12).
- No hardcoded user-facing text. Add every key to all three files: `src/i18n/locales/en.json`, `es.json`, `fr.json`. (CLAUDE.md says `public/locales`. That is out of date. The real files are in `src/i18n/locales/`.)
- No inline `style` attribute. The only exception is a runtime value (`left: X%`, `width: X%`), with a comment. recharts props such as `margin` and `tick` are component props, not inline styles.
- Component styles go in a co-located `styles.module.css`. Colours come only from CSS variables in `src/styles/global.css`. In recharts, pass them as strings: `stroke="var(--accent)"`.
- Numbers render with the `t-mono` class.
- Commits: Conventional Commits, English, lowercase subject, no `Co-authored-by` trailer.
- Lint: `main` has 2 old lint errors (`src/context/AppContext.tsx:83`, `src/screens/Home/HomeScreen.tsx:98`). Do not fix them. Do not add new errors. Check with `npx eslint <changed files>`.
- Do not import `src/utils/formatters.ts` or `src/i18n` into a module that a `*.test.ts` file imports. `formatters.ts` starts i18next, and the tests run in Node.
- If your session has the `dataviz` skill, load it before Task 4.

## Review Focus

1. A filter brew where `yield − 2 × dose ≤ 0` (a typo such as yield 30, dose 20) → the brew is not on the chart. No negative EY.
2. A grind setting that is text ("fine", "medium") or has a decimal comma ("2,5") → text is skipped, "2,5" reads as 2.5. The grind axis is hidden when no grind is a number.
3. All rated brews of a method have the same dose → dose is not in the drivers list (zero variance), and there is no `NaN`.
4. Espresso and filter brews in one list → drivers never mix methods. The control chart shows no espresso dot.
5. A brew with a TDS far outside the chart domain (for example 5 %) → recharts extends the axis. The dot still shows and is still tappable.

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

### Task 2: Analytics data module

**Files:**
- Create: `src/utils/analytics.ts`
- Test: `src/utils/analytics.test.ts`

**Interfaces:**
- Consumes: `calculateEY(dose: number, yieldG: number, tds: number): number` and `getSCAZone(ey: number, tds: number): SCAZone` from `src/utils/scaChart.ts`. `Extraction` from `src/db/types.ts`.
- Produces:
  - `interface ControlPoint { id: number; ey: number; tds: number; zone: SCAZone; rating: number; createdAt: string }`
  - `toControlPoints(extractions: readonly Extraction[]): readonly ControlPoint[]`
  - `beverageWeight(e: Pick<Extraction, 'method' | 'dose' | 'yield'>): number`
  - `onControlChart(method: string): boolean`
  - `parseGrind(setting: string | undefined): number | null`
  - `pearson(xs: readonly number[], ys: readonly number[]): number | null`
  - `type DriverKey = 'dose' | 'ratio' | 'timeS' | 'temp' | 'grind'`
  - `interface Driver { key: DriverKey; r: number; n: number }`
  - `ratingDrivers(extractions: readonly Extraction[], method: string): readonly Driver[]`
  - `driverStrength(r: number): 'positive' | 'negative' | 'weak'`
  - `driverMethods(extractions: readonly Extraction[]): readonly string[]`
  - `interface TimelinePoint { id: number; n: number; createdAt: string; grind: number | null; timeS: number; rating: number }`
  - `beanTimeline(extractions: readonly Extraction[], beanId: number): readonly TimelinePoint[]`
  - `timelineBeanIds(extractions: readonly Extraction[]): readonly number[]`
  - `MIN_DRIVER_SAMPLES = 5`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/analytics.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  beverageWeight, toControlPoints, parseGrind, pearson, ratingDrivers, driverStrength,
  driverMethods, beanTimeline, timelineBeanIds, MIN_DRIVER_SAMPLES,
} from './analytics';
import type { Extraction } from '../db/types';

function ext(p: Partial<Extraction>): Extraction {
  return {
    id: 1, method: 'pour-over', beanId: 1, equipmentIds: [], grindSetting: '20',
    dose: 15, yield: 250, ratio: 16.7, timeS: 180, temp: 94, tds: 1.3,
    flag: 'adjust', rating: 3, acidity: 3, sweetness: 3, bitterness: 3, body: 3, balance: 3,
    flavours: [], createdAt: '2026-09-01T08:00:00.000Z', updatedAt: '2026-09-01T08:00:00.000Z',
    ...p,
  };
}

describe('beverageWeight', () => {
  it('subtracts the water the grounds keep for filter', () => {
    expect(beverageWeight({ method: 'pour-over', dose: 15, yield: 250 })).toBe(220);
  });
  it('uses the yield as is for espresso', () => {
    expect(beverageWeight({ method: 'espresso', dose: 18, yield: 36 })).toBe(36);
  });
});

describe('toControlPoints', () => {
  it('calculates EY from the beverage weight', () => {
    // 1.3 × 220 / 15 = 19.07 → 19.1
    expect(toControlPoints([ext({})])).toEqual([
      { id: 1, ey: 19.1, tds: 1.3, zone: 'ideal', rating: 3, createdAt: '2026-09-01T08:00:00.000Z' },
    ]);
  });

  it('skips espresso, moka pot and cold brew', () => {
    expect(toControlPoints([ext({ method: 'espresso' }), ext({ method: 'moka-pot' }), ext({ method: 'cold-brew' })])).toEqual([]);
  });

  it('skips a brew with no TDS, a zero dose, or no beverage left', () => {
    expect(toControlPoints([
      ext({ tds: null }), ext({ tds: 0 }), ext({ dose: 0 }), ext({ dose: 20, yield: 30 }),
    ])).toEqual([]);
  });
});

describe('parseGrind', () => {
  it('reads numbers and decimal commas', () => {
    expect(parseGrind('12')).toBe(12);
    expect(parseGrind('2,5')).toBe(2.5);
    expect(parseGrind('14 clicks')).toBe(14);
  });
  it('returns null for text or nothing', () => {
    expect(parseGrind('fine')).toBeNull();
    expect(parseGrind(undefined)).toBeNull();
  });
});

describe('pearson', () => {
  it('is 1 and -1 for perfect lines', () => {
    expect(pearson([1, 2, 3], [2, 4, 6])).toBeCloseTo(1);
    expect(pearson([1, 2, 3], [6, 4, 2])).toBeCloseTo(-1);
  });
  it('is null with fewer than 3 points, mismatched lengths, or zero variance', () => {
    expect(pearson([1, 2], [1, 2])).toBeNull();
    expect(pearson([1, 2, 3], [1, 2])).toBeNull();
    expect(pearson([5, 5, 5], [1, 2, 3])).toBeNull();
  });
});

describe('ratingDrivers', () => {
  const brews = [1, 2, 3, 4, 5].map(i => ext({ id: i, temp: 90 + i, rating: i, dose: 15, grindSetting: 'medium' }));

  it('finds the parameter that follows the rating', () => {
    const drivers = ratingDrivers(brews, 'pour-over');
    expect(drivers[0]).toEqual({ key: 'temp', r: 1, n: 5 });
  });

  it('skips a constant parameter and a text grind', () => {
    const keys = ratingDrivers(brews, 'pour-over').map(d => d.key);
    expect(keys).not.toContain('dose');
    expect(keys).not.toContain('grind');
  });

  it('ignores unrated brews and other methods', () => {
    const mixed = [...brews.slice(0, 4), ext({ id: 9, rating: 0, temp: 99 }), ext({ id: 10, method: 'espresso', temp: 99, rating: 5 })];
    expect(ratingDrivers(mixed, 'pour-over')).toEqual([]);
  });

  it('needs MIN_DRIVER_SAMPLES brews', () => {
    expect(MIN_DRIVER_SAMPLES).toBe(5);
  });
});

describe('driverStrength', () => {
  it('uses a 0.3 threshold', () => {
    expect(driverStrength(0.5)).toBe('positive');
    expect(driverStrength(-0.3)).toBe('negative');
    expect(driverStrength(0.1)).toBe('weak');
  });
});

describe('driverMethods', () => {
  it('lists methods with enough rated brews, most first', () => {
    const list = [
      ...[1, 2, 3, 4, 5].map(i => ext({ id: i, method: 'espresso' })),
      ...[6, 7, 8, 9, 10, 11].map(i => ext({ id: i })),
      ...[12, 13].map(i => ext({ id: i, method: 'aeropress' })),
    ];
    expect(driverMethods(list)).toEqual(['pour-over', 'espresso']);
  });
});

describe('beanTimeline', () => {
  it('orders the brews of one bean oldest first and numbers them', () => {
    const list = [
      ext({ id: 2, createdAt: '2026-09-03T08:00:00.000Z', grindSetting: '18' }),
      ext({ id: 1, createdAt: '2026-09-01T08:00:00.000Z', grindSetting: 'fine' }),
      ext({ id: 3, beanId: 2 }),
    ];
    expect(beanTimeline(list, 1).map(p => [p.n, p.id, p.grind])).toEqual([[1, 1, null], [2, 2, 18]]);
  });
});

describe('timelineBeanIds', () => {
  it('lists beans with 2 or more brews, most first', () => {
    const list = [ext({ beanId: 1 }), ext({ beanId: 2 }), ext({ beanId: 2 }), ext({ beanId: 2 }), ext({ beanId: 3 }), ext({ beanId: 3 })];
    expect(timelineBeanIds(list)).toEqual([2, 3]);
  });
});
```

- [ ] **Step 2: Run the tests and make sure they fail**

Run: `npx vitest run src/utils/analytics.test.ts`
Expected: FAIL with `Failed to resolve import "./analytics"`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/analytics.ts`:

```ts
import type { Extraction } from '../db/types';
import { calculateEY, getSCAZone, type SCAZone } from './scaChart';

// Spent filter grounds keep about 2 g of water for each gram of coffee.
export const ABSORPTION_G_PER_G = 2;
export const MIN_DRIVER_SAMPLES = 5;
export const DRIVER_THRESHOLD = 0.3;

export type DriverKey = 'dose' | 'ratio' | 'timeS' | 'temp' | 'grind';
export const DRIVER_KEYS: readonly DriverKey[] = ['dose', 'ratio', 'timeS', 'temp', 'grind'];

export interface ControlPoint {
  id: number;
  ey: number;
  tds: number;
  zone: SCAZone;
  rating: number;
  createdAt: string;
}

export interface Driver { key: DriverKey; r: number; n: number; }

export interface TimelinePoint {
  id: number;
  n: number;              // 1 = the oldest brew of the bean
  createdAt: string;
  grind: number | null;
  timeS: number;
  rating: number;
}

const round = (value: number, digits: number): number => {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
};

// The SCA chart is for brewed coffee at filter strength. Espresso, moka and cold brew concentrate are off its scale.
export function onControlChart(method: string): boolean {
  return method !== 'espresso' && method !== 'moka-pot' && method !== 'cold-brew';
}

// For filter methods, BrewLog stores the water poured as "yield". The cup weighs less.
export function beverageWeight(e: Pick<Extraction, 'method' | 'dose' | 'yield'>): number {
  return onControlChart(e.method) ? e.yield - ABSORPTION_G_PER_G * e.dose : e.yield;
}

export function toControlPoints(extractions: readonly Extraction[]): readonly ControlPoint[] {
  return extractions.flatMap(e => {
    if (e.id == null || !onControlChart(e.method) || e.tds == null || e.tds <= 0 || e.dose <= 0) return [];
    const beverage = beverageWeight(e);
    if (beverage <= 0) return [];
    const ey = round(calculateEY(e.dose, beverage, e.tds), 1);
    return [{ id: e.id, ey, tds: e.tds, zone: getSCAZone(ey, e.tds), rating: e.rating, createdAt: e.createdAt }];
  });
}

export function parseGrind(setting: string | undefined): number | null {
  const n = parseFloat((setting ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function pearson(xs: readonly number[], ys: readonly number[]): number | null {
  const n = xs.length;
  if (n !== ys.length || n < 3) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

function driverValue(e: Extraction, key: DriverKey): number | null {
  const v = key === 'grind' ? parseGrind(e.grindSetting) : e[key];
  return v !== null && Number.isFinite(v) ? v : null;
}

// Correlation between each parameter and the rating, for one method only:
// an espresso ratio and a filter ratio are not on the same scale.
export function ratingDrivers(extractions: readonly Extraction[], method: string): readonly Driver[] {
  const rated = extractions.filter(e => e.method === method && e.rating > 0);
  const out: Driver[] = [];
  for (const key of DRIVER_KEYS) {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const e of rated) {
      const v = driverValue(e, key);
      if (v !== null) { xs.push(v); ys.push(e.rating); }
    }
    if (xs.length < MIN_DRIVER_SAMPLES) continue;
    const r = pearson(xs, ys);
    if (r !== null) out.push({ key, r: round(r, 2), n: xs.length });
  }
  return out.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
}

export function driverStrength(r: number): 'positive' | 'negative' | 'weak' {
  if (r >= DRIVER_THRESHOLD) return 'positive';
  if (r <= -DRIVER_THRESHOLD) return 'negative';
  return 'weak';
}

// Methods that have enough rated brews for ratingDrivers, most brews first.
export function driverMethods(extractions: readonly Extraction[]): readonly string[] {
  const counts = new Map<string, number>();
  for (const e of extractions) if (e.rating > 0) counts.set(e.method, (counts.get(e.method) ?? 0) + 1);
  return [...counts].filter(([, c]) => c >= MIN_DRIVER_SAMPLES).sort((a, b) => b[1] - a[1]).map(([m]) => m);
}

export function beanTimeline(extractions: readonly Extraction[], beanId: number): readonly TimelinePoint[] {
  return extractions
    .filter(e => e.beanId === beanId && e.id != null)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((e, i) => ({
      id: e.id!, n: i + 1, createdAt: e.createdAt,
      grind: parseGrind(e.grindSetting), timeS: e.timeS, rating: e.rating,
    }));
}

// Bean ids with 2 or more brews, most brews first.
export function timelineBeanIds(extractions: readonly Extraction[]): readonly number[] {
  const counts = new Map<number, number>();
  for (const e of extractions) counts.set(e.beanId, (counts.get(e.beanId) ?? 0) + 1);
  return [...counts].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/utils/analytics.test.ts`
Expected: PASS, 17 tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/analytics.ts src/utils/analytics.test.ts
git commit -m "feat(analytics): add control chart, rating driver and timeline data"
```

---

### Task 3: Translations

**Files:**
- Modify: `src/i18n/locales/en.json`, `src/i18n/locales/es.json`, `src/i18n/locales/fr.json`

**Interfaces:**
- Produces: the keys `analytics.controlChart.*`, `analytics.zones.*`, `analytics.drivers.*`, `analytics.timeline.*`. Tasks 4 and 5 use them.

- [ ] **Step 1: Add the keys**

In each file, add these keys **inside the existing `"analytics"` object**, after `"logFirst"`. Add a comma after the `"logFirst"` value.

`en.json`:

```json
    "controlChart": {
      "title": "SCA brewing control chart",
      "eyAxis": "Extraction yield",
      "tooltip": "EY {{ey}}% · TDS {{tds}}%",
      "empty": "Log a filter brew with a TDS reading to see it here.",
      "note": "Filter brews only. The shaded box is the SCA ideal zone. BrewLog subtracts 2 g of water per gram of coffee for the wet grounds."
    },
    "zones": {
      "ideal": "Ideal",
      "under": "Under-extracted",
      "over": "Over-extracted",
      "weak": "Weak",
      "strong": "Strong",
      "underdeveloped": "Under-extracted and weak"
    },
    "drivers": {
      "title": "What moves your rating",
      "empty": "Rate at least {{min}} brews of one method to see this.",
      "positive": "Higher {{param}} gave better ratings.",
      "negative": "Lower {{param}} gave better ratings.",
      "weak": "No parameter has a clear link to your rating yet.",
      "sample": "Based on {{n}} rated brews",
      "params": { "dose": "Dose", "ratio": "Ratio", "timeS": "Time", "temp": "Temperature", "grind": "Grind" }
    },
    "timeline": {
      "title": "Dial-in timeline",
      "empty": "Log 2 or more brews of one bean to see its timeline.",
      "time": "Time",
      "grind": "Grind",
      "brew": "Brew {{n}}"
    }
```

`es.json`:

```json
    "controlChart": {
      "title": "Carta de control SCA",
      "eyAxis": "Rendimiento de extracción",
      "tooltip": "EY {{ey}}% · TDS {{tds}}%",
      "empty": "Registra un filtro con lectura de TDS para verlo aquí.",
      "note": "Solo filtros. La zona sombreada es la zona ideal SCA. BrewLog resta 2 g de agua por gramo de café por el poso húmedo."
    },
    "zones": {
      "ideal": "Ideal",
      "under": "Subextraído",
      "over": "Sobreextraído",
      "weak": "Débil",
      "strong": "Fuerte",
      "underdeveloped": "Subextraído y débil"
    },
    "drivers": {
      "title": "Qué mueve tu valoración",
      "empty": "Valora al menos {{min}} extracciones de un método para ver esto.",
      "positive": "Más {{param}} dio mejores valoraciones.",
      "negative": "Menos {{param}} dio mejores valoraciones.",
      "weak": "Ningún parámetro tiene aún una relación clara con tu valoración.",
      "sample": "Basado en {{n}} extracciones valoradas",
      "params": { "dose": "Dosis", "ratio": "Ratio", "timeS": "Tiempo", "temp": "Temperatura", "grind": "Molienda" }
    },
    "timeline": {
      "title": "Evolución del ajuste",
      "empty": "Registra 2 o más extracciones de un café para ver su evolución.",
      "time": "Tiempo",
      "grind": "Molienda",
      "brew": "Extracción {{n}}"
    }
```

`fr.json`:

```json
    "controlChart": {
      "title": "Diagramme de contrôle SCA",
      "eyAxis": "Rendement d’extraction",
      "tooltip": "EY {{ey}}% · TDS {{tds}}%",
      "empty": "Enregistrez un filtre avec une mesure TDS pour le voir ici.",
      "note": "Filtres uniquement. La zone ombrée est la zone idéale SCA. BrewLog retire 2 g d’eau par gramme de café pour le marc humide."
    },
    "zones": {
      "ideal": "Idéal",
      "under": "Sous-extrait",
      "over": "Sur-extrait",
      "weak": "Faible",
      "strong": "Fort",
      "underdeveloped": "Sous-extrait et faible"
    },
    "drivers": {
      "title": "Ce qui influence votre note",
      "empty": "Notez au moins {{min}} extractions d’une méthode pour voir ceci.",
      "positive": "Plus de {{param}} a donné de meilleures notes.",
      "negative": "Moins de {{param}} a donné de meilleures notes.",
      "weak": "Aucun paramètre n’a encore de lien clair avec votre note.",
      "sample": "Basé sur {{n}} extractions notées",
      "params": { "dose": "Dose", "ratio": "Ratio", "timeS": "Temps", "temp": "Température", "grind": "Mouture" }
    },
    "timeline": {
      "title": "Évolution du réglage",
      "empty": "Enregistrez 2 extractions ou plus d’un café pour voir son évolution.",
      "time": "Temps",
      "grind": "Mouture",
      "brew": "Extraction {{n}}"
    }
```

- [ ] **Step 2: Check the JSON**

Run: `node -e "for (const l of ['en','es','fr']) { const d = JSON.parse(require('fs').readFileSync('src/i18n/locales/'+l+'.json','utf8')); if (!d.analytics.timeline.brew) throw new Error(l) }"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/i18n/locales
git commit -m "feat(analytics): add translations for dial-in analytics"
```

---

### Task 4: Chart components

**Files:**
- Create: `src/screens/Analytics/ControlChart.tsx`
- Create: `src/screens/Analytics/RatingDrivers.tsx`
- Create: `src/screens/Analytics/BeanTimeline.tsx`
- Modify: `src/screens/Analytics/styles.module.css` (append the classes below)

**Interfaces:**
- Consumes: everything from Task 2. `SegToggle({ value: string; options: [string, string][]; onChange(v: string): void })` from `src/components/UI.tsx`. `fmtDate(iso: string): string`, `fmtTime(s: number): string` from `src/utils/formatters.ts`. The i18n keys from Task 3.
- Produces:
  - `ControlChart({ points, onSelect }: { points: readonly ControlPoint[]; onSelect: (id: number) => void })`
  - `RatingDrivers({ extractions }: { extractions: readonly Extraction[] })`
  - `BeanTimeline({ extractions, beans }: { extractions: readonly Extraction[]; beans: readonly Bean[] })`

These components only draw. They have no unit tests. Task 5 checks them in the browser.

- [ ] **Step 1: Write `ControlChart.tsx`**

Create `src/screens/Analytics/ControlChart.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { CartesianGrid, ReferenceArea, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import type { ControlPoint } from '../../utils/analytics';
import s from './styles.module.css';

export interface ControlChartProps {
  points: readonly ControlPoint[];
  onSelect: (id: number) => void;
}

const EY_DOMAIN: [number, number] = [14, 26];
const TDS_DOMAIN: [number, number] = [0.9, 1.7];
const TICK = { fontSize: 10, fontFamily: 'var(--mono)', fill: 'var(--text-tertiary)' };

function isControlPoint(v: unknown): v is ControlPoint {
  return typeof v === 'object' && v !== null && 'ey' in v && 'tds' in v && 'id' in v;
}

export function ControlChart({ points, onSelect }: ControlChartProps) {
  const { t } = useTranslation();
  if (points.length === 0) return <div className={`t-sec ${s.noData}`}>{t('analytics.controlChart.empty')}</div>;
  return (
    <div className={s.chartBox}>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 8, right: 12, bottom: 20, left: 0 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
          <ReferenceArea x1={18} x2={22} y1={1.15} y2={1.35} fill="var(--accent)" fillOpacity={0.12} stroke="var(--accent-dim)" />
          <XAxis type="number" dataKey="ey" domain={EY_DOMAIN} unit="%" tick={TICK} stroke="var(--border)"
            label={{ value: t('analytics.controlChart.eyAxis'), position: 'insideBottom', offset: -12, fill: 'var(--text-secondary)', fontSize: 10 }} />
          <YAxis type="number" dataKey="tds" domain={TDS_DOMAIN} unit="%" tick={TICK} stroke="var(--border)" width={48} />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              const point: unknown = payload?.[0]?.payload;
              if (!active || !isControlPoint(point)) return null;
              return (
                <div className={s.tooltip}>
                  <div className="t-mono">{t('analytics.controlChart.tooltip', { ey: point.ey, tds: point.tds })}</div>
                  <div className="t-upper">{t(`analytics.zones.${point.zone}`)}</div>
                </div>
              );
            }}
          />
          <Scatter
            data={[...points]}
            fill="var(--accent)"
            className={s.clickable}
            onClick={(item: { payload?: unknown }) => { if (isControlPoint(item.payload)) onSelect(item.payload.id); }}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <p className={`t-ter ${s.chartNote}`}>{t('analytics.controlChart.note')}</p>
    </div>
  );
}
```

- [ ] **Step 2: Write `RatingDrivers.tsx`**

Create `src/screens/Analytics/RatingDrivers.tsx`:

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SegToggle } from '../../components/UI';
import { driverMethods, driverStrength, ratingDrivers, MIN_DRIVER_SAMPLES } from '../../utils/analytics';
import type { Extraction } from '../../db/types';
import s from './styles.module.css';

export interface RatingDriversProps {
  extractions: readonly Extraction[];
}

export function RatingDrivers({ extractions }: RatingDriversProps) {
  const { t } = useTranslation();
  const methods = driverMethods(extractions);
  const [picked, setPicked] = useState<string | null>(null);
  const method = picked !== null && methods.includes(picked) ? picked : methods[0];

  if (!method) return <div className={`t-sec ${s.noData}`}>{t('analytics.drivers.empty', { min: MIN_DRIVER_SAMPLES })}</div>;

  const drivers = ratingDrivers(extractions, method);
  const top = drivers[0];
  const topStrength = top ? driverStrength(top.r) : 'weak';

  return (
    <div className="col col-gap-16">
      {methods.length > 1 && (
        <SegToggle value={method} onChange={setPicked}
          options={methods.map(m => [m, t(`methods.${m}`, { defaultValue: m })])} />
      )}
      <p className={s.driverSummary}>
        {top && topStrength !== 'weak'
          ? t(`analytics.drivers.${topStrength}`, { param: t(`analytics.drivers.params.${top.key}`).toLowerCase() })
          : t('analytics.drivers.weak')}
      </p>
      <div className="col col-gap-12">
        {drivers.map(d => (
          <div key={d.key} className={s.driverRow}>
            <span className={s.driverLabel}>{t(`analytics.drivers.params.${d.key}`)}</span>
            <div className={s.driverTrack}>
              {/* runtime values: the bar starts at the centre line and grows left or right with r */}
              <div
                className={`${s.driverFill} ${d.r < 0 ? s.driverNeg : ''}`}
                style={{ left: `${d.r < 0 ? 50 + d.r * 50 : 50}%`, width: `${Math.abs(d.r) * 50}%` }}
              />
            </div>
            <span className={`t-mono t-sec ${s.driverValue}`}>{d.r.toFixed(2)}</span>
          </div>
        ))}
      </div>
      {drivers.length > 0 && <span className={`t-ter t-mono ${s.chartNote}`}>{t('analytics.drivers.sample', { n: drivers[0].n })}</span>}
    </div>
  );
}
```

- [ ] **Step 3: Write `BeanTimeline.tsx`**

Create `src/screens/Analytics/BeanTimeline.tsx`:

```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { beanTimeline, timelineBeanIds, type TimelinePoint } from '../../utils/analytics';
import { fmtDate, fmtTime } from '../../utils/formatters';
import type { Bean, Extraction } from '../../db/types';
import s from './styles.module.css';

export interface BeanTimelineProps {
  extractions: readonly Extraction[];
  beans: readonly Bean[];
}

const TICK = { fontSize: 10, fontFamily: 'var(--mono)', fill: 'var(--text-tertiary)' };

function isTimelinePoint(v: unknown): v is TimelinePoint {
  return typeof v === 'object' && v !== null && 'n' in v && 'timeS' in v && 'createdAt' in v;
}

export function BeanTimeline({ extractions, beans }: BeanTimelineProps) {
  const { t } = useTranslation();
  const beanIds = timelineBeanIds(extractions);
  const [picked, setPicked] = useState<number | null>(null);
  const beanId = picked !== null && beanIds.includes(picked) ? picked : beanIds[0];

  if (beanId === undefined) return <div className={`t-sec ${s.noData}`}>{t('analytics.timeline.empty')}</div>;

  const points = beanTimeline(extractions, beanId);
  const hasGrind = points.some(p => p.grind !== null);

  return (
    <div className="col col-gap-12">
      <select className={`input-underline ${s.beanSelect}`} value={beanId} onChange={e => setPicked(Number(e.target.value))}>
        {beanIds.map(id => (
          <option key={id} value={id}>{beans.find(b => b.id === id)?.name ?? t('common.unknown')}</option>
        ))}
      </select>
      <div className={s.chartBox}>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={[...points]} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" />
            <XAxis dataKey="n" tick={TICK} stroke="var(--border)" />
            <YAxis yAxisId="time" tick={TICK} stroke="var(--border)" width={40} tickFormatter={(v: number) => fmtTime(v)} />
            {hasGrind && <YAxis yAxisId="grind" orientation="right" tick={TICK} stroke="var(--border)" width={32} />}
            <Tooltip
              content={({ active, payload }) => {
                const p: unknown = payload?.[0]?.payload;
                if (!active || !isTimelinePoint(p)) return null;
                return (
                  <div className={s.tooltip}>
                    <div className="t-upper">{t('analytics.timeline.brew', { n: p.n })} · {fmtDate(p.createdAt)}</div>
                    <div className="t-mono">{t('analytics.timeline.time')}: {fmtTime(p.timeS)}</div>
                    {p.grind !== null && <div className="t-mono">{t('analytics.timeline.grind')}: {p.grind}</div>}
                    <div className="t-mono">{'★'.repeat(p.rating)}</div>
                  </div>
                );
              }}
            />
            <Line yAxisId="time" dataKey="timeS" stroke="var(--accent)" strokeWidth={1.5} dot={{ r: 3, fill: 'var(--accent)' }} isAnimationActive={false} />
            {hasGrind && (
              <Line yAxisId="grind" dataKey="grind" stroke="var(--text-secondary)" strokeWidth={1.5} strokeDasharray="4 3"
                dot={{ r: 2.5, fill: 'var(--text-secondary)' }} connectNulls isAnimationActive={false} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className={`row row-gap-16 ${s.legend}`}>
        <span className={s.legendTime}>{t('analytics.timeline.time')}</span>
        {hasGrind && <span className={s.legendGrind}>{t('analytics.timeline.grind')}</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Add the styles**

Append to `src/screens/Analytics/styles.module.css`:

```css
.chartBox      { width: 100%; }
.chartNote     { font-size: 11px; line-height: 1.5; margin-top: 8px; }
.clickable     { cursor: pointer; }
.tooltip       { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 6px; padding: 8px 10px; font-size: 11px; display: flex; flex-direction: column; gap: 4px; }
.driverSummary { font-size: 14px; color: var(--text-primary); margin: 0; }
.driverRow     { display: grid; grid-template-columns: 96px 1fr 44px; align-items: center; gap: 12px; }
.driverLabel   { font-size: 12px; }
.driverTrack   { position: relative; height: 6px; background: var(--bg-elevated); border-radius: 3px; }
.driverTrack::after { content: ''; position: absolute; left: 50%; top: -3px; bottom: -3px; width: 1px; background: var(--border); }
.driverFill    { position: absolute; top: 0; height: 100%; background: var(--success); border-radius: 3px; }
.driverNeg     { background: var(--danger); }
.driverValue   { font-size: 11px; text-align: right; }
.beanSelect    { width: auto; align-self: flex-start; font-size: 12px; color: var(--text-secondary); }
.legend        { font-size: 11px; color: var(--text-secondary); }
.legendTime::before, .legendGrind::before { content: ''; display: inline-block; width: 14px; height: 0; margin-right: 6px; vertical-align: middle; border-top: 2px solid var(--accent); }
.legendGrind::before { border-top: 2px dashed var(--text-secondary); }
```

- [ ] **Step 5: Check the types and lint, then commit**

Run: `npx tsc -b && npx eslint src/screens/Analytics`
Expected: no errors. One old warning in `AnalyticsScreen.tsx` (`missing dependency: 'db'`) is fine.

```bash
git add src/screens/Analytics
git commit -m "feat(analytics): add control chart, rating drivers and bean timeline"
```

---

### Task 5: Add the cards to the Analytics screen

**Files:**
- Modify: `src/screens/Analytics/AnalyticsScreen.tsx`

**Interfaces:**
- Consumes: `toControlPoints` (Task 2), `ControlChart`, `RatingDrivers`, `BeanTimeline` (Task 4). `useNavigate` from `react-router-dom`.

- [ ] **Step 1: Apply the change**

Make this exact change to `src/screens/Analytics/AnalyticsScreen.tsx`:

```diff
@@ -1,8 +1,13 @@
 import { useState, useEffect } from 'react';
 import { useTranslation } from 'react-i18next';
+import { useNavigate } from 'react-router-dom';
 import { useDb } from '../../hooks/useDb';
 import { Stars } from '../../components/UI';
 import type { Extraction, Bean } from '../../db/types';
+import { toControlPoints } from '../../utils/analytics';
+import { ControlChart } from './ControlChart';
+import { RatingDrivers } from './RatingDrivers';
+import { BeanTimeline } from './BeanTimeline';
 import s from './styles.module.css';
 
 function LineChart({ data }: { data: { rating: number }[] }) {
@@ -29,6 +34,7 @@ function LineChart({ data }: { data: { rating: number }[] }) {
 
 export function AnalyticsScreen() {
   const db = useDb();
+  const navigate = useNavigate();
   const { t } = useTranslation();
 
   const [extractions, setExtractions] = useState<Extraction[]>([]);
@@ -77,6 +83,21 @@ export function AnalyticsScreen() {
         <LineChart data={ratingsOverTime} />
       </div>
 
+      <div className={`card ${s.cardMb}`}>
+        <div className={`t-upper ${s.chartHeader}`}>{t('analytics.controlChart.title')}</div>
+        <ControlChart points={toControlPoints(extractions)} onSelect={id => navigate(`/history/${id}`)} />
+      </div>
+
+      <div className={`card ${s.cardMb}`}>
+        <div className={`t-upper ${s.chartHeader}`}>{t('analytics.drivers.title')}</div>
+        <RatingDrivers extractions={extractions} />
+      </div>
+
+      <div className={`card ${s.cardMb}`}>
+        <div className={`t-upper ${s.chartHeader}`}>{t('analytics.timeline.title')}</div>
+        <BeanTimeline extractions={extractions} beans={beans} />
+      </div>
+
       <div className={`card ${s.cardMb}`}>
         <div className={`t-upper ${s.chartHeader}`}>{t('analytics.methodDistribution')}</div>
         <div className="col col-gap-12">
```

- [ ] **Step 2: Run all checks**

Run: `npm test && npx tsc -b && npx eslint src/screens/Analytics src/utils/analytics.ts && npm run build`
Expected: 17 tests pass, no type errors, no new lint errors, build ends with `files generated`.

- [ ] **Step 3: Check it in the browser**

Run: `npm run dev`. Open `http://localhost:5173/analytics`, first at 375 px width (DevTools device mode), then at desktop width.
1. With no TDS data, the control chart card shows its empty text.
2. Log a pour over: dose 15, yield 250, TDS 1.30. Open Analytics. Make sure one dot shows at about EY 19.1 % inside the shaded box. Tap it. Make sure the brew opens.
3. Log 5 rated pour overs with different temperatures. Make sure "What moves your rating" shows bars and a sentence.
4. Pick a bean in the timeline. Make sure the lines show and the tooltip shows the date, time, grind, and stars.
5. Switch to the light theme in Settings. Make sure all chart colours follow the theme.
6. Make sure the page has no horizontal scroll at 375 px.

- [ ] **Step 4: Commit**

```bash
git add src/screens/Analytics/AnalyticsScreen.tsx
git commit -m "feat(analytics): show dial-in analytics cards"
```

---

## Merge notes

- This plan changes no Dexie schema version and no shared screen outside `src/screens/Analytics/`.
- The other 4 feature branches also add Task 1 with the same bytes. Git merges identical changes without a conflict.
