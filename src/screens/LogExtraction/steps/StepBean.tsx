import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../../hooks/useDb';
import { Button, Field, Input, Slider, Sheet, RoastDot, DaysOffRoast } from '../../../components/UI';
import { Icon } from '../../../components/Icons';
import type { WizardDraft } from '../index';
import type { Bean } from '../../../db/types';
import css from './styles.module.css';

interface Props { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void; onNext: () => void; }

function QuickAddBean({ onSave }: { onSave: (p: { name: string; roaster: string; process: string; roast: 'light'|'medium'|'dark'; roastedAt: string }) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [roaster, setRoaster] = useState('');
  const [process, setProcess] = useState('Washed');
  const [roast, setRoast] = useState<'light'|'medium'|'dark'>('light');
  const [days, setDays] = useState(7);

  const processes = [
    { value: 'Washed', key: 'washed' },
    { value: 'Natural', key: 'natural' },
    { value: 'Honey', key: 'honey' },
    { value: 'Anaerobic Natural', key: 'anaerobic' },
    { value: 'Other', key: 'other' },
  ];
  return (
    <div className="col col-gap-16">
      <Field label={t('beans.fields.name')}><Input value={name} onChange={e => setName(e.target.value)} placeholder={t('beans.placeholders.name')} /></Field>
      <Field label={t('beans.fields.roaster')}><Input value={roaster} onChange={e => setRoaster(e.target.value)} placeholder={t('beans.placeholders.roaster')} /></Field>
      <div className="grid grid-2">
        <Field label={t('beans.fields.process')}>
          <select className="input-underline" value={process} onChange={e => setProcess(e.target.value)}>
            {processes.map(p => <option key={p.value} value={p.value}>{t(`beans.processes.${p.key}`)}</option>)}
          </select>
        </Field>
        <Field label={t('beans.fields.roastLevel')}>
          <div className="row row-gap-8">
            {(['light','medium','dark'] as const).map(r => (
              <button key={r} type="button" className={`tag ${roast === r ? 'active' : ''} ${css.roastBtn}`} onClick={() => setRoast(r)}>{t(`beans.roasts.${r}`)}</button>
            ))}
          </div>
        </Field>
      </div>
      <Field label={t('beans.fields.daysSinceRoast')}>
        <Slider value={days} min={0} max={60} step={1} onChange={setDays} displayValue={`${days}d`} />
      </Field>
      <Button full onClick={() => {
        const d = new Date();
        d.setDate(d.getDate() - days);
        onSave({ name: name || t('beans.saveName'), roaster, process, roast, roastedAt: d.toISOString() });
      }} disabled={!name}>{t('beans.saveBeanBtn')}</Button>
    </div>
  );
}

export function StepBean({ draft, update, onNext }: Props) {
  const db = useDb();
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [beans, setBeans] = useState<Bean[]>([]);

  const loadBeans = () => db.getAllBeans().then(all => setBeans(all.filter(b => b.status !== 'wishlist')));
  useEffect(() => { loadBeans(); }, []);

  const filtered = beans.filter(b =>
    b.name.toLowerCase().includes(q.toLowerCase()) ||
    (b.roaster ?? '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className={`step-meta ${css.stepMeta}`}>
        <h2 className={`h-display ${css.stepTitle}`}>{t('extraction.steps.bean.title')}</h2>
      </div>
      <div className={`search-bar ${css.searchMb}`}>
        <span className="t-ter"><Icon name="search" size={16} /></span>
        <input placeholder={t('extraction.steps.bean.search')} value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className={`col col-gap-12 ${css.beanListMb}`}>
        {filtered.map(b => {
          const sel = draft.beanId === b.id;
          return (
            <button key={b.id} type="button"
              className={`${css.beanOption} ${sel ? css.beanOptionSel : ''}`}
              onClick={() => update({ beanId: b.id! })}>
              <div className={`row row-between ${css.beanOptHeader}`}>
                <div className={`col col-gap-4 ${css.beanOptLeft}`}>
                  <div className="row row-gap-8">
                    <RoastDot level={b.roast} />
                    <span className={css.beanOptName}>{b.name}</span>
                  </div>
                  <span className={`t-sec ${css.beanOptMeta}`}>{b.roaster} · {b.process}</span>
                </div>
                <div className={`col ${css.beanOptRight}`}>
                  <DaysOffRoast iso={b.roastedAt} />
                  {sel && <span className="t-acc"><Icon name="check" size={16} /></span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <button type="button" className={`sidebar-link t-acc ${css.addBeanLink}`} onClick={() => setAdding(true)}>
        <Icon name="plus" size={16} /> {t('extraction.steps.bean.quickAdd')}
      </button>
      <div className={css.spacer24} />
      <Button full size="lg" onClick={onNext} rightIcon="arrowRight" disabled={!draft.beanId}>{t('common.continue')}</Button>

      <Sheet open={adding} onClose={() => setAdding(false)} title={t('beans.add')}>
        <QuickAddBean onSave={async (payload) => {
          const newBean = await db.addBean({ ...payload, status: 'active' });
          if (newBean.id) update({ beanId: newBean.id });
          await loadBeans();
          setAdding(false);
        }} />
      </Sheet>
    </div>
  );
}
