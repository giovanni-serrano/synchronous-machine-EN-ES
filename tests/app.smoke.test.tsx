import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { App } from '../src/App';
import { I18nProvider } from '../src/i18n/I18nProvider';
import { DICTIONARIES, LANGS } from '../src/i18n';

describe('app renders in both languages', () => {
  for (const lang of LANGS)
    it(lang, () => {
      const html = renderToString(
        <I18nProvider initialLang={lang}>
          <App />
        </I18nProvider>,
      );
      const d = DICTIONARIES[lang];
      expect(html).toContain(d.meta.appTitle);
      expect(html).toContain(d.fieldLab.title);
      expect(html).toContain(d.controls.poles);
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('NaN');
    });

  it('the other language does not leak into Spanish', () => {
    const html = renderToString(
      <I18nProvider initialLang="es">
        <App />
      </I18nProvider>,
    );
    for (const text of [DICTIONARIES.en.fieldLab.title, DICTIONARIES.en.fieldLab.captionPulsating, DICTIONARIES.en.controls.play])
      expect(html).not.toContain(text);
  });
});
