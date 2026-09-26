/**
 * Pure geometry of the machine cross-section (visual only): rotor proportions, field-vector arrows, rotor pole
 * letters, the δ arc and non-overlapping positions for every label. MachineView just renders this, and tests check
 * that no label touches another in any scenario, number of poles or instant.
 */

import { wrapAngle } from '../../physics';
import type { MachineSnapshot } from '../../animation/snapshot';
import { placeLabels, segmentObstacles, type Box, type LabelRequest } from '../labelLayout';
import { STATOR } from './StatorDrawing';

export const ROTOR = {
  shoeOut: 86,
  shoeIn: 62,
  bodyIn: 24,
  hub: 26,
  shaft: 12,
} as const;

/** px per flux pu: |B_net| = 1 reaches 58 px; B_R of the rating point ≈ 97 px, into the air gap (visual only). */
export const VECTOR_PX_PER_PU = 58;
export const GAP_MID = (ROTOR.shoeOut + STATOR.rBore) / 2;

const POLE_LETTER_R = ROTOR.shoeOut - 10;
const POLE_LETTER_BOX = { w: 15, h: 17 };
const VECTOR_LABEL = { bNet: { w: 34, h: 22 }, bR: { w: 24, h: 22 }, bS: { w: 24, h: 22 } } as const;
/** Two-line δ label in the cross-section: "δ = 20.5°" over a small "mech.". */
const DELTA_LABEL_H = 30;

export interface Segment {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface LayoutShow {
  readonly bR: boolean;
  readonly bS: boolean;
  readonly bNet: boolean;
  readonly sum: boolean;
  readonly delta: boolean;
}

export interface MachineLayout {
  readonly halfWidth: number;
  readonly shoeHalfAngle: number;
  /** Rotor pole axes (mechanical, rad) and polarity. */
  readonly poles: ReadonlyArray<{
    readonly phi: number;
    readonly kind: 'N' | 'S';
    readonly letter: Box;
    /** Field-winding coil sides beside the pole body: current out of / into the page. */
    readonly coilOut: readonly [number, number];
    readonly coilIn: readonly [number, number];
  }>;
  readonly vectors: { readonly bR: Segment; readonly bS: Segment; readonly bNet: Segment; readonly sChained: boolean };
  readonly delta: { readonly r: number; readonly from: number; readonly to: number; readonly label: Box } | null;
  readonly labels: Partial<Record<'bR' | 'bS' | 'bNet', Box>>;
}

/** Polar → SVG coordinates (y down, angles counterclockwise-positive). */
const xy = (r: number, a: number): [number, number] => [r * Math.cos(a), -r * Math.sin(a)];

/** Local rotor coordinates (x along the pole axis) → SVG, rotated by φ (counterclockwise). */
export const rotorXY = (x: number, y: number, phi: number): [number, number] => [
  x * Math.cos(phi) - y * Math.sin(phi),
  -(x * Math.sin(phi) + y * Math.cos(phi)),
];

const COIL_BOX = 12;

/**
 * Candidate label centres around an arrow tip: straight ahead first, then a ring of 12 directions at growing
 * distances (ordered by how far they turn away from "ahead"), then beside the middle of the shaft.
 */
function vectorCandidates(s: Segment, k = 1): Array<[number, number]> {
  const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1) || 1;
  const base = Math.atan2(s.y2 - s.y1, s.x2 - s.x1); // SVG angle of the arrow
  const turns = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8].map((k) => (k * Math.PI) / 8);
  const out: Array<[number, number]> = [];
  for (const dist of [17 * k, 24 * k, 32 * k, 42 * k, 54 * k, 68 * k, 84 * k])
    for (const t of turns) out.push([s.x2 + dist * Math.cos(base + t), s.y2 + dist * Math.sin(base + t)]);
  const mx = (s.x1 + s.x2) / 2;
  const my = (s.y1 + s.y2) / 2;
  const nx = -(s.y2 - s.y1) / len;
  const ny = (s.x2 - s.x1) / len;
  for (const side of [1, -1]) for (const d of [16 * k, 26 * k]) out.push([mx + nx * d * side, my + ny * d * side]);
  return out;
}

/** Points along an arc (SVG coordinates). */
function arcPoints(r: number, from: number, to: number, n = 12): Array<[number, number]> {
  return Array.from({ length: n + 1 }, (_, k) => xy(r, from + ((to - from) * k) / n));
}

/** Gap between a label box and the nearest point of an arc, and that point. */
export function arcGap(arc: { r: number; from: number; to: number }, box: Box): { gap: number; x: number; y: number } {
  let best = { gap: Number.POSITIVE_INFINITY, x: 0, y: 0 };
  for (const [x, y] of arcPoints(arc.r, arc.from, arc.to)) {
    const gap = Math.hypot(Math.max(0, Math.abs(box.x - x) - box.w / 2), Math.max(0, Math.abs(box.y - y) - box.h / 2));
    if (gap < best.gap) best = { gap, x, y };
  }
  return best;
}

/**
 * Candidate centres for an angle label: a polar grid around the arc, sorted by distance to the arc curve,
 * so the label lands as close to its arc as the arrows allow.
 */
