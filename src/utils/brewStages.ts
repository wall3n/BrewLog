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
