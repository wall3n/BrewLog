# Guided Brew Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user select a recipe in the timer step and brew it in a full-screen guided mode: the current pour, the target scale weight, a countdown to the next pour, a sound and vibration cue at each pour, and a screen that stays on.

**Architecture:** Pure stage maths goes in `src/utils/brewStages.ts` (unit tests). Browser side effects go in two small modules: `src/utils/cuePlayer.ts` (Web Audio beep and vibration) and `src/hooks/useWakeLock.ts` (Screen Wake Lock API). A new `GuidedBrew` overlay uses them. `Extraction` gets an optional `recipeId`, so each brew keeps a link to its recipe (Dexie schema version 3).

**Tech Stack:** React 19, TypeScript 6 (strict), Dexie 4, Vitest 4, react-i18next, Web Audio API, Screen Wake Lock API, Vibration API.

**Spec:** the "Feature spec" section below. It comes from the 2026-09-22 feature review (feature 2 of 5).

**Branch:** `feat/guided-brew`, made from `main` at `02e91cb`.

**Verified:** on 2026-09-22 the code of Tasks 2–6 was applied to `main` from this plan's text. Then `npm test` (all stage tests pass), `npx tsc -b`, `npx eslint` (no new errors), and `npm run build` passed. Task 7 and the phone checks were not run.

## Feature spec

1. The timer step (wizard step 5) lists the recipes of the selected method. The user selects one recipe or "No recipe".
2. The default recipe is: the recipe in the draft (`recipeId`), else the most recently used recipe of that method, else the oldest recipe of that method.
3. If the selected recipe has pour stages, a "Guided brew" button opens a full-screen overlay.
4. The overlay shows: a large clock, the current stage label, "Pour to N g" (the cumulative scale weight of the stage), and "<next label> in m:ss".
5. A short beep and vibration play 3 s before each stage. A longer beep and vibration play when a stage starts. A stage at 0 s plays no cue, because the user presses Start at that moment.
6. The screen stays on while the timer runs (where the browser supports the Wake Lock API).
7. "Done" stops the timer, writes the time and the `recipeId` into the draft, and goes to the tasting step.
8. On save, the brew keeps `recipeId`, and the recipe gets `lastUsedAt = now`.
9. "Start brew" on the recipe detail screen also puts `recipeId` in the draft.
10. The extraction detail shows the recipe name as a link, if the recipe still exists.

## Global Constraints

- Node 24.x LTS (pin from `.nvmrc` and `package.json` `engines`). npm only.
- TypeScript `strict`. No `any`, no `as any`, no `as unknown as X`. Give explicit parameter and return types.
- Components never call Dexie. Use `useDb()` from `src/hooks/useDb.ts`.
- Dexie: on a schema change, increase the version and add an `upgrade()` (CLAUDE.md rule).
- No hardcoded user-facing text. Add every key to all three files: `src/i18n/locales/en.json`, `es.json`, `fr.json`. (CLAUDE.md says `public/locales`. That is out of date. The real files are in `src/i18n/locales/`.)
- No inline `style={{}}`. The only exception is a runtime value (`width: X%`), with a comment.
- Component styles go in a co-located `styles.module.css`. Colours come only from CSS variables in `src/styles/global.css`.
- Icons: use the existing `Icon` component from `src/components/Icons.tsx`. The code does not use `lucide-react`.
- Numbers render with the `t-mono` class.
- Commits: Conventional Commits, English, lowercase subject, no `Co-authored-by` trailer.
- Lint: `main` has 2 old lint errors (`src/context/AppContext.tsx:83`, `src/screens/Home/HomeScreen.tsx:98`). Do not fix them. Do not add new errors. Check with `npx eslint <changed files>`.
- Do not import `src/utils/formatters.ts` or `src/i18n` into a module that a `*.test.ts` file imports. `formatters.ts` starts i18next, and the tests run in Node.

## Review Focus