function arcLabelCandidates(r: number, from: number, to: number, maxDr: number): Array<[number, number]> {
  const pts = arcPoints(r, from, to, 8);
  const dist = ([x, y]: [number, number]) => Math.min(...pts.map(([px, py]) => Math.hypot(x - px, y - py)));
  const mid = (from + to) / 2;
  const out: Array<[number, number]> = [];
  for (let dr = -r + 8; dr <= maxDr; dr += 5)
    for (let da = -Math.PI; da < Math.PI; da += 0.08) out.push(xy(r + dr, mid + da));
  return out.map((c) => [c, dist(c)] as const).sort((a, b) => a[1] - b[1]).map(([c]) => c);
}

/** Point on the label box closest to (x, y), for a leader line; null when the label is already next to the arc. */
export function leaderLine(box: Box, x: number, y: number, minGap = 20): Segment | null {
  const cx = Math.max(box.x - box.w / 2, Math.min(x, box.x + box.w / 2));
  const cy = Math.max(box.y - box.h / 2, Math.min(y, box.y + box.h / 2));
  return Math.hypot(cx - x, cy - y) > minGap ? { x1: x, y1: y, x2: cx, y2: cy } : null;
}

export function machineLayout(
  snap: MachineSnapshot,
  poles: number,
  show: LayoutShow,
  deltaLabelWidth: number,
): MachineLayout {
  const pairs = poles / 2;
  const halfWidth = Math.min(13, 34 * Math.tan(Math.PI / (2 * poles)));
  const shoeHalfAngle = (0.62 * Math.PI) / poles;

  // Rotor poles; the letter sits at the pole tip, shifted to the trailing corner so it is never on the B_R axis.
  const rotorPoles = Array.from({ length: poles }, (_, k) => {
    const phi = (snap.elec.bR + Math.PI * k) / pairs;
    const [x, y] = xy(POLE_LETTER_R, phi - 0.55 * shoeHalfAngle);
    const kind = (k % 2 === 0 ? 'N' : 'S') as 'N' | 'S';
    // Right-hand rule: for an N pole (flux outward along its axis) the field current comes out of the page on the
    // counterclockwise side of the pole body.
    const coilX = (ROTOR.bodyIn + ROTOR.shoeIn) / 2;
    const coilY = halfWidth + 5.5;
    return {
      phi,
      kind,
      letter: { x, y, ...POLE_LETTER_BOX },
      coilOut: rotorXY(coilX, kind === 'N' ? coilY : -coilY, phi),
      coilIn: rotorXY(coilX, kind === 'N' ? -coilY : coilY, phi),
    };
  });

  const seg = (angle: number, magnitude: number, from: [number, number] = [0, 0]): Segment => {
    const [dx, dy] = xy(magnitude * VECTOR_PX_PER_PU, angle);
    return { x1: from[0], y1: from[1], x2: from[0] + dx, y2: from[1] + dy };
  };
  const bR = seg(snap.mech.bR, snap.magnitude.bR);
  const bNet = seg(snap.mech.bNet, snap.magnitude.bNet);
  const sChained = show.sum && poles === 2 && show.bR;
  const bS = seg(snap.mech.bS, snap.magnitude.bS, sChained ? [bR.x2, bR.y2] : [0, 0]);

  const obstacles: Box[] = rotorPoles.flatMap((p) => [
    p.letter,
    { x: p.coilOut[0], y: p.coilOut[1], w: COIL_BOX, h: COIL_BOX },
    { x: p.coilIn[0], y: p.coilIn[1], w: COIL_BOX, h: COIL_BOX },
  ]);
  const visible: Array<['bR' | 'bS' | 'bNet', Segment]> = [];
  if (show.bNet) visible.push(['bNet', bNet]);
  if (show.bR) visible.push(['bR', bR]);
  if (show.bS) visible.push(['bS', bS]);
  for (const [, s] of visible) obstacles.push(...segmentObstacles(s.x1, s.y1, s.x2, s.y2));

  // δ arc between B_net and B_R (mechanical), larger than before and labelled with its value.
  let delta: MachineLayout['delta'] = null;
  let deltaRequest: LabelRequest | null = null;
  const from = snap.mech.bNet;
  const to = snap.mech.bNet + wrapAngle(snap.mech.bR - snap.mech.bNet);
  if (show.delta && Math.abs(snap.deltaMech) > 0.005) {
    // Outside the ring of field-winding conductors (r ≈ 43) and inside the shorter of the two arrows.
    const r = Math.max(50, Math.min(64, 0.9 * VECTOR_PX_PER_PU * Math.min(snap.magnitude.bR, snap.magnitude.bNet)));
    const candidates = arcLabelCandidates(r, from, to, 110);
    deltaRequest = { id: 'delta', w: deltaLabelWidth, h: DELTA_LABEL_H, candidates };
    delta = { r, from, to, label: { x: 0, y: 0, w: 0, h: 0 } };
  }
  // Order matters for a greedy placer: B_net and B_R first (they must stay at their tips), then δ (next to its arc),
  // then B_S, whose tip is usually farthest from the crowd and so has the most free room.
  const vectorRequest = (id: 'bR' | 'bS' | 'bNet', seg: Segment): LabelRequest => ({ id, ...VECTOR_LABEL[id], candidates: vectorCandidates(seg) });
  const requests: LabelRequest[] = visible.filter(([id]) => id !== 'bS').map(([id, seg]) => vectorRequest(id, seg));
  if (deltaRequest) requests.push(deltaRequest);
  for (const [id, seg] of visible) if (id === 'bS') requests.push(vectorRequest(id, seg));

  const placed = placeLabels(obstacles, requests);
  if (delta) delta = { ...delta, label: placed.get('delta')! };
  const labels: MachineLayout['labels'] = {};
  for (const [id] of visible) labels[id] = placed.get(id);

  return { halfWidth, shoeHalfAngle, poles: rotorPoles, vectors: { bR, bS, bNet, sChained }, delta, labels };
}

