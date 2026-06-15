import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { Button, ProgressBar } from '../../components/UI';
import { Icon } from '../../components/Icons';
import css from './styles.module.css';
import { StepMethod } from './steps/StepMethod';
import { StepBean } from './steps/StepBean';
import { StepEquipment } from './steps/StepEquipment';
import { StepParameters } from './steps/StepParameters';
import { StepTimer } from './steps/StepTimer';
import { StepTasting } from './steps/StepTasting';
import type { Extraction } from '../../db/types';

export interface WizardDraft {
  id?: number;
  isEditing?: boolean;
  createdAt?: string;
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
  const prefill = location.state as (Partial<Extraction> & { isEditing?: boolean }) | null;
  const { state } = useApp();
  const db = useDb();
  const { t } = useTranslation();

  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<WizardDraft>(() => ({
    id: prefill?.id,
    isEditing: prefill?.isEditing,
    createdAt: prefill?.createdAt,
    method: prefill?.method ?? state.settings?.defaultMethod ?? 'espresso',
    beanId: prefill?.beanId ?? state.activeBeans.find(b => b.status === 'active')?.id ?? null,
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
    acidity: prefill?.acidity ?? 3,
    sweetness: prefill?.sweetness ?? 3,
    bitterness: prefill?.bitterness ?? 3,
    body: prefill?.body ?? 3,
    balance: prefill?.balance ?? 3,
    flavours: prefill?.flavours ?? [],
    notes: prefill?.notes ?? '',
  }));

  const update = (patch: Partial<WizardDraft>) => setDraft(d => ({ ...d, ...patch }));

  const onSave = async () => {
    if (!draft.beanId) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { showTds, isEditing, id, createdAt, ...payload } = draft;
    if (isEditing && id) {
      await db.updateExtraction({
        ...payload,
        beanId: draft.beanId,
        id,
        createdAt: createdAt!,
        updatedAt: new Date().toISOString()
      });
      navigate(`/history/${id}`);
    } else {
      await db.addExtraction({ ...payload, beanId: draft.beanId });
      navigate('/');
    }
  };

  const TOTAL = 6;

  return (
    <div>
      <div className={`row row-between ${css.navRow}`}>
        <Button variant="ghost" className={css.navBtn} onClick={() => step === 1 ? (draft.isEditing ? navigate(`/history/${draft.id}`) : navigate('/')) : setStep(step - 1)}>
          <Icon name="arrowLeft" size={16} />
          <span>{step === 1 ? t('extraction.cancel') : t('extraction.back')}</span>
        </Button>
        <span className="t-upper">{t('extraction.step', { current: step, total: TOTAL })}</span>
      </div>
      <div className={css.progressWrap}>
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
