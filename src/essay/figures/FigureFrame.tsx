/**
 * DOM frame of an essay figure: a fixed-aspect box holding the canvas, an optional play/pause button in the corner
 * and a one-line instruction underneath. Nothing inside changes size while the figure animates.
 */

import type { KeyboardEvent, PointerEvent, ReactNode, Ref } from 'react';
import { useId } from 'react';
import { useI18n } from '../../i18n/I18nProvider';

export function FigureFrame({
  boxRef,
  canvasRef,
  aspect,
  label,
  instruction,
  keysHint,
  playing,
  onTogglePlay,
  onKeyDown,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  className = '',
  children,
}: {
  boxRef: Ref<HTMLDivElement>;
  canvasRef: Ref<HTMLCanvasElement>;
  /** width / height; omit when the figure class sets the aspect in CSS (e.g. fig--scene: 5:6 phone, 16:10 desktop) */
  aspect?: number;
  label: string;
  instruction?: ReactNode;
  keysHint?: string;
  playing?: boolean;
  onTogglePlay?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLCanvasElement>) => void;
  onPointerDown?: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerMove?: (e: PointerEvent<HTMLCanvasElement>) => void;
  onPointerUp?: (e: PointerEvent<HTMLCanvasElement>) => void;
  className?: string;
  children?: ReactNode;
}) {
  const { d } = useI18n();
  const hintId = useId();
  const interactive = !!onPointerDown;
  return (
    <figure className={`fig ${className}`}>
      <div className="fig__box" ref={boxRef} style={aspect ? { aspectRatio: String(aspect) } : undefined}>
        <canvas
          ref={canvasRef}
          className={interactive ? 'fig__canvas fig__canvas--interactive' : 'fig__canvas'}
          role="img"
          aria-label={label}
          aria-describedby={keysHint ? hintId : undefined}
          tabIndex={interactive ? 0 : -1}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        />
        {onTogglePlay && (
          <button type="button" className="fig__play" onClick={onTogglePlay} aria-label={playing ? d.essay.figure.pause : d.essay.figure.play}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {playing ? (
                <g fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </g>
              ) : (
                <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
              )}
            </svg>
          </button>
        )}
        {children}
      </div>
      {(instruction || keysHint) && (
        <figcaption className="fig__caption">
          {instruction}
          {keysHint && (
            <span id={hintId} className="visually-hidden">
              {' '}
              {keysHint}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

/** Pointer position in the canvas' CSS pixels. */
export function localPoint(e: PointerEvent<HTMLCanvasElement>): [number, number] {
  const r = e.currentTarget.getBoundingClientRect();
  return [e.clientX - r.left, e.clientY - r.top];
}
