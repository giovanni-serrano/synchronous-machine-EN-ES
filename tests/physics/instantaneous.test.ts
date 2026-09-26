import { describe, expect, it } from 'vitest';
import {
  phaseInstant,
  presentOperatingPoint,
  solveMachine,
  threePhaseInstant,
  type PhaseWaveParams,
} from '../../src/physics';
import { M, expectRel, inputs } from '../helpers';

const omega = 2 * Math.PI * 60;
const period = 1 / 60;
const waves: PhaseWaveParams[] = [
  { vRms: 277.13, iRms: 120.28, theta: 0, omega },
  { vRms: 277.13, iRms: 120.28, theta: Math.acos(0.8), omega },
  { vRms: 277.13, iRms: 120.28, theta: -Math.acos(0.8), omega },
  { vRms: 277.13, iRms: 50, theta: Math.PI / 2, omega },
  { vRms: 230, iRms: 10, theta: -1.2, omega },
];
const samples = Array.from({ length: 1000 }, (_, k) => (k * period) / 1000);

describe('per-phase instantaneous power (brief §3.4.2)', () => {
  it('P_φ[1 + cos 2ωt] + Q_φ sin 2ωt equals the sampled v(t)·i(t)', () => {
    for (const w of waves)
      for (const t of samples) {
        const x = phaseInstant(w, t);
        expectRel(x.pOneWay + x.pBackAndForth, x.v * x.i, 1e-9, 1e-6);
      }
  });

  it('the one-way term is never negative and averages P_φ; the back-and-forth term averages 0 with amplitude Q_φ', () => {
    for (const w of waves) {
      const pPhi = w.vRms * w.iRms * Math.cos(w.theta);
      const qPhi = w.vRms * w.iRms * Math.sin(w.theta);
      let sumOne = 0;
      let sumBack = 0;
      let maxBack = 0;
      for (const t of samples) {
        const x = phaseInstant(w, t);
        expect(x.pOneWay * Math.sign(pPhi || 1)).toBeGreaterThanOrEqual(-1e-9);
        sumOne += x.pOneWay;
        sumBack += x.pBackAndForth;
        maxBack = Math.max(maxBack, Math.abs(x.pBackAndForth));
      }
      expectRel(sumOne / samples.length, pPhi, 1e-9, 1e-6);
      expectRel(sumBack / samples.length, 0, 0, 1e-6);
      expectRel(maxBack, Math.abs(qPhi), 1e-4, 1e-6);
    }
  });

  it('with a phase shift p(t) has negative stretches (energy returns to the grid)', () => {
    const w = waves[1]!;
    expect(samples.some((t) => phaseInstant(w, t).p < 0)).toBe(true);
    expect(samples.every((t) => phaseInstant(waves[0]!, t).p >= -1e-9)).toBe(true);
  });
});

describe('three-phase total (brief §5.7 step 2)', () => {
  it('p_a + p_b + p_c is constant and equals 3 P_φ', () => {
    for (const w of waves) {
      const threeP = 3 * w.vRms * w.iRms * Math.cos(w.theta);
      for (const t of samples) expectRel(threePhaseInstant(w, t).total, threeP, 1e-9, 1e-6);
    }
  });

  it('the constant total equals the machine P computed by the steady-state model', () => {
    for (const mode of ['motor', 'generator'] as const) {
      const s = solveMachine(M, inputs({ mode, load: 75_000, iF: 7.5 }));
      const pr = presentOperatingPoint(s.op!, s.convention);
      const w: PhaseWaveParams = { vRms: s.vPhi, iRms: pr.iAMag, theta: pr.thetaDrawn, omega: s.omegaE };
      for (const t of samples.slice(0, 50)) expectRel(threePhaseInstant(w, t).total, pr.p, 1e-9, 1e-6);
    }
  });

  it('each phase still oscillates while the total does not', () => {
    const w = waves[3]!; // pure reactive
    const pa = samples.map((t) => threePhaseInstant(w, t).a.p);
    expect(Math.max(...pa) - Math.min(...pa)).toBeGreaterThan(1000);
  });
});
