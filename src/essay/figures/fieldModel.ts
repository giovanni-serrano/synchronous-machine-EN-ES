/**
 * The stator's air-gap flux density as the figures draw it, straight from the model (src/physics/rotatingField.ts):
 * each energised coil contributes its own sinusoidal distribution, sinusoidalGapField(θ, axis, 2, i); with all three
 * coils on, the total is exactly airGapFluxDensity(θ, ωt, 2) (tested). Outward (into the stator iron) is positive:
 * flux ENTERS the stator where B_r > 0 (a stator S face) and LEAVES it where B_r < 0 (an N face).
 */

import { PHASES, PHASE_AXES, sinusoidalGapField, type PhaseId } from '../../physics';

export type Energised = Readonly<Record<PhaseId, boolean>>;

export interface GapField {
  /** Peak |B_r| (per unit of one phase's peak). */
  readonly amp: number;
  /** Mechanical angle of the peak outward flux (the S face; the field inside the bore points here), rad. */
  readonly axis: number;
  /** B_r(θ), outward positive. */
  at(theta: number): number;
}

/** Stator field of the energised coils at ωt, scaled by `envelope` (0 … 1, used to fade currents in and out). */
export function statorGapField(wt: number, on: Energised, envelope = 1): GapField {
  const currents = PHASES.map((ph) => ({ axis: PHASE_AXES[ph], i: on[ph] ? envelope * Math.cos(wt - PHASE_AXES[ph]) : 0 }));
  const at = (theta: number) => currents.reduce((s, c) => s + sinusoidalGapField(theta, c.axis, 2, c.i), 0);
  // The sum of sinusoids of the same spatial period is one sinusoid: find its amplitude and axis from two samples.
  const re = at(0);
  const im = at(Math.PI / 2);
  return { amp: Math.hypot(re, im), axis: Math.atan2(im, re), at };
}
