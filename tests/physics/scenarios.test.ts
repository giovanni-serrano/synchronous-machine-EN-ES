import { describe, expect, it } from 'vitest';
import {
  SCENARIOS,
  gridView,
  presentOperatingPoint,
  scenarioById,
  scenarioInputs,
  solveMachine,
  toDeg,
  type ScenarioId,
} from '../../src/physics';
import { M, R, expectRel } from '../helpers';

const solve = (id: ScenarioId) => {
  const inp = scenarioInputs(M, scenarioById(id));
  const s = solveMachine(M, inp);
  return { inp, s, op: s.op!, pr: presentOperatingPoint(s.op!, s.convention), grid: gridView(s.op!) };
};

/*
 * Expected values are hand calculations (V_φ = 277.13 V, X_S = 2.0 Ω, I_rated = 120.28 A,
 * k_field = 277.13 / 5 = 55.43 V/A):
 *  A  motor 100 kW PF 1:        E_A = |277.13 − j240.56| = 366.97 V, δ = −40.96°
 *  B  gen 80 kW PF 0.8 lag:     I_A = 96.23 − j72.17, E_A = 421.47 + j192.45 = 463.32 V ∠ 24.54°
 *  C  motor 80 kW PF 0.8 lead:  E_A = 421.47 − j192.45 = 463.32 V ∠ −24.54°, delivers 60 kvar
 *  D  motor 80 kW PF 0.8 lag:   E_A = 132.79 − j192.45 = 233.82 V ∠ −55.39°, absorbs 60 kvar
 *  E  gen 100 kW PF 1:          E_A = 366.97 V, δ = 40.96°
 *  F  gen 80 kW PF 1:           E_A = √(277.13² + 192.45²) = 337.40 V → I_F = 6.087 A
 *  G  motor 100 kW, I_F 4.5 A:  E_A = 249.42 V, P_max = 103.68 kW, sin δ = 0.9645 → δ = −74.70°
 *                               I_A = √(E_A² + V_φ² − 2 E_A V_φ cos δ) / X_S = 160.1 A > 120.3 A rated
 *     (near δ = 90° this machine always exceeds rated current: I_A ≥ V_φ / X_S = 1.15 pu)
 */
describe('predefined scenarios (brief §11)', () => {
  it('all scenarios run on the reference machine at 60 Hz, 4 poles, 480 V, and are stable', () => {
    for (const def of SCENARIOS) {
      const inp = scenarioInputs(M, def);
      expect(inp.f).toBe(60);
      expect(inp.poles).toBe(4);
      expect(inp.vT).toBe(480);
      expect(solveMachine(M, inp).op).not.toBeNull();
    }
  });

  it('A: motor, full load, unity PF', () => {
    const { s, op, pr } = solve('A');
    expect(s.operatingMode).toBe('motor');
    expect(s.eA).toBeCloseTo(366.97, 1);
    expect(toDeg(op.delta)).toBeCloseTo(-40.96, 1);
    expect(pr.pfKind).toBe('unity');
    expect(op.iAMag).toBeCloseTo(120.28, 1);
    expect(s.warnings.statorOvercurrent).toBe(false);
  });

  it('B: generator at its rating point (100 kVA, PF 0.8 lagging)', () => {
    const { s, op, pr, grid } = solve('B');
    expect(s.eA).toBeCloseTo(463.32, 1);
    expect(toDeg(op.delta)).toBeCloseTo(24.54, 1);
    expectRel(op.s, 100_000, 1e-9);
    expectRel(op.q, 60_000, 1e-9);
    expect(pr.pfKind).toBe('lagging');
    expect(grid.q.direction).toBe('delivers');
    expect(s.warnings.statorOvercurrent).toBe(false);
    expect(s.warnings.fieldOverexcitation).toBe(false);
    expect(s.inputs.iF).toBeCloseTo(R.ifRated, 9);
  });

  it('C: over-excited motor → PF leading, delivers Q', () => {
    const { s, op, pr, grid } = solve('C');
    expect(s.eA).toBeCloseTo(463.32, 1);
    expect(toDeg(op.delta)).toBeCloseTo(-24.54, 1);
    expect(pr.pfKind).toBe('leading');
    expectRel(pr.pf, 0.8, 1e-9);
    expect(grid.q.direction).toBe('delivers');
    expectRel(grid.q.magnitude, 60_000, 1e-9);
  });

  it('D: under-excited motor → PF lagging, absorbs Q', () => {
    const { s, op, pr, grid } = solve('D');
    expect(s.eA).toBeCloseTo(233.82, 1);
    expect(toDeg(op.delta)).toBeCloseTo(-55.39, 1);
    expect(pr.pfKind).toBe('lagging');
    expect(grid.q.direction).toBe('absorbs');
    expectRel(grid.q.magnitude, 60_000, 1e-9);
  });

  it('E: generator delivering full-load P at unity PF', () => {
    const { s, op, pr, grid } = solve('E');
    expect(s.eA).toBeCloseTo(366.97, 1);
    expect(toDeg(op.delta)).toBeCloseTo(40.96, 1);
    expect(pr.pfKind).toBe('unity');
    expect(grid.p.direction).toBe('delivers');
    expectRel(grid.p.magnitude, 100_000, 1e-9);
  });

  it('F: generator at constant P; the excitation sweep crosses from absorbing to delivering Q', () => {
    const def = scenarioById('F');
    const { inp, s } = solve('F');
    expect(s.eA).toBeCloseTo(337.4, 1);
    expect(inp.iF).toBeCloseTo(6.087, 3);
    const sweep = def.sweep!;
    const lo = solveMachine(M, { ...inp, iF: sweep.iFFrom });
    const hi = solveMachine(M, { ...inp, iF: sweep.iFTo });
    expect(lo.op).not.toBeNull();
    expect(hi.op).not.toBeNull();
    expectRel(lo.op!.p, 80_000, 1e-9);
    expectRel(hi.op!.p, 80_000, 1e-9);
    expect(gridView(lo.op!).q.direction).toBe('absorbs');
    expect(gridView(hi.op!).q.direction).toBe('delivers');
    expect(presentOperatingPoint(lo.op!, lo.convention).pfKind).toBe('leading');
    expect(presentOperatingPoint(hi.op!, hi.convention).pfKind).toBe('lagging');
  });

  it('G: near the stability limit', () => {
    const { s, op } = solve('G');
    expect(s.eA).toBeCloseTo(249.42, 1);
    expect(s.pMax / 1000).toBeCloseTo(103.68, 1);
    expect(toDeg(op.delta)).toBeCloseTo(-74.7, 1);
    expect(s.stability).toBe('nearLimit');
    expect(op.iAMag).toBeCloseTo(160.1, 1);
    expect(s.warnings.statorOvercurrent).toBe(true);
    expect(gridView(op).q.direction).toBe('absorbs');
  });
});
