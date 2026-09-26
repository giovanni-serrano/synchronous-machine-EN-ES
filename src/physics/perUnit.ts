/**
 * Per-unit system of the reference machine. Bases are the machine ratings
 * (three-phase S, rated line voltage) and do not change with the operating point.
 */

import { deriveRatings, type MachineParams } from './machine';

export interface PerUnitBases {
  /** Three-phase power base (W, var, VA). */
  readonly s: number;
  readonly vLine: number;
  readonly vPhase: number;
  readonly i: number;
  readonly z: number;
}

export function perUnitBases(p: MachineParams): PerUnitBases {
  const r = deriveRatings(p);
  return { s: p.ratedS, vLine: p.ratedVT, vPhase: r.vPhiRated, i: r.iRated, z: r.zBase };
}
