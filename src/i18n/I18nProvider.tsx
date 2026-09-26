import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { createFormatter, type Formatter } from '../format/format';
import { withLang } from '../app/urlParams';
import { DICTIONARIES, type Dictionary, type Lang } from './index';

interface I18nValue {
  readonly lang: Lang;
  readonly d: Dictionary;
  readonly fmt: Formatter;
  setLang(lang: Lang): void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      d: DICTIONARIES[lang],
      fmt: createFormatter(lang),
      setLang(next) {
        setLangState(next);
        document.documentElement.lang = next;
        // Keep the choice in the URL so reloads and recordings reproduce it.
        window.history.replaceState(null, '', withLang(window.location.search, next) + window.location.hash);
      },
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const v = useContext(I18nContext);
  if (!v) throw new Error('useI18n must be used inside <I18nProvider>');
  return v;
}
