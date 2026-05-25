import { useApp } from '../../../context/AppContext';
import { Button, Field, Input } from '../../../components/UI';
import { Icon } from '../../../components/Icons';
import type { WizardDraft } from '../index';

interface Props { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void; onNext: () => void; }

export function StepEquipment({ draft, update, onNext }: Props) {
  const { state } = useApp();
  const eq = state.equipment;

  const groups: Record<string, typeof eq> = {};
  eq.forEach(e => { (groups[e.type] = groups[e.type] || []).push(e); });

  const toggle = (id: number) => {
    const next = draft.equipmentIds.includes(id)
      ? draft.equipmentIds.filter(x => x !== id)
      : [...draft.equipmentIds, id];
    update({ equipmentIds: next });
  };

  const hasGrinder = draft.equipmentIds.some(id => eq.find(e => e.id === id)?.type === 'Grinder');

  return (
    <div>
      <div className="step-meta" style={{ marginBottom: 20 }}>
        <div className="col col-gap-4">
          <h2 className="h-display" style={{ fontSize: 28, margin: 0 }}>Your gear</h2>
          <span className="t-sec" style={{ fontSize: 12 }}>MULTI-SELECT</span>
        </div>
      </div>
      <div className="col col-gap-24" style={{ marginBottom: 24 }}>
        {Object.entries(groups).map(([type, items]) => (
          <div key={type}>
            <div className="t-upper" style={{ marginBottom: 8 }}>{type}</div>
            <div className="col col-gap-8">
              {items.map(item => {
                const sel = draft.equipmentIds.includes(item.id!);
                return (
                  <button key={item.id} type="button" onClick={() => toggle(item.id!)}
                    className="card card-tight"
                    style={{ padding: '12px 16px', border: sel ? '1px solid var(--accent)' : '1px solid var(--border)', background: sel ? 'var(--accent-bg)' : 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
                    <div className="col col-gap-4">
                      <span style={{ fontSize: 13 }}>{item.name}</span>
                      {item.model && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.model}</span>}
                    </div>
                    {sel && <Icon name="check" size={16} style={{ color: 'var(--accent)' }} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {hasGrinder && (
        <div style={{ marginBottom: 24 }}>
          <Field label="Grinder setting" hint="Click number, dial, or rotation depending on grinder">
            <Input value={draft.grindSetting} onChange={e => update({ grindSetting: e.target.value })} placeholder="e.g. 2.3" />
          </Field>
        </div>
      )}
      <Button full size="lg" onClick={onNext} rightIcon="arrowRight">Continue</Button>
    </div>
  );
}
