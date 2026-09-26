/**
 * The Open Graph card (1200 × 630), rendered with the real hook renderer and fonts, then captured by
 * scripts/make-og.mjs into public/og.png. Reached with ?view=og; not linked from the essay.
 */

import { useI18n } from '../i18n/I18nProvider';
import { FIELD_FRAME_TIME, HookFigure } from './figures/HookFigure';

export function OgCard() {
  const { d } = useI18n();
  return (
    <div className="essay og-card">
      <div className="og-card__figure">
        <HookFigure still={FIELD_FRAME_TIME} variant="clip" letterScale={1.3} />
      </div>
      <div className="og-card__text">
        <p className="hook__byline">{d.essay.byline}</p>
        <h1 className="og-card__title">{d.essay.hook.title}</h1>
        <p className="og-card__sub">{d.meta.appTitle}</p>
      </div>
    </div>
  );
}
