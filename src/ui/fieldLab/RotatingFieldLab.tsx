/**
 * Phase 2 — rotating magnetic field lab (brief §5.1, §5.2; lesson scenes 2–3; demos A–B).
 * Three currents 120° apart → pulsating phase fields → constant-length rotating resultant; poles change the
 * N–S pattern and the mechanical speed. Pause, frame step, scrubbing, individual contributions.
 */

import { useEffect, useState } from 'react';
import { PHASES, synchronousSpeed, type PhaseId } from '../../physics';
import {
  SPEED_OPTIONS,
  STEP_DEGREES,
  electricalAngle,
  slowMotionFactor,
  stepClock,
  type SpeedOption,
} from '../../animation/clock';
import { useAnimationClock } from '../../animation/useAnimationClock';
import { interpolate } from '../../i18n';
import { useI18n } from '../../i18n/I18nProvider';
import { Segmented } from '../controls/Segmented';
import { ToggleChip } from '../controls/ToggleChip';
import { PauseIcon, PlayIcon, StepBackIcon, StepForwardIcon } from '../icons';
import { SymbolText } from '../SymbolText';
import { PHASE_COLORS, RESULTANT_COLOR } from '../theme';
import { AirGapView } from './AirGapView';
import { PhaseCurrentsPlot } from './PhaseCurrentsPlot';
import { SpaceVectorDiagram } from './SpaceVectorDiagram';

const TWO_PI = 2 * Math.PI;
const FREQUENCIES = [50, 60] as const;
const POLE_OPTIONS = [2, 4, 6, 8] as const;

const isInteractive = (el: EventTarget | null): boolean =>
  el instanceof HTMLElement && /^(INPUT|BUTTON|SELECT|TEXTAREA|A)$/.test(el.tagName);

