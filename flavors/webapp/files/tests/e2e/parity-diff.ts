/**
 * The parity leg's pixel diff: decode two PNG captures to
 * RGBA and count the pixels that differ by more than the
 * per-channel threshold. Self-contained on node:zlib — the
 * leg carries no imaging dependency, so its numbers mean
 * the same thing in every project that seeds it.
 *
 * Semantics the spec's bars rely on:
 * - The diff canvas is the LARGER of the two images in each
 *   dimension; rows or columns one image never renders
 *   count as mismatched — height drift is priced in, never
 *   excused by comparing only the shared region.
 * - Masked rectangles (fractional coordinates, from the
 *   manifest) are excluded from both the mismatch count and
 *   the canvas total: a mask shrinks the priced surface, it
 *   does not forgive pixels inside it.
 * - 8-bit PNGs in the colour types a browser capture
 *   produces (RGBA, RGB, greyscale, palette). Anything else
 *   throws — an undecodable capture is a leg failure, not a
 *   zero.
 */
import { inflateSync } from "node:zlib";

export interface RgbaImage {
  width: number;
  height: number;
  data: Uint8Array;
}

export interface MaskRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiffResult {
  width: number;
  height: number;
  total: number;
  mismatched: number;
  ratio: number;
}

const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };

export function decodePng(buffer: Buffer): RgbaImage {
  if (buffer.length < 8 || buffer.readUInt32BE(0) !== 0x89504e47) {
    throw new Error("parity-diff: not a PNG");
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let palette: Buffer | null = null;
  const idat: Buffer[] = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      bitDepth = body[8] ?? 0;
      colorType = body[9] ?? 0;
    } else if (type === "PLTE") {
      palette = body;
    } else if (type === "IDAT") {
      idat.push(body);
    } else if (type === "IEND") {
      break;
    }
    offset += 12 + length;
  }
  const channels = CHANNELS[colorType];
  if (!channels || bitDepth !== 8 || width === 0 || height === 0) {
    throw new Error(
      `parity-diff: unsupported PNG (bitDepth ${bitDepth}, colorType ${colorType})`,
    );
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const unfiltered = new Uint8Array(height * stride);
  let pos = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[pos] ?? 0;
    pos += 1;
    const row = unfiltered.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? unfiltered.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[pos] ?? 0;
      pos += 1;
      const left = x >= channels ? (row[x - channels] ?? 0) : 0;
      const up = prev ? (prev[x] ?? 0) : 0;
      const upLeft = prev && x >= channels ? (prev[x - channels] ?? 0) : 0;
      let out = value;
      if (filter === 1) out = (value + left) & 0xff;
      else if (filter === 2) out = (value + up) & 0xff;
      else if (filter === 3) out = (value + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        out = (value + predictor) & 0xff;
      }
      row[x] = out;
    }
  }
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const src = i * channels;
    const dst = i * 4;
    if (colorType === 6) {
      data.set(unfiltered.subarray(src, src + 4), dst);
    } else if (colorType === 2) {
      data.set(unfiltered.subarray(src, src + 3), dst);
      data[dst + 3] = 255;
    } else if (colorType === 0) {
      const gray = unfiltered[src] ?? 0;
      data[dst] = gray;
      data[dst + 1] = gray;
      data[dst + 2] = gray;
      data[dst + 3] = 255;
    } else if (colorType === 3) {
      const index = (unfiltered[src] ?? 0) * 3;
      data[dst] = palette?.[index] ?? 0;
      data[dst + 1] = palette?.[index + 1] ?? 0;
      data[dst + 2] = palette?.[index + 2] ?? 0;
      data[dst + 3] = 255;
    } else {
      // Colour type 4: greyscale + alpha.
      const gray = unfiltered[src] ?? 0;
      data[dst] = gray;
      data[dst + 1] = gray;
      data[dst + 2] = gray;
      data[dst + 3] = unfiltered[src + 1] ?? 255;
    }
  }
  return { width, height, data };
}

function masked(x: number, y: number, width: number, height: number, masks: MaskRect[]): boolean {
  return masks.some(
    (mask) =>
      x >= Math.floor(mask.x * width) &&
      x < Math.floor((mask.x + mask.width) * width) &&
      y >= Math.floor(mask.y * height) &&
      y < Math.floor((mask.y + mask.height) * height),
  );
}

export function diffPng(
  a: RgbaImage,
  b: RgbaImage,
  perPixelThreshold: number,
  masks: MaskRect[] = [],
): DiffResult {
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  let total = 0;
  let mismatched = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (masked(x, y, width, height, masks)) continue;
      total += 1;
      const inA = x < a.width && y < a.height;
      const inB = x < b.width && y < b.height;
      if (!inA || !inB) {
        mismatched += 1;
        continue;
      }
      const offsetA = (y * a.width + x) * 4;
      const offsetB = (y * b.width + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        const delta = Math.abs(
          (a.data[offsetA + channel] ?? 0) - (b.data[offsetB + channel] ?? 0),
        );
        if (delta > perPixelThreshold) {
          mismatched += 1;
          break;
        }
      }
    }
  }
  return { width, height, total, mismatched, ratio: total === 0 ? 0 : mismatched / total };
}
