# Bean Stock and Freshness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Each logged brew decreases the bean weight. The app shows how many brews are left, where the bean is in its rest window (resting, peak, past peak, stale), and a "Running low" list on Home.

**Architecture:** One pure module, `src/utils/beanStock.ts`, holds all the maths (stock changes, freshness, brews left). It has unit tests. `useDb()` applies the stock change in the same Dexie transaction as the extraction write (add, edit, delete). Two small components (`StockMeter`, `FreshnessBadge`) show the result on Bean detail, the bean list, and Home. No Dexie version change: the new field `initialWeightG` is not indexed.

**Tech Stack:** React 19, TypeScript 6 (strict), Dexie 4 transactions, Vitest 4, react-i18next.

**Spec:** the "Feature spec" section below. It comes from the 2026-09-22 feature review (feature 3 of 5).

**Branch:** `feat/bean-stock`, made from `main` at `02e91cb`.

**Verified:** on 2026-09-22 the code of Tasks 2–7 was applied to `main` from this plan's text. Then `npm test` (all stock tests pass), `npx tsc -b`, `npx eslint src` (no new errors), and `npm run build` passed. The browser checks were not run.

## Feature spec

1. Stock tracking applies only to a bean that has `weightG`. A bean with no weight does not change.
2. A new brew subtracts its dose from its bean. An edited brew applies the difference. If the edit moves the brew to another bean, the old bean gets its dose back and the new bean loses the new dose. A deleted brew gives its dose back.
3. The weight never goes below 0. Values are rounded to 0.1 g.
4. `initialWeightG` holds the bag size, for the progress bar. The bean form sets it when the user enters a weight for the first time, or enters a weight larger than the bag size (a new bag). Old beans with no `initialWeightG` use `weightG` as the bag size.
5. Brews left = `floor(weightG / average dose)`. The average dose uses the 5 newest brews of that bean. With no brews, it uses 18 g for espresso and 15 g for filter.
6. Rest window: espresso and moka pot 7–21 days, all other methods 5–14 days. The bean uses the method of its newest brew, else the default method from Settings. States: `resting` (before the window), `peak` (in it), `fading` (up to 2× the window end), `stale` (after that), `unknown` (no roast date).
7. "Running low" = 3 brews left or fewer. Home lists active beans that are running low.
8. When an active bean reaches 0 g, Bean detail shows "This bag is empty" and a "Mark as finished" button. The app does not change the status by itself.

## Global Constraints

- Node 24.x LTS (pin from `.nvmrc` and `package.json` `engines`). npm only.
- TypeScript `strict`. No `any`, no `as any`, no `as unknown as X`. Give explicit parameter and return types.
- Components never call Dexie. Use `useDb()` from `src/hooks/useDb.ts`.
- `createdAt` and `updatedAt` on every write. Set `updatedAt` on every bean write that changes the weight.
- No hardcoded user-facing text. Add every key to all three files: `src/i18n/locales/en.json`, `es.json`, `fr.json`. (CLAUDE.md says `public/locales`. That is out of date. The real files are in `src/i18n/locales/`.)
- Plurals use i18next `_one` / `_other` suffixes. No plural ternaries in JSX.
- No inline `style={{}}`. The only exception is a runtime value (`width: X%`), with a comment.
- Component styles go in a co-located `styles.module.css`. Colours come only from CSS variables in `src/styles/global.css`. The global `days-pill green|amber|red` classes already exist (`global.css:274-281`). Use them for the freshness badge.
- Icons: use the existing `Icon` component from `src/components/Icons.tsx`. The code does not use `lucide-react`.
- Numbers render with the `t-mono` class.
- Commits: Conventional Commits, English, lowercase subject, no `Co-authored-by` trailer.
- Lint: `main` has 2 old lint errors (`src/context/AppContext.tsx:83`, `src/screens/Home/HomeScreen.tsx:98`). Do not fix them. Do not add new errors. Check with `npx eslint <changed files>`.
- Do not import `src/utils/formatters.ts` or `src/i18n` into a module that a `*.test.ts` file imports. `formatters.ts` starts i18next, and the tests run in Node.

## Review Focus

1. Edit a brew and change its bean → the old bean gets its dose back, the new bean loses the new dose. Both writes happen in one transaction. If the write fails, no weight changes.
2. Edit a brew and change nothing about the dose or the bean (only the notes) → no bean write at all.
3. A brew for a bean with no `weightG` (the common case for old data and the seed) → no crash, the bean stays without a weight.
4. A dose larger than the remaining weight → the weight becomes 0, not a negative number. The "empty" banner shows.
5. A roast date in the future (a typo) or an invalid date → freshness is `resting` with 0 days, or `unknown`. No `NaN` on screen.

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

### Task 2: Stock maths

**Files:**
- Create: `src/utils/beanStock.ts`
- Test: `src/utils/beanStock.test.ts`

