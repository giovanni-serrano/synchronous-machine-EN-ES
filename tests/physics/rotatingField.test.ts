import { describe, expect, it } from 'vitest';
import {
  PHASE_AXES,
  abs,
  airGapFluxDensity,
  arg,
  statorField,
  statorPoleFaces,
  windingConductors,
  wrapAngle,
} from '../../src/physics';
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

describe('winding drawing is consistent with the right-hand rule (Biot–Savart)', () => {
  it('2 poles: the field of the drawn conductors at the centre points along the resultant ωt', () => {
    const conductors = windingConductors(2);
    for (let deg = 0; deg < 360; deg += 7.5) {
      const wt = (deg * Math.PI) / 180;
      let bx = 0;
      let by = 0;
      for (const c of conductors) {
        // phase current; 'return' carries it into the page (negative z)
        const i = Math.cos(wt - PHASE_AXES[c.phase]) * (c.side === 'go' ? 1 : -1);
        // infinite wire at angle φ, current +z: B at origin ∝ I·(sin φ, −cos φ)
        bx += i * Math.sin(c.angle);
        by += i * -Math.cos(c.angle);
      }
      expectRel(wrapAngle(Math.atan2(by, bx) - wt), 0, 0, 1e-9);
    }
  });

  it('more poles repeat the 2-pole pattern poles/2 times (mechanical = electrical / (poles/2))', () => {
    const base = windingConductors(2).map((c) => `${c.phase}${c.side}${c.angle.toFixed(9)}`).sort();
    for (const poles of [4, 6, 8]) {
      const conductors = windingConductors(poles);
      expect(conductors).toHaveLength(6 * (poles / 2));
      const folded = conductors
        .map((c) => {
          const e = (((c.angle * poles) / 2) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
          return `${c.phase}${c.side}${e.toFixed(9)}`;
        })
        .sort();
      expect(new Set(folded)).toEqual(new Set(base));
    }
  });
});

describe('air-gap field and stator pole faces (brief §5.2)', () => {
  it('there are exactly `poles` faces, alternating N and S', () => {
    for (const poles of [2, 4, 6, 8]) {
      const faces = statorPoleFaces(0.7, poles);
      expect(faces).toHaveLength(poles);
      for (let k = 0; k < faces.length; k++)
        expect(faces[k]!.kind).not.toBe(faces[(k + 1) % faces.length]!.kind);
    }
  });

  it('flux enters the stator at S faces (B_r > 0, peak) and leaves at N faces', () => {
    for (const poles of [2, 4, 6])
      for (const wt of [0, 1, 2.5, 4]) {
        for (const face of statorPoleFaces(wt, poles)) {
          const b = airGapFluxDensity(face.angle, wt, poles);
          expectRel(b, face.kind === 'S' ? 1.5 : -1.5, 0, 1e-9);
        }
      }
  });

  it('2 poles: the S face lies along the resultant; the pattern turns at ω / (poles/2) mechanically', () => {
    const wt = 1.1;
    const s2 = statorPoleFaces(wt, 2).find((f) => f.kind === 'S')!;
    expectRel(s2.angle, wt, 0, 1e-12);
    expectRel(arg(statorField(wt).net), wt, 0, 1e-12);
    const s4 = statorPoleFaces(wt, 4).filter((f) => f.kind === 'S').map((f) => f.angle);
    expect(s4.some((a) => Math.abs(a - wt / 2) < 1e-12)).toBe(true);
  });
});
