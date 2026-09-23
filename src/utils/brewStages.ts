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

// The recipe fields of the log wizard draft.
// recipeId is the recipe the brew is linked to on save. Only Start brew, an edited brew,
// a finished guided brew, or "No recipe" (null) write it.
// recipeChoice is the chip the user tapped in the Time section. undefined means not chosen yet.
export interface RecipeDraft {
  recipeId: number | null;
  recipeChoice?: number | null;
  isEditing?: boolean;
}

// The chip to show as selected. The brew sheet derives it on every render; it is a UI
// preselection only and never links a recipe by itself.
export function initialRecipeChoice(forMethod: readonly Recipe[], draft: RecipeDraft): number | null {
  const has = (id: number | null | undefined): boolean => forMethod.some(r => r.id === id);
  if (draft.recipeChoice === null) return null;
  if (draft.recipeChoice !== undefined && has(draft.recipeChoice)) return draft.recipeChoice;
  // An edit keeps the brew's own recipe. A default would silently link a recipe to old data.
  if (draft.isEditing) return has(draft.recipeId) ? draft.recipeId : null;
  return pickDefaultRecipe(forMethod, forMethod[0]?.method ?? '', draft.recipeId)?.id ?? null;
}

// A chip tap changes the selection. "No recipe" also clears a recipe from Start brew.
export function recipePatchOnChoose(choice: number | null): Partial<RecipeDraft> {
  return choice === null ? { recipeChoice: null, recipeId: null } : { recipeChoice: choice };
}

export function recipePatchOnGuidedDone(recipeId: number): Partial<RecipeDraft> {
  return { recipeChoice: recipeId, recipeId };
}

// The recipe to link on save. With forMethod, a recipe of another method is dropped.
export function recipeIdToSave(draft: RecipeDraft, forMethod?: readonly Recipe[]): number | null {
  if (draft.recipeId === null) return null;
  if (forMethod && !forMethod.some(r => r.id === draft.recipeId)) return null;
  return draft.recipeId;
}
