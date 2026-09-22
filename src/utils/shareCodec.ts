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
