import { wrapLines, type CardModel } from './shareCard';

// The card is a QC lab sheet printed at 1080 × 1350: graphite form on lab paper,
// logged values in ballpoint ink, readouts on the measurement grid.
export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
const PAD = 72;
const INNER = CARD_WIDTH - PAD * 2;
const COLS = 3;
const CELL_H = 176;
const CELL_PAD = 26;
const GRID = 30;
const RULE = 3;
const HAIR = 2;
const STAR_LINE = /^[★☆]{5}$/;
const QUOTE_OPEN = '“';
const QUOTE_CLOSE = '”';
const UNIT_SUFFIX = /^(.+?) ?(g|°C|%)$/;
const STAGE_LINE = /^(\d+) · (.*) @ (\S+) → (.+)$/;
const STAGE_ROW = 84;
const TAG_H = 60;
const TAG_GAP = 14;
const NOTE_LINE = 54;
const FOOTER_H = 72;

interface CardTheme {
  paper: string; cell: string; hairline: string; rule: string; grid: string;
  graphite: string; secondary: string; tertiary: string;
  ink: string; inkFaded: string;
  font: string;
}

// Reads the live design tokens, so the image follows the light or dark theme.
function readCardTheme(): CardTheme {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string): string => css.getPropertyValue(name).trim();
  return {
    paper: v('--bg-base'), cell: v('--bg-surface'), hairline: v('--border'), rule: v('--rule-strong'),
    grid: v('--grid-line'),
    graphite: v('--text-primary'), secondary: v('--text-secondary'), tertiary: v('--text-tertiary'),
    ink: v('--accent'), inkFaded: v('--accent-dim'),
    font: v('--font-sans'),
  };
}

type Stretch = 'condensed' | 'semi-condensed' | 'normal';

interface TypeSpec {
  size: number;
  weight?: number;
  stretch?: Stretch;
  color: string;
  tracking?: number;
}

// One family carries the sheet; the width axis does the hierarchy (condensed caps for printed labels).
function setType(ctx: CanvasRenderingContext2D, th: CardTheme, spec: TypeSpec): void {
  ctx.font = `${spec.weight ?? 400} ${spec.size}px ${th.font}`;
  // Setting font resets the stretch, so apply it after. Browsers without it fall back to normal width.
  if ('fontStretch' in ctx) ctx.fontStretch = spec.stretch ?? 'normal';
  ctx.fillStyle = spec.color;
  ctx.letterSpacing = `${spec.tracking ?? 0}px`;
}

function measure(ctx: CanvasRenderingContext2D): (s: string) => number {
  return (s: string): number => ctx.measureText(s).width;
}

function fitLine(ctx: CanvasRenderingContext2D, text: string, width: number): string {
  return wrapLines(text, width, measure(ctx), 1)[0] ?? '';
}

function hline(ctx: CanvasRenderingContext2D, color: string, y: number, weight: number, x = PAD, w = INNER): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, weight);
}

const label = (th: CardTheme, size = 26): TypeSpec => ({ size, weight: 600, stretch: 'condensed', color: th.secondary, tracking: size * 0.07 });

// Cupping-form boxes, not stars: filled ink when scored, a graphite outline when not.
function drawTastingCells(ctx: CanvasRenderingContext2D, th: CardTheme, line: string, x: number, top: number, size: number): void {
  const gap = Math.round(size * 0.35);
  [...line].forEach((ch, i) => {
    const cx = x + i * (size + gap);
    if (ch === '★') {
      ctx.fillStyle = th.ink;
      ctx.fillRect(cx, top, size, size);
    } else {
      ctx.strokeStyle = th.tertiary;
      ctx.lineWidth = 3;
      ctx.strokeRect(cx + 1.5, top + 1.5, size - 3, size - 3);
    }
  });
}

function tastingWidth(size: number): number {
  return 5 * size + 4 * Math.round(size * 0.35);
}

// The title gets the largest condensed size that fits in two lines, then a smaller size in three lines.
function titleLines(ctx: CanvasRenderingContext2D, th: CardTheme, title: string): { lines: string[]; size: number } {
  const spec = (size: number): TypeSpec => ({ size, weight: 700, stretch: 'condensed', color: th.graphite, tracking: -size * 0.015 });
  for (const size of [120, 100]) {
    setType(ctx, th, spec(size));
    const lines = wrapLines(title, INNER, measure(ctx), 3);
    if (lines.length <= 2) return { lines, size };
  }
  setType(ctx, th, spec(84));
  return { lines: wrapLines(title, INNER, measure(ctx), 3), size: 84 };
}

