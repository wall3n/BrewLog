import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { Button, Sheet, Empty, RoastDot, DaysOffRoast, Field, Input, Slider } from '../../components/UI';
import type { Bean } from '../../db/types';

function BeanCard({ bean, onClick }: { bean: Bean; onClick: () => void }) {
  return (
    <div className="card card-hover" onClick={onClick} style={{ padding: 20 }}>
      <div className="row row-between" style={{ marginBottom: 12, alignItems: 'flex-start' }}>
        <div className="col col-gap-4" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.2 }}>{bean.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>{bean.roaster}</div>
        </div>
        <RoastDot level={bean.roast} />
      </div>
      <div className="row row-between" style={{ alignItems: 'flex-end' }}>
        <div className="col col-gap-4">
          <span className="t-upper">{bean.process}</span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>{(bean.origin ?? '').toUpperCase()}</span>
        </div>
        <DaysOffRoast iso={bean.roastedAt} />
      </div>
    </div>
  );
}

export function QuickAddBean({ onSave }: { onSave: (p: Omit<Bean, 'id'|'createdAt'|'updatedAt'>) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [roaster, setRoaster] = useState('');
  const [process, setProcess] = useState('Washed');
  const [roast, setRoast] = useState<'light'|'medium'|'dark'>('light');
  const [days, setDays] = useState(7);

  return (
    <div className="col col-gap-16">
      <Field label={t('beans.fields.name')}><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Yirgacheffe Konga" /></Field>
      <Field label={t('beans.fields.roaster')}><Input value={roaster} onChange={e => setRoaster(e.target.value)} placeholder="e.g. Sample Roasters" /></Field>
      <div className="grid grid-2">
        <Field label={t('beans.fields.process')}>
          <select className="input-underline" value={process} onChange={e => setProcess(e.target.value)}>
            {['Washed','Natural','Honey','Anaerobic Natural','Other'].map(p => <option key={p}>{p}</option>)}
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
        const d = new Date(); d.setDate(d.getDate() - days);
        onSave({ name: name || t('beans.saveName'), roaster, process, roast, roastedAt: d.toISOString(), status: 'active' });
      }} disabled={!name}>{t('beans.saveBeanBtn')}</Button>
    </div>
  );
}

export function BeansScreen() {
  const { state } = useApp();
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tab, setTab] = useState<'active'|'finished'|'wishlist'>('active');
  const [adding, setAdding] = useState(false);

  const beans = state.beans.filter(b => b.status === tab);

  const noBeansTitle = tab === 'active' ? t('beans.noActive') : tab === 'finished' ? t('beans.noFinished') : t('beans.noWishlist');
  const noBeansBody = tab === 'wishlist' ? t('beans.noWishlistBody') : t('beans.noBeansBody');

  return (
    <div>
      <div className="row row-between" style={{ alignItems: 'flex-end', marginBottom: 24 }}>
        <div className="page-head" style={{ marginBottom: 0 }}>
          <h1>{t('beans.title')}</h1>
          <p>{t('beans.total', { count: state.beans.length })}</p>
        </div>
        <Button variant="ghost" leftIcon="plus" onClick={() => setAdding(true)}>{t('beans.add')}</Button>
      </div>
      <div className="tabs">
        {(['active', 'finished', 'wishlist'] as const).map(k => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
            {t(`beans.tabs.${k}`)} <span style={{ marginLeft: 6, color: 'var(--text-tertiary)' }}>{state.beans.filter(b => b.status === k).length}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-2">
        {beans.length === 0
          ? <div style={{ gridColumn: '1 / -1' }}><Empty icon="bean" title={noBeansTitle} body={noBeansBody} /></div>
          : beans.map(b => <BeanCard key={b.id} bean={b} onClick={() => navigate(`/beans/${b.id}`)} />)
        }
      </div>
      <Sheet open={adding} onClose={() => setAdding(false)} title={t('beans.add')}>
        <QuickAddBean onSave={async (payload) => { await db.addBean(payload); setAdding(false); }} />
      </Sheet>
    </div>
  );
}