1. A recipe whose stages are not in time order (the user edited them) → the overlay sorts them by `timeS`. The "active" highlight and the cues follow the sorted order.
2. Pause and resume across a stage time → the cue plays once, not twice. Reset and start again → the cues play again.
3. iOS Safari: no `navigator.vibrate`, and audio only after a user gesture → no error. The beep works because `prime()` runs in the Start click handler.
4. A recipe deleted after a brew used it → the extraction detail shows no recipe row and does not crash. Editing that brew still saves.
5. An existing user on schema version 2 opens the app → Dexie upgrades to version 3 with no data loss. Old brews have no `recipeId`.

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

### Task 2: Stage maths (`brewStages.ts`)

**Files:**
- Create: `src/utils/brewStages.ts`
- Test: `src/utils/brewStages.test.ts`

**Interfaces:**
- Consumes: `PourStage { id: string; label: string; timeS: number; weightG: number }` and `Recipe` from `src/db/types.ts`. `weightG` is the **cumulative** scale weight (see `RecipeForm.tsx:55`, each new stage is `last.weightG + 60`).
- Produces:
  - `sortStages(stages: readonly PourStage[]): readonly PourStage[]`
  - `interface StageProgress { activeIndex: number; nextIndex: number | null; secondsToNext: number | null; targetWeightG: number | null; isLastStage: boolean }`
  - `getStageProgress(sorted: readonly PourStage[], elapsedS: number): StageProgress` — takes stages that are **already sorted**.
  - `type CueKind = 'warning' | 'stage'`, `WARNING_LEAD_S = 3`
  - `cueBetween(sorted: readonly PourStage[], prevS: number, nowS: number): CueKind | null`
  - `pickDefaultRecipe(recipes: readonly Recipe[], method: string, preferredId: number | null): Recipe | undefined`

- [ ] **Step 1: Write the failing tests**

Create `src/utils/brewStages.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests and make sure they fail**

Run: `npx vitest run src/utils/brewStages.test.ts`
Expected: FAIL with `Failed to resolve import "./brewStages"`.

- [ ] **Step 3: Write the implementation**

Create `src/utils/brewStages.ts`:

```ts
import type { PourStage, Recipe } from '../db/types';

export interface StageProgress {
  activeIndex: number;          // -1 before the first stage starts
  nextIndex: number | null;
  secondsToNext: number | null;
  targetWeightG: number | null; // cumulative scale weight for the active stage
  isLastStage: boolean;
}

export type CueKind = 'warning' | 'stage';
export const WARNING_LEAD_S = 3;

export function sortStages(stages: readonly PourStage[]): readonly PourStage[] {
  return [...stages].sort((a, b) => a.timeS - b.timeS);
}

export function getStageProgress(sorted: readonly PourStage[], elapsedS: number): StageProgress {
  let activeIndex = -1;
  sorted.forEach((stage, i) => { if (elapsedS >= stage.timeS) activeIndex = i; });
  const nextIndex = activeIndex + 1 < sorted.length ? activeIndex + 1 : null;
  return {
    activeIndex,
    nextIndex,
    secondsToNext: nextIndex === null ? null : sorted[nextIndex].timeS - elapsedS,
    targetWeightG: activeIndex >= 0 ? sorted[activeIndex].weightG : null,
    isLastStage: sorted.length > 0 && activeIndex === sorted.length - 1,
  };
}

// The cue to play when the clock moves from prevS to nowS. A stage at 0 s gets no cue,
// because the user presses Start at that moment.
export function cueBetween(sorted: readonly PourStage[], prevS: number, nowS: number): CueKind | null {
  if (nowS <= prevS) return null;
  let cue: CueKind | null = null;
  for (const stage of sorted) {
    if (stage.timeS > prevS && stage.timeS <= nowS) return 'stage';
    const warnAt = stage.timeS - WARNING_LEAD_S;
    if (warnAt > 0 && warnAt > prevS && warnAt <= nowS) cue = 'warning';
  }
  return cue;
}

function time(iso: string | undefined): number {
  return iso ? new Date(iso).getTime() : 0;
}