export function RotatingFieldLab() {
  const { d, fmt } = useI18n();
  const [speed, setSpeed] = useState<SpeedOption>(1);
  const [f, setF] = useState<number>(60);
  const [poles, setPoles] = useState<number>(2);
  const [phases, setPhases] = useState<Record<PhaseId, boolean>>({ a: true, b: true, c: true });
  const [resultant, setResultant] = useState(true);
  const [tipToTail, setTipToTail] = useState(false);
  const [flux, setFlux] = useState(true);
  const clock = useAnimationClock(speed);

  const wt = electricalAngle(clock.t, f);
  const wtWrapped = ((wt % TWO_PI) + TWO_PI) % TWO_PI;
  const pairs = poles / 2;
  const nSync = synchronousSpeed(f, poles);

  const step = (deg: number) => {
    clock.setPlaying(false);
    clock.setT((t) => stepClock(t, f, deg));
  };
  const scrub = (angle: number) => {
    clock.setPlaying(false);
    clock.setT((t) => (Math.floor(electricalAngle(t, f) / TWO_PI) * TWO_PI + angle) / (TWO_PI * f));
  };
  // Changing f keeps the present ωt (no jump); only the speed of what follows changes.
  const changeFrequency = (next: number) => {
    clock.setT((t) => (t * f) / next);
    setF(next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isInteractive(e.target)) return;
      if (e.key === ' ') {
        e.preventDefault();
        clock.setPlaying(!clock.playing);
      } else if (e.key === 'ArrowRight') step(STEP_DEGREES);
      else if (e.key === 'ArrowLeft') step(-STEP_DEGREES);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <section className="lab" aria-labelledby="field-lab-title">
      <header className="lab__intro">
        <h2 id="field-lab-title">{d.fieldLab.title}</h2>
        <p>{d.fieldLab.lead}</p>
      </header>

      <div className="lab__grid">
        <figure className="panel panel--machine">
          <figcaption className="panel__title">{d.fieldLab.airGapTitle}</figcaption>
          <AirGapView wt={wt} poles={poles} show={{ phases, resultant, flux }} />
          <div className="legend">
            <span className="legend__item">
              <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true">
                <circle r="6" fill="none" stroke="currentColor" />
                <circle r="2" fill="currentColor" />
              </svg>
              {d.fieldLab.currentOut}
            </span>
            <span className="legend__item">
              <svg width="14" height="14" viewBox="-7 -7 14 14" aria-hidden="true">
                <circle r="6" fill="none" stroke="currentColor" />
                <path d="M-3 -3L3 3M-3 3L3 -3" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              {d.fieldLab.currentIn}
            </span>
          </div>
          <ul className="notes">
            <li>{d.fieldLab.captionPoleFaces}</li>
            <li>
              {poles === 2
                ? d.fieldLab.captionTwoPoles
                : interpolate(d.fieldLab.captionManyPoles, { poles, pairs })}
            </li>
            <li>{d.fieldLab.noRotor}</li>
          </ul>
        </figure>

        <div className="lab__side">
          <figure className="panel">
            <figcaption className="panel__title">
              {d.fieldLab.vectorsTitle} <span className="panel__note">· {d.fieldLab.vectorsNote}</span>
            </figcaption>
            <SpaceVectorDiagram wt={wt} phases={phases} resultant={resultant} tipToTail={tipToTail} />
            <ul className="notes">
              <li>{d.fieldLab.captionPulsating}</li>
              <li>
                <SymbolText text={d.fieldLab.captionResultant} />
              </li>
            </ul>
          </figure>

          <figure className="panel">
            <figcaption className="panel__title">
              {d.fieldLab.currentsTitle}{' '}
              <span className="panel__note">
                · <SymbolText text={d.fieldLab.currentsAxis} />
              </span>
            </figcaption>
            <div className="legend">
              {PHASES.map((ph) => (
                <span key={ph} className="legend__item">
                  <span className="legend__line" style={{ background: PHASE_COLORS[ph] }} aria-hidden="true" />
                  <SymbolText text={`i_${ph}`} />
                </span>
              ))}
            </div>
            <PhaseCurrentsPlot wt={wt} phases={phases} onScrub={scrub} />
            <p className="hint">{d.fieldLab.scrubHint}</p>
          </figure>
        </div>
      </div>

      <div className="controls">
        <div className="controls__group">
          <span className="controls__label">{d.fieldLab.playback}</span>
          <div className="transport">
            <button type="button" onClick={() => step(-STEP_DEGREES)} aria-label={d.controls.stepBack} title={d.controls.stepBack}>
              <StepBackIcon />
            </button>
            <button type="button" className="transport__play" onClick={() => clock.setPlaying(!clock.playing)}>
              {clock.playing ? <PauseIcon /> : <PlayIcon />}
              <span>{clock.playing ? d.controls.pause : d.controls.play}</span>
            </button>
            <button type="button" onClick={() => step(STEP_DEGREES)} aria-label={d.controls.stepForward} title={d.controls.stepForward}>
              <StepForwardIcon />
            </button>
          </div>
          <Segmented<SpeedOption>
            label={d.controls.animationSpeed}
            options={SPEED_OPTIONS.map((s) => ({ value: s, label: `×${fmt.number(s, s < 1 ? 2 : 0)}` }))}
            value={speed}
            onChange={setSpeed}
          />
          <p className="hint">{d.fieldLab.keyboardHint}</p>
        </div>

        <div className="controls__group">
          <span className="controls__label">{d.fieldLab.grid}</span>
          <Segmented<number>
            label={d.controls.frequency}
            options={FREQUENCIES.map((x) => ({ value: x, label: fmt.hertz(x) }))}
            value={f}
            onChange={changeFrequency}
          />
          <Segmented<number>
            label={d.controls.poles}
            options={POLE_OPTIONS.map((x) => ({ value: x, label: String(x) }))}
            value={poles}
            onChange={setPoles}
          />
        </div>

        <div className="controls__group">
          <span className="controls__label">{d.fieldLab.show}</span>
          <div className="chips">
            {PHASES.map((ph) => (
              <ToggleChip
                key={ph}
                checked={phases[ph]}
                swatch={PHASE_COLORS[ph]}
                onChange={(on) => setPhases((prev) => ({ ...prev, [ph]: on }))}
              >
                {interpolate(d.fieldLab.phase, { phase: ph })}
              </ToggleChip>
            ))}
            <ToggleChip checked={resultant} swatch={RESULTANT_COLOR} onChange={setResultant}>
              {d.fieldLab.resultant}
            </ToggleChip>
            <ToggleChip checked={tipToTail} onChange={setTipToTail}>
              {d.fieldLab.tipToTail}
            </ToggleChip>
            <ToggleChip checked={flux} onChange={setFlux}>
              {d.fieldLab.airGapFlux}
            </ToggleChip>
          </div>
        </div>

        <dl className="readouts">
          <div className="readout readout--hero">
            <dt>
              {d.quantities.nSync} <SymbolText text={d.symbols.nSync} />
            </dt>
            <dd>{fmt.rpm(nSync)}</dd>
          </div>
          <div className="readout">
            <dt>{d.fieldLab.electricalAngle}</dt>
            <dd>{fmt.degrees(wtWrapped, 0)}</dd>
          </div>
          <div className="readout">
            <dt>{d.fieldLab.fieldPosition}</dt>
            <dd>{fmt.degrees(wtWrapped / pairs, 0)}</dd>
          </div>
          <p className="readouts__note">
            {interpolate(d.assumptions.slowMotion, { rpm: fmt.number(nSync, 0) })}{' '}
            ({interpolate(d.fieldLab.slowMotionFactor, { factor: fmt.number(slowMotionFactor(speed), 0) })})
          </p>
        </dl>
      </div>
    </section>
  );
}
