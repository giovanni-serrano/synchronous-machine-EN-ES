/**
 * Pure geometry of the power-triangle plot (visual only; values come from powerTriangle()).
 * Complex plane: P to the right, jQ up (Q > 0 = lagging in the active mode's convention). Fixed scale so the triangle
 * does not jump while sliders move; it zooms out ×½ only when Q or P would leave the plot.
 */

import { placeLabels, segmentObstacles, type Box } from '../labelLayout';

export const TRI_W = 320;
export const TRI_H = 280;
export const ORIGIN = { x: 40, y: 140 } as const;
/** Pixels per unit of rated S at zoom 1. */
export const PX_PER_PU = 80;
const EDGE = 14;
/** Label height (one line, 12 px font). */
export const TRI_LABEL_H = 18;

export interface TriangleLabels {
  readonly p: string;
  readonly q: string;
  readonly s: string;
  readonly theta: string;
  readonly rated: string;
}

/** Width estimate for a 12 px label (tests and layout use the same rule). */
export const labelWidth = (text: string): number => 7 * [...text.replace(/_/g, '')].length + 8;

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface TriangleLayout {
  /** Pixels per unit of rated S (80, or 40 when zoomed out). */
  readonly scale: number;
  readonly zoomedOut: boolean;
  readonly o: Point;
  /** Tip of P on the real axis. */
  readonly pTip: Point;
  /** Tip of S = P + jQ. */
  readonly sTip: Point;
  readonly ratedR: number;
  /** θ arc (null when S or P is too small to draw it). */
  readonly theta: { readonly r: number; readonly from: number; readonly to: number } | null;
  readonly labels: ReadonlyMap<keyof TriangleLabels, Box>;
  /** Obstacles used for placement (exposed for tests). */
  readonly obstacles: readonly Box[];
}

/**
 * Candidate centres around an anchor: the preferred direction first, then fanning out in 22.5° steps, at growing gaps
 * between the anchor and the nearest edge of the box.
 */
