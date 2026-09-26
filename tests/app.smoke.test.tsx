import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { App } from '../src/App';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { DICTIONARIES, LANGS } from '../src/i18n';

describe('Phase 1 page renders in both languages', () => {
  for (const lang of LANGS)
    it(lang, () => {
      const html = renderToString(
        <I18nProvider initialLang={lang}>
          <App />
        </I18nProvider>,
      );
      const d = DICTIONARIES[lang];
      expect(html).toContain(d.meta.appTitle);
      expect(html).toContain(d.scenarios.G.title);
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('NaN');
    });
});
