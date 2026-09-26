import { describe, expect, it } from 'vitest';
import {
  constantPowerLoci,
  powerAngleCurve,
  presentOperatingPoint,
  solveFieldForPowerFactor,
  solveMachine,
  vCurve,
  vCurveLandmarks,
} from '../../src/physics';
import { M, expectRel, inputs } from '../helpers';

describe('constant P while the excitation changes (brief §5.10)', () => {
  for (const mode of ['motor', 'generator'] as const) {
    it(`${mode}: E_A sin δ and I_A cos θ stay constant; tips lie on the constant-power lines`, () => {
      const base = inputs({ mode, load: 60_000 });
      const loci = constantPowerLoci(M, base);
      let stableCount = 0;
      for (let iF = 3; iF <= 10; iF += 0.25) {
        const s = solveMachine(M, { ...base, iF });
        if (!s.op) continue;
        stableCount++;
        expectRel(s.op.eA.im, loci.eAImag, 1e-9, 1e-9); // E_A sin δ
        expectRel(s.op.iA.re, loci.iAReal, 1e-9, 1e-9); // I_A cos θ (internal)
        expectRel(s.eA * Math.sin(s.op.delta), (s.pRequested * s.xS) / (3 * s.vPhi), 1e-9, 1e-9);
      }
      expect(stableCount).toBeGreaterThan(20);
    });
  }
});

describe('V curves (brief §5.11)', () => {
  for (const load of [0, 25_000, 50_000, 80_000, 100_000]) {
    it(`minimum of the V curve at P = ${load / 1000} kW occurs at unity PF`, () => {
      const base = inputs({ mode: 'generator', load });
      const fields = Array.from({ length: 4001 }, (_, k) => (10 * k) / 4000);
      const pts = vCurve(M, base, fields).filter((p) => p.stable);
      const min = pts.reduce((a, b) => (b.iA < a.iA ? b : a));
      const lm = vCurveLandmarks(M, base);
      expect(Math.abs(min.iF - lm.iFUnity)).toBeLessThanOrEqual(10 / 4000 + 1e-12);
      expectRel(min.iA, lm.iAMin, 1e-3, 1e-3);
      // At the landmark itself the solver gives exactly unity PF
      const s = solveMachine(M, { ...base, iF: lm.iFUnity });
      expectRel(s.op!.q, 0, 0, 1e-6 * M.ratedS);
      expectRel(s.op!.iAMag, lm.iAMin, 1e-9, 1e-9);
    });
  }

  it('the V curve agrees with the full solver point by point', () => {
    const base = inputs({ mode: 'motor', load: 70_000 });
    for (const p of vCurve(M, base, [3, 4, 5, 6, 7, 8, 9, 10])) {
      const s = solveMachine(M, { ...base, iF: p.iF });
      expect(p.stable).toBe(s.op !== null);
      if (s.op) {
        expectRel(p.iA, s.op.iAMag, 1e-9, 1e-9);
        expectRel(p.q, s.op.q, 1e-9, 1e-6);
      }
    }
  });

  it('the left end of each V curve is the stability limit (δ = 90°)', () => {
    const base = inputs({ mode: 'generator', load: 80_000 });
    const lm = vCurveLandmarks(M, base);
    const at = solveMachine(M, { ...base, iF: lm.iFStabilityLimit * (1 + 1e-9) });
    expect(at.op).not.toBeNull();
    expect(at.op!.delta).toBeCloseTo(Math.PI / 2, 3);
    const below = solveMachine(M, { ...base, iF: lm.iFStabilityLimit * 0.99 });
    expect(below.stability).toBe('lostSynchronism');
  });
});

