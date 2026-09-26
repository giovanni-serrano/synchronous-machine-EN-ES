/**
 * Rotating magnetic field from three balanced currents (brief §5.1).
 *
 * Phase magnetic axes at 0°, 120°, 240° electrical; currents
 *   i_a = I cos ωt,  i_b = I cos(ωt − 120°),  i_c = I cos(ωt − 240°).
 * Each phase contributes a PULSATING vector along its own axis; the sum has constant
 * magnitude 1.5·B_M and rotates counterclockwise at ω (electrical).
 * With a given number of poles the pattern repeats poles/2 times around the air gap, so the field
 * turns at ω / (poles/2) mechanically.
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

export const PHASES: readonly PhaseId[] = ['a', 'b', 'c'];

/**
 * Radial air-gap flux density of the stator field (fundamental), positive pointing OUTWARD
 * (from the bore into the stator iron):
 *   B_r(θ_mech, t) = 1.5 B_M cos((poles/2)·θ_mech − ωt)
 * For 2 poles its peak lies along the resultant space vector.
 */
export const airGapFluxDensity = (thetaMech: number, wt: number, poles: number, amplitude = 1): number =>
  1.5 * amplitude * Math.cos((poles / 2) * thetaMech - wt);

export interface PoleFace {
  /** Mechanical angle of the pole-face centre, rad in [0, 2π). */
  readonly angle: number;
  /**
   * 'S' where flux ENTERS the stator (B_r > 0, outward), 'N' where it LEAVES the stator (B_r < 0).
   * The resultant space vector points at a stator S face — where a rotor N pole would align.
   */
  readonly kind: 'N' | 'S';
}

const TWO_PI = 2 * Math.PI;
const wrap2Pi = (a: number): number => ((a % TWO_PI) + TWO_PI) % TWO_PI;

/** Centres of the stator pole faces: poles/2 S faces and poles/2 N faces, alternating. */
export function statorPoleFaces(wt: number, poles: number): PoleFace[] {
  const pairs = poles / 2;
  const faces: PoleFace[] = [];
  for (let k = 0; k < pairs; k++) {
    faces.push({ angle: wrap2Pi((wt + TWO_PI * k) / pairs), kind: 'S' });
    faces.push({ angle: wrap2Pi((wt + Math.PI + TWO_PI * k) / pairs), kind: 'N' });
  }
  return faces.sort((x, y) => x.angle - y.angle);
}

export interface Conductor {
  readonly phase: PhaseId;
  /**
   * 'go': a positive phase current flows OUT of the page (dot); 'return': INTO the page (cross).
   * For a phase with magnetic axis α (electrical), 'go' sits at α + 90° and 'return' at α − 90°,
   * which makes a positive current produce a field along +α (right-hand rule).
   */
  readonly side: 'go' | 'return';
  /** Mechanical angle, rad in [0, 2π). */
  readonly angle: number;
}

/** Coil sides of a concentrated three-phase winding (one coil per phase per pole pair). */
export function windingConductors(poles: number): Conductor[] {
  const pairs = poles / 2;
  const out: Conductor[] = [];
  for (const phase of PHASES)
    for (let k = 0; k < pairs; k++) {
      const axis = PHASE_AXES[phase];
      out.push({ phase, side: 'go', angle: wrap2Pi((axis + Math.PI / 2 + TWO_PI * k) / pairs) });
      out.push({ phase, side: 'return', angle: wrap2Pi((axis - Math.PI / 2 + TWO_PI * k) / pairs) });
    }
  return out;
}
