/**
 * Small inset beside the cross-section for 4+ poles: B_R + B_S = B_net tip-to-tail in ELECTRICAL degrees, at the
 * same instant. Bridge to the phasor diagram (Phase 6): each voltage is its field turned by −90°.
 */

import type { MachineSnapshot } from '../../animation/snapshot';
import { useI18n } from '../../i18n/I18nProvider';
import { SymbolText } from '../SymbolText';
import { Arrow } from '../svg/Arrow';
import { COLORS } from '../theme';
import { DeltaLeader, LabelAt, arcPath } from './MachineView';
import { INSET_FRAME, sumInsetLayout } from './machineLayout';

export function ElectricalSumInset({ snap }: { snap: MachineSnapshot }) {
  const { d, fmt } = useI18n();
  const deltaText = `δ = ${fmt.degrees(Math.abs(snap.deltaElec))} ${d.machineLab.electricalShort}`;
  const l = sumInsetLayout(snap, 8 + deltaText.length * 5.6);
  const r = INSET_FRAME;
  return (
    <figure className="inset">
      <figcaption className="inset__title">
        <SymbolText text={d.machineLab.insetTitle} />
      </figcaption>
      <svg viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`} role="img" aria-label={d.machineLab.vectorSum}>
        <circle r={2.5} fill={COLORS.ink} />
        {l.delta && (
          <g>
            <path d={arcPath(l.delta.r, l.delta.from, l.delta.to)} fill="none" stroke={COLORS.accent} strokeWidth={2.2} />
            <DeltaLeader delta={l.delta} />
            <text x={l.delta.label.x} y={l.delta.label.y} className="svg-label svg-label--delta svg-label--small" textAnchor="middle" dominantBaseline="central">
              {deltaText}
            </text>
          </g>
        )}
        <Arrow x1={l.bNet.x1} y1={l.bNet.y1} x2={l.bNet.x2} y2={l.bNet.y2} color={COLORS.vPhi} width={3.6} head={11} />
        <Arrow x1={l.bR.x1} y1={l.bR.y1} x2={l.bR.x2} y2={l.bR.y2} color={COLORS.eA} width={3.6} head={11} />
        <Arrow x1={l.bS.x1} y1={l.bS.y1} x2={l.bS.x2} y2={l.bS.y2} color={COLORS.iA} width={3} head={10} dashed />
        <LabelAt box={l.labels.bNet} text="B_net" strong={false} />
        <LabelAt box={l.labels.bR} text="B_R" strong={false} />
        <LabelAt box={l.labels.bS} text="B_S" strong={false} />
      </svg>
      <p className="hint">
        <SymbolText text={d.machineLab.insetNote} />
      </p>
    </figure>
  );
}
