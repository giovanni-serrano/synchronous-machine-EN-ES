/**
 * Predefined scenarios (brief §11), all on the reference machine at 60 Hz, 4 poles, 480 V.
 * Scenarios that name a power factor SOLVE the field current (brief §3.3); they never set PF directly.
 * Expected values are verified in tests/physics/scenarios.test.ts.
 */

import { solveFieldForPowerFactor, type TargetPfKind } from './excitation';
import type { MachineParams } from './machine';
import type { MachineInputs, ShaftMode } from './types';

export type ScenarioId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export type ScenarioExcitation =
  | { readonly kind: 'powerFactor'; readonly pf: number; readonly pfKind: TargetPfKind }
  | { readonly kind: 'fieldCurrent'; readonly iF: number };

export interface ScenarioDef {
  readonly id: ScenarioId;
  readonly mode: ShaftMode;
  /** Shaft power magnitude, W. */
  readonly load: number;
  readonly excitation: ScenarioExcitation;
  /** Optional excitation sweep at constant P (scenario F), A. */
  readonly sweep?: { readonly iFFrom: number; readonly iFTo: number };
}

export const SCENARIOS: readonly ScenarioDef[] = [
  // A. Motor at full load, unity PF.
  { id: 'A', mode: 'motor', load: 100_000, excitation: { kind: 'powerFactor', pf: 1, pfKind: 'unity' } },
  // B. Generator at its rating point: 100 kVA, PF 0.8 lagging (P = 80 kW).
  { id: 'B', mode: 'generator', load: 80_000, excitation: { kind: 'powerFactor', pf: 0.8, pfKind: 'lagging' } },
  // C. Overexcited motor: PF 0.8 leading, delivers Q to the grid.
  { id: 'C', mode: 'motor', load: 80_000, excitation: { kind: 'powerFactor', pf: 0.8, pfKind: 'leading' } },
  // D. Underexcited motor: PF 0.8 lagging, absorbs Q from the grid.
  { id: 'D', mode: 'motor', load: 80_000, excitation: { kind: 'powerFactor', pf: 0.8, pfKind: 'lagging' } },
  // E. Generator delivering full-load P at unity PF.
  { id: 'E', mode: 'generator', load: 100_000, excitation: { kind: 'powerFactor', pf: 1, pfKind: 'unity' } },
  // F. Generator at constant P, excitation swept: Q exchange changes sign at unity PF.
  {
    id: 'F',
    mode: 'generator',
    load: 80_000,
    excitation: { kind: 'powerFactor', pf: 1, pfKind: 'unity' },
    sweep: { iFFrom: 4.0, iFTo: 8.0 },
  },
  // G. Motor at full load with low excitation: close to the static stability limit.
  { id: 'G', mode: 'motor', load: 100_000, excitation: { kind: 'fieldCurrent', iF: 4.5 } },
];

export function scenarioById(id: ScenarioId): ScenarioDef {
  const found = SCENARIOS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown scenario ${id}`);
  return found;
}

/** Build the inputs of a scenario, solving I_F when the scenario names a power factor. */
export function scenarioInputs(params: MachineParams, def: ScenarioDef): MachineInputs {
  const base: MachineInputs = {
    mode: def.mode,
    f: params.ratedF,
    poles: params.ratedPoles,
    vT: params.ratedVT,
    load: def.load,
    iF: 0,
  };
  if (def.excitation.kind === 'fieldCurrent') return { ...base, iF: def.excitation.iF };
  const { iF } = solveFieldForPowerFactor(params, base, def.excitation.pf, def.excitation.pfKind);
  return { ...base, iF };
}
