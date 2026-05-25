import { METHODS } from '../../../utils/methodDefaults';
import { Icon } from '../../../components/Icons';
import type { WizardData } from '../QuickSetupWizard';

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

export function WizardStep1Method({ data, onChange }: Props) {
  return (
    <div className="wizard-step">
      <h2 className="wizard-step-title">What do you brew most?</h2>
      <p className="wizard-step-sub">Sets your default method. Change any time in Settings.</p>
      <div className="wizard-method-grid">
        {METHODS.filter(m => m.id !== 'custom').map(m => (
          <button
            key={m.id}
            className={`wizard-method-card ${data.method === m.id ? 'active' : ''}`}
            onClick={() => onChange({ method: m.id })}
          >
            <Icon name={m.icon} size={28} />
            <span>{m.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
