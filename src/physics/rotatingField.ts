/**
 * Rotating magnetic field from three balanced currents (brief §5.1).
 *
 * Phase magnetic axes at 0°, 120°, 240° electrical; currents
 *   i_a = I cos ωt,  i_b = I cos(ωt − 120°),  i_c = I cos(ωt − 240°).
 * Each phase contributes a PULSATING vector along its own axis; the sum has constant
 * magnitude 1.5·B_M and rotates counterclockwise at ω (electrical).
 * In a P-pole machine the pattern repeats P/2 times around the air gap, so the field
 * turns at ω / (P/2) mechanically.
 */

import { add, polar, scale, type Complex } from './complex';

export type PhaseId = 'a' | 'b' | 'c';

/** Magnetic axis of each phase winding, electrical rad. */
export const PHASE_AXES: Readonly<Record<PhaseId, number>> = {
  a: 0,
  b: (2 * Math.PI) / 3,
  c: (4 * Math.PI) / 3,
};

export interface PhaseContribution {
  /** Instantaneous current (normalised to peak = 1 × amplitude). */
  readonly current: number;
  /** Field contribution along the phase axis (electrical frame). */
  readonly vector: Complex;
}

export interface StatorField {
  readonly a: PhaseContribution;
  readonly b: PhaseContribution;
  readonly c: PhaseContribution;
  /** Resultant: magnitude 1.5 × amplitude, angle ωt. */
  readonly net: Complex;
}

/**
 * @param wt electrical angle ωt, rad
 * @param amplitude peak field of one phase B_M (any unit)
 */
export function statorField(wt: number, amplitude = 1): StatorField {
  const contribution = (phase: PhaseId): PhaseContribution => {
    const axis = PHASE_AXES[phase];
    const current = amplitude * Math.cos(wt - axis);
    return { current, vector: scale(polar(1, axis), current) };
  };
  const a = contribution('a');
  const b = contribution('b');
  const c = contribution('c');
  return { a, b, c, net: add(add(a.vector, b.vector), c.vector) };
}
