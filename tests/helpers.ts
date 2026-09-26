import { expect } from 'vitest';
import {
  REFERENCE_MACHINE,
  deriveRatings,
  type MachineInputs,
  type ShaftMode,
} from '../src/physics';

export const M = REFERENCE_MACHINE;
export const R = deriveRatings(M);

/** Relative closeness for quantities spanning many orders of magnitude. */
export function expectRel(actual: number, expected: number, rel = 1e-9, abs = 1e-9): void {
  const tol = Math.max(abs, rel * Math.abs(expected));
  expect(Math.abs(actual - expected), `actual ${actual} vs expected ${expected}`).toBeLessThanOrEqual(
    tol,
  );
}

export function inputs(partial: Partial<MachineInputs> = {}): MachineInputs {
  return {
    mode: 'generator',
    f: M.ratedF,
    poles: M.ratedPoles,
    vT: M.ratedVT,
    load: 0,
    iF: M.ifNoLoad,
    ...partial,
  };
}

/** A broad grid of operating inputs (both modes, both frequencies, many loads and excitations). */
export function inputGrid(): MachineInputs[] {
  const out: MachineInputs[] = [];
  const modes: ShaftMode[] = ['motor', 'generator'];
  for (const mode of modes)
    for (const f of [50, 60])
      for (const poles of [2, 4, 6])
        for (const load of [0, 10_000, 40_000, 80_000, 100_000, 140_000])
          for (const iF of [0, 1, 2.5, 4, 5, 6.5, 8, 10])
            for (const vT of [440, 480])
              out.push({ mode, f, poles, load, iF, vT });
  return out;
}
