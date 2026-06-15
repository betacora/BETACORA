/**
 * Generates BeTacora PWA icons (teal #2D7B7B, white B + coral T).
 * Run: node scripts/generate-pwa-icons.mjs
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const TEAL = [0x2d, 0x7b, 0x7b];
const WHITE = [0xff, 0xff, 0xff];
const CORAL = [0xe8, 0x63, 0x4a];

const B_GLYPH = [
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 0],
];

const T_GLYPH = [
  [1, 1, 1, 1, 1],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
  [0, 0, 1, 0, 0],
];

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
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function setPixel(pixels, size, x, y, rgb) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const o = (y * size + x) * 3;
  pixels[o] = rgb[0];
  pixels[o + 1] = rgb[1];
  pixels[o + 2] = rgb[2];
}

function fillRect(pixels, size, x0, y0, w, h, rgb) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      setPixel(pixels, size, x, y, rgb);
    }
  }
}

function drawGlyph(pixels, size, glyph, gx, gy, scale, rgb) {
  for (let row = 0; row < glyph.length; row++) {
    for (let col = 0; col < glyph[row].length; col++) {
      if (glyph[row][col]) {
        fillRect(pixels, size, gx + col * scale, gy + row * scale, scale, scale, rgb);
      }
    }
  }
}

function createBrandIcon(size) {
  const pixels = Buffer.alloc(size * size * 3);
  fillRect(pixels, size, 0, 0, size, size, TEAL);

  const scale = Math.max(3, Math.round(size * 0.045));
  const gap = Math.round(scale * 0.8);
  const glyphW = 5 * scale;
  const glyphH = 7 * scale;
  const totalW = glyphW * 2 + gap;
  const startX = Math.round((size - totalW) / 2);
  const startY = Math.round((size - glyphH) / 2);

  drawGlyph(pixels, size, B_GLYPH, startX, startY, scale, WHITE);
  drawGlyph(pixels, size, T_GLYPH, startX + glyphW + gap, startY, scale, CORAL);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rowBytes = 1 + size * 3;
  const raw = Buffer.alloc(rowBytes * size);
  for (let y = 0; y < size; y++) {
    raw[y * rowBytes] = 0;
    pixels.copy(raw, y * rowBytes + 1, y * size * 3, (y + 1) * size * 3);
  }
  const compressed = zlib.deflateSync(raw);

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", compressed),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [192, 512]) {
  const png = createBrandIcon(size);
  const out = join(publicDir, `icon-${size}.png`);
  writeFileSync(out, png);
  console.log(`Wrote ${out} (${size}x${size}, ${png.length} bytes)`);
}
