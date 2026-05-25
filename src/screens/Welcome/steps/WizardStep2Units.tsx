import type { WizardData } from '../QuickSetupWizard';

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

interface ToggleGroupProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
}

function ToggleGroup<T extends string>({ label, options, value, onSelect }: ToggleGroupProps<T>) {
  return (
    <div className="wizard-unit-row">
      <span className="wizard-unit-label">{label}</span>
      <div className="wizard-toggle">
        {options.map(o => (
          <button
            key={o.value}
            className={`wizard-toggle-btn ${value === o.value ? 'active' : ''}`}
            onClick={() => onSelect(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function WizardStep2Units({ data, onChange }: Props) {
  return (
    <div className="wizard-step">
      <h2 className="wizard-step-title">Your units</h2>
      <p className="wizard-step-sub">Used across all measurements in the app.</p>
      <div className="wizard-unit-list">
        <ToggleGroup
          label="Weight"
          options={[{ value: 'g', label: 'Grams (g)' }, { value: 'oz', label: 'Ounces (oz)' }]}
          value={data.weightUnit}
          onSelect={v => onChange({ weightUnit: v })}
        />
        <ToggleGroup
          label="Temperature"
          options={[{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }]}
          value={data.tempUnit}
          onSelect={v => onChange({ tempUnit: v })}
        />
      </div>
    </div>
  );
}