describe('static stability limit (brief §3.6)', () => {
  it('P(δ) peaks at δ = 90° with P_max = 3 V_φ E_A / X_S', () => {
    const s = solveMachine(M, inputs({ iF: 6 }));
    const curve = powerAngleCurve(s.vPhi, s.eA, s.xS, 3601);
    const peak = curve.reduce((a, b) => (b.p > a.p ? b : a));
    expect(peak.delta).toBeCloseTo(Math.PI / 2, 3);
    expectRel(peak.p, s.pMax, 1e-6);
    expectRel(s.pMax, (3 * s.vPhi * s.eA) / s.xS, 1e-12);
  });

  it('loading exactly to P_max gives δ = 90°; beyond it there is no synchronous solution', () => {
    const probe = solveMachine(M, inputs({ iF: 6 }));
    const at = solveMachine(M, inputs({ mode: 'motor', iF: 6, load: probe.pMax }));
    expect(Math.abs(at.op!.delta)).toBeCloseTo(Math.PI / 2, 6);
    expect(at.stability).toBe('nearLimit');
    const over = solveMachine(M, inputs({ mode: 'motor', iF: 6, load: probe.pMax * 1.01 }));
    expect(over.stability).toBe('lostSynchronism');
    expect(over.op).toBeNull();
    expect(over.loadRatio).toBeGreaterThan(1);
  });

  it('δ grows monotonically with load', () => {
    let prev = -1;
    for (let load = 0; load <= 120_000; load += 5_000) {
      const s = solveMachine(M, inputs({ mode: 'generator', iF: 7, load }));
      expect(s.op!.delta).toBeGreaterThan(prev);
      prev = s.op!.delta;
    }
  });

  it('P_max decreases when the excitation is reduced', () => {
    let prev = Number.POSITIVE_INFINITY;
    for (let iF = 10; iF >= 0.5; iF -= 0.5) {
      const s = solveMachine(M, inputs({ iF }));
      expect(s.pMax).toBeLessThan(prev);
      prev = s.pMax;
    }
  });

  it('reducing the excitation at constant load drives δ toward 90° and then loses synchronism', () => {
    const states = [8, 6, 5, 4.5, 4.0, 3.6, 3.4].map((iF) =>
      solveMachine(M, inputs({ mode: 'motor', load: 80_000, iF })),
    );
    const deltas = states.filter((s) => s.op).map((s) => Math.abs(s.op!.delta));
    for (let k = 1; k < deltas.length; k++) expect(deltas[k]!).toBeGreaterThan(deltas[k - 1]!);
    expect(states.at(-1)!.stability).toBe('lostSynchronism');
  });
});

describe('PF is solved, never imposed (brief §3.3)', () => {
  const targets = [
    { pf: 1, kind: 'unity' as const },
    { pf: 0.9, kind: 'lagging' as const },
    { pf: 0.9, kind: 'leading' as const },
    { pf: 0.7, kind: 'lagging' as const },
  ];
  for (const mode of ['motor', 'generator'] as const)
    for (const t of targets)
      it(`${mode}, 60 kW, PF ${t.pf} ${t.kind}: the solved I_F reproduces that PF`, () => {
        const base = inputs({ mode, load: 60_000 });
        const sol = solveFieldForPowerFactor(M, base, t.pf, t.kind);
        expect(sol.feasible).toBe(true);
        const s = solveMachine(M, { ...base, iF: sol.iF });
        const pr = presentOperatingPoint(s.op!, s.convention);
        expectRel(pr.pf, t.pf, 1e-9);
        expect(pr.pfKind).toBe(t.kind);
        expectRel(pr.p, 60_000, 1e-9);
      });

  it('with the same P, a lower PF requires more current (brief §5.9)', () => {
    const base = inputs({ mode: 'motor', load: 60_000 });
    const current = (pf: number) => {
      const sol = solveFieldForPowerFactor(M, base, pf, pf === 1 ? 'unity' : 'lagging');
      return solveMachine(M, { ...base, iF: sol.iF }).op!.iAMag;
    };
    expect(current(0.9)).toBeGreaterThan(current(1));
    expect(current(0.7)).toBeGreaterThan(current(0.9));
    expectRel(current(0.7), 60_000 / (3 * (480 / Math.sqrt(3)) * 0.7), 1e-9);
  });
});
