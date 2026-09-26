/**
 * Steady-state solver. Pure functions: inputs → state.
 *
 * Internal convention (brief §3.4.1): generator convention, I_A out of the machine,
 * δ signed. E_A = V_φ + jX_S I_A and P = 3 V_φ E_A sin δ / X_S hold with sign in both modes.
 */

import {
  abs,
  arg,
  complex,
  conj,
  div,
  mul,
  mulJ,
  polar,
  scale,
  sub,
  wrapAngle,
} from './complex';
import {
  deriveRatings,
  internalVoltageFromField,
  synchronousReactance,
  synchronousSpeed,
  type MachineParams,
} from './machine';
import type {
  Convention,
  MachineInputs,
  MachineState,
  OperatingMode,
  OperatingPoint,
  StabilityStatus,
} from './types';

/** P / P_max at or above which the UI flags "near the stability limit" (δ ≳ 64°). Pedagogical threshold. */
export const NEAR_LIMIT_RATIO = 0.9;

/** Relative tolerance for rating warnings, so exactly-rated scenarios do not flicker. */
const RATING_TOLERANCE = 1e-6;

/** |I_A| below this (A) is treated as zero when reporting θ. */
const ZERO_CURRENT = 1e-9;

/**
 * Phasor solution for a given torque angle δ (internal convention).
 * Used by the steady-state solver, the P–δ curve, and (later) the qualitative transient scenes.
 */
export function operatingPointAtDelta(
  vPhi: number,
  eA: number,
  xS: number,
  delta: number,
  omegaM: number,
): OperatingPoint {
  const V = complex(vPhi, 0);
  const E = polar(eA, delta);
  // Generator convention: E_A = V_φ + jX_S I_A  ⇒  I_A = (E_A − V_φ) / (jX_S)
  const iA = div(sub(E, V), complex(0, xS));
  const jXsIA = mulJ(scale(iA, xS));
  // Complex power delivered to the grid, three-phase: S = 3 V_φ I_A*
  const sPhase = mul(V, conj(iA));
  const p = 3 * sPhase.re;
  const q = 3 * sPhase.im;
  const iAMag = abs(iA);
  const theta = iAMag < ZERO_CURRENT ? 0 : wrapAngle(arg(V) - arg(iA));
  return {
    delta,
    vPhi: V,
    eA: E,
    iA,
    jXsIA,
    p,
    q,
    s: 3 * vPhi * iAMag,
    iAMag,
    theta,
    // Electromagnetic torque in the direction of rotation: motoring (P < 0 internal) drives the rotor.
    torque: omegaM > 0 ? -p / omegaM : 0,
  };
}

/** Signed electrical power in the internal convention from the selector and the load magnitude. */
export const signedPower = (inputs: MachineInputs): number =>
  inputs.mode === 'generator' ? Math.max(0, inputs.load) : -Math.max(0, inputs.load);

/**
 * Map a signed shaft power (+ generating, − motoring) back to selector + magnitude.
 * Lets a scene sweep continuously from motor to generator (brief §5.4).
 */
export const withSignedPower = (inputs: MachineInputs, p: number): MachineInputs => ({
  ...inputs,
  mode: p >= 0 ? 'generator' : 'motor',
  load: Math.abs(p),
});

export function operatingModeFromPower(p: number): OperatingMode {
  if (p > 0) return 'generator';
  if (p < 0) return 'motor';
  return 'noLoad';
}

export function solveMachine(params: MachineParams, inputs: MachineInputs): MachineState {
  const ratings = deriveRatings(params);
  const { f, poles } = inputs;
  const nSync = synchronousSpeed(f, poles);
  const omegaE = 2 * Math.PI * f;
  const omegaM = (2 * Math.PI * nSync) / 60;
  const xS = synchronousReactance(params, f);
  const vPhi = inputs.vT / Math.sqrt(3);
  const eA = internalVoltageFromField(params, inputs.iF, f);

  const pRequested = signedPower(inputs);
  const pMax = (3 * vPhi * eA) / xS;
  const loadRatio =
    pMax > 0 ? Math.abs(pRequested) / pMax : pRequested === 0 ? 0 : Number.POSITIVE_INFINITY;

  let stability: StabilityStatus;
  let op: OperatingPoint | null = null;

  if (loadRatio > 1 + 1e-12) {
    // No synchronous steady state: the rotor slips (qualitative transient scene).
    stability = 'lostSynchronism';
  } else {
    const sinDelta = pMax > 0 ? Math.max(-1, Math.min(1, pRequested / pMax)) : 0;
    // Stable branch: |δ| ≤ 90°.
    const delta = Math.asin(sinDelta);
    op = operatingPointAtDelta(vPhi, eA, xS, delta, omegaM);
    stability = loadRatio >= NEAR_LIMIT_RATIO ? 'nearLimit' : 'stable';
  }

  const operatingMode = operatingModeFromPower(pRequested);
  const convention: Convention =
    operatingMode === 'noLoad' ? inputs.mode : operatingMode;

  return {
    inputs,
    nSync,
    omegaE,
    omegaM,
    xS,
    vPhi,
    eA,
    pRequested,
    pMax,
    loadRatio,
    stability,
    operatingMode,
    convention,
    op,
    warnings: {
      statorOvercurrent: op !== null && op.iAMag > ratings.iRated * (1 + RATING_TOLERANCE),
      fieldOverexcitation: inputs.iF > ratings.ifRated * (1 + RATING_TOLERANCE),
    },
  };
}
