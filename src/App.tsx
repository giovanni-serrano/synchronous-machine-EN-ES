/**
 * Entry view: the explorable essay by default; the complete lab with ?view=lab (lazy-loaded, so the essay's first
 * load does not pay for it).
 */

import { lazy, Suspense } from 'react';
import { Essay } from './essay/Essay';
import { OgCard } from './essay/OgCard';
import { useI18n } from './i18n/I18nProvider';

const LabApp = lazy(() => import('./LabApp').then((m) => ({ default: m.LabApp })));

export function isLabView(search: string): boolean {
  return new URLSearchParams(search).get('view') === 'lab';
}

export function App({ search = typeof window === 'undefined' ? '' : window.location.search }: { search?: string }) {
  const { lang } = useI18n();
  if (new URLSearchParams(search).get('view') === 'og') return <OgCard />;
  if (isLabView(search))
    return (
      <Suspense fallback={null}>
        <LabApp essayHref={`?lang=${lang}`} />
      </Suspense>
    );
  return <Essay labHref={`?view=lab&lang=${lang}`} />;
}
