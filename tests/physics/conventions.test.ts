import { describe, expect, it } from 'vitest';
import {
  add,
  complex,
  fieldVectors,
  gridView,
  mul,
  presentOperatingPoint,
  solveMachine,
  sub,
  withSignedPower,
  arg,
  wrapAngle,
  abs,
} from '../../src/physics';
import { M, R, expectRel, inputs } from '../helpers';

const jX = (x: number) => complex(0, x);

describe('Chapman phasor equations in the presented conventions', () => {
  it('generator: E_A = V_φ + jX_S I_A with I_A leaving the machine', () => {
    const s = solveMachine(M, inputs({ mode: 'generator', load: 70_000, iF: 7 }));
    const pr = presentOperatingPoint(s.op!, s.convention);
    expect(pr.drawingConvention).toBe('generator');
    const rhs = add(pr.vPhi, mul(jX(s.xS), pr.iA));
    expectRel(rhs.re, pr.eA.re, 1e-12);
    expectRel(rhs.im, pr.eA.im, 1e-12);
    expectRel(pr.jXsIA.re, mul(jX(s.xS), pr.iA).re, 1e-12);
  });

  it('motor: V_φ = E_A + jX_S I_A with I_A entering the machine', () => {
    const s = solveMachine(M, inputs({ mode: 'motor', load: 70_000, iF: 7 }));
    const pr = presentOperatingPoint(s.op!, s.convention);
    expect(pr.drawingConvention).toBe('motor');
    const rhs = add(pr.eA, mul(jX(s.xS), pr.iA));
    expectRel(rhs.re, pr.vPhi.re, 1e-12);
    expectRel(rhs.im, pr.vPhi.im, 1e-12, 1e-9);
    // I_A,motor = −I_A,internal
    expectRel(pr.iA.re, -s.op!.iA.re, 1e-12);
    expectRel(pr.iA.im, -s.op!.iA.im, 1e-12);
  });
});

describe('internal → presentation conversion (brief §3.4.1, §4)', () => {
  it('generator: δ > 0, E_A leads V_φ, P > 0 delivered, torque opposes rotation', () => {
    const s = solveMachine(M, inputs({ mode: 'generator', load: 60_000, iF: 6 }));
    expect(s.op!.delta).toBeGreaterThan(0);
    const pr = presentOperatingPoint(s.op!, s.convention);
    expect(pr.eARelation).toBe('leads');
    expect(pr.p).toBeGreaterThan(0);
    expect(pr.torqueAction).toBe('opposes');
    expect(gridView(s.op!).p.direction).toBe('delivers');
  });

  it('motor: internal δ < 0 shown as |δ| with "E_A lags V_φ", P > 0 absorbed, torque drives', () => {
    const s = solveMachine(M, inputs({ mode: 'motor', load: 60_000, iF: 6 }));
    expect(s.op!.delta).toBeLessThan(0);
    expect(s.op!.p).toBeLessThan(0);
    const pr = presentOperatingPoint(s.op!, s.convention);
    expect(pr.deltaMag).toBeGreaterThan(0);
    expectRel(pr.deltaMag, -s.op!.delta, 1e-12);
    expect(pr.eARelation).toBe('lags');
    expect(pr.p).toBeGreaterThan(0);
    expectRel(pr.p, 60_000, 1e-9);
    expect(pr.torqueAction).toBe('drives');
    expect(gridView(s.op!).p.direction).toBe('absorbs');
  });

  it('presented θ is the angle from the drawn I_A to V_φ, and P = 3 V_φ I_A cos θ_drawn', () => {
    for (const mode of ['motor', 'generator'] as const) {
      const s = solveMachine(M, inputs({ mode, load: 50_000, iF: 7.5 }));
      const pr = presentOperatingPoint(s.op!, s.convention);
      expectRel(pr.thetaDrawn, wrapAngle(arg(pr.vPhi) - arg(pr.iA)), 1e-12);
      expectRel(pr.p, 3 * s.vPhi * pr.iAMag * Math.cos(pr.thetaDrawn), 1e-9);
      expectRel(pr.q, 3 * s.vPhi * pr.iAMag * Math.sin(pr.thetaDrawn), 1e-9, 1e-6);
    }
  });

  it('operating mode and convention follow the sign of P; the selector decides at P = 0', () => {
    expect(solveMachine(M, inputs({ mode: 'motor', load: 1 })).operatingMode).toBe('motor');
    expect(solveMachine(M, inputs({ mode: 'generator', load: 1 })).operatingMode).toBe('generator');
    const idle = solveMachine(M, inputs({ mode: 'motor', load: 0 }));
    expect(idle.operatingMode).toBe('noLoad');
    expect(idle.convention).toBe('motor');
  });

  it('a locked drawing convention keeps PF lagging/leading in the mode convention', () => {
    const s = solveMachine(M, inputs({ mode: 'motor', load: 60_000, iF: 8 }));
    const natural = presentOperatingPoint(s.op!, s.convention);
    const locked = presentOperatingPoint(s.op!, s.convention, 'generator');
    expect(locked.p).toBeLessThan(0); // generator convention: motoring = negative delivered P
    expect(locked.pfKind).toBe(natural.pfKind);
    expectRel(locked.pf, natural.pf, 1e-12);
  });
});