/** Electrical-sum inset: fixed square frame (half-size), label room at the edge, smaller labels (visual only). */
export const INSET_FRAME = 100;
const INSET_MARGIN = 34;
const INSET_LABEL = { bNet: { w: 26, h: 17 }, bR: { w: 19, h: 17 }, bS: { w: 19, h: 17 } } as const;
const INSET_DELTA_H = 14;

/**
 * px per flux pu in the inset: the larger of |B_R| and |B_net| fills the frame minus the label margin. It depends only
 * on magnitudes, which do not change while the fields rotate, so the picture does not "breathe" during animation.
 */
export const insetScale = (snap: MachineSnapshot): number =>
  (INSET_FRAME - INSET_MARGIN) / Math.max(snap.magnitude.bR, snap.magnitude.bNet, 0.5);

export interface SumInsetLayout {
  readonly bR: Segment;
  /** Drawn tip-to-tail from the tip of B_R. */
  readonly bS: Segment;
  readonly bNet: Segment;
  readonly delta: { readonly r: number; readonly from: number; readonly to: number; readonly label: Box } | null;
  readonly labels: Record<'bR' | 'bS' | 'bNet', Box>;
}

/**
 * B_R + B_S = B_net tip-to-tail in ELECTRICAL degrees at the same instant as the cross-section (brief §5.5 bridge to
 * the phasor diagram). For 4+ poles the cross-section arrows point at different poles, so the sum is shown here.
 */
export function sumInsetLayout(snap: MachineSnapshot, deltaLabelWidth: number): SumInsetLayout {
  const scale = insetScale(snap);
  const seg = (angle: number, magnitude: number, from: [number, number]): Segment => {
    const [dx, dy] = xy(magnitude * scale, angle);
    return { x1: from[0], y1: from[1], x2: from[0] + dx, y2: from[1] + dy };
  };
  const bR = seg(snap.elec.bR, snap.magnitude.bR, [0, 0]);
  const bS = seg(snap.elec.bS, snap.magnitude.bS, [bR.x2, bR.y2]);
  const bNet = seg(snap.elec.bNet, snap.magnitude.bNet, [0, 0]);

  const obstacles: Box[] = [bR, bS, bNet].flatMap((s) => segmentObstacles(s.x1, s.y1, s.x2, s.y2));
  const requests: LabelRequest[] = [
    { id: 'bNet', ...INSET_LABEL.bNet, candidates: vectorCandidates(bNet, 0.75) },
    { id: 'bR', ...INSET_LABEL.bR, candidates: vectorCandidates(bR, 0.75) },
    { id: 'bS', ...INSET_LABEL.bS, candidates: vectorCandidates(bS, 0.75) },
  ];
  let delta: SumInsetLayout['delta'] = null;
  const from = snap.elec.bNet;
  const to = snap.elec.bNet + wrapAngle(snap.elec.bR - snap.elec.bNet);
  if (Math.abs(snap.deltaElec) > 0.005) {
    const r = Math.max(20, Math.min(32, 0.5 * scale * Math.min(snap.magnitude.bR, snap.magnitude.bNet)));
    const candidates = arcLabelCandidates(r, from, to, 70);
    requests.push({ id: 'delta', w: deltaLabelWidth, h: INSET_DELTA_H, candidates });
    delta = { r, from, to, label: { x: 0, y: 0, w: 0, h: 0 } };
  }
  // Keep only candidates whose whole box fits inside the inset's frame.
  const frame = INSET_FRAME;
  const inside = (req: LabelRequest): LabelRequest => {
    const fits = req.candidates.filter(([x, y]) => Math.abs(x) + req.w / 2 <= frame && Math.abs(y) + req.h / 2 <= frame);
    return fits.length > 0 ? { ...req, candidates: fits } : req;
  };
  const placed = placeLabels(obstacles, requests.map(inside));
  if (delta) delta = { ...delta, label: placed.get('delta')! };
  return {
    bR,
    bS,
    bNet,
    delta,
    labels: { bR: placed.get('bR')!, bS: placed.get('bS')!, bNet: placed.get('bNet')! },
  };
}

