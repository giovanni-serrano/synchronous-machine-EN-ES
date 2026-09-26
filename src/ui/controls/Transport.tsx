import { useEffect } from 'react';
import { SPEED_OPTIONS, STEP_DEGREES, stepClock, type SpeedOption } from '../../animation/clock';
import type { AnimationClock } from '../../animation/useAnimationClock';
import { useI18n } from '../../i18n/I18nProvider';
import { PauseIcon, PlayIcon, StepBackIcon, StepForwardIcon } from '../icons';
import { Segmented } from './Segmented';

const isInteractive = (el: EventTarget | null): boolean =>
  el instanceof Element && (/^(INPUT|BUTTON|SELECT|TEXTAREA|A)$/.test(el.tagName) || el.closest('[tabindex]') !== null);

/** Frame step that also pauses. */
export function stepper(clock: AnimationClock, f: number) {
  return (deg: number) => {
    clock.setPlaying(false);
    clock.setT((t) => stepClock(t, f, deg));
  };
}

/** Space = play/pause, ←/→ = step. Ignored while focus is on a control. */
export function useTransportKeys(clock: AnimationClock, step: (deg: number) => void) {
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
}

export function TransportControls({
  clock,
  step,
  speed,
  onSpeed,
}: {
  clock: AnimationClock;
  step: (deg: number) => void;
  speed: SpeedOption;
  onSpeed(speed: SpeedOption): void;
}) {
  const { d, fmt } = useI18n();
  return (
    <>
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
        onChange={onSpeed}
      />
      <p className="hint">{d.fieldLab.keyboardHint}</p>
    </>
  );
}
