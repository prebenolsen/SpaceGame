// Run with: node generate-icons.js
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function u32(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; }

function pngChunk(type, data) {
  const t = Buffer.from(type);
  const d = Buffer.isBuffer(data) ? data : Buffer.from(data);
  return Buffer.concat([u32(d.length), t, d, u32(crc32(Buffer.concat([t, d])))]);
}

function encodePNG(width, height, rgba) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', Buffer.concat([u32(width), u32(height), Buffer.from([8, 6, 0, 0, 0])])),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function renderIcon(size) {
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    buf[i * 4] = 10; buf[i * 4 + 1] = 10; buf[i * 4 + 2] = 46; buf[i * 4 + 3] = 255;
  }

  function setPixel(x, y, r, g, b) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
  }

  function fillCircle(cx, cy, r, R, G, B) {
    for (let y = cy - r; y <= cy + r; y++)
      for (let x = cx - r; x <= cx + r; x++)
        if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) setPixel(x, y, R, G, B);
  }

  function fillTriangle(x1, y1, x2, y2, x3, y3, R, G, B) {
    const pts = [[x1, y1], [x2, y2], [x3, y3]].sort((a, b) => a[1] - b[1]);
    const lerp = (y, p, q) => p[1] === q[1] ? p[0] : p[0] + (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]);
    for (let y = Math.ceil(pts[0][1]); y <= Math.floor(pts[2][1]); y++) {
      const xa = lerp(y, pts[0], pts[2]);
      const xb = y <= pts[1][1] ? lerp(y, pts[0], pts[1]) : lerp(y, pts[1], pts[2]);
      for (let x = Math.ceil(Math.min(xa, xb)); x <= Math.floor(Math.max(xa, xb)); x++)
        setPixel(x, y, R, G, B);
    }
  }

  [[0.2, 0.15], [0.8, 0.2], [0.1, 0.7], [0.85, 0.75], [0.5, 0.1], [0.3, 0.85], [0.7, 0.5]].forEach(([sx, sy]) => {
    fillCircle(Math.round(sx * size), Math.round(sy * size), Math.max(1, Math.round(size * 0.015)), 255, 255, 255);
  });

  const cx = size / 2, cy = size / 2;
  fillTriangle(cx, cy - size * 0.25, cx - size * 0.18, cy + size * 0.18, cx, cy + size * 0.08, 144, 202, 249);
  fillTriangle(cx, cy - size * 0.25, cx + size * 0.18, cy + size * 0.18, cx, cy + size * 0.08, 144, 202, 249);

  const crx = size * 0.055, cry = size * 0.09, ccy = cy - size * 0.04;
  for (let y = Math.floor(ccy - cry); y <= Math.ceil(ccy + cry); y++)
    for (let x = Math.floor(cx - crx); x <= Math.ceil(cx + crx); x++)
      if ((x - cx) * (x - cx) / (crx * crx) + (y - ccy) * (y - ccy) / (cry * cry) <= 1)
        setPixel(x, y, 227, 242, 253);

  return buf;
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

for (const size of [192, 512]) {
  const png = encodePNG(size, size, renderIcon(size));
  fs.writeFileSync(path.join(iconsDir, `icon-${size}.png`), png);
  console.log(`Created icons/icon-${size}.png (${png.length} bytes)`);
}
