import { describe, expect, it } from 'vitest';
import { airGapFluxDensity, synchronousSpeed } from '../src/physics';
import { POLE_OPTIONS, polesField } from '../src/essay/figures/PolesFigure';
import { ESSAY_EA, ESSAY_PMAX, opAt, rotorGeometry } from '../src/essay/figures/rotorScene';
import { expectRel } from './helpers';

const DEG = Math.PI / 180;
const G = { cx: 0, cy: 0, ro: 100, rb: 70 };

describe('§4 poles: the drawn field is the model’s, and turns at ω / (poles/2)', () => {
  for (const poles of POLE_OPTIONS)
    it(`${poles} poles: S peaks every 360°/(poles/2), n_sync = ${synchronousSpeed(60, poles)} rpm`, () => {
      const pairs = poles / 2;
      const wt = 0.7;
      const f = polesField(wt, poles);
      for (let k = 0; k < pairs; k++) expectRel(f.at(f.axis + (2 * Math.PI * k) / pairs), 1.5, 1e-12);
      for (let k = 0; k < pairs; k++) expectRel(f.at(f.axis + (Math.PI * (2 * k + 1)) / pairs), -1.5, 1e-12);
      expectRel(f.at(0.3), airGapFluxDensity(0.3, wt, poles), 1e-12, 1e-12);
      // mechanical rotation per electrical radian
      expectRel(polesField(wt + 0.2, poles).axis - f.axis, 0.2 / pairs, 1e-12);
      expect(synchronousSpeed(60, poles)).toBe(7200 / poles);
    });
});

describe('§6–§7: the rotor scene uses the model’s operating point', () => {
  it('E_A = 367 V (scenario A), P_max = 3 V_φ E_A / X_S ≈ 152.6 kW, and δ = 41° gives the rated 100 kW', () => {
    expectRel(ESSAY_EA, 367.0, 2e-3);
    expectRel(ESSAY_PMAX, 152_600, 2e-3);
    expectRel(Math.abs(opAt(-41 * DEG).p), 100_000, 3e-3);
    expect(opAt(-41 * DEG).p).toBeLessThan(0); // motor: P taken from the grid (internal convention)
    expect(opAt(41 * DEG).p).toBeGreaterThan(0); // generator
  });

  it('the rotor field B_R sits δ behind B_net for a motor and ahead of it for a generator', () => {
    for (const d of [-60, -20, 0, 25, 70]) {
      const rg = rotorGeometry(G, { wt: 1.1, delta: d * DEG });
      const rel = Math.atan2(Math.sin(rg.rotorAngle - rg.netAngle), Math.cos(rg.rotorAngle - rg.netAngle));
      expectRel(rel, d * DEG, 1e-9, 1e-9);
      expectRel(rg.bNet, 1, 1e-9); // the grid holds the net field at rated flux
    }
  });
});
