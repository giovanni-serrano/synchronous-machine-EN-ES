/**
 * Timeline of the hook loop (checkpoint 2b review): the claim is "three coils that never move make a magnet that
 * spins", so the loop shows exactly that before any rotor appears.
 *
 *   empty      the stator alone, no current
 *   energise   the three currents fade in; the field (N and S lobes) appears
 *   field      the magnet turns inside the empty machine
 *   rotor      a rotor fades in, turning a little behind the field
 *   lockIn     it pulls into step (damped approach to its load angle)
 *   locked     rotor and field turn together
 *   fade       everything fades out; the loop restarts
 *
 * Pure function of the loop time, so the essay, the clip view and the recording script all show the same frames.
 * The stator field itself always follows the model (statorGapField); the rotor's pull-in is a qualitative illustration.
 */

export type HookStage = 'empty' | 'energise' | 'field' | 'rotor' | 'lockIn' | 'locked' | 'fade' | 'rotorOut';
export type HookVariant = 'clip' | 'essay';

export const HOOK_STAGES: ReadonlyArray<readonly [HookStage, number]> = [
  ['empty', 1.4],
  ['energise', 1.8],
  ['field', 6.5],
  ['rotor', 1.6],
  ['lockIn', 3.2],
  ['locked', 6.0],
  ['fade', 1.5],
];
export const HOOK_LOOP_S = HOOK_STAGES.reduce((s, [, d]) => s + d, 0);

/**
 * The essay's variant (review 2c): it opens with the magnet already turning and never shows the empty stator; at the
 * end only the rotor fades out, so the loop returns to the magnet turning alone.
 */
export const HOOK_ESSAY_STAGES: ReadonlyArray<readonly [HookStage, number]> = [
  ['field', 5.5],
  ['rotor', 1.6],
  ['lockIn', 3.2],
  ['locked', 6.0],
  ['rotorOut', 1.5],
];
export const HOOK_ESSAY_LOOP_S = HOOK_ESSAY_STAGES.reduce((s, [, d]) => s + d, 0);

export const hookStages = (variant: HookVariant) => (variant === 'essay' ? HOOK_ESSAY_STAGES : HOOK_STAGES);
export const hookLoopSeconds = (variant: HookVariant) => (variant === 'essay' ? HOOK_ESSAY_LOOP_S : HOOK_LOOP_S);
/** Electrical cycle of the field in the hook, s (slow: the field turns once every 8 s). */
export const HOOK_CYCLE_S = 8;
/** Final lag of the rotor behind the field (a lightly loaded motor), rad. */
export const HOOK_LAG = 0.35;

export interface HookFrame {
  readonly stage: HookStage;
  /** Current envelope 0 … 1 (field strength). */
  readonly envelope: number;
  /** Rotor visibility 0 … 1. */
  readonly rotor: number;
  /** Rotor angle behind the field, rad. */
  readonly lag: number;
  /** Index of the caption to show (clip view): 0 empty/energise, 1 field, 2 rotor/lock-in, 3 locked. */
  readonly caption: number;
}

const smooth = (x: number) => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

const START_LAG = 1.7;

export function hookFrame(loopTime: number, variant: HookVariant = 'clip'): HookFrame {
  const loop = hookLoopSeconds(variant);
  const stages = hookStages(variant);
  const last = stages[stages.length - 1]![0];
  let t = ((loopTime % loop) + loop) % loop;
  for (const [stage, dur] of stages) {
    if (t < dur || stage === last) {
      const p = Math.min(1, t / dur);
      switch (stage) {
        case 'empty':
          return { stage, envelope: 0, rotor: 0, lag: START_LAG, caption: 0 };
        case 'energise':
          return { stage, envelope: smooth(p), rotor: 0, lag: START_LAG, caption: 0 };
        case 'field':
          return { stage, envelope: 1, rotor: 0, lag: START_LAG, caption: 1 };
        case 'rotor':
          return { stage, envelope: 1, rotor: smooth(p), lag: START_LAG, caption: 2 };
        case 'lockIn': {
          // damped approach from START_LAG to HOOK_LAG with one small overshoot
          const tau = p * dur;
          const lag = HOOK_LAG + (START_LAG - HOOK_LAG) * Math.exp(-1.35 * tau) * Math.cos(2.1 * tau);
          return { stage, envelope: 1, rotor: 1, lag, caption: 2 };
        }
        case 'locked':
          return { stage, envelope: 1, rotor: 1, lag: HOOK_LAG, caption: 3 };
        case 'fade':
          return { stage, envelope: 1 - smooth(p), rotor: 1 - smooth(p), lag: HOOK_LAG, caption: 3 };
        case 'rotorOut':
          return { stage, envelope: 1, rotor: 1 - smooth(p), lag: HOOK_LAG, caption: 3 };
      }
    }
    t -= dur;
  }
  return { stage: 'locked', envelope: 1, rotor: 1, lag: HOOK_LAG, caption: 3 };
}
