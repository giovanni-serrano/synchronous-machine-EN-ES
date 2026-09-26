/**
 * Phase 1 placeholder: a read-only table of the predefined scenarios, straight from the physics model.
 * It exists only to exercise the pipeline (URL → language → dictionary → model → formatting).
 * The real interface starts in Phase 2, after checkpoint 1.
 */

import {
  REFERENCE_MACHINE,
  SCENARIOS,
  gridView,
  presentOperatingPoint,
  scenarioInputs,
  solveMachine,
} from './physics';
import { LANGS } from './i18n';
import { useI18n } from './i18n/I18nProvider';
import { SymbolText } from './ui/SymbolText';

export function App() {
  const { d, fmt, lang, setLang } = useI18n();

  const rows = SCENARIOS.map((def) => {
    const s = solveMachine(REFERENCE_MACHINE, scenarioInputs(REFERENCE_MACHINE, def));
    const op = s.op;
    const pr = op ? presentOperatingPoint(op, s.convention) : null;
    const grid = op ? gridView(op) : null;
    return { def, s, pr, grid };
  });

  return (
    <main className="phase1">
      <header className="phase1__header">
        <div>
          <h1>{d.meta.appTitle}</h1>
          <p className="phase1__subtitle">{d.meta.appSubtitle}</p>
        </div>
        <nav aria-label={d.language.label} className="lang-switch">
          {LANGS.map((l) => (
            <button key={l} type="button" aria-pressed={l === lang} onClick={() => setLang(l)}>
              {d.language[l]}
            </button>
          ))}
        </nav>
      </header>

      <p className="phase1__badge">{d.phase1.badge}</p>
      <p className="phase1__intro">{d.phase1.intro}</p>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{d.phase1.scenario}</th>
              <th>{d.phase1.mode}</th>
              <th>
                <SymbolText text={d.phase1.fieldCurrent} />
              </th>
              <th>δ</th>
              <th>P</th>
              <th>Q</th>
              <th>{d.symbols.pfAbbrev}</th>
              <th>{d.phase1.status}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ def, s, pr, grid }) => {
              const sc = d.scenarios[def.id];
              return (
                <tr key={def.id}>
                  <td>
                    <strong>
                      {def.id}. {sc.title}
                    </strong>
                    <br />
                    <small>
                      <SymbolText text={sc.description} />
                    </small>
                  </td>
                  <td>{d.machineMode[s.operatingMode]}</td>
                  <td className="num">{fmt.current(s.inputs.iF)}</td>
                  <td className="num">
                    {pr ? fmt.degrees(pr.deltaMag) : '—'}
                    <br />
                    <small>
                      {pr && (
                        <SymbolText
                          text={
                            pr.eARelation === 'leads'
                              ? d.angles.eALeads
                              : pr.eARelation === 'lags'
                                ? d.angles.eALags
                                : d.angles.eAInPhase
                          }
                        />
                      )}
                    </small>
                  </td>
                  <td className="num">
                    {grid ? fmt.power(grid.p.magnitude, 'W') : '—'}
                    <br />
                    <small>
                      {grid &&
                        { delivers: d.gridView.pDelivers, absorbs: d.gridView.pAbsorbs, none: d.gridView.pNone }[
                          grid.p.direction
                        ]}
                    </small>
                  </td>
                  <td className="num">
                    {grid ? fmt.power(grid.q.magnitude, 'var') : '—'}
                    <br />
                    <small>
                      {grid &&
                        { delivers: d.gridView.qDelivers, absorbs: d.gridView.qAbsorbs, none: d.gridView.qNone }[
                          grid.q.direction
                        ]}
                    </small>
                  </td>
                  <td className="num">
                    {pr ? fmt.number(pr.pf, 2) : '—'}
                    <br />
                    <small>{pr && d.powerFactor[pr.pfKind]}</small>
                  </td>
                  <td>
                    {{ stable: d.stability.stable, nearLimit: d.stability.nearLimit, lostSynchronism: d.stability.lost }[
                      s.stability
                    ]}
                    <br />
                    <small className="num">
                      <SymbolText text={d.stability.margin} /> = {fmt.percent(s.loadRatio)}
                    </small>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="phase1__assumptions">
        {[d.assumptions.infiniteBus, d.assumptions.cylindricalRotor, d.assumptions.lossless, d.assumptions.noSaturation].map(
          (a) => (
            <li key={a}>
              <SymbolText text={a} />
            </li>
          ),
        )}
      </ul>
    </main>
  );
}
