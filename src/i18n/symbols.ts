/**
 * Language-independent symbols and units (brief §7.1: symbols are the same in both languages,
 * following Chapman). Symbols that differ between Chapman editions live in the dictionaries
 * under `symbols` (e.g. n_sync / n_sinc, PF / FP).
 */

export const SYMBOLS = {
  vPhi: 'V_φ',
  vT: 'V_T',
  eA: 'E_A',
  iA: 'I_A',
  iL: 'I_L',
  xS: 'X_S',
  rA: 'R_A',
  iF: 'I_F',
  theta: 'θ',
  delta: 'δ',
  bR: 'B_R',
  bS: 'B_S',
  bNet: 'B_net',
  nM: 'n_m',
  p: 'P',
  q: 'Q',
  s: 'S',
  pMax: 'P_max',
  torque: 'τ_ind',
  f: 'f',
  jXsIA: 'jX_S I_A',
} as const;

export const UNITS = {
  watt: 'W',
  var: 'var',
  voltAmpere: 'VA',
  volt: 'V',
  ampere: 'A',
  hertz: 'Hz',
  rpm: 'rpm',
  ohm: 'Ω',
  newtonMetre: 'N·m',
  degree: '°',
  perUnit: 'pu',
} as const;
