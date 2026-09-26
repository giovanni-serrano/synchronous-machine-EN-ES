/**
 * Canvas figure loop for the essay.
 *
 * - The figure box has a fixed aspect ratio set in CSS; the canvas fills it, so drawing never changes layout
 *   (docs/experience-redesign.md §4).
 * - One requestAnimationFrame loop per figure, running only while the figure is near the viewport and the tab is
 *   visible. When not animating, `invalidate()` draws a single frame (e.g. after a drag).
 * - Device pixel ratio capped at 2.
 */

import { useCallback, useEffect, useRef } from 'react';

export interface Frame {
  readonly ctx: CanvasRenderingContext2D;
  /** Size in CSS pixels. */
  readonly w: number;
  readonly h: number;
  /** Seconds since the previous drawn frame (0 on a single invalidated frame), capped at 0.05 s. */
  readonly dt: number;
}

export function useCanvasFigure(draw: (frame: Frame) => void, animate: boolean) {
  const boxRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const visible = useRef(false);
  const animateRef = useRef(animate);
  animateRef.current = animate;
  const raf = useRef(0);
  const last = useRef<number | null>(null);

  const paint = useCallback((dt: number) => {
    const canvas = canvasRef.current;
    const { w, h, dpr } = size.current;
    if (!canvas || w === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawRef.current({ ctx, w, h, dt });
  }, []);

  const loop = useCallback(
    (now: number) => {
      const dt = last.current === null ? 0 : Math.min(0.05, (now - last.current) / 1000);
      last.current = now;
      paint(dt);
      if (visible.current && animateRef.current && !document.hidden) raf.current = requestAnimationFrame(loop);
      else {
        raf.current = 0;
        last.current = null;
      }
    },
    [paint],
  );

  const start = useCallback(() => {
    if (raf.current || !visible.current || !animateRef.current || document.hidden) return;
    last.current = null;
    raf.current = requestAnimationFrame(loop);
  }, [loop]);

  /** Draw one frame now (used when paused, after input). */
  const invalidate = useCallback(() => {
    if (!raf.current) requestAnimationFrame(() => paint(0));
  }, [paint]);

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const resize = () => {
      const rect = box.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      size.current = { w: rect.width, h: rect.height, dpr };
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      paint(0);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    const io = new IntersectionObserver(
      ([entry]) => {
        visible.current = !!entry?.isIntersecting;
        if (visible.current) start();
      },
      { rootMargin: '120px 0px' },
    );
    io.observe(box);
    const onVisibility = () => {
      if (!document.hidden) start();
    };
    document.addEventListener('visibilitychange', onVisibility);
    // Canvas text uses the web fonts: redraw once they are ready.
    document.fonts?.ready.then(() => paint(0)).catch(() => {});
    resize();
    return () => {
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (raf.current) cancelAnimationFrame(raf.current);
      raf.current = 0;
    };
  }, [paint, start]);

  useEffect(() => {
    if (animate) start();
    else invalidate();
  }, [animate, start, invalidate]);

  return { boxRef, canvasRef, invalidate };
}

/** prefers-reduced-motion, read once (figures then start paused and can be scrubbed). */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
