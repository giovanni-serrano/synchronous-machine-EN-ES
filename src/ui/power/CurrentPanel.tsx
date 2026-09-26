/**
 * "Same P, lower PF → more current" (brief §5.9) as its own panel, next to the operating-point readouts.
 */

import { memo } from 'react';
import type { PowerTriangle } from '../../physics';
import { interpolate } from '../../i18n';
import { useI18n } from '../../i18n/I18nProvider';
import { SymbolText } from '../SymbolText';
import { CurrentByPf } from './CurrentByPf';

export const CurrentPanel = memo(function CurrentPanel({
  tri,
  vPhi,
  iAMag,
  iRated,
}: {
  tri: PowerTriangle | null;
  vPhi: number;
  iAMag: number;
  iRated: number;
}) {
  const { d, fmt } = useI18n();
  const hasLoad = tri !== null && Math.abs(tri.p) > 1;
  return (
    <section className="panel panel--current" aria-labelledby="current-title">
      <h3 id="current-title" className="panel__title">
        {d.powers.currentTitle}
      </h3>
      {tri && hasLoad ? (
        <>
          <p className="readouts__note">
            <SymbolText text={interpolate(d.powers.currentAxis, { p: fmt.power(Math.abs(tri.p), 'W') })} />
          </p>
          <CurrentByPf pAbs={Math.abs(tri.p)} vPhi={vPhi} pfNow={tri.pf} iANow={iAMag} iRated={iRated} />
          <p className="readouts__note">{d.powers.currentNote}</p>
        </>
      ) : (
        <p className="hint">
          <SymbolText text={d.powers.targetsNeedLoad} />
        </p>
      )}
    </section>
  );
});
