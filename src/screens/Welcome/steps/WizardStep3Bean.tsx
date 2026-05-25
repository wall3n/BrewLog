import type { WizardData } from '../QuickSetupWizard';

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

const ROAST_LEVELS: { value: WizardData['beanRoast']; label: string; desc: string }[] = [
  { value: 'light',  label: 'Light',  desc: 'Floral, fruity, bright' },
  { value: 'medium', label: 'Medium', desc: 'Balanced, caramel, nutty' },
  { value: 'dark',   label: 'Dark',   desc: 'Bold, smoky, bittersweet' },
];

export function WizardStep3Bean({ data, onChange }: Props) {
  return (
    <div className="wizard-step">
      <h2 className="wizard-step-title">Your current bean</h2>
      <p className="wizard-step-sub">Add the coffee you're brewing with right now.</p>

      <div className="field" style={{ marginBottom: 20 }}>
        <span className="field-label">Bean name</span>
        <input
          className="input-underline"
          placeholder="e.g. Ethiopia Yirgacheffe"
          value={data.beanName}
          onChange={e => onChange({ beanName: e.target.value })}
          autoFocus
        />
      </div>

      <div className="field" style={{ marginBottom: 28 }}>
        <span className="field-label">Roaster</span>
        <input
          className="input-underline"
          placeholder="e.g. Sample Roasters"
          value={data.beanRoaster}
          onChange={e => onChange({ beanRoaster: e.target.value })}
        />
      </div>

      <span className="field-label" style={{ display: 'block', marginBottom: 12 }}>Roast level</span>
      <div className="wizard-roast-grid">
        {ROAST_LEVELS.map(r => (
          <button
            key={r.value}
            className={`wizard-roast-card ${data.beanRoast === r.value ? 'active' : ''}`}
            onClick={() => onChange({ beanRoast: r.value })}
          >
            <span className="wizard-roast-name">{r.label}</span>
            <span className="wizard-roast-desc">{r.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
