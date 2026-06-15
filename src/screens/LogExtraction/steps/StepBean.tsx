import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../../context/AppContext';
import { useDb } from '../../../hooks/useDb';
import { Button, Field, Input, Slider, Sheet, RoastDot, DaysOffRoast } from '../../../components/UI';
import { Icon } from '../../../components/Icons';
import type { WizardDraft } from '../index';

interface Props { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void; onNext: () => void; }

function QuickAddBean({ onSave }: { onSave: (p: { name: string; roaster: string; process: string; roast: 'light'|'medium'|'dark'; roastedAt: string }) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [roaster, setRoaster] = useState('');
  const [process, setProcess] = useState('Washed');
  const [roast, setRoast] = useState<'light'|'medium'|'dark'>('light');
  const [days, setDays] = useState(7);

  const processes = ['Washed', 'Natural', 'Honey', 'Anaerobic Natural', 'Other'];
  return (
    <div className="col col-gap-16">
      <Field label={t('beans.fields.name')}><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Yirgacheffe Konga" /></Field>
      <Field label={t('beans.fields.roaster')}><Input value={roaster} onChange={e => setRoaster(e.target.value)} placeholder="e.g. Sample Roasters" /></Field>
      <div className="grid grid-2">
        <Field label={t('beans.fields.process')}>
          <select className="input-underline" value={process} onChange={e => setProcess(e.target.value)}>
            {processes.map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label={t('beans.fields.roastLevel')}>
          <div className="row row-gap-8">
            {(['light','medium','dark'] as const).map(r => (
              <button key={r} type="button" className={`tag ${roast === r ? 'active' : ''}`} onClick={() => setRoast(r)} style={{ flex: 1, justifyContent: 'center' }}>{t(`beans.roasts.${r}`)}</button>
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
  const { state } = useApp();
  const db = useDb();
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);

  const beans = state.beans.filter(b => b.status !== 'wishlist');
  const filtered = beans.filter(b =>
    b.name.toLowerCase().includes(q.toLowerCase()) ||
    (b.roaster ?? '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="step-meta" style={{ marginBottom: 20 }}>
        <h2 className="h-display" style={{ fontSize: 28, margin: 0 }}>{t('extraction.steps.bean.title')}</h2>
      </div>
      <div className="search-bar" style={{ marginBottom: 16 }}>
        <Icon name="search" size={16} style={{ color: 'var(--text-tertiary)' }} />
        <input placeholder={t('extraction.steps.bean.search')} value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="col col-gap-12" style={{ marginBottom: 16 }}>
        {filtered.map(b => {
          const sel = draft.beanId === b.id;
          return (
            <div key={b.id} className="card card-tight card-hover" onClick={() => update({ beanId: b.id! })}
              style={{ padding: 16, border: sel ? '1.5px solid var(--accent)' : '1px solid var(--border)', background: sel ? 'var(--accent-bg)' : 'var(--bg-surface)' }}>
              <div className="row row-between" style={{ alignItems: 'flex-start' }}>
                <div className="col col-gap-4" style={{ flex: 1 }}>
                  <div className="row row-gap-8">
                    <RoastDot level={b.roast} />
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>{b.name}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{b.roaster} · {b.process}</span>
                </div>
                <div className="col" style={{ alignItems: 'flex-end', gap: 6 }}>
                  <DaysOffRoast iso={b.roastedAt} />
                  {sel && <Icon name="check" size={16} style={{ color: 'var(--accent)' }} />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <button type="button" className="sidebar-link" style={{ color: 'var(--accent)', padding: '8px 0' }} onClick={() => setAdding(true)}>
        <Icon name="plus" size={16} /> {t('extraction.steps.bean.quickAdd')}
      </button>
      <div style={{ height: 24 }} />
      <Button full size="lg" onClick={onNext} rightIcon="arrowRight" disabled={!draft.beanId}>{t('common.continue')}</Button>

      <Sheet open={adding} onClose={() => setAdding(false)} title={t('beans.add')}>
        <QuickAddBean onSave={async (payload) => {
          const newBean = await db.addBean({ ...payload, status: 'active' });
          if (newBean.id) update({ beanId: newBean.id });
          setAdding(false);
        }} />
      </Sheet>
    </div>
  );
}
