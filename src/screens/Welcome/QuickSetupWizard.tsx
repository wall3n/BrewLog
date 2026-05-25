import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icons';
import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { WizardStep1Method } from './steps/WizardStep1Method';
import { WizardStep2Units } from './steps/WizardStep2Units';
import { WizardStep3Bean } from './steps/WizardStep3Bean';
import { WizardStep4Equipment } from './steps/WizardStep4Equipment';

export interface WizardData {
  method: string;
  weightUnit: 'g' | 'oz';
  tempUnit: 'C' | 'F';
  beanName: string;
  beanRoaster: string;
  beanRoast: 'light' | 'medium' | 'dark';
  equipment: Array<{ type: string; name: string }>;
}

const DEFAULT_DATA: WizardData = {
  method: 'espresso',
  weightUnit: 'g',
  tempUnit: 'C',
  beanName: '',
  beanRoaster: '',
  beanRoast: 'medium',
  equipment: [{ type: '', name: '' }],
};

const TOTAL_STEPS = 4;

interface Props {
  onBack: () => void;
}

export function QuickSetupWizard({ onBack }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(DEFAULT_DATA);
  const [saving, setSaving] = useState(false);
  const { dispatch } = useApp();
  const db = useDb();
  const navigate = useNavigate();

  function patch(update: Partial<WizardData>) {
    setData(prev => ({ ...prev, ...update }));
  }

  function isStepValid(): boolean {
    if (step === 2) return data.beanName.trim().length > 0 && data.beanRoaster.trim().length > 0;
    return true;
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
  }

  function handleBack() {
    if (step === 0) { onBack(); return; }
    setStep(s => s - 1);
  }

  async function finish(skipEquipment = false) {
    setSaving(true);
    try {
      await db.updateSettings({ defaultMethod: data.method, weightUnit: data.weightUnit, tempUnit: data.tempUnit });
      await db.addBean({ name: data.beanName, roaster: data.beanRoaster, roast: data.beanRoast, status: 'active' });
      if (!skipEquipment) {
        const validEquipment = data.equipment.filter(eq => eq.type && eq.name.trim());
        for (const eq of validEquipment) {
          await db.addEquipment({ type: eq.type, name: eq.name.trim(), usage: 0 });
        }
      }
      dispatch({ type: 'DISMISS_WELCOME' });
      navigate('/');
    } finally {
      setSaving(false);
    }
  }

  const steps = [
    <WizardStep1Method key="1" data={data} onChange={patch} />,
    <WizardStep2Units  key="2" data={data} onChange={patch} />,
    <WizardStep3Bean   key="3" data={data} onChange={patch} />,
    <WizardStep4Equipment key="4" data={data} onChange={patch} onSkip={() => finish(true)} />,
  ];

  const isLast = step === TOTAL_STEPS - 1;

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <button className="wizard-back-btn" onClick={handleBack} aria-label="Back">
          <Icon name="arrowLeft" size={20} />
        </button>
        <div className="wizard-dots">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <span key={i} className={`wizard-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>
        <span className="wizard-step-count">{step + 1} / {TOTAL_STEPS}</span>
      </div>

      <div className="wizard-body">
        {steps[step]}
      </div>

      <div className="wizard-footer">
        {isLast ? (
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={() => finish(false)}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Finish'}
          </button>
        ) : (
          <button
            className="btn btn-primary btn-full btn-lg"
            onClick={handleNext}
            disabled={!isStepValid()}
          >
            Next <Icon name="arrowRight" size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
