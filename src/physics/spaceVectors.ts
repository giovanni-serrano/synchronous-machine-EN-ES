/**
 * Air-gap field space vectors B_R, B_S, B_net and their link to the phasors (brief §4, §5.5).
 *
 * Following Chapman, each voltage lags the field that produces it by 90°:
 *   B_R ↔ E_A,  B_net ↔ V_φ,  B_S ↔ E_stat = −jX_S I_A.
 * So B = j·(voltage)/k with one common factor k, and the angle between B_R and B_net
 * equals δ (the angle between E_A and V_φ). δ is NOT the angle between B_R and B_S.
 *
 * Magnitudes are expressed as flux per unit: 1.0 = air-gap flux of rated V_φ at rated f
 * (φ ∝ V / ω). B_S = B_net − B_R is aligned with the internal (generator-convention) I_A.
 *
 * All angles are electrical and given in the rotating phasor frame (t = 0). At time t the
 * whole set is rotated by ωt; the animation module maps electrical → mechanical angles.
 */

import { mulJ, scale, sub, type Complex } from './complex';
import type { OperatingPoint } from './types';

export interface FieldVectors {
  readonly bR: Complex;
  readonly bS: Complex;
  readonly bNet: Complex;
}

/**
 * @param vPhiRated rated phase voltage, V (normalisation)
 * @param fRatio f / f_rated (flux ∝ V / f)
 */
export function fieldVectors(op: OperatingPoint, vPhiRated: number, fRatio: number): FieldVectors {
  const k = 1 / (vPhiRated * fRatio);
  const bNet = scale(mulJ(op.vPhi), k);
  const bR = scale(mulJ(op.eA), k);
  return { bR, bS: sub(bNet, bR), bNet };
}
