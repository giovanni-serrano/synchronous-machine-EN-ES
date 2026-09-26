/**
 * Space-vector view in ELECTRICAL degrees: each phase's pulsating contribution along its own axis and their
 * resultant (constant length 1.5 B_M, turning at ω). Optional tip-to-tail construction of the sum.
 */

import { PHASES, PHASE_AXES, statorField, type PhaseId } from '../../physics';
import { useI18n } from '../../i18n/I18nProvider';
import { SvgSymbolText } from '../SymbolText';
import { Arrow, polarXY } from '../svg/Arrow';
import { COLORS, PHASE_COLORS, RESULTANT_COLOR } from '../theme';

const SCALE = 62; // px per B_M (visual only)
const AXIS = 116;

export function SpaceVectorDiagram({
  wt,
  phases,
  resultant,
  tipToTail,
}: {
  wt: number;
  phases: Readonly<Record<PhaseId, boolean>>;
  resultant: boolean;
  tipToTail: boolean;
}) {
  const { d } = useI18n();
  const field = statorField(wt);

  // Arrow origins: all at the centre, or chained tip-to-tail.
  let ox = 0;
  let oy = 0;
  const arrows = PHASES.filter((ph) => phases[ph]).map((ph) => {
    const v = field[ph].vector;
    const x1 = tipToTail ? ox : 0;
    const y1 = tipToTail ? oy : 0;
    const x2 = x1 + v.re * SCALE;
    const y2 = y1 - v.im * SCALE;
    if (tipToTail) {
      ox = x2;
      oy = y2;
    }
    return { ph, x1, y1, x2, y2 };
  });

  const [rx, ry] = [field.net.re * SCALE, -field.net.im * SCALE];
  const [lrx, lry] = polarXY(1.5 * SCALE + 16, Math.atan2(field.net.im, field.net.re));

  return (
    <svg viewBox="-150 -140 300 280" className="vectors" role="img" aria-label={d.fieldLab.vectorsTitle}>
      {/* Locus of the resultant */}
      <circle r={1.5 * SCALE} fill="none" stroke={COLORS.muted} strokeDasharray="3 5" />
      {/* Phase axes */}
      {PHASES.map((ph) => {
        const [x, y] = polarXY(AXIS, PHASE_AXES[ph]);
        const [lx, ly] = polarXY(AXIS + 14, PHASE_AXES[ph]);
        return (
          <g key={ph}>
            <line x1={-x} y1={-y} x2={x} y2={y} stroke={PHASE_COLORS[ph]} strokeOpacity={0.35} strokeDasharray="2 4" />
            <text x={lx} y={ly} className="svg-label" textAnchor="middle" dominantBaseline="central">
              +{ph}
            </text>
          </g>
        );
      })}
      {arrows.map(({ ph, x1, y1, x2, y2 }) => {
        const len = Math.hypot(x2 - x1, y2 - y1);
        return (
          <g key={ph}>
            <Arrow x1={x1} y1={y1} x2={x2} y2={y2} color={PHASE_COLORS[ph]} width={3.2} head={11} />
            {len > 14 && (
              <text
                // beyond the tip and offset to its left, so it does not sit on the resultant
                x={x2 + ((x2 - x1) / len) * 8 + ((y2 - y1) / len) * 11}
                y={y2 + ((y2 - y1) / len) * 8 - ((x2 - x1) / len) * 11}
                className="svg-label"
                textAnchor="middle"
                dominantBaseline="central"
              >
                <SvgSymbolText text={`B_${ph}`} />
              </text>
            )}
          </g>
        );
      })}
      {resultant && (
        <g>
          <Arrow x1={0} y1={0} x2={rx} y2={ry} color={RESULTANT_COLOR} width={4.2} head={13} />
          <text x={lrx} y={lry} className="svg-label svg-label--strong" textAnchor="middle" dominantBaseline="central">
            <SvgSymbolText text="B_S" />
          </text>
        </g>
      )}
      <circle r={3} fill={COLORS.ink} />
    </svg>
  );
}
