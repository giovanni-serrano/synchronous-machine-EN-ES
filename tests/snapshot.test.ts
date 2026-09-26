import { describe, expect, it } from 'vitest';
import { machineSnapshot } from '../src/animation/snapshot';
import { PHASES, PHASE_AXES, presentOperatingPoint, solveMachine, wrapAngle } from '../src/physics';
import { M, R, expectRel, inputs } from './helpers';

const times = [0, 0.0013, 0.004, 0.0101, 0.5];

describe('machine snapshot (time-dependent picture of a steady state)', () => {
  for (const poles of [2, 4, 6])
    for (const mode of ['motor', 'generator'] as const)
      it(`${mode}, ${poles} poles: angle(B_R) − angle(B_net) = δ electrical = (poles/2)·δ mechanical, at any t`, () => {
        const s = solveMachine(M, inputs({ mode, poles, load: 70_000, iF: 6.5 }));
        for (const t of times) {
          const snap = machineSnapshot(M, s, t)!;
          expectRel(wrapAngle(snap.elec.bR - snap.elec.bNet), s.op!.delta, 0, 1e-9);
          expectRel(snap.deltaMech * (poles / 2), s.op!.delta, 0, 1e-12);
          expectRel(wrapAngle((snap.mech.bR - snap.mech.bNet) * (poles / 2)), s.op!.delta, 0, 1e-9);
        }
      });

  it('generator: rotor field ahead of the net field; motor: behind (in the direction of rotation)', () => {
    const g = machineSnapshot(M, solveMachine(M, inputs({ mode: 'generator', load: 60_000, iF: 6 })), 0.003)!;
    const m = machineSnapshot(M, solveMachine(M, inputs({ mode: 'motor', load: 60_000, iF: 6 })), 0.003)!;
    expect(wrapAngle(g.mech.bR - g.mech.bNet)).toBeGreaterThan(0);
    expect(wrapAngle(m.mech.bR - m.mech.bNet)).toBeLessThan(0);
  });

  it('the rotor turns at exactly n_sync, and all three fields with it', () => {
    for (const poles of [2, 4, 8]) {
      const s = solveMachine(M, inputs({ poles, load: 40_000, iF: 6 }));
      const a = machineSnapshot(M, s, 0.002)!;
      const b = machineSnapshot(M, s, 0.0021)!;
      const omegaMech = (2 * Math.PI * s.nSync) / 60;
      for (const k of ['bR', 'bS', 'bNet'] as const) expectRel((b.mech[k] - a.mech[k]) / 0.0001, omegaMech, 1e-9);
    }
  });

  it('the stator field built from the instantaneous phase currents points along B_S (1.5 × amplitude)', () => {
    for (const mode of ['motor', 'generator'] as const) {
      const s = solveMachine(M, inputs({ mode, load: 80_000, iF: 7.5 }));
      for (const t of times) {
        const snap = machineSnapshot(M, s, t)!;
        let x = 0;
        let y = 0;
        for (const ph of PHASES) {
          x += snap.currents[ph] * Math.cos(PHASE_AXES[ph]);
          y += snap.currents[ph] * Math.sin(PHASE_AXES[ph]);
        }
        expectRel(wrapAngle(Math.atan2(y, x) - snap.elec.bS), 0, 0, 1e-9);
        expectRel(Math.hypot(x, y), (1.5 * s.op!.iAMag) / R.iRated, 1e-9);
      }
    }
  });

  it('|B_net| is fixed by the grid; |B_R| follows E_A', () => {
    const s = solveMachine(M, inputs({ load: 50_000, iF: 8 }));
    const snap = machineSnapshot(M, s, 0)!;
    expectRel(snap.magnitude.bNet, 1, 1e-12);
    expectRel(snap.magnitude.bR, s.eA / R.vPhiRated, 1e-12);
  });

  it('no snapshot without a synchronous steady state', () => {
    const s = solveMachine(M, inputs({ mode: 'motor', load: 150_000, iF: 3 }));
    expect(s.stability).toBe('lostSynchronism');
    expect(machineSnapshot(M, s, 0)).toBeNull();
  });
});

describe('electrical-degree vector sum (inset beside the cross-section)', () => {
  it('B_R + B_S = B_net at any instant, for any number of poles', () => {
    for (const poles of [2, 4, 8])
      for (const mode of ['motor', 'generator'] as const) {
        const s = solveMachine(M, inputs({ mode, poles, load: 90_000, iF: 7 }));
        for (const t of times) {
          const x = machineSnapshot(M, s, t)!;
          const sx = x.magnitude.bR * Math.cos(x.elec.bR) + x.magnitude.bS * Math.cos(x.elec.bS);
          const sy = x.magnitude.bR * Math.sin(x.elec.bR) + x.magnitude.bS * Math.sin(x.elec.bS);
          expectRel(sx, x.magnitude.bNet * Math.cos(x.elec.bNet), 0, 1e-9);
          expectRel(sy, x.magnitude.bNet * Math.sin(x.elec.bNet), 0, 1e-9);
        }
      }
  });
});

describe('stator dots/crosses show the PHYSICAL current (Phase 4 requirement)', () => {
  it('the snapshot currents do not depend on the convention used to present I_A', () => {
    for (const mode of ['motor', 'generator'] as const) {
      const s = solveMachine(M, inputs({ mode, load: 70_000, iF: 7.5 }));
      const op = s.op!;
      const genView = presentOperatingPoint(op, s.convention, 'generator');
      const motView = presentOperatingPoint(op, s.convention, 'motor');
      // the two presentations draw opposite I_A phasors…
      expectRel(genView.iA.re, -motView.iA.re, 1e-12);
      for (const t of times) {
        const snap = machineSnapshot(M, s, t)!;
        for (const ph of PHASES) {
          // …but the drawn winding current is the internal one in both cases: same sign, same size
          const physical = (op.iAMag / R.iRated) * Math.cos(s.omegaE * t + Math.atan2(op.iA.im, op.iA.re) - PHASE_AXES[ph]);
          expectRel(snap.currents[ph], physical, 0, 1e-12);
          const fromMotorPhasor = (motView.iAMag / R.iRated) * Math.cos(s.omegaE * t + Math.atan2(motView.iA.im, motView.iA.re) - PHASE_AXES[ph]);
          // using the motor-convention phasor would flip every dot into a cross
          if (Math.abs(physical) > 1e-6) expect(Math.sign(fromMotorPhasor)).toBe(-Math.sign(physical));
        }
      }
    }
  });

  it('the same physical operating point gives identical dots/crosses whichever mode label it gets', () => {
    // P = 0 with the selector on MOTOR or on GENERATOR: same physics, different presentation convention.
    const asMotor = solveMachine(M, inputs({ mode: 'motor', load: 0, iF: 8 }));
    const asGen = solveMachine(M, inputs({ mode: 'generator', load: 0, iF: 8 }));
    expect(asMotor.convention).toBe('motor');
    expect(asGen.convention).toBe('generator');
    for (const t of times) {
      const a = machineSnapshot(M, asMotor, t)!;
      const b = machineSnapshot(M, asGen, t)!;
      for (const ph of PHASES) expect(a.currents[ph]).toBe(b.currents[ph]);
    }
  });
});
