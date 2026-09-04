import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const output = resolve('public');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function insideRoundedRect(x, y, size, radius) {
  const left = Math.max(radius - x, 0);
  const right = Math.max(x - (size - radius - 1), 0);
  const top = Math.max(radius - y, 0);
  const bottom = Math.max(y - (size - radius - 1), 0);
  const dx = Math.max(left, right);
  const dy = Math.max(top, bottom);
  return dx * dx + dy * dy <= radius * radius;
}

function insideTriangle(px, py, ax, ay, bx, by, cx, cy) {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy);
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
}

function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function createIcon(size, maskable = false) {
  const rgba = Buffer.alloc(size * size * 4);
  const colors = {
    green: [46, 107, 79, 255],
    paper: [247, 250, 247, 255],
    fold: [220, 234, 222, 255],
  };
  const scale = size / 64;
  const radius = 14 * scale;
  const set = (offset, color) => color.forEach((value, index) => { rgba[offset + index] = value; });

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4;
      set(offset, maskable || insideRoundedRect(x, y, size, radius) ? colors.green : [0, 0, 0, 0]);

      const ux = x / scale;
      const uy = y / scale;
      if (ux >= 18 && ux <= 48 && uy >= 11 && uy <= 53 && !(ux >= 37 && uy <= 23 && uy < ux - 14)) set(offset, colors.paper);
      if (insideTriangle(ux, uy, 37, 11, 37, 23, 48, 23)) set(offset, colors.fold);

      const checkDistance = Math.min(
        distanceToSegment(ux, uy, 25, 38, 30, 43),
        distanceToSegment(ux, uy, 30, 43, 41, 30),
      );
      if (checkDistance <= 2.5) set(offset, colors.green);
    }
  }

  const rowSize = size * 4 + 1;
  const raw = Buffer.alloc(rowSize * size);
  for (let y = 0; y < size; y++) rgba.copy(raw, y * rowSize + 1, y * size * 4, (y + 1) * size * 4);
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const [name, size, maskable] of [['favicon-32.png', 32, false], ['apple-touch-icon.png', 180, false], ['icon-192.png', 192, false], ['icon-512.png', 512, false], ['icon-maskable-512.png', 512, true]]) {
  writeFileSync(resolve(output, name), createIcon(size, maskable));
}
