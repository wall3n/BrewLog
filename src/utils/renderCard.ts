import { wrapLines, type CardModel } from './shareCard';

export const CARD_WIDTH = 1080;
export const CARD_HEIGHT = 1350;
const PAD = 88;
const INNER = CARD_WIDTH - PAD * 2;
const COLS = 3;
const STAR_LINE = /^[★☆]{5}$/;
const QUOTE_OPEN = '“';

interface CardTheme {
  bg: string; primary: string; secondary: string; accent: string; border: string;
  serif: string; mono: string;
}

// Reads the live design tokens, so the image follows the light or dark theme.
function readCardTheme(): CardTheme {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string): string => css.getPropertyValue(name).trim();
  return {
    bg: v('--bg-base'), primary: v('--text-primary'), secondary: v('--text-secondary'),
    accent: v('--accent'), border: v('--border'),
    serif: v('--serif'), mono: v('--mono'),
  };
}

function setType(ctx: CanvasRenderingContext2D, font: string, color: string, tracking = 0): void {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.letterSpacing = `${tracking}px`;
}

function measure(ctx: CanvasRenderingContext2D): (s: string) => number {
  return (s: string): number => ctx.measureText(s).width;
}

function rule(ctx: CanvasRenderingContext2D, th: CardTheme, y: number): void {
  ctx.fillStyle = th.border;
  ctx.fillRect(PAD, y, INNER, 2);
}

// A five-point star drawn as a path. The rating is data, so it gets a real shape, not a font glyph.
function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, filled: boolean, th: CardTheme): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = th.accent;
    ctx.fill();
  } else {
    ctx.strokeStyle = th.border;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

// The title gets the largest size that fits in two lines, then a smaller size in three lines.
function titleLines(ctx: CanvasRenderingContext2D, th: CardTheme, title: string): { lines: string[]; size: number } {
  for (const size of [112, 96]) {
    setType(ctx, `${size}px ${th.serif}`, th.primary, -1);
    const lines = wrapLines(title, INNER, measure(ctx), 3);
    if (lines.length <= 2) return { lines, size };
  }
  setType(ctx, `80px ${th.serif}`, th.primary, -1);
  return { lines: wrapLines(title, INNER, measure(ctx), 3), size: 80 };
}

// A stat value shrinks until it fits its column, then gets an ellipsis.
function fitStatValue(ctx: CanvasRenderingContext2D, th: CardTheme, value: string, width: number): string {
  for (let size = 64; size >= 40; size -= 4) {
    setType(ctx, `500 ${size}px ${th.mono}`, th.primary, -1);
    if (ctx.measureText(value).width <= width) return value;
  }
  return wrapLines(value, width, measure(ctx), 1)[0] ?? '';
}

function drawCard(ctx: CanvasRenderingContext2D, model: CardModel, th: CardTheme): void {
  ctx.fillStyle = th.bg;
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.textBaseline = 'alphabetic';

  // Header: the app mark on the left, the brewing method on the right.
  const headY = PAD + 32;
  setType(ctx, `44px ${th.serif}`, th.accent);
  ctx.fillText('BrewLog', PAD, headY);
  setType(ctx, `500 24px ${th.mono}`, th.secondary, 3);
  ctx.textAlign = 'right';
  ctx.fillText(model.eyebrow.toUpperCase(), CARD_WIDTH - PAD, headY, INNER / 2);
  ctx.textAlign = 'left';

  // Title block.
  let y = headY + 72;
  const title = titleLines(ctx, th, model.title);
  for (const line of title.lines) {
    y += Math.round(title.size * 1.02);
    ctx.fillText(line, PAD, y);
  }
  if (model.subtitle) {
    y += 60;
    setType(ctx, `32px ${th.mono}`, th.secondary);
    ctx.fillText(wrapLines(model.subtitle, INNER, measure(ctx), 1)[0] ?? '', PAD, y);
  }

  // Stats grid: value above label, as on the detail screens.
  y += 64;
  rule(ctx, th, y);
  const colW = INNER / COLS;
  const rows = Math.ceil(model.stats.length / COLS);
  model.stats.forEach((stat, i) => {
    const x = PAD + (i % COLS) * colW;
    const rowY = y + 104 + Math.floor(i / COLS) * 164;
    ctx.fillText(fitStatValue(ctx, th, stat.value, colW - 24), x, rowY);
    setType(ctx, `500 22px ${th.mono}`, th.secondary, 2.5);
    ctx.fillText(wrapLines(stat.label.toUpperCase(), colW - 24, measure(ctx), 1)[0] ?? '', x, rowY + 46);
  });
  if (rows > 0) {
    y += 104 + (rows - 1) * 164 + 46 + 56;
    rule(ctx, th, y);
  }

  // Free lines: stars, flavours, a note, or pour stages. They stop above the footer.
  const bottom = model.footer ? CARD_HEIGHT - PAD - 96 : CARD_HEIGHT - PAD;
  y += 24;
  for (const text of model.lines) {
    if (STAR_LINE.test(text)) {
      if (y + 88 > bottom) break;
      const r = 22;
      [...text].forEach((ch, i) => drawStar(ctx, PAD + r + i * 60, y + 32 + r, r, ch === '★', th));
      y += 88;
      continue;
    }
    const quote = text.startsWith(QUOTE_OPEN);
    const lineH = quote ? 58 : 48;
    if (quote) setType(ctx, `46px ${th.serif}`, th.primary);
    else setType(ctx, `32px ${th.mono}`, th.secondary);
    y += quote ? 20 : 0;
    for (const line of wrapLines(text, INNER, measure(ctx), quote ? 3 : 2)) {
      if (y + lineH > bottom) break;
      y += lineH;
      ctx.fillText(line, PAD, y);
    }
    y += 12;
  }

  // Footer: the date, under a rule.
  if (model.footer) {
    rule(ctx, th, CARD_HEIGHT - PAD - 56);
    setType(ctx, `26px ${th.mono}`, th.secondary, 1);
    ctx.fillText(model.footer, PAD, CARD_HEIGHT - PAD);
  }
  ctx.letterSpacing = '0px';
}

export async function renderCardPng(model: CardModel): Promise<Blob> {
  const theme = readCardTheme();
  // The fonts are self-hosted (fontsource), so this works offline.
  await Promise.all([
    document.fonts.load(`112px ${theme.serif}`),
    document.fonts.load(`32px ${theme.mono}`),
    document.fonts.load(`500 64px ${theme.mono}`),
  ]);
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
