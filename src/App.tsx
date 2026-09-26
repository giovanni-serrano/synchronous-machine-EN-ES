/**
 * Entry view: the explorable essay by default. The old lab stays reachable for development only with ?view=lab
 * (lazy-loaded, not linked from the essay until it is restyled); ?view=og renders the social card and
 * ?view=hook-clip the recordable hook.
 */

import { lazy, Suspense } from 'react';
import { Essay } from './essay/Essay';
import { HookClip } from './essay/HookClip';
import { OgCard } from './essay/OgCard';
import { useI18n } from './i18n/I18nProvider';

const LabApp = lazy(() => import('./LabApp').then((m) => ({ default: m.LabApp })));

export function isLabView(search: string): boolean {
  return new URLSearchParams(search).get('view') === 'lab';
}

export function App({ search = typeof window === 'undefined' ? '' : window.location.search }: { search?: string }) {
  const { lang } = useI18n();
  const view = new URLSearchParams(search).get('view');
  if (view === 'og') return <OgCard />;
  if (view === 'hook-clip') {
    const t = Number(new URLSearchParams(search).get('t'));
    return <HookClip still={Number.isFinite(t) && t > 0 ? t : undefined} />;
  }
  if (isLabView(search))
    return (
      <Suspense fallback={null}>
        <LabApp essayHref={`?lang=${lang}`} />
      </Suspense>
    );
  return <Essay />;
}
