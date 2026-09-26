/**
 * Instantaneous picture of a steady-state operating point (brief §13: time kept separate from the physics).
 *
 * The phasor frame rotates at ω. At physical time t every field space vector is its phasor-frame angle + ωt
 * (electrical). Mechanical angles are electrical / (poles/2). Nothing here changes the steady state: δ, |B| and
 * the currents' amplitude and phase come from MachineState; only the common rotation ωt is added.
 */

import {
  PHASES,
  PHASE_AXES,
  abs,
  arg,
  fieldVectors,
  type MachineParams,
  type MachineState,
  type PhaseId,
  deriveRatings,
} from '../physics';

export interface MachineSnapshot {
  /** ωt, rad (unwrapped). */
  readonly wt: number;
  /** Electrical angles at time t, rad. */
  readonly elec: { readonly bR: number; readonly bS: number; readonly bNet: number };
  /** Mechanical angles at time t (one N pole of each pattern), rad. B_R's is the rotor's N-pole axis. */
  readonly mech: { readonly bR: number; readonly bS: number; readonly bNet: number };
  /** Field magnitudes, flux per unit (1 = air-gap flux of rated V_φ at rated f). */
  readonly magnitude: { readonly bR: number; readonly bS: number; readonly bNet: number };
  /** δ electrical (signed, = angle from B_net to B_R) and its mechanical counterpart δ / (poles/2). */
  readonly deltaElec: number;
  readonly deltaMech: number;
  /** Instantaneous stator phase currents, normalised to the rated peak (±1 = √2·I_rated). */
  readonly currents: Readonly<Record<PhaseId, number>>;
}

/** Returns null when the operating point has no synchronous steady state (loss of synchronism). */
export function machineSnapshot(params: MachineParams, state: MachineState, t: number): MachineSnapshot | null {
  const op = state.op;
  if (!op) return null;
  const { vPhiRated, iRated } = deriveRatings(params);
  const pairs = state.inputs.poles / 2;
  const wt = state.omegaE * t;
  const b = fieldVectors(op, vPhiRated, state.inputs.f / params.ratedF);

  const elec = { bR: arg(b.bR) + wt, bS: arg(b.bS) + wt, bNet: arg(b.bNet) + wt };
  // Stator MMF is aligned with the internal (generator-convention) armature current phasor.
  const iAngle = arg(op.iA);
  const iAmp = op.iAMag / iRated;
  const currents = Object.fromEntries(
    PHASES.map((ph) => [ph, iAmp * Math.cos(wt + iAngle - PHASE_AXES[ph])]),
  ) as Record<PhaseId, number>;

  return {
    wt,
    elec,
    mech: { bR: elec.bR / pairs, bS: elec.bS / pairs, bNet: elec.bNet / pairs },
    magnitude: { bR: abs(b.bR), bS: abs(b.bS), bNet: abs(b.bNet) },
    deltaElec: op.delta,
    deltaMech: op.delta / pairs,
    currents,
  };
}