**Interfaces:**
- Consumes: `Bean`, `Extraction` from `src/db/types.ts`.
- Produces:
  - `interface StockChange { beanId: number; deltaG: number }` (negative = coffee used)
  - `interface DoseRef { beanId: number; dose: number }`
  - `stockChanges(prev: DoseRef | null, next: DoseRef | null): readonly StockChange[]`
  - `applyStockChange(weightG: number | undefined, deltaG: number): number | undefined`
  - `nextInitialWeight(prevInitial: number | undefined, prevWeight: number | undefined, newWeight: number | undefined): number | undefined`
  - `averageDose(dosesNewestFirst: readonly number[], fallback: number): number`
  - `servingsLeft(weightG: number | undefined, avgDoseG: number): number | null`
  - `LOW_STOCK_SERVINGS = 3`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/beanStock.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  stockChanges, applyStockChange, nextInitialWeight, averageDose, servingsLeft,
} from './beanStock';

describe('stockChanges', () => {
  it('subtracts the dose of a new brew', () => {
    expect(stockChanges(null, { beanId: 1, dose: 18 })).toEqual([{ beanId: 1, deltaG: -18 }]);
  });

  it('gives the dose back for a deleted brew', () => {
    expect(stockChanges({ beanId: 1, dose: 18 }, null)).toEqual([{ beanId: 1, deltaG: 18 }]);
  });

  it('applies only the difference for an edit on the same bean', () => {
    expect(stockChanges({ beanId: 1, dose: 18 }, { beanId: 1, dose: 18.5 })).toEqual([{ beanId: 1, deltaG: -0.5 }]);
  });

  it('returns nothing when the dose and bean do not change', () => {
    expect(stockChanges({ beanId: 1, dose: 18 }, { beanId: 1, dose: 18 })).toEqual([]);
  });

  it('moves the dose when the brew changes bean', () => {
    expect(stockChanges({ beanId: 1, dose: 18 }, { beanId: 2, dose: 20 })).toEqual([
      { beanId: 1, deltaG: 18 },
      { beanId: 2, deltaG: -20 },
    ]);
  });

  it('rounds to 0.1 g', () => {
    expect(stockChanges({ beanId: 1, dose: 18.1 }, { beanId: 1, dose: 18.3 })).toEqual([{ beanId: 1, deltaG: -0.2 }]);
  });
});

describe('applyStockChange', () => {
  it('leaves a bean with no weight alone', () => {
    expect(applyStockChange(undefined, -18)).toBeUndefined();
  });
  it('never goes below 0', () => {
    expect(applyStockChange(10, -18)).toBe(0);
  });
  it('rounds to 0.1 g', () => {
    expect(applyStockChange(250, -18.25)).toBe(231.8);
  });
});

describe('nextInitialWeight', () => {
  it('uses the first weight as the bag size', () => {
    expect(nextInitialWeight(undefined, undefined, 250)).toBe(250);
  });
  it('keeps the bag size when the weight goes down', () => {
    expect(nextInitialWeight(250, 200, 180)).toBe(250);
  });
  it('uses the old weight as the bag size for an old bean', () => {
    expect(nextInitialWeight(undefined, 200, 150)).toBe(200);
  });
  it('starts a new bag when the weight is larger than the bag size', () => {
    expect(nextInitialWeight(250, 10, 1000)).toBe(1000);
  });
  it('clears the bag size when the weight is removed', () => {
    expect(nextInitialWeight(250, 100, undefined)).toBeUndefined();
  });
});

describe('averageDose', () => {
  it('uses the fallback with no brews', () => {
    expect(averageDose([], 18)).toBe(18);
  });
  it('averages the 5 newest positive doses', () => {
    expect(averageDose([20, 20, 20, 20, 20, 5, 5], 18)).toBe(20);
    expect(averageDose([0, 16, 18], 18)).toBe(17);
  });
});