describe('over-excited → delivers Q, in either mode (brief §1, pillar 3)', () => {
  const cases = [
    { mode: 'generator' as const, iF: 8, q: 'delivers', pf: 'lagging' },
    { mode: 'generator' as const, iF: 4.5, q: 'absorbs', pf: 'leading' },
    { mode: 'motor' as const, iF: 8, q: 'delivers', pf: 'leading' },
    { mode: 'motor' as const, iF: 4.5, q: 'absorbs', pf: 'lagging' },
  ];
  it.each(cases)('$mode at I_F = $iF A → $q Q, PF $pf', ({ mode, iF, q, pf }) => {
    const s = solveMachine(M, inputs({ mode, load: 50_000, iF }));
    const op = s.op!;
    const overexcited = abs(op.eA) * Math.cos(op.delta) > s.vPhi;
    expect(overexcited).toBe(q === 'delivers');
    expect(gridView(op).q.direction).toBe(q);
    expect(presentOperatingPoint(op, s.convention).pfKind).toBe(pf);
  });

  it('motor convention: an over-excited motor shows negative absorbed Q (it delivers Q, like a capacitor)', () => {
    const s = solveMachine(M, inputs({ mode: 'motor', load: 50_000, iF: 8 }));
    expect(presentOperatingPoint(s.op!, s.convention).q).toBeLessThan(0);
  });
});

