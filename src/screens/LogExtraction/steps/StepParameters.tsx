import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input, Slider } from '../../../components/UI';
import { Icon } from '../../../components/Icons';
import { methodById, getTargets, extractionZone } from '../../../utils/methodDefaults';
import { fmtTime } from '../../../utils/formatters';
import type { WizardDraft } from '../index';
import css from './styles.module.css';

interface Props { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void; onNext: () => void; }

function AlgorithmAssist({ draft }: { draft: WizardDraft }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const targets = getTargets(draft.method);
  const ey = draft.tds && draft.dose && draft.yield
    ? ((draft.tds / 100) * draft.yield / draft.dose * 100)
    : null;
  const zone = ey !== null ? extractionZone(ey) : null;

  return (
    <div className={`card ${css.algoCard}`}>
      <button type="button" onClick={() => setOpen(!open)} className={`row row-between ${css.algoBtn}`}>
        <div className="row row-gap-12">
          <span className="t-acc"><Icon name="sparkles" size={16} /></span>
          <span className={css.algoTitle}>{t('extraction.steps.parameters.algorithmAssist')}</span>
        </div>
        <span className="t-sec"><Icon name={open ? 'chevronUp' : 'chevronDown'} size={16} /></span>
      </button>
      {open && (
        <div className={css.algoBody}>
          <div className={`col col-gap-12 ${css.algoContent}`}>
            {Object.entries(targets).map(([k, v]) => (
              <div key={k} className="row row-between">
                <span className="t-upper">{k === 'ey' ? t('extraction.steps.parameters.eyLabel') : k}</span>
                <span className={`t-mono t-sec ${css.unitHint}`}>{v}</span>
              </div>
            ))}
            {ey !== null && zone && (
              <div>
                <div className={`row row-between ${css.eyRow}`}>
                  <span className="t-upper">{t('extraction.steps.parameters.yourEY')}</span>
                  {/* zone.color is runtime-computed — must remain inline */}
                  <span className={`t-mono ${css.eyStat}`} style={{ color: zone.color }}>{ey.toFixed(1)}% · {t(`extraction.zones.${zone.labelKey}`)}</span>
                </div>
                {/* zone.position is runtime-computed — must remain inline */}
                <div className="zone-bar"><div className="marker" style={{ left: `${zone.position}%` }} /></div>
                <div className="zone-labels"><span>12</span><span>16</span><span>18</span><span>22</span><span>24</span><span>28</span></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function StepParameters({ draft, update, onNext }: Props) {
  const { t } = useTranslation();
  const method = draft.method;
  const isEspresso = method === 'espresso' || method === 'moka-pot';

  useEffect(() => {
    update({ yield: Math.round(draft.dose * draft.ratio * 10) / 10 });
  }, [draft.dose, draft.ratio]);

  const handleTimeChange = (val: string) => {
    const m = val.match(/^(\d{1,2}):(\d{1,2})$/);
    if (m) update({ timeS: parseInt(m[1]) * 60 + parseInt(m[2]) });
  };

  return (
    <div>
      <div className={`step-meta ${css.stepMeta}`}>
        <div className="col col-gap-4">
          <h2 className={`h-display ${css.stepTitle}`}>{t('extraction.steps.parameters.title')}</h2>
          <span className={`t-sec ${css.stepSub}`}>{t(`methods.${methodById(method).id}`, { defaultValue: methodById(method).name }).toUpperCase()}</span>
        </div>
      </div>

      <div className={`card ${css.cardMb}`}>
        <div className="col col-gap-24">
          <div className="grid grid-2">
            <Field label={t('extraction.fields.dose')} right={<span className={`t-ter t-mono ${css.unitHint}`}>g</span>}>
              <Input large type="number" value={draft.dose} onChange={e => update({ dose: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label={t('extraction.fields.yield')} right={<span className={`t-ter t-mono ${css.unitHint}`}>g</span>}>
              <Input large type="number" value={draft.yield} onChange={e => update({ yield: parseFloat(e.target.value) || 0 })} />
            </Field>
          </div>
          <Field label={`${t('extraction.fields.ratio')}  1 : ${draft.ratio.toFixed(1)}`}>
            <Slider value={draft.ratio} min={isEspresso ? 1.0 : 5} max={isEspresso ? 3.0 : 20} step={0.1}
              onChange={v => update({ ratio: v })} displayValue={`1:${draft.ratio.toFixed(1)}`} />
          </Field>
          <div className="grid grid-2">
            <Field label={t('extraction.fields.extractionTime')} right={<span className={`t-ter t-mono ${css.unitHint}`}>m:ss</span>}>
              <Input value={fmtTime(draft.timeS)} onChange={e => handleTimeChange(e.target.value)} />
            </Field>
            <Field label={t('extraction.fields.temperature')} right={<span className={`t-ter t-mono ${css.unitHint}`}>°C</span>}>
              <Input type="number" value={draft.temp} onChange={e => update({ temp: parseFloat(e.target.value) || 0 })} />
            </Field>
          </div>
          {isEspresso && (
            <Field label={t('extraction.fields.pressure')} right={<span className={`t-ter t-mono ${css.unitHint}`}>bar</span>}>
              <Input type="number" step="0.1" value={draft.pressure} onChange={e => update({ pressure: parseFloat(e.target.value) || 0 })} />
            </Field>
          )}
          <div>
            <label className={`row row-gap-8 ${css.checkLabel}`}>
              {/* accentColor is a browser UI color property — must remain inline */}
              <input type="checkbox" checked={draft.showTds}
                onChange={e => update({ showTds: e.target.checked, tds: e.target.checked ? (draft.tds ?? 1.4) : null })}
                style={{ accentColor: 'var(--accent)' }} />
              <span className={`t-sec ${css.stepSub}`}>{t('extraction.steps.parameters.refractometer')}</span>
            </label>
            {draft.showTds && (
              <div className={css.tdsWrap}>
                <Field label={t('extraction.fields.tds')} right={<span className={`t-ter t-mono ${css.unitHint}`}>%</span>}>
                  <Input type="number" step="0.01" value={draft.tds ?? ''} onChange={e => update({ tds: parseFloat(e.target.value) || null })} />
                </Field>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlgorithmAssist draft={draft} />
      <div className={css.spacer24} />
      <Button full size="lg" onClick={onNext} rightIcon="arrowRight">{t('common.continue')}</Button>
    </div>
  );
}
