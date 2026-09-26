import { describe, expect, it } from 'vitest';
import { abs, arg, statorField, wrapAngle } from '../../src/physics';
import { expectRel } from '../helpers';

describe('rotating magnetic field (brief §5.1)', () => {
  const angles = Array.from({ length: 721 }, (_, k) => (k * 2 * Math.PI) / 720);

  it('the resultant of three pulsating phase fields has constant magnitude 1.5 B_M', () => {
    for (const wt of angles) expectRel(abs(statorField(wt, 2).net), 3, 1e-12, 1e-12);
  });

  it('the resultant rotates counterclockwise at ω: its angle equals ωt', () => {
    for (const wt of angles) expectRel(wrapAngle(arg(statorField(wt).net) - wt), 0, 0, 1e-12);
  });

  it('each phase contribution only pulsates along its own axis', () => {
    for (const wt of angles.slice(0, 100)) {
      const f = statorField(wt);
      expect(Math.abs(f.a.vector.im)).toBeLessThan(1e-12); // axis a at 0°
      expectRel(f.a.vector.re, Math.cos(wt), 0, 1e-12);
      expectRel(abs(f.b.vector), Math.abs(Math.cos(wt - (2 * Math.PI) / 3)), 0, 1e-12);
    }
  });
});
