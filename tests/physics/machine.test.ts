import { describe, expect, it } from 'vitest';
import {
  electricalToMechanical,
  internalVoltageFromField,
  solveMachine,
  synchronousReactance,
  synchronousSpeed,
  toDeg,
} from '../../src/physics';
import { M, R, expectRel, inputs } from '../helpers';

describe('synchronous speed n_sync = 120 f / poles', () => {
  it.each([
    [60, 2, 3600],
    [60, 4, 1800],
    [60, 6, 1200],
    [60, 8, 900],
    [50, 2, 3000],
    [50, 4, 1500],
  ])('f = %d Hz, %d poles → %d rpm', (f, poles, rpm) => {
    expect(synchronousSpeed(f, poles)).toBe(rpm);
    expect(solveMachine(M, inputs({ f, poles })).nSync).toBe(rpm);
  });

  it('going from 2 to 4 poles halves the speed', () => {
    expect(synchronousSpeed(60, 4)).toBe(synchronousSpeed(60, 2) / 2);
  });

  it('ω_m = 2π n_sync / 60 and ω_e = (poles/2) ω_m', () => {
    const s = solveMachine(M, inputs({ poles: 4 }));
    expectRel(s.omegaM, (2 * Math.PI * 1800) / 60);
    expectRel(s.omegaE, 2 * s.omegaM);
  });

  it('electrical → mechanical angle divides by poles/2', () => {
    expect(electricalToMechanical(Math.PI / 2, 4)).toBeCloseTo(Math.PI / 4, 12);
    expect(electricalToMechanical(Math.PI / 2, 2)).toBeCloseTo(Math.PI / 2, 12);
  });
});

describe('reference machine (brief §3.7)', () => {
  it('ratings: V_φ = 277.1 V, I_rated = 120.3 A, Z_base = 2.304 Ω, X_S ≈ 0.87 pu', () => {
    expectRel(R.vPhiRated, 480 / Math.sqrt(3));
    expect(R.iRated).toBeCloseTo(120.28, 2);
    expect(R.zBase).toBeCloseTo(2.304, 3);
    expect(R.xsPu).toBeCloseTo(0.868, 3);
  });

  it('full load (100 kW) at unity PF as generator: δ ≈ 41°, E_A ≈ 367 V', () => {
    // Hand calculation: E_A = 277.13 + j(2.0)(120.28) = 277.13 + j240.56 → 366.97 ∠ 40.96°
    const iF = 366.97 / R.kField;
    const s = solveMachine(M, inputs({ mode: 'generator', load: 100_000, iF }));
    expect(s.op).not.toBeNull();
    expect(toDeg(s.op!.delta)).toBeCloseTo(40.96, 1);
    expect(s.op!.iAMag).toBeCloseTo(120.28, 1);
    expect(s.op!.q / 1000).toBeCloseTo(0, 1);
  });

  it('field-heating limit sits at rated S, PF 0.8 lagging: E_A ≈ 463.3 V, I_F ≈ 8.36 A', () => {
    expect(R.eAFieldLimit).toBeCloseTo(463.32, 1);
    expect(R.ifRated).toBeCloseTo(8.36, 2);
  });
});

describe('frequency scaling (brief §3.5)', () => {
  it('X_S and E_A both scale with f', () => {
    expectRel(synchronousReactance(M, 50), (2.0 * 50) / 60);
    expectRel(internalVoltageFromField(M, 5, 50), (R.vPhiRated * 50) / 60);
  });

  it('I_F never produces a negative E_A', () => {
    expect(internalVoltageFromField(M, -3, 60)).toBe(0);
  });

  it('at fixed V_T and I_F, P_max is independent of f (E_A/X_S is), but torque is not', () => {
    const s60 = solveMachine(M, inputs({ f: 60, load: 50_000, iF: 6 }));
    const s50 = solveMachine(M, inputs({ f: 50, load: 50_000, iF: 6 }));
    expectRel(s50.pMax, s60.pMax);
    expectRel(s50.op!.delta, s60.op!.delta);
    expectRel(Math.abs(s50.op!.torque), 50_000 / s50.omegaM);
    expect(Math.abs(s50.op!.torque)).toBeGreaterThan(Math.abs(s60.op!.torque));
  });
});

describe('rating warnings (brief §3.6.1)', () => {
  it('flags stator overcurrent and field over-excitation without blocking the solution', () => {
    const s = solveMachine(M, inputs({ mode: 'generator', load: 80_000, iF: 10 }));
    expect(s.op).not.toBeNull();
    expect(s.warnings.statorOvercurrent).toBe(true);
    expect(s.warnings.fieldOverexcitation).toBe(true);
  });

  it('no warnings at a comfortable operating point', () => {
    const s = solveMachine(M, inputs({ mode: 'motor', load: 50_000, iF: 6 }));
    expect(s.warnings.statorOvercurrent).toBe(false);
    expect(s.warnings.fieldOverexcitation).toBe(false);
  });
});
