import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  return (
    <div className="wizard-step">
      <h2 className="wizard-step-title">{t('wizard.step2.title')}</h2>
      <p className="wizard-step-sub">{t('wizard.step2.sub')}</p>
      <div className="wizard-unit-list">
        <ToggleGroup
          label={t('wizard.step2.weight')}
          options={[{ value: 'g', label: t('wizard.step2.weightG') }, { value: 'oz', label: t('wizard.step2.weightOz') }]}
          value={data.weightUnit}
          onSelect={v => onChange({ weightUnit: v })}
        />
        <ToggleGroup
          label={t('wizard.step2.temperature')}
          options={[{ value: 'C', label: '°C' }, { value: 'F', label: '°F' }]}
          value={data.tempUnit}
          onSelect={v => onChange({ tempUnit: v })}
        />
      </div>
    </div>
  );
}
