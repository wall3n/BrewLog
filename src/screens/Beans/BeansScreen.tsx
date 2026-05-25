import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [name, setName] = useState('');
  const [roaster, setRoaster] = useState('');
  const [process, setProcess] = useState('Washed');
  const [roast, setRoast] = useState<'light'|'medium'|'dark'>('light');
  const [days, setDays] = useState(7);

  return (
    <div className="col col-gap-16">
      <Field label="Bean name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Yirgacheffe Konga" /></Field>
      <Field label="Roaster"><Input value={roaster} onChange={e => setRoaster(e.target.value)} placeholder="e.g. Sample Roasters" /></Field>
      <div className="grid grid-2">
        <Field label="Process">
          <select className="input-underline" value={process} onChange={e => setProcess(e.target.value)}>
            {['Washed','Natural','Honey','Anaerobic Natural','Other'].map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Roast level">
          <div className="row row-gap-8">
            {(['light','medium','dark'] as const).map(r => (
              <button key={r} type="button" className={`tag ${roast === r ? 'active' : ''}`} onClick={() => setRoast(r)} style={{ flex: 1, justifyContent: 'center' }}>{r}</button>
            ))}
          </div>
        </Field>
      </div>
      <Field label="Days since roast">
        <Slider value={days} min={0} max={60} step={1} onChange={setDays} displayValue={`${days}d`} />
      </Field>
      <Button full onClick={() => {
        const d = new Date(); d.setDate(d.getDate() - days);
        onSave({ name: name || 'Untitled bean', roaster, process, roast, roastedAt: d.toISOString(), status: 'active' });
      }} disabled={!name}>Save bean</Button>
    </div>
  );
}

export function BeansScreen() {
  const { state } = useApp();
  const db = useDb();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'active'|'finished'|'wishlist'>('active');
  const [adding, setAdding] = useState(false);

  const beans = state.beans.filter(b => b.status === tab);

  return (
    <div>
      <div className="row row-between" style={{ alignItems: 'flex-end', marginBottom: 24 }}>
        <div className="page-head" style={{ marginBottom: 0 }}>
          <h1>Beans</h1>
          <p>{state.beans.length} TOTAL</p>
        </div>
        <Button variant="ghost" leftIcon="plus" onClick={() => setAdding(true)}>Add bean</Button>
      </div>
      <div className="tabs">
        {([['active','Active'],['finished','Finished'],['wishlist','Wishlist']] as const).map(([k, l]) => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>
            {l} <span style={{ marginLeft: 6, color: 'var(--text-tertiary)' }}>{state.beans.filter(b => b.status === k).length}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-2">
        {beans.length === 0
          ? <div style={{ gridColumn: '1 / -1' }}><Empty icon="bean" title={`No ${tab} beans`} body={tab === 'wishlist' ? 'Add beans you want to try.' : 'Add a bean to get started.'} /></div>
          : beans.map(b => <BeanCard key={b.id} bean={b} onClick={() => navigate(`/beans/${b.id}`)} />)
        }
      </div>
      <Sheet open={adding} onClose={() => setAdding(false)} title="Add bean">
        <QuickAddBean onSave={async (payload) => { await db.addBean(payload); setAdding(false); }} />
      </Sheet>
    </div>
  );
}
