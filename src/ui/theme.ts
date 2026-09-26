/**
 * Fixed colour per physical quantity, used everywhere in the app (brief §7). Visual only.
 *
 * Dark theme only (brief §7: dark background helps read fields and phasors; recordings use it too).
 * Surface #0f1216. Validated with the dataviz palette validator (OKLab ΔE, CVD simulation), per panel,
 * i.e. for the sets of colours that actually appear together:
 *  - phases a / b / c                        → all pairs pass (CVD ΔE ≥ 13.2, normal ΔE ≥ 19.3)
 *  - E_A / I_A (+ neutral V_φ, jX_S I_A)     → pass (CVD 9.4, normal 26.5)
 *  - P / Q (+ neutral S)                     → pass (CVD 19.5, normal 22.5)
 *  - I_A / P / Q (instantaneous-power scene) → CVD 6.5 (warn band) → labels required, always present
 * No four of the chromatic hues can pass all pairs at once, so colour never works alone: every vector,
 * curve and conductor carries a text label.
 *
 * Fields share the hue of the voltage they produce (Chapman: B_R ↔ E_A, B_net ↔ V_φ); B_S shares the
 * hue of I_A because it is aligned with the (generator-convention) armature current.
 */

export const COLORS = {
  surface: '#0f1216',
  phaseA: '#d55181',
  phaseB: '#c98500',
  phaseC: '#3987e5',
  /** V_φ and B_net — the grid's reference; neutral. */
  vPhi: '#e6e9ed',
  /** E_A and B_R. */
  eA: '#d95926',
  /** I_A and B_S. */
  iA: '#199e70',
  /** jX_S I_A — drawn dashed. */
  jXsIA: '#898781',
  p: '#9085e9',
  q: '#e66767',
  /** S — neutral hypotenuse. */
  s: '#c3c2b7',
  /** Angles (δ arcs) and UI accent — always drawn with a text label next to it. */
  accent: '#e8b04a',
  ink: '#e6e9ed',
  inkDim: '#8d97a3',
  muted: '#5c6570',
  grid: '#232a33',
  steel: '#2a313a',
  steelEdge: '#3a434e',
} as const;

export const PHASE_COLORS = { a: COLORS.phaseA, b: COLORS.phaseB, c: COLORS.phaseC } as const;

/** The resultant stator field; with no rotor it is also the net field, hence the B_net / V_φ colour. */
export const RESULTANT_COLOR = COLORS.vPhi;