export function pickDefaultRecipe(
  recipes: readonly Recipe[],
  method: string,
  preferredId: number | null,
): Recipe | undefined {
  const forMethod = recipes.filter(r => r.method === method);
  const preferred = forMethod.find(r => r.id === preferredId);
  if (preferred) return preferred;
  const used = forMethod.filter(r => r.lastUsedAt).sort((a, b) => time(b.lastUsedAt) - time(a.lastUsedAt));
  if (used.length > 0) return used[0];
  return [...forMethod].sort((a, b) => time(a.createdAt) - time(b.createdAt))[0];
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/utils/brewStages.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/utils/brewStages.ts src/utils/brewStages.test.ts
git commit -m "feat(guided-brew): add pour stage progress and cue timing"
```

---

### Task 3: Store `recipeId` on extractions (schema version 3)

**Files:**
- Modify: `src/db/types.ts` (the `Extraction` interface)
- Modify: `src/db/schema.ts` (add version 3)
- Modify: `src/screens/LogExtraction/index.tsx` (draft field and save)
- Modify: `src/screens/Recipes/RecipeDetail.tsx` (the "Start brew" button)

**Interfaces:**
- Produces: `Extraction.recipeId?: number` (indexed). `WizardDraft.recipeId: number | null`.
- Consumes: `db.updateRecipe(data: Partial<Recipe> & { id: number }): Promise<void>` from `useDb()`.

- [ ] **Step 1: Add the field to the type**

In `src/db/types.ts`, in `interface Extraction`, add after `beanId: number;`:

```ts
  recipeId?: number;
```

- [ ] **Step 2: Add schema version 3**

In `src/db/schema.ts`, add after the `this.version(2)...` block (inside the constructor):

```ts
    this.version(3).stores({
      beans: '++id, status, roastedAt, createdAt',
      equipment: '++id, type, createdAt',
      recipes: '++id, method, createdAt',
      extractions: '++id, method, beanId, recipeId, flag, rating, createdAt',
      settings: '++id',
    }).upgrade(() => {
      // recipeId is optional. Existing extractions keep it undefined, so no data changes.
    });
```

- [ ] **Step 3: Carry `recipeId` in the wizard draft**

In `src/screens/LogExtraction/index.tsx`:

Add to `interface WizardDraft`, after `beanId: number | null;`:

```ts
  recipeId: number | null;
```

Add to the `useState<WizardDraft>` initialiser, after the `beanId:` line:

```ts
    recipeId: prefill?.recipeId ?? null,
```

Replace the whole `onSave` function with:

```tsx
  const onSave = async () => {
    if (!draft.beanId) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { showTds, isEditing, id, createdAt, recipeId, ...payload } = draft;
    const recipeField = recipeId != null ? { recipeId } : {};
    if (isEditing && id) {
      await db.updateExtraction({
        ...payload,
        ...recipeField,
        beanId: draft.beanId,
        id,
        createdAt: createdAt!,
        updatedAt: new Date().toISOString()
      });
      navigate(`/history/${id}`);
    } else {
      await db.addExtraction({ ...payload, ...recipeField, beanId: draft.beanId });
      if (recipeId != null) await db.updateRecipe({ id: recipeId, lastUsedAt: new Date().toISOString() });
      navigate('/');
    }
  };
```

- [ ] **Step 4: Pass `recipeId` from the recipe detail**

In `src/screens/Recipes/RecipeDetail.tsx`, change the `state` object of the "Start brew" button to:

```tsx
{ state: { method: r.method, ratio: r.ratio, dose: r.dose, yield: r.yield, timeS: r.time, temp: r.temp, recipeId: r.id } }
```

- [ ] **Step 5: Check the types, check the upgrade, then commit**

Run: `npx tsc -b && npx eslint src/db src/screens/LogExtraction/index.tsx src/screens/Recipes/RecipeDetail.tsx`
Expected: no errors.

Upgrade check: on `main`, run `npm run dev` and open the app once, so the browser has a version 2 database with seed data. Switch to this branch, reload. In DevTools → Application → IndexedDB → `BrewLog`, make sure the version is 30 (Dexie multiplies by 10) and the extractions are still there.

```bash
git add src/db src/screens/LogExtraction/index.tsx src/screens/Recipes/RecipeDetail.tsx
git commit -m "feat(guided-brew): link extractions to the recipe they used"
```

---

### Task 4: Cue player and wake lock

**Files:**
- Create: `src/utils/cuePlayer.ts`
- Create: `src/hooks/useWakeLock.ts`

**Interfaces:**
- Consumes: `CueKind` from `src/utils/brewStages.ts`.
- Produces:
  - `interface CuePlayer { prime(): void; play(kind: CueKind): void; close(): void }`
  - `createCuePlayer(): CuePlayer`
  - `useWakeLock(active: boolean): void`

These modules only call browser APIs. They have no unit tests. Task 6 checks them by hand on a phone.

- [ ] **Step 1: Write the cue player**

Create `src/utils/cuePlayer.ts`:

```ts
import type { CueKind } from './brewStages';

export interface CuePlayer {
  prime(): void;
  play(kind: CueKind): void;
  close(): void;
}

const BEEP = {
  warning: { freq: 660, seconds: 0.08, vibrate: 60 },
  stage:   { freq: 880, seconds: 0.18, vibrate: 200 },
} as const;

export function createCuePlayer(): CuePlayer {
  let ctx: AudioContext | null = null;
  return {
    // Call this inside a click handler. iOS allows audio only after a user gesture.
    prime(): void {
      if (!ctx && typeof AudioContext !== 'undefined') ctx = new AudioContext();
      void ctx?.resume();
    },
    play(kind: CueKind): void {
      const beep = BEEP[kind];
      if (typeof navigator.vibrate === 'function') navigator.vibrate(beep.vibrate);
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = beep.freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + beep.seconds);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + beep.seconds);
    },
    close(): void {
      void ctx?.close();
      ctx = null;
    },
  };
}
```

- [ ] **Step 2: Write the wake lock hook**

Create `src/hooks/useWakeLock.ts`:

```ts
import { useEffect } from 'react';