describe('continuity from motor to generator (brief §5.4)', () => {
  it('δ, P and I_A change sign smoothly when the shaft power sweeps through zero', () => {
    const base = inputs({ iF: 6 });
    const steps = 401;
    let prev: ReturnType<typeof solveMachine> | null = null;
    let modeChanges = 0;
    for (let k = 0; k < steps; k++) {
      const p = -100_000 + (200_000 * k) / (steps - 1);
      const s = solveMachine(M, withSignedPower(base, p));
      expect(s.op).not.toBeNull();
      expectRel(s.op!.p, p, 1e-9, 1e-6);
      if (prev) {
        expect(s.op!.delta).toBeGreaterThan(prev.op!.delta); // monotonic
        expect(Math.abs(s.op!.delta - prev.op!.delta)).toBeLessThan(0.01); // < 0.6° per 0.5 kW step
        // No jump in the internal I_A: its tip moves along a circle of radius E_A/X_S, so chord ≤ arc.
        const dDelta = Math.abs(s.op!.delta - prev.op!.delta);
        expect(abs(sub(s.op!.iA, prev.op!.iA))).toBeLessThanOrEqual((s.eA / s.xS) * dDelta * (1 + 1e-9));
        if (s.operatingMode !== prev.operatingMode) modeChanges++;
      }
      prev = s;
    }
    expect(modeChanges).toBeGreaterThanOrEqual(1);
    expect(modeChanges).toBeLessThanOrEqual(2); // motor → (noLoad) → generator
  });

  /** Sweep P from −100 kW to +100 kW and return the drawn I_A at each step, plus the chord ≤ arc bound per step. */
  function drawnSweep(iF: number, drawing: 'auto' | 'generator') {
    const out: Array<{ iA: ReturnType<typeof complex>; bound: number }> = [];
    let prevDelta: number | null = null;
    for (let k = 0; k <= 400; k++) {
      const s = solveMachine(M, withSignedPower(inputs({ iF }), -100_000 + 500 * k));
      const pr = presentOperatingPoint(s.op!, s.convention, drawing === 'auto' ? s.convention : drawing);
      const bound = prevDelta === null ? 0 : (s.eA / s.xS) * Math.abs(s.op!.delta - prevDelta) * (1 + 1e-9);
      out.push({ iA: pr.iA, bound });
      prevDelta = s.op!.delta;
    }
    return out;
  }
  const worstJump = (sweep: ReturnType<typeof drawnSweep>) =>
    Math.max(...sweep.slice(1).map((x, k) => abs(sub(x.iA, sweep[k]!.iA)) - x.bound));

  it('the DRAWN I_A is continuous when the drawing convention is locked (scene 5 / demo H)', () => {
    expect(worstJump(drawnSweep(6, 'generator'))).toBeLessThanOrEqual(0);
  });

  it('with E_A = V_φ, the drawn I_A is continuous even with the automatic convention (I_A = 0 at P = 0)', () => {
    expect(worstJump(drawnSweep(M.ifNoLoad, 'auto'))).toBeLessThanOrEqual(1e-9);
  });

  it('with the automatic convention and I_A ≠ 0 at P = 0, the drawn I_A flips by 180° — a convention artefact', () => {
    // Documents why continuous sweeps must lock the drawing convention (sign-conventions.md §5).
    expect(worstJump(drawnSweep(6, 'auto'))).toBeGreaterThan(40); // ≈ 2 × 27.7 A
  });
});

describe('field space vectors (brief §4: δ is between B_R and B_net)', () => {
  it('angle(B_R) − angle(B_net) = δ, and B_net = B_R + B_S', () => {
    for (const mode of ['motor', 'generator'] as const) {
      const s = solveMachine(M, inputs({ mode, load: 80_000, iF: 6 }));
      const b = fieldVectors(s.op!, R.vPhiRated, 1);
      expectRel(wrapAngle(arg(b.bR) - arg(b.bNet)), s.op!.delta, 1e-12);
      const sum = add(b.bR, b.bS);
      expectRel(sum.re, b.bNet.re, 1e-12, 1e-12);
      expectRel(sum.im, b.bNet.im, 1e-12, 1e-12);
    }
  });

  it('generator: B_R leads B_net; motor: B_net leads B_R', () => {
    const g = solveMachine(M, inputs({ mode: 'generator', load: 80_000, iF: 6 }));
    const m = solveMachine(M, inputs({ mode: 'motor', load: 80_000, iF: 6 }));
    const bg = fieldVectors(g.op!, R.vPhiRated, 1);
    const bm = fieldVectors(m.op!, R.vPhiRated, 1);
    expect(wrapAngle(arg(bg.bR) - arg(bg.bNet))).toBeGreaterThan(0);
    expect(wrapAngle(arg(bm.bNet) - arg(bm.bR))).toBeGreaterThan(0);
  });

  it('B_net is fixed by the grid (|B_net| = V_φ / V_φ,rated at rated f)', () => {
    const s = solveMachine(M, inputs({ mode: 'generator', load: 30_000, iF: 9 }));
    expectRel(abs(fieldVectors(s.op!, R.vPhiRated, 1).bNet), 1, 1e-12);
  });

  it('B_S is aligned with the internal (generator-convention) armature current', () => {
    const s = solveMachine(M, inputs({ mode: 'generator', load: 80_000, iF: 7 }));
    const b = fieldVectors(s.op!, R.vPhiRated, 1);
    expectRel(wrapAngle(arg(b.bS) - arg(s.op!.iA)), 0, 1e-9, 1e-9);
  });
});
