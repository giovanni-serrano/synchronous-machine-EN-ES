/**
 * i_a, i_b, i_c over one electrical cycle, with a cursor at the present ωt. Hover shows the values;
 * dragging scrubs through the cycle (calls onScrub with an electrical angle in [0, 2π)).
 */

import { useState, type PointerEvent } from 'react';
import { PHASES, statorField, type PhaseId } from '../../physics';
import { useI18n } from '../../i18n/I18nProvider';
import { SvgSymbolText } from '../SymbolText';
import { COLORS, PHASE_COLORS } from '../theme';

const W = 400;
const H = 200;
const L = 40;
const R = 12;
const T = 26;
const B = 34;
const PW = W - L - R;
const PH = H - T - B;
const SAMPLES = 181;
const TWO_PI = 2 * Math.PI;

const xOf = (angle: number) => L + (angle / TWO_PI) * PW;
const yOf = (value: number) => T + ((1 - value) / 2) * PH;
const PEAK_ANGLE: Record<PhaseId, number> = { a: 0.06, b: TWO_PI / 3, c: (2 * TWO_PI) / 3 };

export function PhaseCurrentsPlot({
  wt,
  phases,
  onScrub,
}: {
  wt: number;
  phases: Readonly<Record<PhaseId, boolean>>;
  onScrub(angle: number): void;
}) {
  const { d, fmt } = useI18n();
  const [hover, setHover] = useState<number | null>(null);
  const cursor = ((wt % TWO_PI) + TWO_PI) % TWO_PI;

  const angleFromEvent = (e: PointerEvent<SVGSVGElement>): number => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    return Math.min(TWO_PI - 1e-9, Math.max(0, ((x - L) / PW) * TWO_PI));
  };

  const paths = PHASES.map((ph) => {
    let dPath = '';
    for (let k = 0; k < SAMPLES; k++) {
      const a = (TWO_PI * k) / (SAMPLES - 1);
      dPath += `${k === 0 ? 'M' : 'L'}${xOf(a).toFixed(2)},${yOf(statorField(a)[ph].current).toFixed(2)}`;
    }
    return { ph, dPath };
  });

  const now = statorField(cursor);
  const hovered = hover === null ? null : statorField(hover);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="currents"
      role="img"
      aria-label={d.fieldLab.currentsTitle}
      onPointerMove={(e) => {
        const a = angleFromEvent(e);
        setHover(a);
        if (e.buttons === 1) onScrub(a);
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onScrub(angleFromEvent(e));
      }}
      onPointerLeave={() => setHover(null)}
    >
      {/* Grid and axes */}
      {[-1, 0, 1].map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={yOf(v)} y2={yOf(v)} stroke={v === 0 ? COLORS.muted : COLORS.grid} />
          <text x={L - 6} y={yOf(v)} className="svg-tick" textAnchor="end" dominantBaseline="central">
            {fmt.number(v, 0)}
          </text>
        </g>
      ))}
      {[0, 90, 180, 270, 360].map((deg) => (
        <g key={deg}>
          <line x1={xOf((deg * Math.PI) / 180)} x2={xOf((deg * Math.PI) / 180)} y1={T} y2={T + PH} stroke={COLORS.grid} />
          <text x={xOf((deg * Math.PI) / 180)} y={T + PH + 14} className="svg-tick" textAnchor="middle">
            {deg}°
          </text>
        </g>
      ))}
      <text x={L + PW / 2} y={H - 4} className="svg-tick" textAnchor="middle">
        {d.fieldLab.angleAxis}
      </text>

      {/* Curves with direct labels at their peaks */}
      {paths.map(({ ph, dPath }) =>
        phases[ph] ? (
          <g key={ph}>
            <path d={dPath} fill="none" stroke={PHASE_COLORS[ph]} strokeWidth={2} />
            <text x={xOf(PEAK_ANGLE[ph])} y={T - 8} className="svg-label" textAnchor="middle">
              <SvgSymbolText text={`i_${ph}`} />
            </text>
          </g>
        ) : null,
      )}

      {/* Present instant */}
      <line x1={xOf(cursor)} x2={xOf(cursor)} y1={T} y2={T + PH} stroke={COLORS.ink} strokeWidth={1.5} />
      {PHASES.filter((ph) => phases[ph]).map((ph) => (
        <circle
          key={ph}
          cx={xOf(cursor)}
          cy={yOf(now[ph].current)}
          r={4.5}
          fill={PHASE_COLORS[ph]}
          stroke={COLORS.surface}
          strokeWidth={2}
        />
      ))}

      {/* Hover crosshair + tooltip */}
      {hover !== null && hovered && (
        <g pointerEvents="none">
          <line x1={xOf(hover)} x2={xOf(hover)} y1={T} y2={T + PH} stroke={COLORS.inkDim} strokeDasharray="3 3" />
          <g transform={`translate(${Math.min(xOf(hover) + 8, W - R - 96)}, ${T + 4})`}>
            <rect width={92} height={70} rx={4} fill={COLORS.surface} stroke={COLORS.steelEdge} />
            <text x={8} y={16} className="svg-tick">
              ωt = {fmt.number((hover * 180) / Math.PI, 0)}°
            </text>
            {PHASES.map((ph, k) => (
              <text key={ph} x={8} y={33 + k * 15} className="svg-tick">
                <SvgSymbolText text={`i_${ph} = ${fmt.number(hovered[ph].current, 2)}`} />
              </text>
            ))}
          </g>
        </g>
      )}
    </svg>
  );
}