// Keeps the screen on while `active` is true. The browser releases the lock when the tab
// is hidden, so the hook asks again when the tab becomes visible.
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async (): Promise<void> => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) { void lock.release(); return; }
        sentinel = lock;
      } catch {
        // Denied (for example, low battery mode). The brew still works without it.
      }
    };
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') void request();
    };

    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release();
    };
  }, [active]);
}
```

- [ ] **Step 3: Check the types and lint**

Run: `npx tsc -b && npx eslint src/utils/cuePlayer.ts src/hooks/useWakeLock.ts`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/cuePlayer.ts src/hooks/useWakeLock.ts
git commit -m "feat(guided-brew): add audio cue player and screen wake lock"
```

---

### Task 5: Guided brew overlay and translations

**Files:**
- Create: `src/screens/LogExtraction/GuidedBrew/index.tsx`
- Create: `src/screens/LogExtraction/GuidedBrew/styles.module.css`
- Modify: `src/i18n/locales/en.json`, `src/i18n/locales/es.json`, `src/i18n/locales/fr.json`

**Interfaces:**
- Consumes: `useTimer()` → `{ seconds: number; display: string; isRunning: boolean; start(): void; pause(): void; reset(): void }` (`src/hooks/useTimer.ts`). `sortStages`, `getStageProgress`, `cueBetween` (Task 2). `createCuePlayer`, `useWakeLock` (Task 4). `fmtTime(s: number): string` from `src/utils/formatters.ts`. `useApp().dispatch({ type: 'OPEN_MODAL' | 'CLOSE_MODAL' })` hides the quick-add FAB (the same pattern as `src/components/Modal/index.tsx`).
- Produces: `GuidedBrew({ recipe, onDone, onClose }: GuidedBrewProps)` where `onDone(timeS: number): void` and `onClose(): void`.

- [ ] **Step 1: Add the translations**

Add a new top-level key `"guidedBrew"` to each locale file, directly after the `"extraction"` block. Keep valid JSON.

`en.json`:

```json
  "guidedBrew": {
    "open": "Guided brew",
    "title": "Guided brew",
    "close": "Close guided brew",
    "now": "Now",
    "ready": "Press start",
    "pourTo": "Pour to {{weight}} g",
    "nextIn": "{{label}} in {{time}}",
    "finalStage": "Last pour. Wait for the drawdown.",
    "done": "Done · use {{time}}",
    "recipe": "Recipe",
    "noRecipe": "No recipe"
  },
```

