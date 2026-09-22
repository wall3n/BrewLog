import { useTranslation } from 'react-i18next';
import { Button, Stepper } from '../../../components/UI';
import { extractionZone } from '../../../utils/methodDefaults';
import { brewEY } from '../../../utils/scaChart';
import type { ShotDraft, UpdateDraft } from '../index';
import s from '../styles.module.css';

interface ExtractionAssistProps { draft: ShotDraft; update: UpdateDraft; }

/** Optional refractometer reading: TDS in, extraction yield and SCA zone out. */
export function ExtractionAssist({ draft, update }: ExtractionAssistProps) {
  const { t } = useTranslation();

  if (!draft.showTds) {
    return (
      <Button variant="ghost" full leftIcon="plus" onClick={() => update({ showTds: true, tds: draft.tds ?? (draft.method === 'espresso' ? 9.0 : 1.35) })}>
        {t('sheet.addTds')}
      </Button>
    );
  }

  const tds = draft.tds ?? 0;
  // Same formula as the analytics control chart; null when the inputs give no real EY.
  const ey = brewEY(draft.method, draft.dose, draft.yield, tds);
  const zone = ey !== null ? extractionZone(ey) : null;

  return (
    <div className="col col-gap-16">
      <div className={s.params}>
        <Stepper label={t('extraction.fields.tds')} value={tds} onChange={v => update({ tds: v })} step={0.01} decimals={2} unit="%" max={30} size="md" />
        <div className={s.eyCell}>
          <span className="field-label">{t('extraction.steps.parameters.eyLabel')}</span>
          <span className={s.eyValue}>{ey !== null ? ey.toFixed(1) : '—'}{ey !== null && <span className={s.eyUnit}>%</span>}</span>
          {zone && <span className={`${s.eyZone} ${s[`zone_${zone.labelKey}`]}`}>{t(`extraction.zones.${zone.labelKey}`)}</span>}
        </div>
      </div>
      <div>
        <div className="zone-bar" aria-hidden="true">
          <div className="band" />
          {/* marker position is runtime-computed — allowed inline style exception */}
          {zone && <div className="marker" style={{ left: `${zone.position}%` }} />}
        </div>
        <div className="zone-labels"><span>12</span><span>16</span><span>18</span><span>22</span><span>24</span><span>28%</span></div>
      </div>
      <button type="button" className="btn-link" onClick={() => update({ showTds: false })}>{t('sheet.removeTds')}</button>
    </div>
  );
}
