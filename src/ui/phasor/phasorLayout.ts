/**
 * Pure geometry of the phasor diagram (brief §5.12; visual only — values come from presentOperatingPoint()).
 *
 * V_φ lies on the positive real axis. Voltages share one scale; I_A has its own (amperes), stated in the UI.
 * The jX_S I_A arrow closes the Chapman equation tip-to-tail in the DRAWING convention:
 *   generator: E_A = V_φ + jX_S I_A  → from the tip of V_φ to the tip of E_A;
 *   motor:     V_φ = E_A + jX_S I_A  → from the tip of E_A to the tip of V_φ.
 * The scale steps down (never continuously) only when a phasor would leave the plot; a user zoom multiplies it.
 */

import type { Complex, Convention, PresentedOperatingPoint } from '../../physics';
import { placeLabels, ring, segmentObstacles, type Box } from '../labelLayout';

export const PH_W = 360;
export const PH_H = 300;
export const PH_ORIGIN = { x: 100, y: 150 } as const;
/** V_φ rated drawn this long at scale step 1. */
export const V_RATED_PX = 120;
/** I_A rated drawn this long at scale step 1. */
export const I_RATED_PX = 80;
export const SCALE_STEPS = [1, 0.75, 0.56, 0.42, 0.32] as const;
const EDGE = 14;
export const PH_LABEL_H = 18;

export type PhasorId = 'vPhi' | 'eA' | 'iA' | 'jx';
export type PhasorLabelId = PhasorId | 'delta' | 'theta';

export interface PhasorShow {
  readonly vPhi: boolean;
  readonly eA: boolean;
  readonly iA: boolean;
  readonly jx: boolean;
  readonly names: boolean;
  readonly angles: boolean;
}

export interface Pt {
  readonly x: number;
  readonly y: number;
}

export interface Seg {
  readonly from: Pt;
  readonly to: Pt;
}

export interface AngleArc {
  readonly r: number;
  /** SVG angles (y down), radians. */
  readonly from: number;
  readonly to: number;
}

export interface PhasorLayout {
  /** Scale step (1 = rated V_φ is V_RATED_PX long) times the user zoom. */
  readonly step: number;
  readonly vectors: Readonly<Record<PhasorId, Seg>>;
  readonly delta: AngleArc | null;
  readonly theta: AngleArc | null;
  readonly labels: ReadonlyMap<PhasorLabelId, Box>;
  readonly obstacles: readonly Box[];
}

/** Width estimate for a 12 px label with subscripts (tests and layout use the same rule). */
export const phasorLabelWidth = (text: string): number => 7 * [...text.replace(/_/g, '')].length + 8;

const toPt = (c: Complex, k: number): Pt => ({ x: PH_ORIGIN.x + c.re * k, y: PH_ORIGIN.y - c.im * k });
const add = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
const svgAngle = (from: Pt, to: Pt) => Math.atan2(to.y - from.y, to.x - from.x);
const len = (s: Seg) => Math.hypot(s.to.x - s.from.x, s.to.y - s.from.y);

function geometry(pr: PresentedOperatingPoint, pxPerV: number, pxPerA: number) {
  const tail = pr.drawingConvention === 'generator' ? pr.vPhi : pr.eA;
  return {
    vPhi: { from: toPt({ re: 0, im: 0 }, pxPerV), to: toPt(pr.vPhi, pxPerV) },
    eA: { from: toPt({ re: 0, im: 0 }, pxPerV), to: toPt(pr.eA, pxPerV) },
    iA: { from: toPt({ re: 0, im: 0 }, pxPerA), to: toPt(pr.iA, pxPerA) },
    jx: { from: toPt(tail, pxPerV), to: toPt(add(tail, pr.jXsIA), pxPerV) },
  } satisfies Record<PhasorId, Seg>;
}

const inside = (p: Pt) => p.x >= EDGE && p.x <= PH_W - EDGE && p.y >= EDGE && p.y <= PH_H - EDGE;

/**
 * @param vPhiRated, iRated  scale references (rated V_φ, rated I_A)
 * @param modeConvention     θ is only drawn when the drawing convention is the mode's own (PF is defined there)
 */