`es.json`:

```json
  "guidedBrew": {
    "open": "Preparación guiada",
    "title": "Preparación guiada",
    "close": "Cerrar la preparación guiada",
    "now": "Ahora",
    "ready": "Pulsa iniciar",
    "pourTo": "Vierte hasta {{weight}} g",
    "nextIn": "{{label}} en {{time}}",
    "finalStage": "Último vertido. Espera a que drene.",
    "done": "Listo · usar {{time}}",
    "recipe": "Receta",
    "noRecipe": "Sin receta"
  },
```

`fr.json`:

```json
  "guidedBrew": {
    "open": "Préparation guidée",
    "title": "Préparation guidée",
    "close": "Fermer la préparation guidée",
    "now": "Maintenant",
    "ready": "Appuyez sur démarrer",
    "pourTo": "Versez jusqu’à {{weight}} g",
    "nextIn": "{{label}} dans {{time}}",
    "finalStage": "Dernier versement. Attendez l’écoulement.",
    "done": "Terminé · utiliser {{time}}",
    "recipe": "Recette",
    "noRecipe": "Sans recette"
  },
```

Run: `node -e "for (const l of ['en','es','fr']) JSON.parse(require('fs').readFileSync('src/i18n/locales/'+l+'.json','utf8'))"`
Expected: no output.

- [ ] **Step 2: Write the overlay**

Create `src/screens/LogExtraction/GuidedBrew/index.tsx`:

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../../context/AppContext';
import { useTimer } from '../../../hooks/useTimer';
import { useWakeLock } from '../../../hooks/useWakeLock';
import { Button, ProgressBar } from '../../../components/UI';
import { Icon } from '../../../components/Icons';
import { sortStages, getStageProgress, cueBetween } from '../../../utils/brewStages';
import { createCuePlayer, type CuePlayer } from '../../../utils/cuePlayer';
import { fmtTime } from '../../../utils/formatters';
import type { Recipe } from '../../../db/types';
import s from './styles.module.css';

export interface GuidedBrewProps {
  recipe: Recipe;
  onDone: (timeS: number) => void;
  onClose: () => void;
}

