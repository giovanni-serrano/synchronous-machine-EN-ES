/**
 * Essay palette (docs/experience-redesign.md §3): one colour per concept, neutrals for everything else.
 * Contrast on INK.bg: text 17.0:1, textDim 9.3:1, textFaint 5.5:1; every concept colour ≥ 6.9:1.
 * Labels are always drawn in the neutral inks, never in a concept colour.
 */

export const INK = {
  bg: '#0d0f12',
  text: '#f4f1ea',
  textDim: '#b9b4a8',
  textFaint: '#8e897f',
  steel: '#1c2027',
  steelEdge: '#343a43',
  steelLight: '#262b33',
  hairline: '#3a3f47',
} as const;

export const CONCEPT = {
  /** B_net ↔ V_φ: the grid, the reference. */
  net: '#f4f1ea',
  /** B_R ↔ E_A. */
  rotor: '#ff9a4a',
  /** B_S ↔ I_A (stator currents). */
  stator: '#40c4ff',
  p: '#b5e35a',
  q: '#ff6f9f',
} as const;

/** Phase colours — sections 3–4 and the lab only. */
export const PHASE_COLOR = {
  a: '#ff6b6b',
  b: '#ffd24a',
  c: '#3ddc97',
} as const;

export const SERIF = '"Source Serif 4 Variable", "Source Serif 4", Georgia, serif';
export const MONO = '"IBM Plex Mono", ui-monospace, monospace';

/** rgba() from a #rrggbb colour. */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, Math.min(1, a))})`;
}
