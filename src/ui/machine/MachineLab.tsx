/**
 * The machine lab (Phases 3–4; brief §5.3–5.5, §6): cross-section + MOTOR / GENERATOR selector, shaft load,
 * excitation, energy flow, and a continuous motor ↔ generator sweep with a locked drawing convention.
 * All physics comes from solveMachine / presentOperatingPoint / energyFlow; the view reads a snapshot.
 */

import { useEffect, useState } from 'react';
import {
  REFERENCE_MACHINE,
  SCENARIOS,
  energyFlow,
  presentOperatingPoint,
  scenarioById,
  scenarioInputs,
  signedPower,
  solveMachine,
  withSignedPower,
  type Convention,
  type MachineInputs,
  type PhaseId,
  type ScenarioId,
  type ShaftMode,
} from '../../physics';
import { slowMotionFactor, type SpeedOption } from '../../animation/clock';
import { machineSnapshot } from '../../animation/snapshot';
import { useAnimationClock } from '../../animation/useAnimationClock';
import { interpolate } from '../../i18n';
import { useI18n } from '../../i18n/I18nProvider';
import { Segmented } from '../controls/Segmented';
import { Slider } from '../controls/Slider';
import { ToggleChip } from '../controls/ToggleChip';
import { TransportControls, stepper, useTransportKeys } from '../controls/Transport';
import { SymbolText } from '../SymbolText';
import { COLORS } from '../theme';
import { ElectricalSumInset } from './ElectricalSumInset';
import { EnergyFlowDiagram } from './EnergyFlowDiagram';
import { MachineView, type MachineShow } from './MachineView';

const M = REFERENCE_MACHINE;
const POLE_OPTIONS = [2, 4, 6, 8] as const;
/** Shaft-power slider range, W (1.5 pu: enough to push most excitations past P_max). */
export const LOAD_MAX = 150_000;
/** Auto sweep: signed shaft power = SWEEP_AMPLITUDE · sin(2π t / SWEEP_PERIOD_S). Visual driver only. */
const SWEEP_AMPLITUDE = 100_000;
const SWEEP_PERIOD_S = 14;

const DEFAULT_INPUTS: MachineInputs = scenarioInputs(M, scenarioById('A'));

const samePreset = (a: MachineInputs, b: MachineInputs) =>
  a.mode === b.mode && Math.abs(a.load - b.load) < 1 && Math.abs(a.iF - b.iF) < 0.005;