// A readout value in ink shrinks until it fits its cell, then gets an ellipsis.
// A trailing unit ("20 g", "92 °C") prints smaller in graphite, so the number leads.
function drawReadoutValue(ctx: CanvasRenderingContext2D, th: CardTheme, value: string, x: number, y: number, width: number): void {
  const unitMatch = UNIT_SUFFIX.exec(value);
  const num = unitMatch ? unitMatch[1] : value;
  const unit = unitMatch ? unitMatch[2] : '';
  const valueSpec = (size: number): TypeSpec => ({ size, weight: 500, stretch: 'semi-condensed', color: th.ink, tracking: -size * 0.02 });
  const unitSpec = (size: number): TypeSpec => ({ size: Math.round(size * 0.46), weight: 500, color: th.secondary });
  for (let size = 84; size >= 48; size -= 4) {
    setType(ctx, th, unitSpec(size));
    const unitW = unit ? ctx.measureText(unit).width + size * 0.1 : 0;
    setType(ctx, th, valueSpec(size));
    const numW = ctx.measureText(num).width;
    const fits = numW + unitW <= width;
    if (!fits && size > 48) continue;
    const text = fits ? num : fitLine(ctx, num, width - unitW);
    ctx.fillText(text, x, y);
    if (unit) {
      const after = ctx.measureText(text).width;
      setType(ctx, th, unitSpec(size));
      ctx.fillText(unit, x + after + size * 0.1, y);
    }
    return;
  }
}

function drawReadoutGrid(ctx: CanvasRenderingContext2D, th: CardTheme, model: CardModel, top: number): number {
  const rows = Math.ceil(model.stats.length / COLS);
  if (rows === 0) return top;
  const height = rows * CELL_H;
  const colW = INNER / COLS;

  // Fill cells on the measurement grid: the grid sits only behind data.
  ctx.fillStyle = th.cell;
  ctx.fillRect(PAD, top, INNER, height);
  ctx.save();
  ctx.beginPath();
  ctx.rect(PAD, top, INNER, height);
  ctx.clip();
  ctx.fillStyle = th.grid;
  for (let gx = PAD + GRID; gx < PAD + INNER; gx += GRID) ctx.fillRect(gx, top, 1.5, height);
  for (let gy = top + GRID; gy < top + height; gy += GRID) ctx.fillRect(PAD, gy, INNER, 1.5);
  ctx.restore();

  // Hairlines between cells, a heavy section rule on top.
  ctx.fillStyle = th.hairline;
  for (let c = 1; c < COLS; c++) ctx.fillRect(PAD + c * colW - 1, top, HAIR, height);
  for (let r = 1; r <= rows; r++) hline(ctx, th.hairline, top + r * CELL_H - HAIR, HAIR);
  hline(ctx, th.rule, top, RULE);

  model.stats.forEach((stat, i) => {
    const x = PAD + (i % COLS) * colW + CELL_PAD;
    const cellTop = top + Math.floor(i / COLS) * CELL_H;
    const w = colW - CELL_PAD * 2;
    setType(ctx, th, label(th));
    ctx.fillText(fitLine(ctx, stat.label.toUpperCase(), w), x, cellTop + 54);
    drawReadoutValue(ctx, th, stat.value, x, cellTop + 142, w);
  });
  return top + height;
}

type Block =
  | { kind: 'tags'; tags: string[][]; height: number }
  | { kind: 'note'; lines: string[]; height: number }
  | { kind: 'stage'; n: string; label: string; at: string; weight: string; height: number }
  | { kind: 'cells'; line: string; height: number };

const tagSpec = (th: CardTheme): TypeSpec => ({ size: 30, weight: 500, color: th.ink });
const noteSpec = (th: CardTheme): TypeSpec => ({ size: 38, color: th.ink });

// Flavour tags flow into rows of outlined ink tags, like the logged tags on the sheet.
function tagRows(ctx: CanvasRenderingContext2D, th: CardTheme, text: string, maxRows: number): string[][] {
  setType(ctx, th, tagSpec(th));
  const rows: string[][] = [[]];
  let x = 0;
  for (const raw of text.split(' · ')) {
    const tag = fitLine(ctx, raw, INNER - 44);
    const w = ctx.measureText(tag).width + 44;
    if (x > 0 && x + w > INNER) {
      if (rows.length === maxRows) break;
      rows.push([]);
      x = 0;
    }
    rows[rows.length - 1].push(tag);
    x += w + TAG_GAP;
  }
  return rows;
}

function layoutBlocks(ctx: CanvasRenderingContext2D, th: CardTheme, lines: readonly string[]): Block[] {
  return lines.map((text): Block => {
    if (STAR_LINE.test(text)) return { kind: 'cells', line: text, height: 96 };
    const stage = STAGE_LINE.exec(text);
    if (stage) return { kind: 'stage', n: stage[1], label: stage[2], at: stage[3], weight: stage[4], height: STAGE_ROW };
    if (text.startsWith(QUOTE_OPEN)) {
      setType(ctx, th, noteSpec(th));
      const body = text.slice(1, text.endsWith(QUOTE_CLOSE) ? -1 : undefined);
      const wrapped = wrapLines(body, INNER, measure(ctx), 3);
      return { kind: 'note', lines: wrapped, height: 28 + wrapped.length * NOTE_LINE };
    }
    // Any other line is the flavour list.
    const tags = tagRows(ctx, th, text, 2);
    return { kind: 'tags', tags, height: 28 + tags.length * TAG_H + (tags.length - 1) * TAG_GAP };
  });
}

