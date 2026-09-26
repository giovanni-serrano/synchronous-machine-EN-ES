/**
 * Excitation-related derived quantities: PF → required I_F, V curves, constant-power loci, P–δ curve.
 * All in the internal (generator) convention unless stated.
 */

import { abs, add, complex, mulJ, scale, type Complex } from './complex';
import {
  fieldFromInternalVoltage,
  internalVoltageFromField,
  synchronousReactance,
  type MachineParams,
} from './machine';
import { signedPower } from './solve';
import type { MachineInputs } from './types';

export type TargetPfKind = 'lagging' | 'leading' | 'unity';

export interface FieldSolution {
  /** Required field current, A (clamped to [0, ifMax] when infeasible). */
  readonly iF: number;
  /** Required |E_A|, V (unclamped). */
  readonly eA: number;
  /** False when the required I_F lies outside [0, ifMax]. */
  readonly feasible: boolean;
}

/**
 * Solve the field current that yields a target power factor for the given mode and load
 * (brief §3.3: PF is never an input; a scenario asking for a PF solves I_F).
 *
 * Lagging / leading follow Chapman for the active mode:
 *  generator lagging ⇔ delivers Q;  motor lagging ⇔ absorbs Q.
 * With P = 0 the PF is undefined; the solution is E_A = V_φ (I_A = 0).
 */
export function solveFieldForPowerFactor(
  params: MachineParams,
  inputs: MachineInputs,
  pf: number,
  kind: TargetPfKind,
): FieldSolution {
  const vPhi = inputs.vT / Math.sqrt(3);
  const xS = synchronousReactance(params, inputs.f);
  const p = signedPower(inputs);

  let q = 0;
  if (kind !== 'unity' && p !== 0) {
    const pfc = Math.min(1, Math.max(1e-3, pf)); // PF ∈ (0, 1]; avoids tan θ → ∞
    const tanTheta = Math.sqrt(1 - pfc * pfc) / pfc;
    const sameDirection = kind === 'lagging'; // lagging ⇔ P and Q flow the same way w.r.t. the grid
    q = (sameDirection ? Math.sign(p) : -Math.sign(p)) * Math.abs(p) * tanTheta;
  }

  // I_A = conj(S_φ / V_φ) with V_φ real: I_A = (P − jQ) / (3 V_φ)
  const iA: Complex = complex(p / (3 * vPhi), -q / (3 * vPhi));
  const e = add(complex(vPhi, 0), mulJ(scale(iA, xS)));
  const eA = abs(e);
  const iFExact = fieldFromInternalVoltage(params, eA, inputs.f);
  const feasible = iFExact >= 0 && iFExact <= params.ifMax;
  return { iF: Math.min(params.ifMax, Math.max(0, iFExact)), eA, feasible };
}

export interface VCurvePoint {
  readonly iF: number;
  /** |I_A|, A. NaN beyond the stability limit. */
  readonly iA: number;
  /** Reactive power delivered to the grid (internal), var. NaN beyond the limit. */
  readonly q: number;
  readonly stable: boolean;
}

/**
 * I_A vs I_F at constant P (linear, unsaturated model).
 * |I_A|² X_S² = E_A² − 2 E_A V_φ cos δ + V_φ², with E_A sin δ fixed by P.
 */
export function vCurve(
  params: MachineParams,
  inputs: MachineInputs,
  fieldCurrents: readonly number[],
): VCurvePoint[] {
  const vPhi = inputs.vT / Math.sqrt(3);
  const xS = synchronousReactance(params, inputs.f);
  const c = (signedPower(inputs) * xS) / (3 * vPhi); // = E_A sin δ
  return fieldCurrents.map((iF) => {
    const eA = internalVoltageFromField(params, iF, inputs.f);
    // Beyond the static stability limit (E_A < |E_A sin δ| required) there is no synchronous solution.
    if (eA < Math.abs(c)) return { iF, iA: Number.NaN, q: Number.NaN, stable: false };
    const eCos = Math.sqrt(Math.max(0, eA * eA - c * c)); // stable branch: cos δ ≥ 0
    const iA = Math.hypot(c, eCos - vPhi) / xS;
    const q = (3 * vPhi * (eCos - vPhi)) / xS;
    return { iF, iA, q, stable: true };
  });
}

export interface VCurveLandmarks {
  /** Field current at the static stability limit (δ = 90°), A. */
  readonly iFStabilityLimit: number;
  /** Field current for unity PF (minimum of the V curve), A. */
  readonly iFUnity: number;
  /** |I_A| at unity PF (the curve minimum) = |P| / (3 V_φ), A. */
  readonly iAMin: number;
}

export function vCurveLandmarks(params: MachineParams, inputs: MachineInputs): VCurveLandmarks {
  const vPhi = inputs.vT / Math.sqrt(3);
  const xS = synchronousReactance(params, inputs.f);
  const p = signedPower(inputs);
  const c = Math.abs(p * xS) / (3 * vPhi);
  return {
    iFStabilityLimit: fieldFromInternalVoltage(params, c, inputs.f),
    iFUnity: fieldFromInternalVoltage(params, Math.hypot(vPhi, c), inputs.f),
    iAMin: Math.abs(p) / (3 * vPhi),
  };
}

/**
 * Loci followed at constant P when only the excitation changes (brief §5.10), internal convention:
 *  - tip of E_A on the horizontal line Im(E_A) = E_A sin δ = P X_S / (3 V_φ);
 *  - tip of I_A on the vertical line Re(I_A) = I_A cos θ = P / (3 V_φ).
 */
export function constantPowerLoci(
  params: MachineParams,
  inputs: MachineInputs,
): { eAImag: number; iAReal: number } {
  const vPhi = inputs.vT / Math.sqrt(3);
  const xS = synchronousReactance(params, inputs.f);
  const p = signedPower(inputs);
  return { eAImag: (p * xS) / (3 * vPhi), iAReal: p / (3 * vPhi) };
}

/** P(δ) = 3 V_φ E_A sin δ / X_S, internal convention, W. */
export const powerAtDelta = (vPhi: number, eA: number, xS: number, delta: number): number =>
  (3 * vPhi * eA * Math.sin(delta)) / xS;

/** Sampled P–δ curve for δ ∈ [−π, π]. */
export function powerAngleCurve(
  vPhi: number,
  eA: number,
  xS: number,
  samples = 181,
): Array<{ delta: number; p: number }> {
  return Array.from({ length: samples }, (_, k) => {
    const delta = -Math.PI + (2 * Math.PI * k) / (samples - 1);
    return { delta, p: powerAtDelta(vPhi, eA, xS, delta) };
  });
}
