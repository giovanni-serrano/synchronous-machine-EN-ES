/**
 * Animation time, kept separate from the steady-state physics (brief §13).
 *
 * The clock holds PHYSICAL time t (seconds of the real machine). Wall-clock time is mapped to it through a
 * slow-motion time scale, so ωt = 2π f t is always physically consistent: 50 Hz really turns slower than
 * 60 Hz, and 4 poles really turn at half the speed of 2 poles. The slow motion itself is visual only.
 */

/** Physical seconds per wall-clock second at speed ×1: 60 Hz → one electrical cycle every 2 s. */
export const BASE_TIME_SCALE = 1 / 120;

/** Speed multipliers offered in the UI. */
export const SPEED_OPTIONS = [0.25, 0.5, 1, 2] as const;
export type SpeedOption = (typeof SPEED_OPTIONS)[number];

/** Longest wall-clock frame taken into account (s): a background tab must not make the machine jump. */
export const MAX_FRAME_SECONDS = 0.1;

/** Frame-step size, electrical degrees. */
export const STEP_DEGREES = 5;

export const advanceClock = (t: number, wallDt: number, timeScale: number): number =>
  t + Math.min(Math.max(wallDt, 0), MAX_FRAME_SECONDS) * timeScale;

/** Move physical time so that ωt changes by `electricalDegrees`. */
export const stepClock = (t: number, f: number, electricalDegrees: number): number =>
  t + electricalDegrees / 360 / f;

/** ωt, rad (unwrapped). */
export const electricalAngle = (t: number, f: number): number => 2 * Math.PI * f * t;

/** How many times slower than real time the animation runs. */
export const slowMotionFactor = (speed: number): number => 1 / (BASE_TIME_SCALE * speed);
