/**
 * Generates BrewLog PWA icons as pure PNG (no external deps, only built-in zlib).
 * Draws a coffee cup silhouette on dark background using the app's accent color.
 */
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync } from 'fs';

// CRC32 for PNG chunk validation
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

// Returns [r,g,b] for a pixel at normalized coords (nx,ny) in [-0.5, 0.5]
function pixelColor(nx, ny) {
  // ── Coffee cup silhouette ──
  // Cup body (tapered trapezoid)
  const cupT = -0.17, cupB = 0.22;
  let inCup = false;
  if (ny >= cupT && ny <= cupB) {
    const t = (ny - cupT) / (cupB - cupT);
    const hw = 0.235 - t * 0.025; // slight taper top→bottom
    inCup = Math.abs(nx) <= hw;
  }

  // Rim (slightly wider strip at top of cup)
  const inRim = ny >= cupT - 0.025 && ny <= cupT + 0.01 && Math.abs(nx) <= 0.265;

  // Inner hollow (cup is hollow — remove inside)
  let inHollow = false;
  if (ny >= cupT + 0.04 && ny <= cupB - 0.03) {
    const t = (ny - (cupT + 0.04)) / (cupB - 0.03 - (cupT + 0.04));
    const hw = 0.20 - t * 0.02;
    inHollow = Math.abs(nx) <= hw;
  }

  // Handle (C-arc on right side)
  const hcx = 0.29, hcy = 0.04;
  const outerR = 0.115, innerR = 0.065;
  const hd = Math.hypot(nx - hcx, ny - hcy);
  const inHandle = hd >= innerR && hd <= outerR && nx >= hcx - 0.01;

  // Saucer (wide flat ellipse below cup)
  const inSaucer = ny >= cupB + 0.015 && ny <= cupB + 0.065 && Math.abs(nx) <= 0.31;
  const inSaucerStem = ny >= cupB + 0.015 && ny <= cupB + 0.065 && Math.abs(nx) <= 0.10;
  const _ = inSaucerStem; // always in saucer if it's in saucer stem

  // Steam (3 small dots above cup)
  const steamY = cupT - 0.13;
  const steamR = 0.023;
  const inSteam =
    Math.hypot(nx + 0.075, ny - (steamY + 0.01)) <= steamR ||
    Math.hypot(nx, ny - steamY) <= steamR ||
    Math.hypot(nx - 0.075, ny - (steamY + 0.01)) <= steamR;

  const accent = [0xc8, 0xa9, 0x6e]; // #c8a96e
  const steamColor = [0x7a, 0x64, 0x41]; // accent-dim
  const bg = [0x0f, 0x0e, 0x0d]; // #0f0e0d

  if ((inCup || inRim || inHandle || inSaucer) && !inHollow) return accent;
  if (inSteam) return steamColor;
  return bg;
}

function makePNG(size) {
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = [0]; // filter byte: None
    for (let x = 0; x < size; x++) {
      const nx = (x + 0.5 - size / 2) / size;
      const ny = (y + 0.5 - size / 2) / size;
      row.push(...pixelColor(nx, ny));
    }
    rows.push(Buffer.from(row));
  }

  const raw = Buffer.concat(rows);
  const compressed = deflateSync(raw, { level: 9 });

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
writeFileSync('public/icons/icon-192.png', makePNG(192));
writeFileSync('public/icons/icon-512.png', makePNG(512));
writeFileSync('public/icons/apple-touch-icon.png', makePNG(180));
console.log('Icons written: icon-192.png, icon-512.png, apple-touch-icon.png');
