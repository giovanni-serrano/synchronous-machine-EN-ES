/**
 * An angle arc that can be highlighted from another view (brief §5.12: highlighting δ in one view highlights it in the
 * other). Pointer hover and keyboard focus both set the shared highlight; a wide transparent stroke is the hit area.
 */

import type { ReactNode } from 'react';
import { COLORS } from '../theme';

export type AngleLink = 'theta' | 'delta' | null;

export function LinkedArc({
  d,
  id,
  link,
  onLink,
  label,
  width = 2.4,
  children,
}: {
  /** SVG path of the arc. */
  d: string;
  id: Exclude<AngleLink, null>;
  link: AngleLink;
  onLink(link: AngleLink): void;
  /** Accessible name. */
  label: string;
  width?: number;
  /** Arc label (text) — also a hover target. */
  children?: ReactNode;
}) {
  const hot = link === id;
  const on = () => onLink(id);
  const off = () => onLink(null);
  return (
    <g
      className={hot ? 'linked-arc is-hot' : 'linked-arc'}
      tabIndex={0}
      role="button"
      aria-label={label}
      aria-pressed={hot}
      onMouseEnter={on}
      onMouseLeave={off}
      onFocus={on}
      onBlur={off}
    >
      {hot && <path d={d} fill="none" stroke={COLORS.accent} strokeOpacity={0.3} strokeWidth={width + 9} strokeLinecap="round" />}
      <path d={d} fill="none" stroke={COLORS.accent} strokeWidth={hot ? width + 1.8 : width} strokeLinecap="round" />
      <path d={d} fill="none" stroke="transparent" strokeWidth={16} pointerEvents="stroke" />
      {children}
    </g>
  );
}
