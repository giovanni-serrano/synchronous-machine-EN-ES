/**
 * Electrical angle ωt for a narrative figure: plays slowly (one cycle every `cycleSeconds`), pauses while the reader
 * scrubs, and responds to the keyboard (space = play/pause, ← → = step 5°). Starts paused with reduced motion.
 */

import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import { prefersReducedMotion } from '../canvas/useCanvasFigure';

const STEP = (5 * Math.PI) / 180;

export function useScrubTime(cycleSeconds: number, initial = 0.5) {
  const [playing, setPlaying] = useState(() => !prefersReducedMotion());
  const wt = useRef(initial);
  const dragging = useRef(false);

  const advance = useCallback(
    (dt: number) => {
      if (playing && !dragging.current) wt.current = (wt.current + (2 * Math.PI * dt) / cycleSeconds) % (2 * Math.PI);
      return wt.current;
    },
    [playing, cycleSeconds],
  );

  const onKey = useCallback((e: KeyboardEvent, invalidate: () => void, extra?: (key: string) => boolean) => {
    if (e.key === ' ') {
      setPlaying((p) => !p);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      setPlaying(false);
      wt.current = (wt.current + (e.key === 'ArrowRight' ? STEP : -STEP) + 2 * Math.PI) % (2 * Math.PI);
      invalidate();
    } else if (!extra?.(e.key)) return;
    e.preventDefault();
  }, []);

  return { wt, playing, setPlaying, advance, dragging, onKey };
}

/** Slow-motion factor shown to the reader: real 60 Hz cycle vs the figure's cycle. */
export const slowdown = (cycleSeconds: number, f = 60) => Math.round(cycleSeconds * f);