export function phasorLayout(
  pr: PresentedOperatingPoint,
  vPhiRated: number,
  iRated: number,
  modeConvention: Convention,
  show: PhasorShow,
  text: Readonly<Record<PhasorLabelId, string>>,
  zoom = 1,
): PhasorLayout {
  const fitStep =
    SCALE_STEPS.find((k) => {
      const g = geometry(pr, (V_RATED_PX * k) / vPhiRated, (I_RATED_PX * k) / iRated);
      return Object.values(g).every((s) => inside(s.from) && inside(s.to));
    }) ?? SCALE_STEPS[SCALE_STEPS.length - 1]!;
  const step = fitStep * zoom;
  const vectors = geometry(pr, (V_RATED_PX * step) / vPhiRated, (I_RATED_PX * step) / iRated);
  const o = PH_ORIGIN;

  // δ between V_φ (angle 0) and E_A; θ between V_φ and I_A (mode convention only).
  const vLen = len(vectors.vPhi);
  const eLen = len(vectors.eA);
  const iLen = len(vectors.iA);
  const angE = svgAngle(vectors.eA.from, vectors.eA.to);
  const angI = svgAngle(vectors.iA.from, vectors.iA.to);
  const delta: AngleArc | null =
    show.angles && eLen > 20 && vLen > 20 && Math.abs(angE) > 0.01
      ? { r: Math.max(20, Math.min(64, 0.42 * Math.min(vLen, eLen))), from: 0, to: angE }
      : null;
  let theta: AngleArc | null =
    show.angles && pr.drawingConvention === modeConvention && iLen > 16 && Math.abs(angI) > 0.01
      ? { r: Math.max(16, Math.min(46, 0.55 * iLen)), from: 0, to: angI }
      : null;
  // Keep the two arcs on clearly different radii when their spans overlap (same side of V_φ).
  if (delta && theta && Math.sign(delta.to) === Math.sign(theta.to) && Math.abs(delta.r - theta.r) < 14)
    theta = { ...theta, r: delta.r - 14 >= 14 ? delta.r - 14 : delta.r + 14 };

  const visible = (id: PhasorId) => show[id];
  const obstacles: Box[] = [
    ...segmentObstacles(8, o.y, PH_W - 8, o.y, 5, 8), // real axis (reference)
    ...(Object.keys(vectors) as PhasorId[]).filter(visible).flatMap((id) => {
      const s = vectors[id];
      return segmentObstacles(s.from.x, s.from.y, s.to.x, s.to.y);
    }),
  ];

  // Prefer the side of each vector that faces away from the middle of the drawing.
  const pts = (Object.keys(vectors) as PhasorId[]).filter(visible).flatMap((id) => [vectors[id].from, vectors[id].to]);
  const cx = pts.reduce((a, p) => a + p.x, 0) / Math.max(1, pts.length);
  const cy = pts.reduce((a, p) => a + p.y, 0) / Math.max(1, pts.length);
  const H = PH_LABEL_H;
  const w = (id: PhasorLabelId) => phasorLabelWidth(text[id]);
  const fits = (bw: number, cands: [number, number][]) =>
    cands.filter(([x, y]) => x - bw / 2 >= 2 && x + bw / 2 <= PH_W - 2 && y - H / 2 >= 2 && y + H / 2 <= PH_H - 2);

  const vectorRequest = (id: PhasorId) => {
    const s = vectors[id];
    const mx = (s.from.x + s.to.x) / 2;
    const my = (s.from.y + s.to.y) / 2;
    const a = svgAngle(s.from, s.to);
    const n1 = a + Math.PI / 2;
    const away = Math.cos(n1) * (mx - cx) + Math.sin(n1) * (my - cy) >= 0 ? n1 : n1 + Math.PI;
    const cands = [
      ...(len(s) > 10 ? ring(mx, my, away, w(id), H) : []),
      ...ring(s.to.x, s.to.y, a, w(id), H), // beyond the tip
    ];
    return { id, w: w(id), h: H, candidates: fits(w(id), cands) };
  };
  const arcRequest = (id: 'delta' | 'theta', arc: AngleArc) => {
    const bis = (arc.from + arc.to) / 2;
    const ax = o.x + arc.r * Math.cos(bis);
    const ay = o.y + arc.r * Math.sin(bis);
    const cands: [number, number][] = [
      ...ring(ax, ay, bis, w(id), H, [2, 5, 9, 14]),
      ...ring(o.x + arc.r * Math.cos(arc.from), o.y + arc.r * Math.sin(arc.from), arc.from, w(id), H, [3, 8]),
      ...[18, 28, 38].map((dr): [number, number] => [o.x + (arc.r + dr) * Math.cos(bis), o.y + (arc.r + dr) * Math.sin(bis)]),
      ...ring(o.x + arc.r * Math.cos(arc.to), o.y + arc.r * Math.sin(arc.to), arc.to, w(id), H, [3, 8]),
      ...ring(ax, ay, bis, w(id), H, [20, 26]),
    ];
    return { id, w: w(id), h: H, candidates: fits(w(id), cands) };
  };

  const requests = [
    ...(delta ? [arcRequest('delta', delta)] : []),
    ...(theta ? [arcRequest('theta', theta)] : []),
    ...(show.names ? (['eA', 'vPhi', 'jx', 'iA'] as const).filter(visible).map(vectorRequest) : []),
  ];
  const labels = placeLabels(obstacles, requests) as Map<PhasorLabelId, Box>;
  return { step, vectors, delta, theta, labels, obstacles };
}
