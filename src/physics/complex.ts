/**
 * Minimal complex-number helpers for phasor arithmetic.
 * Immutable, pure functions. Angles in radians.
 */

export interface Complex {
  readonly re: number;
  readonly im: number;
}

export const complex = (re: number, im = 0): Complex => ({ re, im });

export const ZERO: Complex = complex(0, 0);
export const J: Complex = complex(0, 1);

export const polar = (magnitude: number, angle: number): Complex =>
  complex(magnitude * Math.cos(angle), magnitude * Math.sin(angle));

export const add = (a: Complex, b: Complex): Complex => complex(a.re + b.re, a.im + b.im);

export const sub = (a: Complex, b: Complex): Complex => complex(a.re - b.re, a.im - b.im);

export const mul = (a: Complex, b: Complex): Complex =>
  complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);

export const div = (a: Complex, b: Complex): Complex => {
  const d = b.re * b.re + b.im * b.im;
  return complex((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};

export const scale = (a: Complex, k: number): Complex => complex(a.re * k, a.im * k);

export const neg = (a: Complex): Complex => complex(-a.re, -a.im);

export const conj = (a: Complex): Complex => complex(a.re, -a.im);

/** Multiply by j: a rotation of +90°. */
export const mulJ = (a: Complex): Complex => complex(-a.im, a.re);

export const abs = (a: Complex): number => Math.hypot(a.re, a.im);

export const arg = (a: Complex): number => Math.atan2(a.im, a.re);

/** Wrap an angle to (-π, π]. */
export const wrapAngle = (angle: number): number => {
  const twoPi = 2 * Math.PI;
  let a = angle % twoPi;
  if (a <= -Math.PI) a += twoPi;
  if (a > Math.PI) a -= twoPi;
  return a;
};

export const DEG = Math.PI / 180;
export const toDeg = (rad: number): number => rad / DEG;
export const toRad = (deg: number): number => deg * DEG;
