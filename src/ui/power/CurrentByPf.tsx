/**
 * "Same P, lower PF → more current" (brief §5.9): I_A = |P| / (3 V_φ PF) for the present operating point and for
 * PF 1.00, 0.90 and 0.70 at the same P, against the rated current. One series (I_A), so no legend; each bar is labelled.
 */

import { armatureCurrentAtPf } from '../../physics';
import { useI18n } from '../../i18n/I18nProvider';
import { SvgSymbolText } from '../SymbolText';
import { COLORS } from '../theme';

const W = 360;
const ROW = 26;
const TOP = 8;
const LABEL_W = 92;
const VALUE_W = 64;
const BAR_H = 12;

export const PF_BAR_TARGETS = [1, 0.9, 0.7] as const;

export function CurrentByPf({
  pAbs,
  vPhi,
  pfNow,
  iANow,
  iRated,
}: {
  pAbs: number;
  vPhi: number;
  pfNow: number;
  iANow: number;
  iRated: number;
}) {
  const { d, fmt } = useI18n();
  const rows = [
    { key: 'now', label: `${d.powers.currentNow} · ${fmt.number(pfNow, 2)}`, value: iANow, now: true },
    ...PF_BAR_TARGETS.map((pf) => ({
      key: String(pf),
      label: `${d.symbols.pfAbbrev} ${fmt.number(pf, 2)}`,
      value: armatureCurrentAtPf(pAbs, vPhi, pf),
      now: false,
    })),
  ];
  const max = Math.max(iRated, ...rows.map((r) => r.value)) * 1.08;
  const x0 = LABEL_W;
  const span = W - LABEL_W - VALUE_W;
  const x = (i: number) => x0 + (span * i) / max;
  const h = TOP + rows.length * ROW + 18;

  return (
    <svg viewBox={`0 0 ${W} ${h}`} className="pf-bars" role="img" aria-label={d.powers.currentTitle}>
      {/* Rated current (drawn first: labels sit on top of the line, with their halo) */}
      <line x1={x(iRated)} y1={TOP - 2} x2={x(iRated)} y2={TOP + rows.length * ROW + 2} stroke={COLORS.s} strokeDasharray="3 4" strokeOpacity={0.8} />
      <text x={x(iRated)} y={TOP + rows.length * ROW + 11} className="svg-label svg-label--dim svg-label--small" textAnchor="middle" dominantBaseline="central">
        <SvgSymbolText text={`${d.powers.currentRated} ${fmt.current(iRated)}`} />
      </text>
      {rows.map((r, k) => {
        const cy = TOP + k * ROW + ROW / 2;
        return (
          <g key={r.key}>
            <text x={x0 - 8} y={cy} className="svg-label" textAnchor="end" dominantBaseline="central" fontWeight={r.now ? 600 : 400}>
              {r.label}
            </text>
            <rect
              x={x0}
              y={cy - BAR_H / 2}
              width={Math.max(0, x(r.value) - x0)}
              height={BAR_H}
              rx={4}
              fill={COLORS.iA}
              fillOpacity={r.now ? 1 : 0.45}
            />
            <text x={x(r.value) + 6} y={cy} className="svg-label" dominantBaseline="central">
              {fmt.current(r.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