describe('servingsLeft', () => {
  it('rounds down', () => {
    expect(servingsLeft(100, 18)).toBe(5);
  });
  it('returns null with no weight or no dose', () => {
    expect(servingsLeft(undefined, 18)).toBeNull();
    expect(servingsLeft(100, 0)).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests and make sure they fail**

Run: `npx vitest run src/utils/beanStock.test.ts`
Expected: FAIL with `Failed to resolve import "./beanStock"`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/beanStock.ts`:

```ts
export interface StockChange { beanId: number; deltaG: number; }   // negative = coffee used
export interface DoseRef { beanId: number; dose: number; }

export const LOW_STOCK_SERVINGS = 3;
const DOSE_SAMPLE = 5;

const round1 = (n: number): number => Math.round(n * 10) / 10;

// prev = the brew before the write (null for a new brew). next = after it (null for a delete).
export function stockChanges(prev: DoseRef | null, next: DoseRef | null): readonly StockChange[] {
  const deltas = new Map<number, number>();
  const add = (beanId: number, delta: number): void => {
    deltas.set(beanId, (deltas.get(beanId) ?? 0) + delta);
  };
  if (prev) add(prev.beanId, prev.dose);
  if (next) add(next.beanId, -next.dose);
  return [...deltas]
    .map(([beanId, delta]) => ({ beanId, deltaG: round1(delta) }))
    .filter(change => change.deltaG !== 0);
}

export function applyStockChange(weightG: number | undefined, deltaG: number): number | undefined {
  if (weightG == null) return undefined;
  return Math.max(0, round1(weightG + deltaG));
}

export function nextInitialWeight(
  prevInitial: number | undefined,
  prevWeight: number | undefined,
  newWeight: number | undefined,
): number | undefined {
  if (newWeight == null) return undefined;
  const bag = prevInitial ?? prevWeight;
  if (bag == null || newWeight > bag) return newWeight;
  return bag;
}

export function averageDose(dosesNewestFirst: readonly number[], fallback: number): number {
  const recent = dosesNewestFirst.filter(d => d > 0).slice(0, DOSE_SAMPLE);
  if (recent.length === 0) return fallback;
  return recent.reduce((sum, d) => sum + d, 0) / recent.length;
}

export function servingsLeft(weightG: number | undefined, avgDoseG: number): number | null {
  if (weightG == null || avgDoseG <= 0) return null;
  return Math.floor(weightG / avgDoseG);
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/utils/beanStock.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/beanStock.ts src/utils/beanStock.test.ts
git commit -m "feat(beans): add bean stock maths"
```

---

### Task 3: Freshness and the bean stock view

**Files:**
- Modify: `src/utils/beanStock.ts` (add at the end)
- Test: `src/utils/beanStock.test.ts` (add new `describe` blocks at the end)

**Interfaces:**
- Produces:
  - `type BrewKind = 'espresso' | 'filter'`, `brewKind(method: string): BrewKind`
  - `REST_WINDOWS: Readonly<Record<BrewKind, readonly [number, number]>>`
  - `type FreshnessState = 'resting' | 'peak' | 'fading' | 'stale' | 'unknown'`
  - `interface Freshness { days: number | null; state: FreshnessState; daysUntilPeak: number | null; daysLeftInPeak: number | null }`
  - `getFreshness(roastedAt: string | undefined, kind: BrewKind, now: Date): Freshness`
  - `interface BeanUsage { doses: number[]; lastMethod: string }` (doses newest first)
  - `summariseUsage(extractions: readonly Pick<Extraction, 'beanId' | 'dose' | 'method' | 'createdAt'>[]): Map<number, BeanUsage>`
  - `interface BeanStockView { freshness: Freshness; servings: number | null; isLow: boolean; isEmpty: boolean }`
  - `beanStockView(bean: Pick<Bean, 'roastedAt' | 'weightG'>, usage: BeanUsage | undefined, fallbackMethod: string, now: Date): BeanStockView`

- [ ] **Step 1: Write the failing tests**

Change the import at the top of `src/utils/beanStock.test.ts` to:

```ts
import {
  stockChanges, applyStockChange, nextInitialWeight, averageDose, servingsLeft,
  brewKind, getFreshness, summariseUsage, beanStockView,
} from './beanStock';
```

Add at the end of the file:

```ts
const NOW = new Date('2026-09-22T12:00:00.000Z');
const daysAgo = (n: number): string => new Date(NOW.getTime() - n * 86_400_000).toISOString();

describe('brewKind', () => {
  it('treats espresso and moka pot as espresso, all else as filter', () => {
    expect(brewKind('espresso')).toBe('espresso');
    expect(brewKind('moka-pot')).toBe('espresso');
    expect(brewKind('pour-over')).toBe('filter');
    expect(brewKind('custom')).toBe('filter');
  });
});

describe('getFreshness', () => {
  it('is unknown with no or an invalid roast date', () => {
    expect(getFreshness(undefined, 'espresso', NOW).state).toBe('unknown');
    expect(getFreshness('not a date', 'espresso', NOW)).toEqual({
      days: null, state: 'unknown', daysUntilPeak: null, daysLeftInPeak: null,
    });
  });

  it('is resting before the window', () => {
    expect(getFreshness(daysAgo(3), 'espresso', NOW)).toEqual({
      days: 3, state: 'resting', daysUntilPeak: 4, daysLeftInPeak: null,
    });
  });

  it('is at peak in the window, with the days left', () => {
    expect(getFreshness(daysAgo(10), 'espresso', NOW)).toEqual({
      days: 10, state: 'peak', daysUntilPeak: null, daysLeftInPeak: 11,
    });
    expect(getFreshness(daysAgo(5), 'filter', NOW).state).toBe('peak');
  });

  it('is fading up to 2× the window end, then stale', () => {
    expect(getFreshness(daysAgo(30), 'espresso', NOW).state).toBe('fading');
    expect(getFreshness(daysAgo(43), 'espresso', NOW).state).toBe('stale');
    expect(getFreshness(daysAgo(20), 'filter', NOW).state).toBe('fading');
  });

  it('treats a future roast date as day 0', () => {
    expect(getFreshness(daysAgo(-5), 'espresso', NOW).days).toBe(0);
  });
});

describe('summariseUsage', () => {
  it('groups doses by bean, newest first, with the newest method', () => {
    const usage = summariseUsage([
      { beanId: 1, dose: 18, method: 'espresso', createdAt: daysAgo(3) },
      { beanId: 1, dose: 15, method: 'pour-over', createdAt: daysAgo(1) },
      { beanId: 2, dose: 20, method: 'espresso', createdAt: daysAgo(2) },
    ]);
    expect(usage.get(1)).toEqual({ doses: [15, 18], lastMethod: 'pour-over' });
    expect(usage.get(2)).toEqual({ doses: [20], lastMethod: 'espresso' });
  });
});

describe('beanStockView', () => {
  it('uses the fallback method and dose when the bean has no brews', () => {
    const view = beanStockView({ roastedAt: daysAgo(10), weightG: 45 }, undefined, 'espresso', NOW);
    expect(view.servings).toBe(2);   // 45 / 18
    expect(view.isLow).toBe(true);
    expect(view.freshness.state).toBe('peak');
  });

  it('uses the filter default dose for a filter method', () => {
    expect(beanStockView({ weightG: 150 }, undefined, 'pour-over', NOW).servings).toBe(10);   // 150 / 15
  });

  it('marks an empty bag', () => {
    const view = beanStockView({ weightG: 0 }, { doses: [18], lastMethod: 'espresso' }, 'espresso', NOW);
    expect(view.isEmpty).toBe(true);
    expect(view.servings).toBe(0);
  });

  it('is not low when the weight is unknown', () => {
    const view = beanStockView({}, undefined, 'espresso', NOW);
    expect(view.servings).toBeNull();
    expect(view.isLow).toBe(false);
    expect(view.isEmpty).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests and make sure they fail**

Run: `npx vitest run src/utils/beanStock.test.ts`
Expected: FAIL (the new exports do not exist).

- [ ] **Step 3: Write the implementation**

Add this import at the top of `src/utils/beanStock.ts`:

```ts
import type { Bean, Extraction } from '../db/types';
```

Add at the end of `src/utils/beanStock.ts`:

```ts
export type BrewKind = 'espresso' | 'filter';
export type FreshnessState = 'resting' | 'peak' | 'fading' | 'stale' | 'unknown';

export interface Freshness {
  days: number | null;
  state: FreshnessState;
  daysUntilPeak: number | null;
  daysLeftInPeak: number | null;
}

export interface BeanUsage { doses: number[]; lastMethod: string; }   // doses newest first

export interface BeanStockView {
  freshness: Freshness;
  servings: number | null;
  isLow: boolean;
  isEmpty: boolean;
}

// Days off roast. Espresso needs more rest for the CO2 to leave the bean.
export const REST_WINDOWS: Readonly<Record<BrewKind, readonly [number, number]>> = {
  espresso: [7, 21],
  filter: [5, 14],
};

const DEFAULT_DOSE_G: Readonly<Record<BrewKind, number>> = { espresso: 18, filter: 15 };
const DAY_MS = 86_400_000;
const UNKNOWN: Freshness = { days: null, state: 'unknown', daysUntilPeak: null, daysLeftInPeak: null };

export function brewKind(method: string): BrewKind {
  return method === 'espresso' || method === 'moka-pot' ? 'espresso' : 'filter';
}

export function getFreshness(roastedAt: string | undefined, kind: BrewKind, now: Date): Freshness {
  if (!roastedAt) return UNKNOWN;
  const roasted = new Date(roastedAt).getTime();
  if (Number.isNaN(roasted)) return UNKNOWN;
  const days = Math.max(0, Math.floor((now.getTime() - roasted) / DAY_MS));
  const [start, end] = REST_WINDOWS[kind];
  if (days < start) return { days, state: 'resting', daysUntilPeak: start - days, daysLeftInPeak: null };
  if (days <= end) return { days, state: 'peak', daysUntilPeak: null, daysLeftInPeak: end - days };
  const state: FreshnessState = days <= end * 2 ? 'fading' : 'stale';
  return { days, state, daysUntilPeak: null, daysLeftInPeak: null };
}

export function summariseUsage(
  extractions: readonly Pick<Extraction, 'beanId' | 'dose' | 'method' | 'createdAt'>[],
): Map<number, BeanUsage> {
  const newestFirst = [...extractions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const usage = new Map<number, BeanUsage>();
  for (const e of newestFirst) {
    const entry = usage.get(e.beanId) ?? { doses: [], lastMethod: e.method };
    entry.doses.push(e.dose);
    usage.set(e.beanId, entry);
  }
  return usage;
}

export function beanStockView(
  bean: Pick<Bean, 'roastedAt' | 'weightG'>,
  usage: BeanUsage | undefined,
  fallbackMethod: string,
  now: Date,
): BeanStockView {
  const kind = brewKind(usage?.lastMethod ?? fallbackMethod);
  const servings = servingsLeft(bean.weightG, averageDose(usage?.doses ?? [], DEFAULT_DOSE_G[kind]));
  return {
    freshness: getFreshness(bean.roastedAt, kind, now),
    servings,
    isLow: servings !== null && servings <= LOW_STOCK_SERVINGS,
    isEmpty: bean.weightG === 0,
  };
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/utils/beanStock.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/beanStock.ts src/utils/beanStock.test.ts
git commit -m "feat(beans): add rest window freshness and brews left"
```

---

### Task 4: Apply stock changes in `useDb()` and store the bag size

**Files:**
- Modify: `src/db/types.ts` (the `Bean` interface)
- Modify: `src/hooks/useDb.ts` (extraction writes, new `getBeanUsage`)
- Modify: `src/screens/Beans/BeanForm.tsx` (`handleSave`)

**Interfaces:**
- Consumes: `stockChanges`, `applyStockChange`, `summariseUsage`, `nextInitialWeight`, `StockChange`, `BeanUsage`.
- Produces:
  - `Bean.initialWeightG?: number`
  - `useDb().getBeanUsage(beanIds: readonly number[]): Promise<Map<number, BeanUsage>>`
  - `addExtraction`, `updateExtraction`, `deleteExtraction` keep their signatures. They now also change the bean weight and refresh `state.activeBeans`.

- [ ] **Step 1: Add the field**

In `src/db/types.ts`, in `interface Bean`, add after `weightG?: number;`:

```ts
  initialWeightG?: number;   // bag size, for the stock bar. Not indexed, so no schema version change.
```

- [ ] **Step 2: Add the stock helper to `useDb.ts`**

In `src/hooks/useDb.ts`, add to the imports:

```ts
import { stockChanges, applyStockChange, summariseUsage, type StockChange, type BeanUsage } from '../utils/beanStock';
```

Directly after `const now = () => new Date().toISOString();`, add:

```ts
// Runs inside the caller's transaction. A bean with no weight is not tracked.
async function applyStock(changes: readonly StockChange[]): Promise<void> {
  for (const change of changes) {
    const bean = await db.beans.get(change.beanId);
    if (!bean || bean.weightG == null) continue;
    await db.beans.put({ ...bean, weightG: applyStockChange(bean.weightG, change.deltaG), updatedAt: now() });
  }
}
```

Inside `useDb()`, directly after `const { dispatch } = useApp();`, add:

```ts
  const refreshActiveBeans = async (): Promise<void> => {
    const activeBeans = await db.beans.where('status').equals('active').toArray();
    dispatch({ type: 'ACTIVE_BEANS_CHANGED', payload: activeBeans });
  };
```

- [ ] **Step 3: Replace the three extraction writes**

Replace the whole `// ── Extractions ──` block (`addExtraction`, `updateExtraction`, `deleteExtraction`) with:

```ts
    // ── Extractions ───────────────────────────────────────────────
    async addExtraction(data: Omit<Extraction, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
      const ts = now();
      const id = await db.transaction('rw', db.extractions, db.beans, async () => {
        const newId = await db.extractions.add({ ...data, createdAt: ts, updatedAt: ts });
        await applyStock(stockChanges(null, { beanId: data.beanId, dose: data.dose }));
        return newId;
      });
      await refreshActiveBeans();
      return id as number;
    },
    async updateExtraction(data: Extraction): Promise<void> {
      await db.transaction('rw', db.extractions, db.beans, async () => {
        const prev = data.id != null ? await db.extractions.get(data.id) : undefined;
        await db.extractions.put({ ...data, updatedAt: now() });
        await applyStock(stockChanges(
          prev ? { beanId: prev.beanId, dose: prev.dose } : null,
          { beanId: data.beanId, dose: data.dose },
        ));
      });
      await refreshActiveBeans();
    },
    async deleteExtraction(id: number): Promise<void> {
      await db.transaction('rw', db.extractions, db.beans, async () => {
        const prev = await db.extractions.get(id);
        await db.extractions.delete(id);
        if (prev) await applyStock(stockChanges({ beanId: prev.beanId, dose: prev.dose }, null));
      });
      await refreshActiveBeans();
    },
```

- [ ] **Step 4: Add `getBeanUsage`**

In the `// ── Read ──` block, after `getActiveBeans`, add:

```ts
    async getBeanUsage(beanIds: readonly number[]): Promise<Map<number, BeanUsage>> {
      if (beanIds.length === 0) return new Map();
      const rows = await db.extractions.where('beanId').anyOf([...beanIds]).toArray();
      return summariseUsage(rows);
    },
```

- [ ] **Step 5: Store the bag size in the bean form**

In `src/screens/Beans/BeanForm.tsx`, add the import:

```ts
import { nextInitialWeight } from '../../utils/beanStock';
```

Replace `handleSave` with:

```tsx
  function handleSave() {
    const newWeight = weightG !== '' ? parseFloat(weightG) : undefined;
    onSave({
      name: name.trim() || t('beans.saveName'),
      roaster: roaster.trim(),
      origin: origin.trim() || undefined,
      process: process.trim() || undefined,
      roast,
      roastedAt: roastedAt ? new Date(roastedAt).toISOString() : undefined,
      weightG: newWeight,
      initialWeightG: nextInitialWeight(initial.initialWeightG, initial.weightG, newWeight),
      status,
      notes: notes.trim() || undefined,
    });
  }
```

- [ ] **Step 6: Check the types, lint, and behaviour, then commit**

Run: `npm test && npx tsc -b && npx eslint src/hooks/useDb.ts src/screens/Beans/BeanForm.tsx src/db/types.ts`
Expected: tests pass, no type errors, no new lint errors.

Browser check (`npm run dev`):
1. Edit a bean. Set the weight to 250. Save.
2. Log an espresso with dose 18 for that bean. Open the bean. Make sure "Weight remaining" shows 232 g.
3. Edit that brew. Set the dose to 20. Make sure the bean shows 230 g.
4. Delete the brew. Make sure the bean shows 250 g.

```bash
git add src/db/types.ts src/hooks/useDb.ts src/screens/Beans/BeanForm.tsx
git commit -m "feat(beans): subtract each brew dose from the bean weight"
```

---

### Task 5: `StockMeter`, `FreshnessBadge`, and translations

**Files:**
- Create: `src/components/StockMeter/index.tsx`, `src/components/StockMeter/styles.module.css`
- Create: `src/components/FreshnessBadge/index.tsx`
- Modify: `src/components/UI.tsx` (two export lines)
- Modify: `src/i18n/locales/en.json`, `es.json`, `fr.json`

**Interfaces:**
- Consumes: `Freshness`, `FreshnessState` (Task 3). `ProgressBar({ value, max })` from `src/components/UI.tsx`.
- Produces:
  - `StockMeter({ weightG, initialWeightG, servings, isLow }: StockMeterProps)` with `weightG: number; initialWeightG?: number; servings: number | null; isLow: boolean`
  - `FreshnessBadge({ freshness }: FreshnessBadgeProps)`
  - i18n keys `beans.stock.*`, `beans.freshness.*`, `home.runningLow`

- [ ] **Step 1: Add the translations**

In each locale file, add two keys **inside the existing `"beans"` object**, directly after `"diallingHeaders": { ... },`. Also add `"runningLow"` **inside the existing `"home"` object**, directly after `"topBeans"`.

`en.json` — inside `"beans"`:

```json
    "stock": {
      "remaining": "{{weight}} g left",
      "servingsLeft_one": "≈ {{count}} brew left",
      "servingsLeft_other": "≈ {{count}} brews left",
      "empty": "This bag is empty.",
      "markFinished": "Mark as finished"
    },
    "freshness": {
      "resting_one": "Resting · peak in {{count}} day",
      "resting_other": "Resting · peak in {{count}} days",
      "peak_one": "Peak · {{count}} day left",
      "peak_other": "Peak · {{count}} days left",
      "fading": "Past peak",
      "stale": "Stale"
    },
```

`en.json` — inside `"home"`: `"runningLow": "Running low",`

`es.json` — inside `"beans"`:

```json
    "stock": {
      "remaining": "Quedan {{weight}} g",
      "servingsLeft_one": "≈ {{count}} extracción restante",
      "servingsLeft_other": "≈ {{count}} extracciones restantes",
      "empty": "Esta bolsa está vacía.",
      "markFinished": "Marcar como terminado"
    },
    "freshness": {
      "resting_one": "En reposo · óptimo en {{count}} día",
      "resting_other": "En reposo · óptimo en {{count}} días",
      "peak_one": "Óptimo · queda {{count}} día",
      "peak_other": "Óptimo · quedan {{count}} días",
      "fading": "Pasado de punto",
      "stale": "Rancio"
    },
```

`es.json` — inside `"home"`: `"runningLow": "Se acaba",`

`fr.json` — inside `"beans"`:

```json
    "stock": {
      "remaining": "Il reste {{weight}} g",
      "servingsLeft_one": "≈ {{count}} extraction restante",
      "servingsLeft_other": "≈ {{count}} extractions restantes",
      "empty": "Ce sachet est vide.",
      "markFinished": "Marquer comme terminé"
    },
    "freshness": {
      "resting_one": "Repos · optimal dans {{count}} jour",
      "resting_other": "Repos · optimal dans {{count}} jours",
      "peak_one": "Optimal · reste {{count}} jour",
      "peak_other": "Optimal · restent {{count}} jours",
      "fading": "Après l’optimum",
      "stale": "Éventé"
    },
```

`fr.json` — inside `"home"`: `"runningLow": "Bientôt épuisé",`

Run: `node -e "for (const l of ['en','es','fr']) JSON.parse(require('fs').readFileSync('src/i18n/locales/'+l+'.json','utf8'))"`
Expected: no output.

- [ ] **Step 2: Write `StockMeter`**

Create `src/components/StockMeter/index.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { ProgressBar } from '../ProgressBar';
import s from './styles.module.css';

export interface StockMeterProps {
  weightG: number;
  initialWeightG?: number;
  servings: number | null;
  isLow: boolean;
}

export function StockMeter({ weightG, initialWeightG, servings, isLow }: StockMeterProps) {
  const { t } = useTranslation();
  const bag = initialWeightG && initialWeightG > 0 ? initialWeightG : Math.max(weightG, 1);
  return (
    <div className={s.meter}>
      <div className="row row-between">
        <span className={`t-mono ${s.weight}`}>{t('beans.stock.remaining', { weight: weightG })}</span>
        {servings !== null && (
          <span className={`t-mono ${isLow ? s.low : 't-sec'} ${s.servings}`}>
            {t('beans.stock.servingsLeft', { count: servings })}
          </span>
        )}
      </div>
      <ProgressBar value={weightG} max={bag} />
    </div>
  );
}
```

Create `src/components/StockMeter/styles.module.css`:

```css
.meter    { display: flex; flex-direction: column; gap: 6px; }
.weight   { font-size: 12px; }
.servings { font-size: 11px; }
.low      { color: var(--warning); }
```

Check the `ProgressBar` import path. `src/components/UI.tsx` exports it as `export { ProgressBar } from './ProgressBar';`, so `'../ProgressBar'` is correct.

- [ ] **Step 3: Write `FreshnessBadge`**

Create `src/components/FreshnessBadge/index.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import type { Freshness, FreshnessState } from '../../utils/beanStock';

export interface FreshnessBadgeProps {
  freshness: Freshness;
}

// Uses the global days-pill classes from global.css.
const PILL: Readonly<Record<Exclude<FreshnessState, 'unknown'>, string>> = {
  resting: 'amber',
  peak: 'green',
  fading: 'amber',
  stale: 'red',
};

export function FreshnessBadge({ freshness }: FreshnessBadgeProps) {
  const { t } = useTranslation();
  const { state } = freshness;
  if (state === 'unknown') return <span className="t-ter t-mono">—</span>;
  const label =
    state === 'resting' ? t('beans.freshness.resting', { count: freshness.daysUntilPeak ?? 0 })
    : state === 'peak' ? t('beans.freshness.peak', { count: freshness.daysLeftInPeak ?? 0 })
    : t(`beans.freshness.${state}`);
  return (
    <span className={`days-pill ${PILL[state]}`} title={t('beans.daysOffRoast', { count: freshness.days ?? 0 })}>
      {label}
    </span>
  );
}
```

Add to `src/components/UI.tsx`, after the `FilterBar` export:

```ts
export { StockMeter } from './StockMeter';
export { FreshnessBadge } from './FreshnessBadge';
```

- [ ] **Step 4: Check the types and lint**

Run: `npx tsc -b && npx eslint src/components/StockMeter src/components/FreshnessBadge src/components/UI.tsx`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components src/i18n/locales
git commit -m "feat(beans): add stock meter and freshness badge"
```

---

### Task 6: Bean detail

**Files:**
- Modify: `src/screens/Beans/BeanDetail.tsx`
- Modify: `src/screens/Beans/styles.module.css` (add two classes)

**Interfaces:**
- Consumes: `beanStockView`, `summariseUsage` (Task 3). `StockMeter`, `FreshnessBadge` (Task 5). `useApp().state.settings.defaultMethod: string` from `src/context/AppContext.tsx`.

- [ ] **Step 1: Add the imports and calculate the view**

In `src/screens/Beans/BeanDetail.tsx`, change the UI import and add two imports:

```tsx
import { Button, BackBar, RoastDot, Empty, Sheet, StockMeter, FreshnessBadge } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { beanStockView, summariseUsage } from '../../utils/beanStock';
```

Add after `const { t } = useTranslation();`:

```tsx
  const { state } = useApp();
```

Add after the `avgRating` constant:

```tsx
  const stock = beanStockView(bean, summariseUsage(extractions).get(bean.id!), state.settings.defaultMethod, new Date());
  const markFinished = async (): Promise<void> => {
    await db.updateBean({ ...bean, status: 'finished' });
    setBean({ ...bean, status: 'finished' });
  };
```

- [ ] **Step 2: Show the badge, the meter, and the empty banner**

Directly after the `<div className="page-head mb-5"> ... </div>` block, add:

```tsx
      {stock.isEmpty && bean.status === 'active' && (
        <div className={`card ${s.cardMb} ${s.emptyBanner}`}>
          <span>{t('beans.stock.empty')}</span>
          <Button variant="ghost" onClick={markFinished}>{t('beans.stock.markFinished')}</Button>
        </div>
      )}
```

Inside the first card, directly after `<div className="divider" />` (the one after the `grid grid-3` stats), add:

```tsx
        <div className={`col col-gap-12 ${s.stockBlock}`}>
          <FreshnessBadge freshness={stock.freshness} />
          {bean.weightG != null && (
            <StockMeter weightG={bean.weightG} initialWeightG={bean.initialWeightG} servings={stock.servings} isLow={stock.isLow} />
          )}
        </div>
        <div className="divider" />
```

Add to `src/screens/Beans/styles.module.css`:

```css
.emptyBanner { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-color: var(--warning); }
.stockBlock  { align-items: flex-start; }
```

- [ ] **Step 3: Check the types, lint, and screen, then commit**

Run: `npx tsc -b && npx eslint src/screens/Beans/BeanDetail.tsx`
Expected: no new errors.

Browser check: open a bean with a roast date 10 days ago → "Peak · 11 days left". Set its weight to 10 g and log an 18 g espresso → the weight shows 0 g and the "This bag is empty" banner shows. Press "Mark as finished" → the banner goes away and the status shows "FINISHED".

```bash
git add src/screens/Beans/BeanDetail.tsx src/screens/Beans/styles.module.css
git commit -m "feat(beans): show freshness and stock on bean detail"
```

---

### Task 7: Bean list and Home "Running low"

**Files:**
- Modify: `src/screens/Beans/BeansScreen.tsx` (`BeanCard` and the page loader)
- Modify: `src/screens/Home/HomeScreen.tsx`
- Modify: `src/screens/Beans/styles.module.css`, `src/screens/Home/styles.module.css` (one class each)

**Interfaces:**
- Consumes: `useDb().getBeanUsage(beanIds)` (Task 4). `beanStockView`, `summariseUsage`, `BeanUsage` (Task 3). `StockMeter`, `FreshnessBadge` (Task 5).

- [ ] **Step 1: Bean card**

In `src/screens/Beans/BeansScreen.tsx`:

Change the UI import to add `StockMeter, FreshnessBadge` and remove `DaysOffRoast` (the badge replaces it on the card):

```tsx
import { Button, Sheet, Empty, RoastDot, Field, Input, Slider, Pagination, FilterBar, StockMeter, FreshnessBadge } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { beanStockView, type BeanUsage } from '../../utils/beanStock';
```

`BeanCard` is the only user of `DaysOffRoast` in this file, so remove it from the import.

Replace the `BeanCard` function with:

```tsx
function BeanCard({ bean, usage, fallbackMethod, onClick }: { bean: Bean; usage: BeanUsage | undefined; fallbackMethod: string; onClick: () => void }) {
  const stock = beanStockView(bean, usage, fallbackMethod, new Date());
  return (
    <div className={`card card-hover ${s.beanCardPad}`} onClick={onClick}>
      <div className={`row row-between ${s.beanCardHeader}`}>
        <div className={`col col-gap-4 ${s.beanCardLeft}`}>
          <div className={s.beanName}>{bean.name}</div>
          <div className={`t-sec ${s.beanRoaster}`}>{bean.roaster}</div>
        </div>
        <RoastDot level={bean.roast} />
      </div>
      <div className={`row row-between ${s.beanCardBottom}`}>
        <div className="col col-gap-4">
          <span className="t-upper">{bean.process}</span>
          <span className={`t-ter ${s.beanOrigin}`}>{(bean.origin ?? '').toUpperCase()}</span>
        </div>
        <FreshnessBadge freshness={stock.freshness} />
      </div>
      {bean.weightG != null && (
        <div className={s.beanCardStock}>
          <StockMeter weightG={bean.weightG} initialWeightG={bean.initialWeightG} servings={stock.servings} isLow={stock.isLow} />
        </div>
      )}
    </div>
  );
}
```

Add to `src/screens/Beans/styles.module.css`:

```css
.beanCardStock { margin-top: 12px; }
```

- [ ] **Step 2: Load the usage for the visible page**

In `BeansScreen()`, add after the other `useState` lines:

```tsx
  const { state } = useApp();
  const [usage, setUsage] = useState<Map<number, BeanUsage>>(new Map());
```

In `loadBeans`, change the `.then(({ items, total }) => { ... })` of `getBeansPage` to:

```tsx
    }).then(async ({ items, total }) => {
      setBeans(items);
      setTotalCount(total);
      setUsage(await db.getBeanUsage(items.map(b => b.id!)));
    });
```

Change the card render to:

```tsx
          : beans.map(b => <BeanCard key={b.id} bean={b} usage={usage.get(b.id!)} fallbackMethod={state.settings.defaultMethod} onClick={() => navigate(`/beans/${b.id}`)} />)
```

- [ ] **Step 3: Home "Running low"**

In `src/screens/Home/HomeScreen.tsx`:

Change line 5 and add three imports:

```tsx
import { Stars, MethodBadge, Empty, RoastDot, StockMeter } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { beanStockView, summariseUsage } from '../../utils/beanStock';
import s from './styles.module.css';
```

(`HomeScreen.tsx` does not import its CSS module yet. `src/screens/Home/styles.module.css` exists.)

In `HomeScreen()`, add after `const { t } = useTranslation();`:

```tsx
  const { state } = useApp();
```

Add after the `topBeans` constant:

```tsx
  const usageByBean = summariseUsage(extractions);
  const runningLow = beans
    .filter(b => b.status === 'active' && b.weightG != null)
    .map(b => ({ bean: b, stock: beanStockView(b, usageByBean.get(b.id!), state.settings.defaultMethod, new Date()) }))
    .filter(x => x.stock.isLow);
```

Add this section directly after the `</header>` line:

```tsx
      {runningLow.length > 0 && (
        <section className="home-block">
          <div className="block-label">
            <span className="t-upper">{t('home.runningLow')}</span>
          </div>
          <div className="col col-gap-12">
            {runningLow.map(({ bean, stock }) => (
              <button key={bean.id} type="button" className={`card ${s.lowCard}`} onClick={() => navigate(`/beans/${bean.id}`)}>
                <div className={s.lowName}>{bean.name}</div>
                <StockMeter weightG={bean.weightG ?? 0} initialWeightG={bean.initialWeightG} servings={stock.servings} isLow />
              </button>
            ))}
          </div>
        </section>
      )}
```

Add to `src/screens/Home/styles.module.css`:

```css
.lowCard { display: flex; flex-direction: column; gap: 8px; width: 100%; text-align: left; cursor: pointer; }
.lowName { font-size: 15px; color: var(--text-primary); }
```

- [ ] **Step 4: Run all checks**

Run: `npm test && npx tsc -b && npx eslint src/screens/Beans/BeansScreen.tsx src/screens/Home/HomeScreen.tsx && npm run build`
Expected: tests pass, no type errors, lint shows only the old `HomeScreen.tsx:98` error (its line number can move), build ends with `files generated`.

- [ ] **Step 5: Check it in the browser, then commit**

1. Set an active bean to 50 g. Open Home. Make sure "Running low" lists it with "≈ 2 brews left".
2. Open Beans. Make sure the card shows the freshness badge and the stock bar. Beans with no weight show no bar.

```bash
git add src/screens/Beans src/screens/Home
git commit -m "feat(beans): show stock on bean cards and running low on home"
```

---

## Merge notes

- This plan changes no Dexie schema version (`initialWeightG` is not indexed).
- `feat/dial-in-assistant` also edits `src/screens/Beans/BeanDetail.tsx` (a "Brew again" button before the action row). Keep both changes on merge.
- `feat/guided-brew` and `feat/dial-in-assistant` edit `onSave` in the wizard. This plan does not touch it, because the stock logic lives in `useDb()`.
- The other 4 feature branches also add Task 1 with the same bytes. Git merges identical changes without a conflict.
