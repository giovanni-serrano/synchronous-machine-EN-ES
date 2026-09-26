/**
 * The explorable essay (docs/experience-redesign.md). Checkpoint 2b vertical slice: the hook, §2 One coil and
 * §3 Three coils. Each section: a heading, a few short sentences, one large figure, the formula last and small.
 */

import { useEffect, type ReactNode } from 'react';
import { LANGS } from '../i18n';
import { useI18n } from '../i18n/I18nProvider';
import { SymbolText } from '../ui/SymbolText';
import { HookFigure } from './figures/HookFigure';
import { OneCoilFigure } from './figures/OneCoilFigure';
import { ThreeCoilsFigure } from './figures/ThreeCoilsFigure';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="essay-section" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className="prose">
        <a href={`#${id}`} className="anchor">
          {title}
        </a>
      </h2>
      {children}
    </section>
  );
}

const P = ({ children }: { children: string }) => (
  <p className="prose">
    <SymbolText text={children} />
  </p>
);

const Formula = ({ children }: { children: string }) => (
  <p className="prose formula">
    <SymbolText text={children} />
  </p>
);

export function Essay({ labHref }: { labHref: string }) {
  const { d, lang, setLang } = useI18n();
  const e = d.essay;
  useEffect(() => {
    document.title = e.docTitle;
  }, [e.docTitle]);
  const other = LANGS.find((l) => l !== lang)!;

  return (
    <div className="essay">
      <nav className="essay-lang" aria-label={d.language.label}>
        <button type="button" onClick={() => setLang(other)} lang={other}>
          {e.footer.lang}
        </button>
      </nav>

      <header className="hook">
        <HookFigure />
        <div className="hook__text prose">
          <p className="hook__byline">{e.byline}</p>
          <h1 className="hook__title">{e.hook.title}</h1>
          <p className="hook__standfirst">{e.hook.standfirst}</p>
          <a className="hook__scroll" href="#one-coil">
            {e.hook.scroll}
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </header>

      <main>
        <Section id="one-coil" title={e.oneCoil.title}>
          <P>{e.oneCoil.p1}</P>
          <P>{e.oneCoil.p2}</P>
          <OneCoilFigure />
          <P>{e.oneCoil.p3}</P>
          <p className="prose question">{e.oneCoil.question}</p>
          <Formula>{e.oneCoil.formula}</Formula>
        </Section>

        <Section id="three-coils" title={e.threeCoils.title}>
          <P>{e.threeCoils.p1}</P>
          <P>{e.threeCoils.p2}</P>
          <ThreeCoilsFigure />
          <P>{e.threeCoils.p3}</P>
          <P>{e.threeCoils.p4}</P>
          <Formula>{e.threeCoils.formula}</Formula>
        </Section>

        <section className="essay-section essay-next" aria-labelledby="next-title">
          <h2 id="next-title" className="prose">
            {e.next.title}
          </h2>
          <P>{e.next.body}</P>
          <p className="prose">
            <a className="text-link" href={labHref}>
              {e.next.link} →
            </a>
          </p>
        </section>
      </main>

      <footer className="essay-footer prose">
        <p>{e.source}</p>
        <p>{e.footer.license}</p>
      </footer>
    </div>
  );
}
