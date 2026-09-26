/**
 * Reference machine (brief §3.7) and its derived ratings.
 *
 * Every number shown by the app for "the machine" comes from here.
 * Model assumptions (brief §3.2): infinite bus, cylindrical rotor, R_A = 0,
 * no saturation (E_A ∝ I_F on the air-gap line), balanced Y connection.
 */

export interface MachineParams {
  /** Rated three-phase apparent power, VA. */
  readonly ratedS: number;
  /** Rated line (terminal) voltage V_T, V. */
  readonly ratedVT: number;
  /** Rated frequency, Hz. */
  readonly ratedF: number;
  /** Default number of poles. */
  readonly ratedPoles: number;
  /** Rated power factor (lagging, generator convention). Used to define the field-heating limit. */
  readonly ratedPF: number;
  /** Synchronous reactance per phase at rated frequency, Ω. X_S = ω L_S scales with f. */
  readonly xsAtRatedF: number;
  /** Field current that gives E_A = rated V_φ at rated frequency (air-gap line), A. */
  readonly ifNoLoad: number;
  /** Upper end of the excitation slider, A. */
  readonly ifMax: number;
}

export const REFERENCE_MACHINE: MachineParams = {
  ratedS: 100_000,
  ratedVT: 480,
  ratedF: 60,
  ratedPoles: 4,
  ratedPF: 0.8,
  xsAtRatedF: 2.0,
  ifNoLoad: 5.0,
  ifMax: 10.0,
};

export interface MachineRatings {
  /** Rated phase voltage V_φ = V_T / √3, V. */
  readonly vPhiRated: number;
  /** Rated armature (= line, Y connection) current, A. */
  readonly iRated: number;
  /** Base impedance Z_base = V_T² / S, Ω. */
  readonly zBase: number;
  /** X_S in per unit at rated frequency. */
  readonly xsPu: number;
  /** Air-gap-line slope at rated frequency: E_A = kField · I_F, V/A. */
  readonly kField: number;
  /** E_A at the field-heating limit (rated S at rated PF lagging, generator), V. */
  readonly eAFieldLimit: number;
  /** Field current at the field-heating limit, A. */
  readonly ifRated: number;
}

export function deriveRatings(p: MachineParams): MachineRatings {
  const vPhiRated = p.ratedVT / Math.sqrt(3);
  const iRated = p.ratedS / (Math.sqrt(3) * p.ratedVT);
  const zBase = (p.ratedVT * p.ratedVT) / p.ratedS;
  const kField = vPhiRated / p.ifNoLoad;

  // Field limit: generator at rated S, rated PF lagging (Chapman's usual rating point).
  // Generator convention: E_A = V_φ + jX_S I_A, with I_A = I_rated ∠ −acos(PF).
  const theta = Math.acos(p.ratedPF);
  const iRe = iRated * Math.cos(-theta);
  const iIm = iRated * Math.sin(-theta);
  const eRe = vPhiRated - p.xsAtRatedF * iIm;
  const eIm = p.xsAtRatedF * iRe;
  const eAFieldLimit = Math.hypot(eRe, eIm);

  return {
    vPhiRated,
    iRated,
    zBase,
    xsPu: p.xsAtRatedF / zBase,
    kField,
    eAFieldLimit,
    ifRated: eAFieldLimit / kField,
  };
}

/** X_S = ω L_S: scales linearly with frequency (brief §3.5). */
export const synchronousReactance = (p: MachineParams, f: number): number =>
  p.xsAtRatedF * (f / p.ratedF);

/**
 * E_A = K φ ω with φ ∝ I_F (no saturation): E_A = kField · I_F · (f / f_rated).
 * I_F is clamped at 0 (a field current is never negative in this model).
 */
export function internalVoltageFromField(p: MachineParams, iF: number, f: number): number {
  const { kField } = deriveRatings(p);
  return kField * Math.max(0, iF) * (f / p.ratedF);
}

/** Inverse of {@link internalVoltageFromField}. */
export function fieldFromInternalVoltage(p: MachineParams, eA: number, f: number): number {
  const { kField } = deriveRatings(p);
  return eA / (kField * (f / p.ratedF));
}

/** n_sync = 120 f / poles, rpm. */
export const synchronousSpeed = (f: number, poles: number): number => (120 * f) / poles;

/** Electrical angle → mechanical angle: θ_mech = θ_elec / (poles/2). */
export const electricalToMechanical = (angleElec: number, poles: number): number =>
  angleElec / (poles / 2);
