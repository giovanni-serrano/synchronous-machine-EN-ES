import type { Complex } from './complex';

/**
 * MOTOR / GENERATOR selector. It fixes the direction of the shaft power:
 *  - 'generator': a prime mover pushes power INTO the shaft (P delivered to the grid);
 *  - 'motor':     a mechanical load takes power OUT of the shaft (P absorbed from the grid).
 */
export type ShaftMode = 'motor' | 'generator';

/** Chapman sign convention used to present I_A (brief §4). */
export type Convention = 'generator' | 'motor';

/** Independent inputs (brief §3.3). Everything else is derived. */
export interface MachineInputs {
  readonly mode: ShaftMode;
  /** Grid frequency, Hz (fixed by the infinite bus). */
  readonly f: number;
  /** Number of poles (even integer ≥ 2). Never called "P": P is active power. */
  readonly poles: number;
  /** Grid line voltage V_T, V (fixed by the infinite bus). */
  readonly vT: number;
  /** Magnitude of the shaft mechanical power, W (≥ 0). Lossless model: |P_elec| = load. */
  readonly load: number;
  /** Field current I_F, A (≥ 0). Determines E_A. */
  readonly iF: number;
}

/**
 * A steady-state operating point in the INTERNAL convention (brief §3.4.1):
 * generator convention, I_A positive flowing OUT of the machine, δ signed.
 * Per-phase phasors, RMS magnitudes, V_φ on the real axis.
 */
export interface OperatingPoint {
  /** Torque angle δ, rad, signed: > 0 E_A leads V_φ (generating), < 0 E_A lags V_φ (motoring). */
  readonly delta: number;
  readonly vPhi: Complex;
  readonly eA: Complex;
  /** Armature current, internal convention (out of the machine). */
  readonly iA: Complex;
  /** jX_S·I_A with the internal I_A, so that E_A = V_φ + jX_S I_A. */
  readonly jXsIA: Complex;
  /** Three-phase active power delivered TO the grid, W (signed). */
  readonly p: number;
  /** Three-phase reactive power delivered TO the grid, var (signed). */
  readonly q: number;
  /** Three-phase apparent power, VA (≥ 0). */
  readonly s: number;
  /** |I_A|, A. */
  readonly iAMag: number;
  /**
   * Power-factor angle θ = ∠V_φ − ∠I_A in the internal (generator) convention, rad, in (−π, π].
   * θ > 0: I_A lags V_φ. θ is undefined when I_A = 0; it is then reported as 0.
   */
  readonly theta: number;
  /** Electromagnetic torque on the rotor, N·m, positive in the direction of rotation (motoring). */
  readonly torque: number;
}

export type StabilityStatus = 'stable' | 'nearLimit' | 'lostSynchronism';

/** Operating label derived from the sign of P (brief §3.4.1). */
export type OperatingMode = 'motor' | 'generator' | 'noLoad';

export interface MachineWarnings {
  /** |I_A| above rated current → stator heating. */
  readonly statorOvercurrent: boolean;
  /** I_F above the field-heating limit. */
  readonly fieldOverexcitation: boolean;
}

/** Full derived state. Visual components only READ this. */
export interface MachineState {
  readonly inputs: MachineInputs;
  /** n_sync = 120 f / poles, rpm. */
  readonly nSync: number;
  /** Electrical angular frequency ω = 2πf, rad/s. */
  readonly omegaE: number;
  /** Mechanical angular speed ω_m, rad/s. */
  readonly omegaM: number;
  /** X_S at the present frequency, Ω. */
  readonly xS: number;
  /** V_φ = V_T/√3, V. */
  readonly vPhi: number;
  /** |E_A| from I_F, V. */
  readonly eA: number;
  /** Requested electrical power, internal convention (+ generating, − motoring), W. */
  readonly pRequested: number;
  /** Static stability limit P_max = 3 V_φ E_A / X_S, W (≥ 0). */
  readonly pMax: number;
  /** |P| / P_max (∞ when P_max = 0 and P ≠ 0). */
  readonly loadRatio: number;
  readonly stability: StabilityStatus;
  readonly operatingMode: OperatingMode;
  /** Chapman convention for the active mode (P sign; the selector when P = 0). */
  readonly convention: Convention;
  /** Steady-state operating point, or null when no synchronous solution exists. */
  readonly op: OperatingPoint | null;
  readonly warnings: MachineWarnings;
}
