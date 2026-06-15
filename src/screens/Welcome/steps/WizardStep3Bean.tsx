import { useTranslation } from 'react-i18next';
import type { WizardData } from '../QuickSetupWizard';

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
}

export function WizardStep3Bean({ data, onChange }: Props) {
  const { t } = useTranslation();

  const ROAST_LEVELS: { value: WizardData['beanRoast']; label: string; desc: string }[] = [
    { value: 'light',  label: t('wizard.step3.roastLight'),  desc: t('wizard.step3.roastLightDesc') },
    { value: 'medium', label: t('wizard.step3.roastMedium'), desc: t('wizard.step3.roastMediumDesc') },
    { value: 'dark',   label: t('wizard.step3.roastDark'),   desc: t('wizard.step3.roastDarkDesc') },
  ];

  return (
    <div className="wizard-step">
      <h2 className="wizard-step-title">{t('wizard.step3.title')}</h2>
      <p className="wizard-step-sub">{t('wizard.step3.sub')}</p>

      <div className="field" style={{ marginBottom: 20 }}>
        <span className="field-label">{t('wizard.step3.beanName')}</span>
        <input
          className="input-underline"
          placeholder={t('wizard.step3.beanNamePlaceholder')}
          value={data.beanName}
          onChange={e => onChange({ beanName: e.target.value })}
          autoFocus
        />
      </div>

      <div className="field" style={{ marginBottom: 28 }}>
        <span className="field-label">{t('wizard.step3.roaster')}</span>
        <input
          className="input-underline"
          placeholder={t('wizard.step3.roasterPlaceholder')}
          value={data.beanRoaster}
          onChange={e => onChange({ beanRoaster: e.target.value })}
        />
      </div>

      <span className="field-label" style={{ display: 'block', marginBottom: 12 }}>{t('wizard.step3.roastLevel')}</span>
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