export function GuidedBrew({ recipe, onDone, onClose }: GuidedBrewProps) {
  const { t } = useTranslation();
  const { dispatch } = useApp();
  const { seconds, display, isRunning, start, pause, reset } = useTimer();
  const player = useRef<CuePlayer | null>(null);
  const prevSeconds = useRef(0);
  const stages = useMemo(() => sortStages(recipe.stages), [recipe.stages]);
  const progress = getStageProgress(stages, seconds);

  useWakeLock(isRunning);

  useEffect(() => {
    dispatch({ type: 'OPEN_MODAL' });
    const p = createCuePlayer();
    player.current = p;
    return () => {
      dispatch({ type: 'CLOSE_MODAL' });
      p.close();
    };
  }, [dispatch]);

  useEffect(() => {
    const cue = cueBetween(stages, prevSeconds.current, seconds);
    prevSeconds.current = seconds;
    if (cue) player.current?.play(cue);
  }, [seconds, stages]);

  const handleStart = (): void => { player.current?.prime(); start(); };
  const handleReset = (): void => { reset(); prevSeconds.current = 0; };
  const handleDone = (): void => { pause(); onDone(seconds); };

  const active = progress.activeIndex >= 0 ? stages[progress.activeIndex] : null;
  const next = progress.nextIndex !== null ? stages[progress.nextIndex] : null;

  return createPortal(
    <div className={s.overlay} role="dialog" aria-modal="true" aria-label={t('guidedBrew.title')}>
      <div className={`row row-between ${s.head}`}>
        <span className="t-upper">{recipe.name}</span>
        <button type="button" className={s.close} onClick={onClose} aria-label={t('guidedBrew.close')}>
          <Icon name="x" size={20} />
        </button>
      </div>

      <div className={`t-mono ${s.clock}`}>{display}</div>

      <div className={s.now}>
        <span className="t-upper">{t('guidedBrew.now')}</span>
        <span className={`h-display ${s.stageLabel}`}>{active ? active.label : t('guidedBrew.ready')}</span>
        {progress.targetWeightG !== null && (
          <span className={`t-mono t-acc ${s.target}`}>{t('guidedBrew.pourTo', { weight: progress.targetWeightG })}</span>
        )}
      </div>

      <div className={`t-sec t-mono ${s.next}`} aria-live="polite">
        {next && progress.secondsToNext !== null
          ? t('guidedBrew.nextIn', { label: next.label, time: fmtTime(progress.secondsToNext) })
          : progress.isLastStage ? t('guidedBrew.finalStage') : null}
      </div>

      <ProgressBar value={Math.min(seconds, recipe.time)} max={recipe.time > 0 ? recipe.time : 1} />

      <ol className={s.stages}>
        {stages.map((stage, i) => (
          <li key={stage.id} className={`pour-stage ${i === progress.activeIndex ? 'active' : ''}`}>
            <span className="pn">{i + 1}</span>
            <span className="pl">{stage.label}</span>
            <span className="pt">@ {fmtTime(stage.timeS)} → {stage.weightG}g</span>
          </li>
        ))}
      </ol>

      <div className={s.controls}>
        {!isRunning
          ? <Button size="lg" onClick={handleStart} leftIcon="play">{t('extraction.steps.timer.start')}</Button>
          : <Button size="lg" variant="ghost" onClick={pause} leftIcon="pause">{t('extraction.steps.timer.pause')}</Button>}
        <Button size="lg" variant="ghost" onClick={handleReset} leftIcon="reset">{t('extraction.steps.timer.reset')}</Button>
        <Button size="lg" full onClick={handleDone}>{t('guidedBrew.done', { time: fmtTime(seconds) })}</Button>
      </div>
    </div>,
    document.body,
  );
}
```

Create `src/screens/LogExtraction/GuidedBrew/styles.module.css`:

```css
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: calc(16px + env(safe-area-inset-top)) 16px calc(16px + env(safe-area-inset-bottom));
  background: var(--bg-base);
  overflow-y: auto;
}
.head       { gap: 12px; }
.close      { background: none; border: 0; color: var(--text-secondary); padding: 8px; cursor: pointer; }
.clock      { font-size: 72px; line-height: 1; text-align: center; color: var(--text-primary); }
.now        { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
.stageLabel { font-size: 32px; }
.target     { font-size: 28px; }
.next       { min-height: 20px; text-align: center; font-size: 14px; }
.stages     { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.controls   { margin-top: auto; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.controls > :last-child { grid-column: 1 / -1; }

@media (min-width: 1024px) {
  .overlay { padding-left: calc(50% - 280px); padding-right: calc(50% - 280px); }
  .clock   { font-size: 96px; }
}
```

- [ ] **Step 3: Check the types and lint**

Run: `npx tsc -b && npx eslint src/screens/LogExtraction/GuidedBrew`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/screens/LogExtraction/GuidedBrew src/i18n/locales
git commit -m "feat(guided-brew): add full-screen guided brew overlay"
```

---

### Task 6: Recipe picker in the timer step

**Files:**
- Modify: `src/screens/LogExtraction/steps/StepTimer.tsx` (full rewrite, shown below)
- Modify: `src/screens/LogExtraction/steps/styles.module.css` (add two classes)

**Interfaces:**
- Consumes: `pickDefaultRecipe`, `sortStages`, `getStageProgress` (Task 2). `GuidedBrew` (Task 5). `WizardDraft.recipeId` (Task 3). `Tag({ active, onClick, children })` from `src/components/UI.tsx`.

- [ ] **Step 1: Rewrite the step**

Replace all of `src/screens/LogExtraction/steps/StepTimer.tsx` with:

```tsx
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../../hooks/useDb';
import { useTimer } from '../../../hooks/useTimer';
import { Button, Tag } from '../../../components/UI';
import { fmtTime } from '../../../utils/formatters';
import { pickDefaultRecipe, sortStages, getStageProgress } from '../../../utils/brewStages';
import { GuidedBrew } from '../GuidedBrew';
import type { WizardDraft } from '../index';
import type { Recipe } from '../../../db/types';
import css from './styles.module.css';

interface Props { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void; onNext: () => void; onSkip: () => void; }

export function StepTimer({ draft, update, onNext, onSkip }: Props) {
  const db = useDb();
  const { t } = useTranslation();
  const { seconds, display, isRunning, start, pause, reset } = useTimer();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [guided, setGuided] = useState(false);

  useEffect(() => {
    db.getAllRecipes().then(all => {
      const forMethod = all.filter(r => r.method === draft.method);
      setRecipes(forMethod);
      const initial = pickDefaultRecipe(forMethod, draft.method, draft.recipeId);
      update({ recipeId: initial?.id ?? null });
    });
    // Load once per method. `update` and `db` change on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.method]);

  const recipe = recipes.find(r => r.id === draft.recipeId);
  const stages = useMemo(() => sortStages(recipe?.stages ?? []), [recipe]);
  const activeStageIdx = getStageProgress(stages, seconds).activeIndex;

  const finishGuided = (timeS: number): void => {
    setGuided(false);
    update({ timeS, recipeId: recipe?.id ?? null });
    onNext();
  };

  return (
    <div>
      <div className={`step-meta ${css.stepMeta}`}>
        <div className="col col-gap-4">
          <h2 className={`h-display ${css.stepTitle}`}>{t('extraction.steps.timer.title')}</h2>
          <span className={`t-sec ${css.stepSub}`}>{t('extraction.steps.timer.subtitle')}</span>
        </div>
        <button type="button" className="skip" onClick={onSkip}>{t('extraction.steps.timer.skip')}</button>
      </div>

      {recipes.length > 0 && (
        <div className={css.recipePicker}>
          <div className="t-upper">{t('guidedBrew.recipe')}</div>
          <div className="scroll-x">
            {recipes.map(r => (
              <Tag key={r.id} active={r.id === draft.recipeId} onClick={() => update({ recipeId: r.id ?? null })}>{r.name}</Tag>
            ))}
            <Tag subtle active={draft.recipeId === null} onClick={() => update({ recipeId: null })}>{t('guidedBrew.noRecipe')}</Tag>
          </div>
        </div>
      )}

      {recipe && stages.length > 0 && (
        <div className={css.guidedBtn}>
          <Button full size="lg" leftIcon="play" onClick={() => setGuided(true)}>{t('guidedBrew.open')}</Button>
        </div>
      )}

      <div className={`card ${css.timerCard}`}>
        <div className="timer">{display}</div>
        <div className={`row row-gap-12 ${css.timerControls}`}>
          {!isRunning
            ? <Button onClick={start} leftIcon="play">{t('extraction.steps.timer.start')}</Button>
            : <Button variant="ghost" onClick={pause} leftIcon="pause">{t('extraction.steps.timer.pause')}</Button>
          }
          <Button variant="ghost" onClick={reset} leftIcon="reset">{t('extraction.steps.timer.reset')}</Button>
          <Button variant="ghost" onClick={() => { pause(); update({ timeS: seconds }); onNext(); }}>
            {t('extraction.steps.timer.useTime', { time: fmtTime(seconds) })}
          </Button>
        </div>
      </div>

      {recipe && stages.length > 0 && (
        <div className={`col col-gap-8 ${css.recipeMb}`}>
          <div className={`t-upper ${css.recipeTitle}`}>{recipe.name}</div>
          {stages.map((s, i) => (
            <div key={s.id} className={`pour-stage ${i === activeStageIdx ? 'active' : ''}`}>
              <span className="pn">{i + 1}</span>
              <span className="pl">{s.label}</span>
              <span className="pt">@ {fmtTime(s.timeS)} → {s.weightG}g</span>
            </div>
          ))}
        </div>
      )}

      <Button full size="lg" variant="ghost" onClick={onNext}>{t('extraction.steps.timer.continueWithout')}</Button>

      {guided && recipe && (
        <GuidedBrew recipe={recipe} onDone={finishGuided} onClose={() => setGuided(false)} />
      )}
    </div>
  );
}
```

Add to `src/screens/LogExtraction/steps/styles.module.css`:

```css
.recipePicker { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.guidedBtn    { margin-bottom: 16px; }
```

- [ ] **Step 2: Check the types and lint**

Run: `npx tsc -b && npx eslint src/screens/LogExtraction/steps/StepTimer.tsx`
Expected: no errors.

- [ ] **Step 3: Check it on a phone**

Run: `npm run dev -- --host`. Open the LAN URL on a phone.
1. Log a pour over. At step 5, make sure the recipe chips show and the most recently used recipe is selected.
2. Press "Guided brew", then Start. Make sure you hear a short beep 3 s before each pour and a longer beep at each pour (Android also vibrates).
3. Leave the phone for 1 minute. Make sure the screen stays on (Safari 16.4+ and Chrome).
4. Press Pause at 0:44 and Start again. Make sure the 0:45 beep plays once.
5. Press "Done". Make sure step 6 opens. Save. Open the recipe. Make sure "Last used" shows today.

- [ ] **Step 4: Commit**

```bash
git add src/screens/LogExtraction/steps
git commit -m "feat(guided-brew): add recipe picker and guided mode to timer step"
```

---

### Task 7: Show the recipe on the extraction detail

**Files:**
- Modify: `src/screens/History/ExtractionDetail.tsx`
- Modify: `src/screens/History/styles.module.css` (add one class)

**Interfaces:**
- Consumes: `db.getRecipe(id: number): Promise<Recipe | undefined>`, `Extraction.recipeId?: number`.

- [ ] **Step 1: Load the recipe**

In `src/screens/History/ExtractionDetail.tsx`:

Change the type import to:

```tsx
import type { Extraction, Bean, Equipment, Recipe } from '../../db/types';
```

Add state after the `equipment` state:

```tsx
  const [recipe, setRecipe] = useState<Recipe | undefined>(undefined);
```

In `load()`, replace the `Promise.all` block and the two `set…` lines after it with:

```tsx
      const [b, allEq, rcp] = await Promise.all([
        extraction.beanId ? db.getBean(extraction.beanId) : Promise.resolve(undefined),
        db.getAllEquipment(),
        extraction.recipeId != null ? db.getRecipe(extraction.recipeId) : Promise.resolve(undefined),
      ]);
      setBean(b);
      setEquipment(allEq.filter(e => (extraction.equipmentIds ?? []).includes(e.id!)));
      setRecipe(rcp);
```

- [ ] **Step 2: Show the link**

Directly after `{bean && <p>{bean.roaster} · {bean.process}</p>}`, add:

```tsx
        {recipe && (
          <button type="button" className={`t-upper ${s.recipeLink}`} onClick={() => navigate(`/recipes/${recipe.id}`)}>
            {t('guidedBrew.recipe')} · {recipe.name}
          </button>
        )}
```

Add to `src/screens/History/styles.module.css`:

```css
.recipeLink { background: none; border: 0; padding: 0; margin-top: 8px; color: var(--accent); cursor: pointer; }
```

- [ ] **Step 3: Run all checks**

Run: `npm test && npx tsc -b && npx eslint src/screens/History/ExtractionDetail.tsx && npm run build`
Expected: all tests pass, no type errors, no new lint errors, build ends with `files generated`.

- [ ] **Step 4: Check it in the browser**

Open the brew from Task 6. Make sure "Recipe · <name>" shows and opens the recipe. Delete that recipe. Open the brew again. Make sure the row does not show and the screen does not crash.

- [ ] **Step 5: Commit**

```bash
git add src/screens/History
git commit -m "feat(guided-brew): show the recipe link on extraction detail"
```

---

## Merge notes

- This plan adds **Dexie version 3**. No other feature branch in this set changes the schema. If a different branch merges a version 3 first, rename this block to the next free version.
- The other 4 feature branches also add Task 1 with the same bytes. Git merges identical changes without a conflict.
- `feat/dial-in-assistant` also changes `onSave` in `src/screens/LogExtraction/index.tsx` (it navigates to `/history/:id` after a new save). On merge, keep both: the `recipeField` logic from this plan and the `navigate(`/history/${newId}`)` from that plan.
- `feat/dial-in-assistant` also edits `src/screens/History/ExtractionDetail.tsx` in a different place. Keep both changes.
