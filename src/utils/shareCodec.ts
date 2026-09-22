import type { PourStage, Recipe } from '../db/types';
import { METHODS } from './methodDefaults';

// A recipe travels in the URL hash (#r=...). The browser never sends the hash to a server.
export const SHARE_VERSION = 1;
export const IMPORT_PATH = '/recipes/import';
export const MAX_PAYLOAD_CHARS = 4000;
export const MAX_NAME_LENGTH = 80;
export const MAX_LABEL_LENGTH = 40;
export const MAX_STAGES = 20;

// Inclusive [min, max] for each number a link can carry. The decoder and shareProblems both read these.
export const SHARE_LIMITS = {
  ratio: [1, 30],
  dose: [1, 200],
  yield: [1, 3000],
  temp: [0, 100],
  time: [0, 86_400],
  stageTime: [0, 86_400],
  stageWeight: [0, 3000],
} as const satisfies Record<string, readonly [number, number]>;

type LimitKey = keyof typeof SHARE_LIMITS;

export type ShareProblemField =
  | 'name' | 'method' | 'ratio' | 'dose' | 'yield' | 'temp' | 'time'
  | 'stages' | 'stageLabel' | 'stageTime' | 'stageWeight' | 'payload';

// `stage` is the 0-based index of the stage, for stage fields only.
export interface ShareProblem {
  field: ShareProblemField;
  stage?: number;
}

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

function num(v: unknown, key: LimitKey): number | null {
  const [min, max] = SHARE_LIMITS[key];
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null;
}

function isKnownMethod(v: unknown): v is string {
  return typeof v === 'string' && METHODS.some(m => m.id === v);
}

// Lists every reason the decoder would reject or change this recipe. Empty list: the link round-trips.
export function shareProblems(recipe: SharedRecipe): readonly ShareProblem[] {
  const problems: ShareProblem[] = [];
  const name = recipe.name.trim();
  if (!name || name.length > MAX_NAME_LENGTH) problems.push({ field: 'name' });
  if (!isKnownMethod(recipe.method)) problems.push({ field: 'method' });
  const fields = ['ratio', 'dose', 'yield', 'temp', 'time'] as const;
  for (const field of fields) {
    if (num(recipe[field], field) === null) problems.push({ field });
  }
  if (recipe.stages.length > MAX_STAGES) problems.push({ field: 'stages' });
  recipe.stages.forEach((st, stage) => {
    if (st.label.trim().length > MAX_LABEL_LENGTH) problems.push({ field: 'stageLabel', stage });
    if (num(st.timeS, 'stageTime') === null) problems.push({ field: 'stageTime', stage });
    if (num(st.weightG, 'stageWeight') === null) problems.push({ field: 'stageWeight', stage });
  });
  // The size check only matters once every field fits.
  if (problems.length === 0 && encodeRecipe(recipe).length > MAX_PAYLOAD_CHARS) problems.push({ field: 'payload' });
  return problems;
}

// Treat every link as untrusted input: check each field and its range.
function parseRecipe(v: unknown): SharedRecipe | null {
  if (!isRecord(v) || v.v !== SHARE_VERSION || !isRecord(v.r)) return null;
  const r = v.r;
  const name = typeof r.name === 'string' ? r.name.trim().slice(0, MAX_NAME_LENGTH) : '';
  const method = isKnownMethod(r.method) ? r.method : null;
  const ratio = num(r.ratio, 'ratio');
  const dose = num(r.dose, 'dose');
  const yieldG = num(r.yield, 'yield');
  const temp = num(r.temp, 'temp');
  const time = num(r.time, 'time');
  if (!name || !method || ratio === null || dose === null || yieldG === null || temp === null || time === null) return null;
  if (!Array.isArray(r.stages) || r.stages.length > MAX_STAGES) return null;
  const stages: PourStage[] = [];
  for (const [i, s] of r.stages.entries()) {
    if (!isRecord(s) || typeof s.label !== 'string') return null;
    const timeS = num(s.timeS, 'stageTime');
    const weightG = num(s.weightG, 'stageWeight');
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
