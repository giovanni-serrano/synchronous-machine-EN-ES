/**
 * Phase 6 panel (brief §5.12): the phasor diagram with its equation and convention indicator, magnitudes, show/hide
 * toggles for each vector, names and angles, and zoom. θ / δ highlights are shared with the triangle and the machine.
 */

import { memo, useState } from 'react';
import { abs, type Convention, type PresentedOperatingPoint, type PowerTriangle } from '../../physics';
import { useI18n } from '../../i18n/I18nProvider';
import { Segmented } from '../controls/Segmented';
import { ToggleChip } from '../controls/ToggleChip';
import { SymbolText } from '../SymbolText';
import type { AngleLink } from '../svg/LinkedArc';
import { COLORS } from '../theme';
import { PHASOR_TEXT, PhasorDiagram } from './PhasorDiagram';
import type { PhasorShow } from './phasorLayout';

const ZOOMS = [1, 1.5, 2] as const;

export const PhasorPanel = memo(function PhasorPanel({
  pr,
  tri,
  modeConvention,
  vPhiRated,
  iRated,
  link,
  onLink,
}: {
  pr: PresentedOperatingPoint | null;
  tri: PowerTriangle | null;
  modeConvention: Convention;
  vPhiRated: number;
  iRated: number;
  link: AngleLink;
  onLink(link: AngleLink): void;
}) {
  const { d, fmt } = useI18n();
  const [show, setShow] = useState<PhasorShow>({ vPhi: true, eA: true, iA: true, jx: true, names: true, angles: true });
  const [zoom, setZoom] = useState<number>(1);
  const toggle = (key: keyof PhasorShow) => (on: boolean) => setShow((s) => ({ ...s, [key]: on }));

  const relation = pr ? { leads: d.angles.eALeads, lags: d.angles.eALags, inPhase: d.angles.eAInPhase }[pr.eARelation] : '';
  const locked = pr !== null && pr.drawingConvention !== modeConvention;

  return (
    <section className="panel panel--phasors" aria-labelledby="phasors-title">
      <h3 id="phasors-title" className="panel__title">
        {d.phasors.title}
      </h3>
      {pr && tri ? (
        <>
          <div className="powers__top">
            <PhasorDiagram
              pr={pr}
              modeConvention={modeConvention}
              vPhiRated={vPhiRated}
              iRated={iRated}
              show={show}
              zoom={zoom}
              link={link}
              onLink={onLink}
            />
            <div className="powers__summary">
              <p className="powers__pf">
                <SymbolText text={d.phasors.equation[pr.drawingConvention]} />
              </p>
              <p className="readouts__note convention-note">
                <SymbolText text={d.convention[pr.drawingConvention]} />
              </p>
              <ul className="phasor-values">
                <li>
                  <span className="swatch" style={{ background: COLORS.vPhi }} /> <SymbolText text={`V_φ = ${fmt.voltage(abs(pr.vPhi))}`} />
                </li>
                <li>
                  <span className="swatch" style={{ background: COLORS.eA }} /> <SymbolText text={`E_A = ${fmt.voltage(abs(pr.eA))}`} />
                </li>
                <li>
                  <span className="swatch" style={{ background: COLORS.iA }} /> <SymbolText text={`I_A = ${fmt.current(pr.iAMag)}`} />
                </li>
                <li>
                  <span className="swatch swatch--dashed" style={{ borderColor: COLORS.jXsIA }} />{' '}
                  <SymbolText text={`X_S I_A = ${fmt.voltage(abs(pr.jXsIA))}`} />
                </li>
              </ul>
              <p
                className={link === 'delta' ? 'phasor-angle is-hot' : 'phasor-angle'}
                onMouseEnter={() => onLink('delta')}
                onMouseLeave={() => onLink(null)}
              >
                δ = {fmt.degrees(pr.deltaMag)} · <SymbolText text={relation} />
              </p>
              <p
                className={link === 'theta' ? 'phasor-angle is-hot' : 'phasor-angle'}
                onMouseEnter={() => onLink('theta')}
                onMouseLeave={() => onLink(null)}
              >
                θ = {fmt.degrees(Math.abs(tri.theta))}
                {tri.pfKind !== 'unity' && (
                  <>
                    {' · '}
                    <SymbolText text={tri.pfKind === 'lagging' ? d.angles.iALags : d.angles.iALeads} />
                  </>
                )}
              </p>
              <div className="controls__group phasors__zoom">
                <Segmented<number>
                  label={d.phasors.zoom}
                  options={ZOOMS.map((z) => ({ value: z, label: `×${fmt.number(z, z === 1 ? 0 : 1)}` }))}
                  value={zoom}
                  onChange={setZoom}
                />
              </div>
            </div>
          </div>

          <div className="chips chips--legend">
            <ToggleChip checked={show.vPhi} onChange={toggle('vPhi')} swatch={COLORS.vPhi}>
              <SymbolText text={PHASOR_TEXT.vPhi} />
            </ToggleChip>
            <ToggleChip checked={show.eA} onChange={toggle('eA')} swatch={COLORS.eA}>
              <SymbolText text={PHASOR_TEXT.eA} />
            </ToggleChip>
            <ToggleChip checked={show.iA} onChange={toggle('iA')} swatch={COLORS.iA}>
              <SymbolText text={PHASOR_TEXT.iA} />
            </ToggleChip>
            <ToggleChip checked={show.jx} onChange={toggle('jx')} swatch={COLORS.jXsIA} dashed>
              <SymbolText text={PHASOR_TEXT.jx} />
            </ToggleChip>
            <ToggleChip checked={show.names} onChange={toggle('names')}>
              {d.phasors.names}
            </ToggleChip>
            <ToggleChip checked={show.angles} onChange={toggle('angles')}>
              {d.phasors.angles}
            </ToggleChip>
          </div>
          <ul className="notes">
            <li>{d.phasors.hoverNote}</li>
            <li>
              <SymbolText text={d.phasors.conjugateNote} />
            </li>
            <li>
              <SymbolText text={d.phasors.scaleNote} />
            </li>
            {locked && (
              <li>
                <SymbolText text={d.phasors.thetaLocked} />
              </li>
            )}
          </ul>
        </>
      ) : (
        <p className="hint">
          <SymbolText text={d.stability.lostExplanation} />
        </p>
      )}
    </section>
  );
});
