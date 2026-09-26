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
      expect(html).toContain(d.machineLab.title);
      expect(html).toContain(d.nav.field);
      expect(html).toContain(d.controls.poles);
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('NaN');
    });

  it('layout: energy flow sits in the left column; the torque action shares the torque row', () => {
    const html = renderToString(
      <I18nProvider initialLang="en">
        <App />
      </I18nProvider>,
    );
    const main = html.indexOf('lab__main');
    const side = html.indexOf('lab__side');
    const energy = html.indexOf('panel--energy');
    expect(main).toBeGreaterThan(-1);
    expect(energy).toBeGreaterThan(main);
    expect(energy).toBeLessThan(side);
    // Default scenario A is a loaded motor: "<value> · drives the rotor" inside the same <dd>.
    expect(html).toMatch(/<dd>[^<]*N·m<span class="readout__qualifier"> · <!-- -->drives the rotor<\/span><\/dd>/);
  });

  it('the other language does not leak into Spanish', () => {
    const html = renderToString(
      <I18nProvider initialLang="es">
        <App />
      </I18nProvider>,
    );
    for (const text of [DICTIONARIES.en.machineLab.viewTitle, DICTIONARIES.en.nav.field, DICTIONARIES.en.machineLab.operatingPoint, DICTIONARIES.en.controls.play])
      expect(html).not.toContain(text);
  });
});
