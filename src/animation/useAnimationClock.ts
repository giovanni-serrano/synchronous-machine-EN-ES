import { useCallback, useEffect, useRef, useState } from 'react';
import { BASE_TIME_SCALE, advanceClock } from './clock';

export interface AnimationClock {
  /** Physical time, s. */
  readonly t: number;
  readonly playing: boolean;
  setPlaying(playing: boolean): void;
  /** Jump to a physical time (pauses nothing by itself). */
  setT(t: number | ((prev: number) => number)): void;
}

/** requestAnimationFrame-driven physical clock. `speed` multiplies the base slow-motion scale. */
export function useAnimationClock(speed: number, initiallyPlaying = true): AnimationClock {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(initiallyPlaying);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      const dt = last === null ? 0 : (now - last) / 1000;
      last = now;
      setT((prev) => advanceClock(prev, dt, BASE_TIME_SCALE * speedRef.current));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const set = useCallback((next: number | ((prev: number) => number)) => setT(next), []);
  return { t, playing, setPlaying, setT: set };
}
