/**
 * Phase 3 — the machine (brief §5.3, §5.5, §6; lesson scenes 1, 4, 10). The operating point comes from the
 * predefined scenarios A–G (the motor/generator selector, load and excitation controls arrive in Phase 4).
 */

import { useState } from 'react';
import {
  REFERENCE_MACHINE,
  SCENARIOS,
  presentOperatingPoint,
  scenarioById,
  scenarioInputs,
  solveMachine,
  type PhaseId,
  type ScenarioId,
} from '../../physics';
import { slowMotionFactor, type SpeedOption } from '../../animation/clock';
import { machineSnapshot } from '../../animation/snapshot';
import { useAnimationClock } from '../../animation/useAnimationClock';
import { interpolate } from '../../i18n';
import { useI18n } from '../../i18n/I18nProvider';
import { Segmented } from '../controls/Segmented';
import { ToggleChip } from '../controls/ToggleChip';
import { TransportControls, stepper, useTransportKeys } from '../controls/Transport';
import { SymbolText } from '../SymbolText';
import { COLORS } from '../theme';
import { ElectricalSumInset } from './ElectricalSumInset';
import { MachineView, type MachineShow } from './MachineView';

const M = REFERENCE_MACHINE;
const POLE_OPTIONS = [2, 4, 6, 8] as const;