function drawBlock(ctx: CanvasRenderingContext2D, th: CardTheme, block: Block, y: number): void {
  switch (block.kind) {
    case 'cells':
      drawTastingCells(ctx, th, block.line, PAD, y + 32, 40);
      return;
    case 'stage': {
      const base = y + STAGE_ROW / 2 + 12;
      setType(ctx, th, { size: 32, weight: 700, stretch: 'condensed', color: th.tertiary });
      ctx.textAlign = 'center';
      ctx.fillText(block.n, PAD + 22, base);
      ctx.textAlign = 'right';
      setType(ctx, th, { size: 34, weight: 500, color: th.ink });
      const right = `${block.at} → ${block.weight}`;
      ctx.fillText(right, PAD + INNER, base);
      const rightW = ctx.measureText(right).width;
      ctx.textAlign = 'left';
      setType(ctx, th, { size: 34, color: th.graphite });
      ctx.fillText(fitLine(ctx, block.label, INNER - 76 - rightW - 24), PAD + 76, base);
      hline(ctx, th.hairline, y + STAGE_ROW - HAIR, HAIR);
      return;
    }
    case 'note': {
      setType(ctx, th, noteSpec(th));
      block.lines.forEach((line, i) => ctx.fillText(line, PAD, y + 28 + (i + 1) * NOTE_LINE - 14));
      return;
    }
    case 'tags': {
      block.tags.forEach((row, r) => {
        let x = PAD;
        const top = y + 28 + r * (TAG_H + TAG_GAP);
        for (const tag of row) {
          setType(ctx, th, tagSpec(th));
          const w = ctx.measureText(tag).width + 44;
          ctx.strokeStyle = th.inkFaded;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x + 1, top + 1, w - 2, TAG_H - 2, 8);
          ctx.stroke();
          ctx.fillText(tag, x + 22, top + TAG_H / 2 + 11);
          x += w + TAG_GAP;
        }
      });
      return;
    }
  }
}

function drawCard(ctx: CanvasRenderingContext2D, model: CardModel, th: CardTheme): void {
  ctx.fillStyle = th.paper;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // Sheet head: the printed wordmark, the method as a printed label, then the section rule.
  const headY = PAD + 40;
  setType(ctx, th, { size: 44, weight: 700, stretch: 'condensed', color: th.graphite, tracking: -0.6 });
  ctx.fillText('BrewLog', PAD, headY);
  const markW = ctx.measureText('BrewLog').width;
  setType(ctx, th, label(th, 28));
  ctx.textAlign = 'right';
  ctx.fillText(fitLine(ctx, model.eyebrow.toUpperCase(), INNER - markW - 48), CARD_WIDTH - PAD, headY);
  ctx.textAlign = 'left';
  hline(ctx, th.rule, headY + 28, RULE);

  // Title and subtitle.
  let y = headY + 28 + 40;
  const title = titleLines(ctx, th, model.title);
  for (const line of title.lines) {
    y += Math.round(title.size * 0.98);
    ctx.fillText(line, PAD, y);
  }
  if (model.subtitle) {
    y += 64;
    setType(ctx, th, { size: 34, color: th.secondary });
    ctx.fillText(fitLine(ctx, model.subtitle, INNER), PAD, y);
  }

  // The sheet fills top-down like a printed form: readout grid, then tags, a note or pour stages.
  // Unused space stays blank paper above the foot of the sheet.
  const bottom = model.footer ? CARD_HEIGHT - PAD - FOOTER_H : CARD_HEIGHT - PAD;
  const stars = model.footer ? model.lines.find(l => STAR_LINE.test(l)) : undefined;
  const blocks = layoutBlocks(ctx, th, model.lines.filter(l => l !== stars));
  const stageTop = blocks.some(b => b.kind === 'stage') ? 16 : 0;

  y = drawReadoutGrid(ctx, th, model, y + 64) + stageTop;
  for (const block of blocks) {
    if (y + block.height > bottom) break;
    drawBlock(ctx, th, block, y);
    y += block.height;
  }

  // Foot of the sheet: a section rule, the logged date, and the cupping score cells.
  if (model.footer) {
    const ruleY = CARD_HEIGHT - PAD - FOOTER_H + 16;
    hline(ctx, th.rule, ruleY, RULE);
    const baseY = CARD_HEIGHT - PAD;
    const cellsW = stars ? tastingWidth(30) + 32 : 0;
    setType(ctx, th, { size: 30, weight: 500, color: th.secondary });
    ctx.fillText(fitLine(ctx, model.footer, INNER - cellsW), PAD, baseY);
    if (stars) drawTastingCells(ctx, th, stars, CARD_WIDTH - PAD - tastingWidth(30), baseY - 28, 30);
  }
  ctx.letterSpacing = '0px';
}

export async function renderCardPng(model: CardModel): Promise<Blob> {
  const theme = readCardTheme();
  // The font is self-hosted (fontsource), so this works offline.
  await Promise.all([400, 500, 600, 700].map(w => document.fonts.load(`${w} 64px ${theme.font}`)));
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
