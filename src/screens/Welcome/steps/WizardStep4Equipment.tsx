import type { WizardData } from '../QuickSetupWizard';

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  onSkip: () => void;
}

const EQUIPMENT_TYPES = ['Grinder', 'Machine', 'Scale', 'Kettle', 'Other'];

export function WizardStep4Equipment({ data, onChange, onSkip }: Props) {
  function updateRow(index: number, field: 'type' | 'name', value: string) {
    const updated = data.equipment.map((eq, i) =>
      i === index ? { ...eq, [field]: value } : eq
    );
    onChange({ equipment: updated });
  }

  function addRow() {
    onChange({ equipment: [...data.equipment, { type: '', name: '' }] });
  }

  function removeRow(index: number) {
    onChange({ equipment: data.equipment.filter((_, i) => i !== index) });
  }

  return (
    <div className="wizard-step">
      <h2 className="wizard-step-title">Your equipment</h2>
      <p className="wizard-step-sub">Grinder, machine, scale — add what you use.</p>

      <div className="wizard-eq-list">
        {data.equipment.map((eq, i) => (
          <div key={i} className="wizard-eq-row">
            <select
              className="wizard-eq-select"
              value={eq.type}
              onChange={e => updateRow(i, 'type', e.target.value)}
            >
              <option value="">Type…</option>
              {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input
              className="wizard-eq-input"
              placeholder="Name or model"
              value={eq.name}
              onChange={e => updateRow(i, 'name', e.target.value)}
            />
            {data.equipment.length > 1 && (
              <button className="wizard-eq-remove" onClick={() => removeRow(i)} aria-label="Remove">×</button>
            )}
          </div>
        ))}
      </div>

      <button className="wizard-add-link" onClick={addRow}>+ Add another</button>

      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <button className="wizard-skip-link" onClick={onSkip}>Skip for now</button>
      </div>
    </div>
  );
}