export function MachineLab() {
  const { d, fmt } = useI18n();
  const [speed, setSpeed] = useState<SpeedOption>(1);
  const [scenario, setScenario] = useState<ScenarioId>('A');
  const [poles, setPoles] = useState<number>(M.ratedPoles);
  const [highlight, setHighlight] = useState<PhaseId | null>(null);
  const [show, setShow] = useState<MachineShow>({
    bR: true,
    bS: true,
    bNet: true,
    sum: true,
    delta: true,
    flux: true,
    axes: false,
  });
  const clock = useAnimationClock(speed);

  const inputs = { ...scenarioInputs(M, scenarioById(scenario)), poles };
  const state = solveMachine(M, inputs);
  const snap = machineSnapshot(M, state, clock.t);
  const pr = state.op ? presentOperatingPoint(state.op, state.convention) : null;
  const step = stepper(clock, inputs.f);
  useTransportKeys(clock, step);

  const toggle = (key: keyof MachineShow) => (on: boolean) => setShow((s) => ({ ...s, [key]: on }));
  const sc = d.scenarios[scenario];
  const relation = pr ? { leads: d.angles.eALeads, lags: d.angles.eALags, inPhase: d.angles.eAInPhase }[pr.eARelation] : '';
  const deltaMechText = snap ? fmt.degrees(Math.abs(snap.deltaMech)) : '—';
  const deltaElecText = pr ? fmt.degrees(pr.deltaMag) : '—';

  return (
    <section className="lab" aria-labelledby="machine-lab-title">
      <header className="lab__intro">
        <h2 id="machine-lab-title">{d.machineLab.title}</h2>
        <p>
          <SymbolText text={d.machineLab.lead} />
        </p>
      </header>

      <div className="lab__grid">
        <figure className="panel panel--machine">
          <figcaption className="panel__title">{d.machineLab.viewTitle}</figcaption>
          {snap ? (
            <div className={poles > 2 ? 'machine-wrap machine-wrap--inset' : 'machine-wrap'}>
              <MachineView snap={snap} poles={poles} show={show} highlight={highlight} onHighlight={setHighlight} />
              {poles > 2 && <ElectricalSumInset snap={snap} />}
            </div>
          ) : (
            <p className="banner banner--critical">{d.stability.lost} — {d.stability.lostExplanation}</p>
          )}
          <div className="chips chips--legend">
            <ToggleChip checked={show.bR} onChange={toggle('bR')} swatch={COLORS.eA}>
              <SymbolText text={d.machineLab.rotorField} />
            </ToggleChip>
            <ToggleChip checked={show.bS} onChange={toggle('bS')} swatch={COLORS.iA}>
              <SymbolText text={d.machineLab.statorField} />
            </ToggleChip>
            <ToggleChip checked={show.bNet} onChange={toggle('bNet')} swatch={COLORS.vPhi}>
              <SymbolText text={d.machineLab.netField} />
            </ToggleChip>
            {poles === 2 && (
              <ToggleChip checked={show.sum} onChange={toggle('sum')}>
                <SymbolText text={d.machineLab.vectorSum} />
              </ToggleChip>
            )}
            <ToggleChip checked={show.delta} onChange={toggle('delta')}>
              {d.machineLab.deltaArc}
            </ToggleChip>
            <ToggleChip checked={show.flux} onChange={toggle('flux')}>
              {d.machineLab.gapFlux}
            </ToggleChip>
            <ToggleChip checked={show.axes} onChange={toggle('axes')}>
              {d.fieldLab.coilAxes}
            </ToggleChip>
          </div>
          <ul className="notes">
            <li>
              <SymbolText text={interpolate(d.machineLab.syncNote, { nSync: d.symbols.nSync })} />
            </li>
            <li>
              <SymbolText text={d.angles.deltaBetweenFields} />
            </li>
            <li>
              <SymbolText
                text={interpolate(d.angles.mechanicalNote, { poles, deltaElec: deltaElecText, deltaMech: deltaMechText })}
              />
            </li>
            <li>
              <SymbolText
                text={poles === 2 ? d.machineLab.sumNoteTwoPoles : interpolate(d.machineLab.sumNoteManyPoles, { poles })}
              />
            </li>
            <li>
              <SymbolText text={d.machineLab.rotorPolesNote} />
            </li>
            <li>{d.machineLab.rotation}</li>
            <li>{d.assumptions.salientDrawing}</li>
          </ul>
        </figure>

        <div className="lab__side">
          <section className="panel" aria-labelledby="op-title">
            <h3 id="op-title" className="panel__title">
              {d.machineLab.operatingPoint}
            </h3>
            <div className="controls__group">
              <Segmented<ScenarioId>
                label={d.controls.scenario}
                options={SCENARIOS.map((s) => ({ value: s.id, label: s.id }))}
                value={scenario}
                onChange={setScenario}
              />
              <p className="scenario">
                <strong>{sc.title}</strong>
                <br />
                <SymbolText text={sc.description} />
              </p>
              <Segmented<number>
                label={d.controls.poles}
                options={POLE_OPTIONS.map((x) => ({ value: x, label: String(x) }))}
                value={poles}
                onChange={setPoles}
              />
            </div>

            <dl className="readouts">
              <div className="readout readout--hero">
                <dt>{d.machineLab.deltaInside}</dt>
                <dd>
                  {deltaMechText} <small>{d.machineLab.mechanicalShort}</small>
                </dd>
              </div>
              <div className="readout">
                <dt>
                  <SymbolText text={d.machineLab.deltaPhasor} />
                </dt>
                <dd>
                  {deltaElecText} <small>{d.machineLab.electricalShort}</small>
                </dd>
              </div>
              <p className="readouts__note">
                <SymbolText text={relation} />
              </p>
              <div className="readout">
                <dt>{d.machineMode.label}</dt>
                <dd>{d.machineMode[state.operatingMode]}</dd>
              </div>
              <div className="readout">
                <dt>
                  {d.quantities.nSync} <SymbolText text={d.symbols.nSync} />
                </dt>
                <dd>{fmt.rpm(state.nSync)}</dd>
              </div>
              <div className="readout">
                <dt>
                  {d.quantities.iF} <SymbolText text="I_F" />
                </dt>
                <dd>{fmt.current(inputs.iF)}</dd>
              </div>
              <div className="readout">
                <dt>
                  {d.quantities.eA} <SymbolText text="E_A" />
                </dt>
                <dd>{fmt.voltage(state.eA)}</dd>
              </div>
              <div className="readout">
                <dt>
                  {d.quantities.iA} <SymbolText text="I_A" />
                </dt>
                <dd>{pr ? fmt.current(pr.iAMag) : '—'}</dd>
              </div>
              <div className="readout">
                <dt>
                  <SymbolText text={d.stability.margin} />
                </dt>
                <dd>{fmt.percent(state.loadRatio)}</dd>
              </div>
              <p className="readouts__note">
                <SymbolText text={`${d.assumptions.infiniteBus} ${d.assumptions.cylindricalRotor}`} />
              </p>
            </dl>
          </section>

          <section className="panel" aria-label={d.fieldLab.playback}>
            <h3 className="panel__title">{d.fieldLab.playback}</h3>
            <div className="controls__group">
              <TransportControls clock={clock} step={step} speed={speed} onSpeed={setSpeed} />
              <p className="readouts__note">
                {interpolate(d.assumptions.slowMotion, { rpm: fmt.number(state.nSync, 0) })} (
                {interpolate(d.fieldLab.slowMotionFactor, { factor: fmt.number(slowMotionFactor(speed), 0) })})
              </p>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
