import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { Button, Sheet, Field, Input, Tag, Empty } from '../../components/UI';
import { Icon } from '../../components/Icons';

function QuickAddEquipment({ onSave }: { onSave: (p: { type: string; name: string; model?: string }) => void }) {
  const [type, setType] = useState('Grinder');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');
  const TYPES = ['Grinder','Machine','Scale','Kettle','WDT','Brewer','Other'];
  return (
    <div className="col col-gap-16">
      <Field label="Type">
        <div className="row row-wrap row-gap-8">
          {TYPES.map(t => <Tag key={t} active={type === t} onClick={() => setType(t)}>{t}</Tag>)}
        </div>
      </Field>
      <Field label="Name"><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. DF64 Gen 2" /></Field>
      <Field label="Model (optional)"><Input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. SSP MP burrs" /></Field>
      <Button full onClick={() => onSave({ type, name: name || 'Unnamed', model: model || undefined })} disabled={!name}>Save</Button>
    </div>
  );
}

export function EquipmentScreen() {
  const { state } = useApp();
  const db = useDb();
  const [adding, setAdding] = useState(false);

  const groups: Record<string, typeof state.equipment> = {};
  state.equipment.forEach(e => { (groups[e.type] = groups[e.type] || []).push(e); });

  return (
    <div>
      <div className="row row-between" style={{ alignItems: 'flex-end', marginBottom: 24 }}>
        <div className="page-head" style={{ marginBottom: 0 }}>
          <h1>Equipment</h1>
          <p>{state.equipment.length} ITEMS</p>
        </div>
        <Button variant="ghost" leftIcon="plus" onClick={() => setAdding(true)}>Add gear</Button>
      </div>

      {state.equipment.length === 0
        ? <Empty icon="equipment" title="No equipment" body="Add your grinder, scale, and more." />
        : (
          <div className="col col-gap-32">
            {Object.entries(groups).map(([type, items]) => (
              <div key={type}>
                <div className="t-upper" style={{ marginBottom: 12 }}>{type}</div>
                <div className="col col-gap-8">
                  {items.map(item => (
                    <div key={item.id} className="card card-tight" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div className="col col-gap-4">
                        <span style={{ fontSize: 14 }}>{item.name}</span>
                        {item.model && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.model}</span>}
                        {item.notes && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{item.notes}</span>}
                      </div>
                      <div className="row row-gap-12">
                        <span className="t-mono" style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{item.usage ?? 0} uses</span>
                        <button type="button" onClick={async () => {
                          if (confirm(`Delete ${item.name}?`)) await db.deleteEquipment(item.id!);
                        }} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }}>
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )
      }

      <Sheet open={adding} onClose={() => setAdding(false)} title="Add equipment">
        <QuickAddEquipment onSave={async (payload) => { await db.addEquipment({ ...payload, usage: 0 }); setAdding(false); }} />
      </Sheet>
    </div>
  );
}
