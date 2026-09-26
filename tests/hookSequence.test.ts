import { describe, expect, it } from 'vitest';
import { HOOK_LAG, HOOK_LOOP_S, HOOK_STAGES, hookFrame } from '../src/essay/figures/hookSequence';

describe('hook loop timeline', () => {
  it('stages in order: empty machine, field alone, then the rotor appears and locks on', () => {
    const order = HOOK_STAGES.map(([s]) => s);
    expect(order).toEqual(['empty', 'energise', 'field', 'rotor', 'lockIn', 'locked', 'fade']);
    let t = 0;
    for (const [stage, dur] of HOOK_STAGES) {
      const f = hookFrame(t + dur / 2);
      expect(f.stage).toBe(stage);
      if (stage === 'empty') expect(f.envelope).toBe(0);
      if (stage === 'field') expect([f.envelope, f.rotor]).toEqual([1, 0]); // the magnet turns in an EMPTY machine
      if (stage === 'locked') expect(f.lag).toBe(HOOK_LAG);
      t += dur;
    }
  });

  it('no jumps: envelope, rotor visibility and lag change smoothly, including across the loop restart', () => {
    const dt = 1 / 120;
    let prev = hookFrame(0);
    for (let t = dt; t <= 2 * HOOK_LOOP_S; t += dt) {
      const f = hookFrame(t);
      expect(Math.abs(f.envelope - prev.envelope), `envelope at ${t.toFixed(2)} s`).toBeLessThan(0.03);
      expect(Math.abs(f.rotor - prev.rotor), `rotor at ${t.toFixed(2)} s`).toBeLessThan(0.03);
      if (f.rotor > 0.01 && prev.rotor > 0.01) expect(Math.abs(f.lag - prev.lag), `lag at ${t.toFixed(2)} s`).toBeLessThan(0.05);
      prev = f;
    }
  });
});
