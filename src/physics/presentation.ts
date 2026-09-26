/**
 * THE single conversion: internal (signed generator) convention → Chapman presentation (brief §3.4.1, §4).
 *
 * No visual component may re-implement any part of this mapping.
 *
 *  - V_φ and E_A are the same phasors in both conventions.
 *  - Motor convention draws I_A entering the machine: I_A,motor = −I_A,internal,
 *    so jX_S I_A flips too and V_φ = E_A + jX_S I_A holds.
 *  - P and Q are reported in the drawing convention (generator: delivered; motor: absorbed).
 *  - δ is reported as a magnitude plus "E_A leads / lags V_φ".
 *  - PF and θ are always evaluated in the convention of the active operating mode, so that
 *    "lagging / leading" keeps Chapman's meaning even when a scene locks the drawing convention.
 */

import { abs, arg, neg, wrapAngle, type Complex } from './complex';
import type { Convention, OperatingPoint } from './types';

export type PfKind = 'lagging' | 'leading' | 'unity';
export type AngleRelation = 'leads' | 'lags' | 'inPhase';
export type FlowDirection = 'delivers' | 'absorbs' | 'none';
export type TorqueAction = 'drives' | 'opposes' | 'none';

export interface PresentedOperatingPoint {
  /** Convention used to draw I_A and jX_S I_A. */
  readonly drawingConvention: Convention;
  /** Convention of the active operating mode (used for PF and θ). */
  readonly modeConvention: Convention;
  readonly vPhi: Complex;
  readonly eA: Complex;
  /** I_A as drawn: out of the machine (generator) or into it (motor). */
  readonly iA: Complex;
  /** jX_S I_A with the drawn I_A. Generator: E_A = V_φ + jX_S I_A. Motor: V_φ = E_A + jX_S I_A. */
  readonly jXsIA: Complex;
  readonly iAMag: number;
  /** |δ|, electrical rad. */
  readonly deltaMag: number;
  /** Position of E_A relative to V_φ. */
  readonly eARelation: AngleRelation;
  /** Signed angle ∠V_φ − ∠I_A for the DRAWN I_A, rad in (−π, π]; > 0 means the drawn I_A lags V_φ. */
  readonly thetaDrawn: number;
  /** Active power in the drawing convention: generator → delivered to grid; motor → absorbed. W. */
  readonly p: number;
  /** Reactive power in the drawing convention: generator → delivered; motor → absorbed. var. */
  readonly q: number;
  /** Apparent power, VA. */
  readonly s: number;
  /** PF = cos θ ∈ [0, 1], evaluated in the mode convention. */
  readonly pf: number;
  readonly pfKind: PfKind;
  /** |θ| in the mode convention, rad ∈ [0, π/2]. */
  readonly thetaMag: number;
  readonly torqueMag: number;
  readonly torqueAction: TorqueAction;
}

/** Convention-independent summary "seen from the grid" (brief §4). */
export interface GridView {
  readonly p: { readonly direction: FlowDirection; readonly magnitude: number };
  readonly q: { readonly direction: FlowDirection; readonly magnitude: number };
}

/** Values smaller than this fraction of |S| (or 1e-6 absolute) are treated as zero. */
const REL_TOL = 1e-9;
const ANGLE_TOL = 1e-9;

const isZero = (x: number, reference: number): boolean =>
  Math.abs(x) <= Math.max(1e-6, REL_TOL * reference);

const flow = (internalSigned: number, reference: number): FlowDirection =>
  isZero(internalSigned, reference) ? 'none' : internalSigned > 0 ? 'delivers' : 'absorbs';

export function gridView(op: OperatingPoint): GridView {
  return {
    p: { direction: flow(op.p, op.s), magnitude: Math.abs(op.p) },
    q: { direction: flow(op.q, op.s), magnitude: Math.abs(op.q) },
  };
}

export function presentOperatingPoint(
  op: OperatingPoint,
  modeConvention: Convention,
  drawingConvention: Convention = modeConvention,
): PresentedOperatingPoint {
  const drawnSign = drawingConvention === 'generator' ? 1 : -1;
  const modeSign = modeConvention === 'generator' ? 1 : -1;

  const iA = drawnSign === 1 ? op.iA : neg(op.iA);
  const jXsIA = drawnSign === 1 ? op.jXsIA : neg(op.jXsIA);
  const iAMag = abs(iA);

  // Q in the mode convention decides lagging / leading: Q > 0 ⇔ I_A lags V_φ ⇔ lagging.
  const qMode = modeSign * op.q;
  const unity = isZero(op.q, op.s);
  const pfKind: PfKind = unity ? 'unity' : qMode > 0 ? 'lagging' : 'leading';
  const pf = op.s > 0 ? Math.abs(op.p) / op.s : 1;

  const eARelation: AngleRelation =
    Math.abs(op.delta) <= ANGLE_TOL ? 'inPhase' : op.delta > 0 ? 'leads' : 'lags';

  const torqueAction: TorqueAction = isZero(op.p, op.s)
    ? 'none'
    : op.torque > 0
      ? 'drives'
      : 'opposes';

  return {
    drawingConvention,
    modeConvention,
    vPhi: op.vPhi,
    eA: op.eA,
    iA,
    jXsIA,
    iAMag,
    deltaMag: Math.abs(op.delta),
    eARelation,
    thetaDrawn: iAMag > 0 ? wrapAngle(arg(op.vPhi) - arg(iA)) : 0,
    p: drawnSign * op.p,
    q: drawnSign * op.q,
    s: op.s,
    pf,
    pfKind,
    thetaMag: Math.acos(Math.min(1, pf)),
    torqueMag: Math.abs(op.torque),
    torqueAction,
  };
}
