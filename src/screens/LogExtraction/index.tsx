import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { Button, ProgressBar } from '../../components/UI';
import { Icon } from '../../components/Icons';
import { StepMethod } from './steps/StepMethod';
import { StepBean } from './steps/StepBean';
import { StepEquipment } from './steps/StepEquipment';
import { StepParameters } from './steps/StepParameters';
import { StepTimer } from './steps/StepTimer';
import { StepTasting } from './steps/StepTasting';
import type { Extraction } from '../../db/types';

export interface WizardDraft {
  method: string;
  beanId: number | null;
  equipmentIds: number[];
  grindSetting: string;
  dose: number;
  yield: number;
  ratio: number;
  timeS: number;
  temp: number;
  pressure: number;
  tds: number | null;
  showTds: boolean;
  flag: 'dialled' | 'adjust' | 'fail';
  rating: number;
  acidity: number;
  sweetness: number;
  bitterness: number;
  body: number;
  balance: number;
  flavours: string[];
  notes: string;
}

export function LogExtractionScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state as Partial<Extraction> | null;
  const { state } = useApp();
  const db = useDb();

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<WizardDraft>(() => ({
    method: prefill?.method ?? state.settings?.defaultMethod ?? 'espresso',
    beanId: prefill?.beanId ?? state.beans.find(b => b.status === 'active')?.id ?? null,
    equipmentIds: prefill?.equipmentIds ?? [],
    grindSetting: prefill?.grindSetting ?? '',
    dose: prefill?.dose ?? 18,
    yield: prefill?.yield ?? 36,
    ratio: prefill?.ratio ?? 2.0,
    timeS: prefill?.timeS ?? 28,
    temp: prefill?.temp ?? 93,
    pressure: prefill?.pressure ?? 9,
    tds: prefill?.tds ?? null,
    showTds: !!(prefill?.tds),
    flag: prefill?.flag ?? 'dialled',
    rating: prefill?.rating ?? 0,
    acidity: 3, sweetness: 3, bitterness: 3, body: 3, balance: 3,
    flavours: [],
    notes: '',
  }));

  const update = (patch: Partial<WizardDraft>) => setDraft(d => ({ ...d, ...patch }));

  const onSave = async () => {
    if (!draft.beanId) return;
    const { showTds, ...payload } = draft;
    await db.addExtraction({ ...payload, beanId: draft.beanId });
    navigate('/');
  };

  const TOTAL = 6;

  return (
    <div>
      <div className="row row-between" style={{ marginBottom: 24 }}>
        <Button variant="ghost" style={{ padding: '6px 10px' }} onClick={() => step === 1 ? navigate('/') : setStep(step - 1)}>
          <Icon name="arrowLeft" size={16} />
          <span>{step === 1 ? 'Cancel' : 'Back'}</span>
        </Button>
        <span className="t-upper">Step {step} of {TOTAL}</span>
      </div>
      <div style={{ marginBottom: 32 }}>
        <ProgressBar value={step} max={TOTAL} />
      </div>

      {step === 1 && <StepMethod draft={draft} update={update} onNext={() => setStep(2)} />}
      {step === 2 && <StepBean draft={draft} update={update} onNext={() => setStep(3)} />}
      {step === 3 && <StepEquipment draft={draft} update={update} onNext={() => setStep(4)} />}
      {step === 4 && <StepParameters draft={draft} update={update} onNext={() => setStep(5)} />}
      {step === 5 && <StepTimer draft={draft} update={update} onNext={() => setStep(6)} onSkip={() => setStep(6)} />}
      {step === 6 && <StepTasting draft={draft} update={update} onSave={onSave} />}
    </div>
  );
}