function ring(ax: number, ay: number, prefAngle: number, bw: number, bh: number, gaps = [5, 10, 17, 26, 38, 52]): [number, number][] {
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

const fits = (p: number, q: number, scale: number) =>
  ORIGIN.x + p * scale <= TRI_W - EDGE && Math.abs(q) * scale <= ORIGIN.y - EDGE;

/**
 * @param p, q  in units of rated S (mode convention: p ≥ 0, q > 0 lagging)
 */
export function triangleLayout(p: number, q: number, text: TriangleLabels): TriangleLayout {
  const zoomedOut = !fits(p, q, PX_PER_PU);
  const scale = zoomedOut ? PX_PER_PU / 2 : PX_PER_PU;
  const o = ORIGIN;
  const pTip = { x: o.x + p * scale, y: o.y };
  const sTip = { x: o.x + p * scale, y: o.y - q * scale };
  const sLen = Math.hypot(sTip.x - o.x, sTip.y - o.y);
  const pLen = pTip.x - o.x;
  const angleS = Math.atan2(sTip.y - o.y, sTip.x - o.x); // SVG angle (y down)

  const theta =
    sLen > 24 && pLen > 6 && Math.abs(q) * scale > 2 ? { r: Math.min(40, 0.55 * sLen), from: 0, to: angleS } : null;

  const obstacles: Box[] = [
    ...segmentObstacles(12, o.y, TRI_W - 6, o.y, 6, 8), // real axis
    ...segmentObstacles(o.x, 8, o.x, TRI_H - 8, 6, 8), // imaginary axis
    ...segmentObstacles(o.x, o.y, pTip.x, pTip.y),
    ...segmentObstacles(pTip.x, pTip.y, sTip.x, sTip.y),
    ...segmentObstacles(o.x, o.y, sTip.x, sTip.y),
    // axis captions (drawn at fixed places in the component)
    { x: TRI_W - 34, y: o.y + 14, w: 56, h: 16 },
    { x: o.x + 34, y: 14, w: 56, h: 16 },
    { x: o.x + 40, y: 30, w: 72, h: 14 },
    { x: o.x + 40, y: TRI_H - 12, w: 72, h: 14 },
  ];

  const w = (k: keyof TriangleLabels) => labelWidth(text[k]);
  const H = TRI_LABEL_H;
  const up = q >= 0;
  const midP = { x: (o.x + pTip.x) / 2, y: o.y };
  const midQ = { x: pTip.x, y: (pTip.y + sTip.y) / 2 };
  const midS = { x: (o.x + sTip.x) / 2, y: (o.y + sTip.y) / 2 };
  // Outward normal of the hypotenuse (away from the P side): up-left when Q > 0, down-left when Q < 0.
  const outward = up ? 1 : -1;
  const sNormal = sLen > 0 ? Math.atan2((-outward * (sTip.x - o.x)) / sLen, (outward * (sTip.y - o.y)) / sLen) : -Math.PI / 2;

  const pCands = ring(midP.x, midP.y, up ? Math.PI / 2 : -Math.PI / 2, w('p'), H);
  const qCands = ring(midQ.x, midQ.y, 0, w('q'), H);
  const sCands = [
    ...(sLen > 12 ? ring(midS.x, midS.y, sNormal, w('s'), H) : []),
    ...ring(sTip.x, sTip.y, up ? -Math.PI / 2 : Math.PI / 2, w('s'), H),
  ];
  // θ: next to its arc, inside the angle; further out along the bisector for narrow angles; last resort just across
  // the real axis at the start of the arc.
  const thetaCands: [number, number][] = theta
    ? [
        ...ring(o.x + theta.r * Math.cos(angleS / 2), o.y + theta.r * Math.sin(angleS / 2), angleS / 2, w('theta'), H, [2, 5, 9, 14]),
        ...[1.3, 1.6, 1.9, 2.2].map((k): [number, number] => [o.x + k * theta.r * Math.cos(angleS / 2), o.y + k * theta.r * Math.sin(angleS / 2)]),
        ...[0.5, 0.75, 1, 0.25].map((k): [number, number] => [o.x + k * theta.r + 4, o.y + (up ? 1 : -1) * (H / 2 + 7)]),
      ]
    : [];
  const ratedR = scale;
  const ratedCands: [number, number][] = [-60, -45, -72, 60, 45, 72, -30, 30, -84, 84].flatMap((deg) => {
    const ang = (deg * Math.PI) / 180;
    return ring(o.x + ratedR * Math.cos(ang), o.y + ratedR * Math.sin(ang), ang, w('rated'), 16, [4, 10]).slice(0, 3);
  });

  // Keep every candidate box inside the plot.
  const inside = (bw: number, bh: number, cands: [number, number][]) =>
    cands.filter(([x, y]) => x - bw / 2 >= 2 && x + bw / 2 <= TRI_W - 2 && y - bh / 2 >= 2 && y + bh / 2 <= TRI_H - 2);
  // θ first (it must hug its arc), then the three sides, then the rated-S caption.
  const requests = [
    ...(theta ? [{ id: 'theta', w: w('theta'), h: H, candidates: inside(w('theta'), H, thetaCands) }] : []),
    { id: 'p', w: w('p'), h: H, candidates: inside(w('p'), H, pCands) },
    { id: 'q', w: w('q'), h: H, candidates: inside(w('q'), H, qCands) },
    { id: 's', w: w('s'), h: H, candidates: inside(w('s'), H, sCands) },
    { id: 'rated', w: w('rated'), h: 16, candidates: inside(w('rated'), 16, ratedCands) },
  ];
  const labels = placeLabels(obstacles, requests) as Map<keyof TriangleLabels, Box>;
  return { scale, zoomedOut, o, pTip, sTip, ratedR, theta, labels, obstacles };
}
