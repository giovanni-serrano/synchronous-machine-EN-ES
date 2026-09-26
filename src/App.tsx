/**
 * App shell: header, section tabs (the machine / the rotating field). The Explore / Guided lesson / Presentation
 * modes arrive in later phases.
 */

import { useState } from 'react';
import { LANGS } from './i18n';
import { useI18n } from './i18n/I18nProvider';
import { RotatingFieldLab } from './ui/fieldLab/RotatingFieldLab';
import { MachineLab } from './ui/machine/MachineLab';

type Section = 'machine' | 'field';
const SECTIONS: readonly Section[] = ['machine', 'field'];

export function App() {
  const { d, lang, setLang } = useI18n();
  const [section, setSection] = useState<Section>('machine');

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>{d.meta.appTitle}</h1>
          <p className="app__subtitle">{d.meta.appSubtitle}</p>
        </div>
        <nav aria-label={d.language.label} className="lang-switch">
          {LANGS.map((l) => (
            <button key={l} type="button" aria-pressed={l === lang} onClick={() => setLang(l)} lang={l}>
              {l.toUpperCase()}
              <span className="visually-hidden"> — {d.language[l]}</span>
            </button>
          ))}
        </nav>
      </header>
      <div role="tablist" aria-label={d.nav.label} className="tabs">
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            id={`tab-${s}`}
            aria-selected={section === s}
            aria-controls={`panel-${s}`}
            onClick={() => setSection(s)}
          >
            {d.nav[s]}
          </button>
        ))}
      </div>
      <main id={`panel-${section}`} role="tabpanel" aria-labelledby={`tab-${section}`}>
        {section === 'machine' ? <MachineLab /> : <RotatingFieldLab />}
      </main>
    </div>
  );
}
