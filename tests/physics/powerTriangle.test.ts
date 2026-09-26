import { describe, expect, it } from 'vitest';
import {
  armatureCurrentAtPf,
  gridView,
  powerTriangle,
  presentOperatingPoint,
  solveFieldForPowerFactor,
  solveMachine,
  withSignedPower,
} from '../../src/physics';
import { M, expectRel, inputs } from '../helpers';

const V_PHI = M.ratedVT / Math.sqrt(3); // 277.13 V

describe('power triangle S = P + jQ (brief §5.8)', () => {
  it('|S|² = P² + Q², P ≥ 0 in the mode convention, θ = atan2(Q, P) and PF = cos θ, over a grid of operating points', () => {
    let n = 0;
    for (const mode of ['motor', 'generator'] as const)
      for (let load = 0; load <= 120_000; load += 20_000)
        for (let iF = 2; iF <= 10; iF += 1) {
          const s = solveMachine(M, inputs({ mode, load, iF }));
          if (!s.op) continue;
          n++;
          const t = powerTriangle(s.op, s.convention);
          expectRel(t.s * t.s, t.p * t.p + t.q * t.q, 1e-9, 1e-3);
          expect(t.p).toBeGreaterThanOrEqual(-1e-6);
          expectRel(Math.cos(t.theta), t.pf, 1e-9, 1e-12);
          if (t.pfKind === 'lagging') expect(t.q).toBeGreaterThan(0);
          if (t.pfKind === 'leading') expect(t.q).toBeLessThan(0);
        }
    expect(n).toBeGreaterThan(80);
  });

  it('over-excited: Q up (lagging) for the generator, Q down (leading) for the motor — and the grid receives Q in both', () => {
    const gen = solveMachine(M, inputs({ mode: 'generator', load: 60_000, iF: 8.5 }));
    const mot = solveMachine(M, inputs({ mode: 'motor', load: 60_000, iF: 8.5 }));
    const tg = powerTriangle(gen.op!, gen.convention);
    const tm = powerTriangle(mot.op!, mot.convention);
    expect(tg.pfKind).toBe('lagging');
    expect(tg.q).toBeGreaterThan(0);
    expect(tm.pfKind).toBe('leading');
    expect(tm.q).toBeLessThan(0);
    expect(gridView(gen.op!).q.direction).toBe('delivers');
    expect(gridView(mot.op!).q.direction).toBe('delivers');
  });

  it('under-excited: Q down (leading) for the generator, Q up (lagging) for the motor', () => {
    const gen = solveMachine(M, inputs({ mode: 'generator', load: 40_000, iF: 3.5 }));
    const mot = solveMachine(M, inputs({ mode: 'motor', load: 40_000, iF: 3.5 }));
    expect(powerTriangle(gen.op!, gen.convention).pfKind).toBe('leading');
    expect(powerTriangle(mot.op!, mot.convention).pfKind).toBe('lagging');
  });

  it('agrees with presentOperatingPoint (PF, kind, |θ|) and does not depend on a locked drawing convention', () => {
    for (let p = -110_000; p <= 110_000; p += 10_000)
      for (const iF of [3.5, 5, 7, 9]) {
        const s = solveMachine(M, withSignedPower(inputs({ iF }), p));
        if (!s.op) continue;
        const t = powerTriangle(s.op, s.convention);
        for (const locked of ['motor', 'generator'] as const) {
          const pr = presentOperatingPoint(s.op, s.convention, locked);
          expect(t.pfKind).toBe(pr.pfKind);
          expectRel(t.pf, pr.pf, 1e-12, 1e-12);
          expectRel(Math.abs(t.theta), pr.thetaMag, 1e-9, 1e-9);
        }
      }
  });

  it('no load, E_A = V_φ: S = 0 reports PF 1, unity, θ = 0', () => {
    const s = solveMachine(M, inputs({ mode: 'generator', load: 0, iF: M.ifNoLoad }));
    const t = powerTriangle(s.op!, s.convention);
    expectRel(t.s, 0, 0, 1e-6);
    expect(t.pfKind).toBe('unity');
    expect(t.pf).toBe(1);
    expect(t.theta).toBe(0);
  });
});

describe('power-factor targets at the same P (brief §5.9)', () => {
  // Hand values: I_A = P / (3 V_φ PF), 3 V_φ = 831.38 V.
  it('I_A = |P| / (3 V_φ PF): 100 kW → 120.28 A at PF 1, 133.64 A at 0.90, 171.83 A at 0.70', () => {
    expectRel(armatureCurrentAtPf(100_000, V_PHI, 1), 120.28, 1e-4);
    expectRel(armatureCurrentAtPf(100_000, V_PHI, 0.9), 133.64, 1e-4);
    expectRel(armatureCurrentAtPf(100_000, V_PHI, 0.7), 171.83, 1e-4);
    expectRel(armatureCurrentAtPf(-100_000, V_PHI, 0.9), 133.64, 1e-4); // sign of P does not matter
  });

  const targets = [
    { pf: 1, kind: 'unity' },
    { pf: 0.9, kind: 'lagging' },
    { pf: 0.9, kind: 'leading' },
    { pf: 0.7, kind: 'lagging' },
  ] as const;

  for (const mode of ['motor', 'generator'] as const)
    for (const target of targets)
      it(`${mode}, 80 kW, PF ${target.pf} ${target.kind}: the solved I_F gives that PF, and I_A matches |P| / (3 V_φ PF)`, () => {
        const base = inputs({ mode, load: 80_000 });
        const sol = solveFieldForPowerFactor(M, base, target.pf, target.kind);
        expect(sol.feasible).toBe(true);
        const s = solveMachine(M, { ...base, iF: sol.iF });
        const t = powerTriangle(s.op!, s.convention);
        expect(t.pfKind).toBe(target.kind);
        expectRel(t.pf, target.pf, 1e-9, 1e-9);
        expectRel(t.p, 80_000, 1e-9, 1e-6);
        expectRel(s.op!.iAMag, armatureCurrentAtPf(80_000, V_PHI, target.pf), 1e-9, 1e-9);
      });

  it('same P, lower PF → more current; lagging and leading at the same PF need the same current', () => {
    const base = inputs({ mode: 'generator', load: 80_000 });
    const iAt = (pf: number, kind: 'unity' | 'lagging' | 'leading') =>
      solveMachine(M, { ...base, iF: solveFieldForPowerFactor(M, base, pf, kind).iF }).op!.iAMag;
    expect(iAt(0.9, 'lagging')).toBeGreaterThan(iAt(1, 'unity'));
    expect(iAt(0.7, 'lagging')).toBeGreaterThan(iAt(0.9, 'lagging'));
    expectRel(iAt(0.9, 'lagging'), iAt(0.9, 'leading'), 1e-9);
  });
});
