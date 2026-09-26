/**
 * Tiny greedy label placer (visual only). Each label offers candidate centres in order of preference; the first
 * candidate whose box clears every obstacle and every already-placed label wins. If none is free, the candidate
 * with the least overlap is used (tests make sure that does not happen in the app's configurations).
 */

export interface Box {
  /** Centre. */
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface LabelRequest {
  readonly id: string;
  readonly w: number;
  readonly h: number;
  readonly candidates: ReadonlyArray<readonly [number, number]>;
}

const PAD = 2;

export function overlapArea(a: Box, b: Box): number {
  const ox = Math.min(a.x + a.w / 2, b.x + b.w / 2) - Math.max(a.x - a.w / 2, b.x - b.w / 2) + PAD;
  const oy = Math.min(a.y + a.h / 2, b.y + b.h / 2) - Math.max(a.y - a.h / 2, b.y - b.h / 2) + PAD;
  return ox > 0 && oy > 0 ? ox * oy : 0;
}

export function placeLabels(obstacles: readonly Box[], requests: readonly LabelRequest[]): Map<string, Box> {
  const placed = new Map<string, Box>();
  const taken: Box[] = [...obstacles];
  for (const req of requests) {
    let best: Box | null = null;
    let bestOverlap = Number.POSITIVE_INFINITY;
    for (const [x, y] of req.candidates) {
      const box = { x, y, w: req.w, h: req.h };
      const overlap = taken.reduce((sum, o) => sum + overlapArea(box, o), 0);
      if (overlap < bestOverlap) {
        best = box;
        bestOverlap = overlap;
        if (overlap === 0) break;
      }
    }
    if (best) {
      placed.set(req.id, best);
      taken.push(best);
    }
  }
  return placed;
}

/** Small square boxes along a segment, so labels also keep clear of arrow shafts. */
export function segmentObstacles(x1: number, y1: number, x2: number, y2: number, size = 7, step = 7): Box[] {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const n = Math.max(1, Math.ceil(len / step));
  return Array.from({ length: n + 1 }, (_, k) => ({
    x: x1 + ((x2 - x1) * k) / n,
    y: y1 + ((y2 - y1) * k) / n,
    w: size,
    h: size,
  }));
}

/**
 * Candidate centres around an anchor: the preferred direction first, then fanning out in 22.5° steps, at growing gaps
 * between the anchor and the nearest edge of the box.
 */
export function ring(ax: number, ay: number, prefAngle: number, bw: number, bh: number, gaps = [5, 10, 17, 26, 38, 52]): [number, number][] {
  const out: [number, number][] = [];
  for (const g of gaps)
    for (let k = 0; k < 16; k++) {
      const step = Math.ceil(k / 2) * (k % 2 ? 1 : -1); // 0, +1, −1, +2, −2, …
      const ang = prefAngle + (step * Math.PI) / 8;
      const c = Math.cos(ang);
      const sn = Math.sin(ang);
      const ext = (Math.abs(c) * bw) / 2 + (Math.abs(sn) * bh) / 2;
      out.push([ax + (g + ext) * c, ay + (g + ext) * sn]);
    }
  return out;
}
