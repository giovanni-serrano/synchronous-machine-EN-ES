import { describe, expect, it } from 'vitest';
import {
  BASE_TIME_SCALE,
  MAX_FRAME_SECONDS,
  advanceClock,
  electricalAngle,
  slowMotionFactor,
  stepClock,
} from '../src/animation/clock';

describe('animation clock (separate from steady-state physics)', () => {
  it('advances physical time by wall time × time scale', () => {
    expect(advanceClock(0, 0.05, BASE_TIME_SCALE)).toBeCloseTo(0.05 * BASE_TIME_SCALE, 15);
  });

  it('caps long frames so a background tab does not make the machine jump', () => {
    expect(advanceClock(0, 5, 1)).toBeCloseTo(MAX_FRAME_SECONDS, 15);
    expect(advanceClock(1, -1, 1)).toBe(1);
  });

  it('at speed ×1, one 60 Hz electrical cycle takes 2 s of wall time (120× slower)', () => {
    let t = 0;
    for (let k = 0; k < 20; k++) t = advanceClock(t, 0.1, BASE_TIME_SCALE);
    expect(electricalAngle(t, 60)).toBeCloseTo(2 * Math.PI, 9);
    expect(slowMotionFactor(1)).toBeCloseTo(120, 9);
  });

  it('steps by an electrical angle regardless of frequency', () => {
    expect(electricalAngle(stepClock(0, 60, 5), 60)).toBeCloseTo((5 * Math.PI) / 180, 12);
    expect(electricalAngle(stepClock(0, 50, -5), 50)).toBeCloseTo((-5 * Math.PI) / 180, 12);
  });
});
