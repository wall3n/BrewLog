import { useTranslation } from 'react-i18next';
import type { WizardData } from '../QuickSetupWizard';
import css from './styles.module.css';

interface Props {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  onSkip: () => void;
}

const EQUIPMENT_TYPES = ['Grinder', 'Machine', 'Scale', 'Kettle', 'Other'];

export function WizardStep4Equipment({ data, onChange, onSkip }: Props) {
  const { t } = useTranslation();

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
      <h2 className="wizard-step-title">{t('wizard.step4.title')}</h2>
      <p className="wizard-step-sub">{t('wizard.step4.sub')}</p>

      <div className="wizard-eq-list">
        {data.equipment.map((eq, i) => (
          <div key={i} className="wizard-eq-row">
            <select
              className="wizard-eq-select"
              value={eq.type}
              onChange={e => updateRow(i, 'type', e.target.value)}
            >
              <option value="">{t('wizard.step4.typePlaceholder')}</option>
              {EQUIPMENT_TYPES.map(ty => <option key={ty} value={ty}>{t(`equipment.types.${ty}`, { defaultValue: ty })}</option>)}
            </select>
            <input
              className="wizard-eq-input"
              placeholder={t('wizard.step4.namePlaceholder')}
              value={eq.name}
              onChange={e => updateRow(i, 'name', e.target.value)}
            />
            {data.equipment.length > 1 && (
              <button className="wizard-eq-remove" onClick={() => removeRow(i)} aria-label={t('common.remove')}>×</button>
            )}
          </div>
        ))}
      </div>

      <button className="wizard-add-link" onClick={addRow}>{t('wizard.step4.addAnother')}</button>

      <div className={css.skipWrap}>
        <button className="wizard-skip-link" onClick={onSkip}>{t('wizard.step4.skip')}</button>
      </div>
    </div>
  );
}
