/**
 * Instantaneous per-phase power (brief §3.4.2).
 *
 *   v(t) = √2 V_φ cos(ωt),   i(t) = √2 I_A cos(ωt − θ)
 *   p(t) = v·i = P_φ [1 + cos 2ωt] + Q_φ sin 2ωt
 *   P_φ = V_φ I_A cos θ,  Q_φ = V_φ I_A sin θ
 *
 * Sign convention: θ > 0 means i lags v. p > 0 means energy flows in the reference
 * direction chosen for i (the drawing convention: out of the machine for the generator
 * convention, into it for the motor convention).
 */

export interface PhaseWaveParams {
  /** RMS phase voltage, V. */
  readonly vRms: number;
  /** RMS phase current, A. */
  readonly iRms: number;
  /** θ, rad (i lags v when θ > 0). */
  readonly theta: number;
  /** ω = 2πf, rad/s. */
  readonly omega: number;
}

export interface PhaseInstant {
  readonly v: number;
  readonly i: number;
  /** v·i, W. */
  readonly p: number;
  /** P_φ (1 + cos 2ωt): never negative, mean P_φ — energy flowing one way. */
  readonly pOneWay: number;
  /** Q_φ sin 2ωt: zero mean, amplitude Q_φ — energy going back and forth. */
  readonly pBackAndForth: number;
}

/** Phase offsets for a balanced abc sequence (electrical rad). */
export const PHASE_OFFSETS = { a: 0, b: (-2 * Math.PI) / 3, c: (2 * Math.PI) / 3 } as const;

export function phaseInstant(w: PhaseWaveParams, t: number, phaseOffset = 0): PhaseInstant {
  const wt = w.omega * t + phaseOffset;
  const v = Math.SQRT2 * w.vRms * Math.cos(wt);
  const i = Math.SQRT2 * w.iRms * Math.cos(wt - w.theta);
  const pPhi = w.vRms * w.iRms * Math.cos(w.theta);
  const qPhi = w.vRms * w.iRms * Math.sin(w.theta);
  return {
    v,
    i,
    p: v * i,
    pOneWay: pPhi * (1 + Math.cos(2 * wt)),
    pBackAndForth: qPhi * Math.sin(2 * wt),
  };
}

export interface ThreePhaseInstant {
  readonly a: PhaseInstant;
  readonly b: PhaseInstant;
  readonly c: PhaseInstant;
  /** p_a + p_b + p_c — constant (= 3 P_φ) in a balanced system. */
  readonly total: number;
}

export function threePhaseInstant(w: PhaseWaveParams, t: number): ThreePhaseInstant {
  const a = phaseInstant(w, t, PHASE_OFFSETS.a);
  const b = phaseInstant(w, t, PHASE_OFFSETS.b);
  const c = phaseInstant(w, t, PHASE_OFFSETS.c);
  return { a, b, c, total: a.p + b.p + c.p };
}
