/**
 * Phase 5 panel (brief §5.8, §5.9): power triangle linked to the machine, S = P + jQ explained, power-factor targets
 * that solve I_F at the present P, and the current needed at each PF. Everything comes from the live MachineState.
 */

import { useState } from 'react';
import {
  fieldFromInternalVoltage,
  solveFieldForPowerFactor,
  type GridView,
  type MachineInputs,
  type MachineParams,
  type PowerTriangle as Triangle,
} from '../../physics';
import { interpolate } from '../../i18n';
import { useI18n } from '../../i18n/I18nProvider';
import { Segmented } from '../controls/Segmented';
import { SymbolText } from '../SymbolText';
import { CurrentByPf } from './CurrentByPf';
import { PowerTriangle } from './PowerTriangle';

export const PF_TARGETS = [
  { id: '1.00', pf: 1, kind: 'unity' },
  { id: '0.90lag', pf: 0.9, kind: 'lagging' },
  { id: '0.90lead', pf: 0.9, kind: 'leading' },
  { id: '0.70lag', pf: 0.7, kind: 'lagging' },
] as const;
type TargetId = (typeof PF_TARGETS)[number]['id'];

/** Target matching the present operating point, if any (PF within ±0.002 and same kind). */
export function matchingTarget(tri: Triangle): TargetId | undefined {
  return PF_TARGETS.find((t) => Math.abs(tri.pf - t.pf) < 0.002 && (t.kind === 'unity' || tri.pfKind === t.kind))?.id;
}

export function PowerPanel({
  params,
  inputs,
  tri,
  grid,
  vPhi,
  iAMag,
  iRated,
  onField,
}: {
  params: MachineParams;
  inputs: MachineInputs;
  tri: Triangle | null;
  grid: GridView | null;
  vPhi: number;
  iAMag: number;
  iRated: number;
  onField(iF: number): void;
}) {
  const { d, fmt } = useI18n();
  // Remember an infeasible request while I_F still sits where it was clamped.
  const [limitNote, setLimitNote] = useState<{ iF: number; required: number } | null>(null);
  const hasLoad = inputs.load > 0;

  const applyTarget = (id: TargetId) => {
    const t = PF_TARGETS.find((x) => x.id === id)!;
    const sol = solveFieldForPowerFactor(params, inputs, t.pf, t.kind);
    setLimitNote(sol.feasible ? null : { iF: sol.iF, required: fieldFromInternalVoltage(params, sol.eA, inputs.f) });
    onField(sol.iF);
  };
  const showLimit = limitNote !== null && Math.abs(limitNote.iF - inputs.iF) < 1e-9;

  const pfKindText = tri ? d.powerFactor[tri.pfKind] : '';
  const gridLine = grid
    ? [
        { delivers: d.gridView.pDelivers, absorbs: d.gridView.pAbsorbs, none: d.gridView.pNone }[grid.p.direction],
        { delivers: d.gridView.qDelivers, absorbs: d.gridView.qAbsorbs, none: d.gridView.qNone }[grid.q.direction],
      ].join(' · ')
    : '';

  return (
    <section className="panel panel--powers" aria-labelledby="powers-title">
      <h3 id="powers-title" className="panel__title">
        {d.powers.title}
      </h3>
      {tri ? (
        <>
          <div className="powers__top">
            <PowerTriangle tri={tri} ratedS={params.ratedS} />
            <div className="powers__summary">
              <p className="powers__pf">
                <SymbolText text={interpolate(d.powers.pfLine, { pf: d.symbols.pfAbbrev, value: fmt.number(tri.pf, 2), kind: pfKindText })} />
                <br />θ = {fmt.degrees(Math.abs(tri.theta))}
              </p>
              <p className="readouts__note">
                <SymbolText text={d.powers.upMeans[tri.modeConvention]} />
              </p>
              <p className="readouts__note">
                <strong>{d.gridView.title}:</strong> {gridLine}
              </p>
              <p className="readouts__note">{d.gridView.unifyingIdea}</p>
            </div>
          </div>
          <ul className="notes">
            <li>
              <strong>S = P + jQ.</strong> <SymbolText text={d.powers.realPart} /> <SymbolText text={d.powers.imagPart} />
            </li>
            <li>{d.powers.jNote}</li>
            <li>
              <SymbolText text={d.powers.sNote} />
            </li>
          </ul>

          <div className="controls__group powers__targets">
            <Segmented<TargetId | ''>
              label={d.powers.targetsLabel}
              options={PF_TARGETS.map((t) => ({
                value: t.id,
                label: t.kind === 'unity' ? fmt.number(t.pf, 2) : `${fmt.number(t.pf, 2)} ${d.powerFactor[t.kind]}`,
              }))}
              value={(hasLoad && matchingTarget(tri)) || ''}
              onChange={(id) => id && hasLoad && applyTarget(id)}
            />
            <p className="hint">
              <SymbolText text={hasLoad ? d.powers.targetsHint : d.powers.targetsNeedLoad} />
            </p>
            {showLimit && (
              <p className="banner banner--warning">
                <SymbolText text={interpolate(d.powers.targetInfeasible, { value: fmt.current(limitNote.required) })} />
              </p>
            )}
          </div>

          {hasLoad && (
            <figure className="powers__current">
              <figcaption className="inset__title">
                {d.powers.currentTitle} · <SymbolText text={interpolate(d.powers.currentAxis, { p: fmt.power(Math.abs(tri.p), 'W') })} />
              </figcaption>
              <CurrentByPf pAbs={Math.abs(tri.p)} vPhi={vPhi} pfNow={tri.pf} iANow={iAMag} iRated={iRated} />
              <p className="readouts__note">{d.powers.currentNote}</p>
            </figure>
          )}
        </>
      ) : (
        <p className="hint">
          <SymbolText text={d.stability.lostExplanation} />
        </p>
      )}
    </section>
  );
}