export function MachineLab() {
  const { d, fmt } = useI18n();
  const [speed, setSpeed] = useState<SpeedOption>(1);
  const [inputs, setInputs] = useState<MachineInputs>(DEFAULT_INPUTS);
  const [continuous, setContinuous] = useState(false);
  const [drawingConvention, setDrawingConvention] = useState<Convention>('generator');
  const [sweeping, setSweeping] = useState(false);
  const [highlight, setHighlight] = useState<PhaseId | null>(null);
  const [show, setShow] = useState<MachineShow>({ bR: true, bS: true, bNet: true, sum: true, delta: true, flux: true, axes: false });
  const clock = useAnimationClock(speed);

  // Auto sweep (continuous mode): drives the signed shaft power smoothly through zero and back.
  useEffect(() => {
    if (!sweeping) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = SWEEP_AMPLITUDE * Math.sin((2 * Math.PI * (now - start)) / 1000 / SWEEP_PERIOD_S);
      setInputs((prev) => withSignedPower(prev, p));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sweeping]);

  const state = solveMachine(M, inputs);
  const snap = machineSnapshot(M, state, clock.t);
  const convention: Convention = continuous ? drawingConvention : state.convention;
  const pr = state.op ? presentOperatingPoint(state.op, state.convention, convention) : null;
  const flow = state.op ? energyFlow(state.op) : null;
  const step = stepper(clock, inputs.f);
  useTransportKeys(clock, step);

  const set = (patch: Partial<MachineInputs>) => {
    setSweeping(false);
    setInputs((prev) => ({ ...prev, ...patch }));
  };
  const applyPreset = (id: ScenarioId) => {
    setSweeping(false);
    setInputs((prev) => ({ ...scenarioInputs(M, scenarioById(id)), poles: prev.poles }));
  };
  const activePreset = SCENARIOS.find((s) => samePreset(inputs, scenarioInputs(M, s)))?.id;
  const toggle = (key: keyof MachineShow) => (on: boolean) => setShow((s) => ({ ...s, [key]: on }));

  const relation = pr ? { leads: d.angles.eALeads, lags: d.angles.eALags, inPhase: d.angles.eAInPhase }[pr.eARelation] : '';
  const deltaMechText = snap ? fmt.degrees(Math.abs(snap.deltaMech)) : '—';
  const deltaElecText = pr ? fmt.degrees(pr.deltaMag) : '—';
  const pSigned = signedPower(inputs);
  const loadLabel = inputs.mode === 'motor' ? d.controls.shaftLoad : d.controls.primeMover;
  const chain =
    state.operatingMode === 'motor'
      ? d.energyFlow.motorChain
      : state.operatingMode === 'generator'
        ? d.energyFlow.generatorChain
        : d.energyFlow.noLoadChain;

  return (
    <section className="lab" aria-labelledby="machine-lab-title">
      <header className="lab__intro">
        <h2 id="machine-lab-title">{d.machineLab.title}</h2>
        <p>
          <SymbolText text={d.machineLab.lead} />
        </p>
      </header>

      <div className="lab__grid">
        <div className="lab__main">
          <figure className="panel panel--machine">
            <figcaption className="panel__title">
              {d.machineLab.viewTitle} · {d.machineMode[state.operatingMode]}
            </figcaption>
            {snap ? (
              <div className={inputs.poles > 2 ? 'machine-wrap machine-wrap--inset' : 'machine-wrap'}>
                <MachineView snap={snap} poles={inputs.poles} show={show} highlight={highlight} onHighlight={setHighlight} />
                {inputs.poles > 2 && <ElectricalSumInset snap={snap} />}
              </div>
            ) : (
              <div className="banner banner--critical" role="alert">
                <strong>{d.stability.lost}.</strong> <SymbolText text={d.stability.lostExplanation} />
                <br />
                {d.stability.recoverHint}
              </div>
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
              {inputs.poles === 2 && (
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
              {snap && (
                <li>
                  <SymbolText
                    text={interpolate(d.angles.mechanicalNote, { poles: inputs.poles, deltaElec: deltaElecText, deltaMech: deltaMechText })}
                  />
                </li>
              )}
              <li>
                <SymbolText
                  text={
                    inputs.poles === 2 ? d.machineLab.sumNoteTwoPoles : interpolate(d.machineLab.sumNoteManyPoles, { poles: inputs.poles })
                  }
                />
              </li>
              <li>
                <SymbolText text={d.machineLab.rotorPolesNote} />
              </li>
              <li>{d.machineLab.rotation}</li>
              <li>{d.assumptions.salientDrawing}</li>
            </ul>
          </figure>

          <section className="panel panel--energy" aria-labelledby="energy-title">
            <h3 id="energy-title" className="panel__title">
              {d.energyFlow.title}
            </h3>
            <EnergyFlowDiagram flow={flow} ratedS={M.ratedS} />
            <p className="scenario">{chain}</p>
            <ul className="notes">
              <li>{d.energyFlow.qNote}</li>
              <li>
                <SymbolText text={d.assumptions.lossless} />
              </li>
            </ul>
          </section>
        </div>

        <div className="lab__side">
          <section className="panel panel--controls" aria-labelledby="controls-title">
            <h3 id="controls-title" className="panel__title">
              {d.machineControls.title}
            </h3>
            <div className="controls__group">
              {!continuous ? (
                <>
                  <div className="mode-select">
                    <Segmented<ShaftMode>
                      label={d.machineMode.label}
                      options={[
                        { value: 'motor', label: d.machineMode.motor },
                        { value: 'generator', label: d.machineMode.generator },
                      ]}
                      value={inputs.mode}
                      onChange={(mode) => set({ mode })}
                    />
                  </div>
                  <Slider
                    label={loadLabel}
                    value={inputs.load}
                    min={0}
                    max={LOAD_MAX}
                    step={500}
                    onChange={(load) => set({ load })}
                    display={fmt.power(inputs.load, 'W')}
                    valueText={fmt.power(inputs.load, 'W')}
                  />
                </>
              ) : (
                <Slider
                  label={d.machineControls.shaftPower}
                  value={pSigned}
                  min={-LOAD_MAX}
                  max={LOAD_MAX}
                  step={500}
                  centerMark
                  onChange={(p) => {
                    setSweeping(false);
                    setInputs((prev) => withSignedPower(prev, p));
                  }}
                  display={`${fmt.power(Math.abs(pSigned), 'W')} · ${d.machineMode[state.operatingMode]}`}
                  valueText={`${fmt.power(Math.abs(pSigned), 'W')} ${d.machineMode[state.operatingMode]}`}
                  hint={d.machineControls.signedHint}
                />
              )}
              <Slider
                label={
                  <>
                    {d.controls.excitation} <SymbolText text="(I_F)" />
                  </>
                }
                value={inputs.iF}
                min={0}
                max={M.ifMax}
                step={0.01}
                onChange={(iF) => set({ iF })}
                display={
                  <>
                    {fmt.current(inputs.iF)} · <SymbolText text={interpolate(d.machineControls.eAValue, { value: fmt.voltage(state.eA) })} />
                  </>
                }
                valueText={`${fmt.current(inputs.iF)}, ${fmt.voltage(state.eA)}`}
              />
              <Segmented<number>
                label={d.controls.poles}
                options={POLE_OPTIONS.map((x) => ({ value: x, label: String(x) }))}
                value={inputs.poles}
                onChange={(poles) => set({ poles })}
              />
              <div className="chips">
                <ToggleChip
                  checked={continuous}
                  onChange={(on) => {
                    setContinuous(on);
                    if (!on) setSweeping(false);
                  }}
                >
                  {d.machineControls.continuous}
                </ToggleChip>
                {continuous && (
                  <ToggleChip checked={sweeping} onChange={setSweeping}>
                    {d.machineControls.autoSweep}
                  </ToggleChip>
                )}
              </div>
              {continuous && (
                <>
                  <p className="hint">
                    <SymbolText text={d.machineControls.continuousHint} />
                  </p>
                  <Segmented<Convention>
                    label={d.machineControls.drawingConvention}
                    options={[
                      { value: 'generator', label: d.machineMode.generator },
                      { value: 'motor', label: d.machineMode.motor },
                    ]}
                    value={drawingConvention}
                    onChange={setDrawingConvention}
                  />
                </>
              )}
              <Segmented<ScenarioId | ''>
                label={d.machineControls.presets}
                options={SCENARIOS.map((s) => ({ value: s.id, label: s.id }))}
                value={activePreset ?? ''}
                onChange={(id) => id && applyPreset(id)}
              />
              {activePreset && (
                <p className="scenario">
                  <strong>{d.scenarios[activePreset].title}</strong>
                  <br />
                  <SymbolText text={d.scenarios[activePreset].description} />
                </p>
              )}
            </div>
            <div className="status-list" aria-live="polite">
              {state.stability === 'nearLimit' && (
                <p className="banner banner--warning">
                  <strong>{d.stability.nearLimit}.</strong> <SymbolText text={d.stability.excitationNote} />
                </p>
              )}
              {state.warnings.statorOvercurrent && (
                <p className="banner banner--warning">
                  <SymbolText text={d.warnings.statorOvercurrent} />
                </p>
              )}
              {state.warnings.fieldOverexcitation && (
                <p className="banner banner--warning">
                  <SymbolText text={d.warnings.fieldOverexcitation} />
                </p>
              )}
            </div>
          </section>

          <section className="panel" aria-labelledby="op-title">
            <h3 id="op-title" className="panel__title">
              {d.machineLab.operatingPoint}
            </h3>
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
                  {d.quantities.iA} <SymbolText text="I_A" />
                </dt>
                <dd>{pr ? fmt.current(pr.iAMag) : '—'}</dd>
              </div>
              <div className="readout">
                <dt>
                  {d.quantities.torque} <SymbolText text="τ_ind" />
                </dt>
                <dd>
                  {pr ? fmt.torque(pr.torqueMag) : '—'}
                  {pr && pr.torqueAction !== 'none' && <span className="readout__qualifier"> · {d.torque[pr.torqueAction]}</span>}
                </dd>
              </div>
              <div className="readout">
                <dt>
                  <SymbolText text={d.stability.margin} />
                </dt>
                <dd>{Number.isFinite(state.loadRatio) ? fmt.percent(state.loadRatio) : '—'}</dd>
              </div>
              <p className="readouts__note convention-note">
                <SymbolText text={d.convention[convention]} />
              </p>
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
