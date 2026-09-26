import { describe, expect, it } from 'vitest';
import { energyFlow, solveMachine, withSignedPower } from '../../src/physics';
import { M, expectRel, inputs } from '../helpers';

describe('energy flow Grid ↔ Machine ↔ Shaft (brief §5.4)', () => {
  it('motor: electrical power in from the grid, mechanical power out at the shaft', () => {
    const s = solveMachine(M, inputs({ mode: 'motor', load: 60_000, iF: 6 }));
    const e = energyFlow(s.op!);
    expect(e.grid.p.direction).toBe('absorbs');
    expect(e.shaft.direction).toBe('outOfMachine');
    expectRel(e.shaft.magnitude, 60_000, 1e-9);
  });

  it('generator: mechanical power in at the shaft, electrical power out to the grid', () => {
    const s = solveMachine(M, inputs({ mode: 'generator', load: 60_000, iF: 6 }));
    const e = energyFlow(s.op!);
    expect(e.grid.p.direction).toBe('delivers');
    expect(e.shaft.direction).toBe('intoMachine');
  });

  it('lossless: |P_mech| = |P_elec| everywhere, and P reverses exactly at zero shaft power', () => {
    for (let p = -120_000; p <= 120_000; p += 10_000) {
      const s = solveMachine(M, withSignedPower(inputs({ iF: 7 }), p));
      const e = energyFlow(s.op!);
      expectRel(e.shaft.magnitude, e.grid.p.magnitude, 1e-12, 1e-9);
      expect(e.shaft.direction).toBe(p > 0 ? 'intoMachine' : p < 0 ? 'outOfMachine' : 'none');
    }
  });

  it('Q flows independently of P: an over-excited motor sends Q to the grid while taking P from it', () => {
    const e = energyFlow(solveMachine(M, inputs({ mode: 'motor', load: 60_000, iF: 8.5 })).op!);
    expect(e.grid.p.direction).toBe('absorbs');
    expect(e.grid.q.direction).toBe('delivers');
  });
});
