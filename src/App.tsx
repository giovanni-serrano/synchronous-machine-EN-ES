/**
 * App shell. Phase 2: the rotating-field lab. The Explore / Guided lesson / Presentation modes arrive in later
 * phases and will slot in below the header.
 */

import { LANGS } from './i18n';
import { useI18n } from './i18n/I18nProvider';
import { RotatingFieldLab } from './ui/fieldLab/RotatingFieldLab';

export function App() {
  const { d, lang, setLang } = useI18n();

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
      <main>
        <RotatingFieldLab />
      </main>
    </div>
  );
}
