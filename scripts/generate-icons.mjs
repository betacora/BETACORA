/**
 * Generates BeTacora PWA icons: teal bg, white B, coral T.
 * Pure Node — no external deps. Writes PNG via minimal encoder.
 */
import { writeFileSync } from "fs";
import { deflateSync } from "zlib";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "../public");

const TEAL = [14, 107, 122]; // #0E6B7A
const WHITE = [255, 255, 255];
const CORAL = [255, 111, 97]; // #FF6F61

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  const crcInput = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function setPixel(data, size, x, y, [r, g, b]) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
  data[i + 3] = 255;
}

function fillCircle(data, size, cx, cy, radius, color) {
  const r2 = radius * radius;
  for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y++) {
    for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) setPixel(data, size, x, y, color);
    }
  }
}

function fillRect(data, size, x0, y0, x1, y1, color) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      setPixel(data, size, x, y, color);
    }
  }
}

function drawLetterB(data, size) {
  const s = size / 512;
  const x0 = Math.round(108 * s);
  const y0 = Math.round(118 * s);
  const w = Math.round(52 * s);
  const h = Math.round(276 * s);
  const r = Math.round(26 * s);

  // Vertical stem
  fillRect(data, size, x0, y0, x0 + w, y0 + h, WHITE);

  // Top bowl
  const topCy = y0 + Math.round(78 * s);
  const botCy = y0 + Math.round(198 * s);
  const bowlRx = Math.round(95 * s);
  const bowlRy = Math.round(72 * s);

  for (let y = y0; y <= y0 + h; y++) {
    for (let x = x0 + w - Math.round(10 * s); x <= x0 + w + bowlRx; x++) {
      const cy = y < topCy + bowlRy ? topCy : botCy;
      const ry = y < topCy + bowlRy ? bowlRy : bowlRy;
      const dx = (x - (x0 + w + Math.round(35 * s))) / bowlRx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1 && x > x0 + w - Math.round(5 * s)) {
        setPixel(data, size, x, y, WHITE);
      }
    }
  }

  // Simplify B with rounded rects for bowls
  fillCircle(data, size, x0 + w + Math.round(55 * s), topCy, Math.round(68 * s), WHITE);
  fillCircle(data, size, x0 + w + Math.round(55 * s), botCy, Math.round(68 * s), WHITE);
  fillRect(data, size, x0, y0, x0 + w + Math.round(20 * s), y0 + h, WHITE);
  // Cut inner holes
  fillCircle(
    data,
    size,
    x0 + w + Math.round(52 * s),
    topCy,
    Math.round(38 * s),
    TEAL
  );
  fillCircle(
    data,
    size,
    x0 + w + Math.round(52 * s),
    botCy,
    Math.round(38 * s),
    TEAL
  );
  // Restore stem after bowl overlap
  fillRect(data, size, x0, y0, x0 + w, y0 + h, WHITE);
}

function drawLetterT(data, size) {
  const s = size / 512;
  const barY0 = Math.round(118 * s);
  const barH = Math.round(52 * s);
  const stemW = Math.round(52 * s);
  const cx = Math.round(358 * s);

  // Top bar
  fillRect(data, size, Math.round(268 * s), barY0, Math.round(448 * s), barY0 + barH, CORAL);
  // Stem
  fillRect(
    data,
    size,
    cx - Math.floor(stemW / 2),
    barY0,
    cx + Math.ceil(stemW / 2) - 1,
    Math.round(394 * s),
    CORAL
  );
  // Rounded cap on bar
  fillCircle(data, size, Math.round(268 * s), barY0 + barH / 2, barH / 2, CORAL);
  fillCircle(data, size, Math.round(448 * s), barY0 + barH / 2, barH / 2, CORAL);
}

function renderIcon(size) {
  const data = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const o = i * 4;
    data[o] = TEAL[0];
    data[o + 1] = TEAL[1];
    data[o + 2] = TEAL[2];
    data[o + 3] = 255;
  }
  drawLetterB(data, size);
  drawLetterT(data, size);
  return data;
}

function encodePng(size, rawRgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter none
    rawRgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }

  const compressed = deflateSync(raw);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const png = encodePng(size, renderIcon(size));
  const path = join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(path, png);
  console.log(`Wrote ${path} (${png.length} bytes)`);
}
