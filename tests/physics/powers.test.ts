import { describe, expect, it } from 'vitest';
import { add, mul, complex, solveMachine, presentOperatingPoint } from '../../src/physics';
import { M, expectRel, inputGrid } from '../helpers';

const stableStates = inputGrid()
  .map((i) => solveMachine(M, i))
  .filter((s) => s.op !== null);

describe('power relations over a broad grid of operating points', () => {
  it('the grid contains both modes and many stable points', () => {
    expect(stableStates.length).toBeGreaterThan(300);
    expect(stableStates.some((s) => s.operatingMode === 'motor')).toBe(true);
    expect(stableStates.some((s) => s.operatingMode === 'generator')).toBe(true);
  });

  it('|S|² = P² + Q²', () => {
    for (const s of stableStates) {
      const { p, q, s: sa } = s.op!;
      expectRel(sa * sa, p * p + q * q, 1e-9, 1e-3);
    }
  });

  it('P = √3 V_T I_L cos θ and Q = √3 V_T I_L sin θ (line values; Y: I_L = I_A)', () => {
    for (const s of stableStates) {
      const { p, q, iAMag, theta } = s.op!;
      const vT = s.inputs.vT;
      expectRel(p, Math.sqrt(3) * vT * iAMag * Math.cos(theta), 1e-9, 1e-6);
      expectRel(q, Math.sqrt(3) * vT * iAMag * Math.sin(theta), 1e-9, 1e-6);
    }
  });

  it('P = 3 V_φ I_A cos θ (phase values) in the presented convention too', () => {
    for (const s of stableStates) {
      const pr = presentOperatingPoint(s.op!, s.convention);
      expectRel(Math.abs(pr.p), 3 * s.vPhi * pr.iAMag * pr.pf, 1e-9, 1e-6);
    }
  });

  it('P from the phasors equals 3 V_φ E_A sin δ / X_S (phase values)', () => {
    for (const s of stableStates) {
      const op = s.op!;
      // S = 3 V_φ I_A* computed independently from the phasors
      const sc = mul(complex(3, 0), mul(op.vPhi, complex(op.iA.re, -op.iA.im)));
      expectRel(sc.re, (3 * s.vPhi * s.eA * Math.sin(op.delta)) / s.xS, 1e-9, 1e-6);
      expectRel(op.p, sc.re, 1e-12, 1e-6);
      expectRel(op.q, sc.im, 1e-12, 1e-6);
    }
  });

  it('the solved P equals the requested shaft power (lossless model)', () => {
    for (const s of stableStates) expectRel(s.op!.p, s.pRequested, 1e-9, 1e-6);
  });

  it('τ_ind = 3 V_φ E_A sin δ / (ω_m X_S), acting in the direction of rotation when motoring', () => {
    for (const s of stableStates) {
      const op = s.op!;
      const chapman = (3 * s.vPhi * s.eA * Math.sin(op.delta)) / (s.omegaM * s.xS);
      expectRel(op.torque, -chapman, 1e-9, 1e-9);
      if (s.operatingMode === 'motor') expect(op.torque).toBeGreaterThan(0);
      if (s.operatingMode === 'generator') expect(op.torque).toBeLessThan(0);
    }
  });

  it('internal generator equation E_A = V_φ + jX_S I_A holds at every point', () => {
    for (const s of stableStates) {
      const op = s.op!;
      const rhs = add(op.vPhi, mul(complex(0, s.xS), op.iA));
      expectRel(rhs.re, op.eA.re, 1e-12, 1e-9);
      expectRel(rhs.im, op.eA.im, 1e-12, 1e-9);
    }
  });
});
