import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input, Textarea, RoastDot, RoastDateField } from '../../components/UI';
import type { Bean } from '../../db/types';
import { nextInitialWeight } from '../../utils/beanStock';
import { daysOffRoast, fromDateInputValue, toDateInputValue } from '../../utils/roastDate';
import s from './styles.module.css';

interface BeanFormProps {
  initial?: Partial<Bean>;
  onSave: (payload: Omit<Bean, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function BeanForm({ initial = {}, onSave }: BeanFormProps) {
  const { t } = useTranslation();

  const [name, setName] = useState(initial.name ?? '');
  const [roaster, setRoaster] = useState(initial.roaster ?? '');
  const [origin, setOrigin] = useState(initial.origin ?? '');
  const [process, setProcess] = useState(initial.process ?? 'Washed');
  const [roast, setRoast] = useState<'light' | 'medium' | 'dark'>(initial.roast ?? 'light');

  const [roastedAt, setRoastedAt] = useState(toDateInputValue(initial.roastedAt));
  const roastFuture = (daysOffRoast(roastedAt, new Date()) ?? 0) < 0;

  const [weightG, setWeightG] = useState<string>(initial.weightG != null ? String(initial.weightG) : '');
  const [status, setStatus] = useState<'active' | 'finished' | 'wishlist'>(initial.status ?? 'active');
  const [notes, setNotes] = useState(initial.notes ?? '');

  function handleSave() {
    const newWeight = weightG !== '' ? parseFloat(weightG) : undefined;
    onSave({
      name: name.trim() || t('beans.saveName'),
      roaster: roaster.trim(),
      origin: origin.trim() || undefined,
      process: process.trim() || undefined,
      roast,
      roastedAt: fromDateInputValue(roastedAt),
      weightG: newWeight,
      initialWeightG: nextInitialWeight(initial.initialWeightG, initial.weightG, newWeight),
      status,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <div className="col col-gap-20">
      <Field label={t('beans.fields.name')}>
        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('beans.placeholders.name')}
        />
      </Field>

      <Field label={t('beans.fields.roaster')}>
        <Input
          value={roaster}
          onChange={e => setRoaster(e.target.value)}
          placeholder={t('beans.placeholders.roaster')}
        />
      </Field>

      <div className={s.formGrid}>
        <Field label={t('beans.fields.origin')}>
          <Input
            value={origin}
            onChange={e => setOrigin(e.target.value)}
            placeholder={t('beans.placeholders.origin')}
          />
        </Field>
        <Field label={t('beans.fields.process')}>
          <select
            className="input-underline"
            value={process}
            onChange={e => setProcess(e.target.value)}
          >
            {[
              { value: 'Washed', key: 'washed' },
              { value: 'Natural', key: 'natural' },
              { value: 'Honey', key: 'honey' },
              { value: 'Anaerobic Natural', key: 'anaerobic' },
              { value: 'Other', key: 'other' },
            ].map(p => (
              <option key={p.value} value={p.value}>{t(`beans.processes.${p.key}`)}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className={s.formGrid}>
        <Field label={t('beans.fields.roastLevel')}>
          <div className={s.roastRow} role="radiogroup" aria-label={t('beans.fields.roastLevel')}>
            {(['light', 'medium', 'dark'] as const).map(r => (
              <button
                key={r}
                type="button"
                role="radio"
                aria-checked={roast === r}
                className={`tag ${roast === r ? 'active' : ''} ${s.roastBtn}`}
                onClick={() => setRoast(r)}
              >
                <RoastDot level={r} />
                {t(`beans.roasts.${r}`)}
              </button>
            ))}
          </div>
        </Field>
        
        <Field label={t('beans.fields.weight')} right={<span className="field-hint">g</span>}>
          <Input
            type="number"
            value={weightG}
            onChange={e => setWeightG(e.target.value)}
            placeholder={t('beans.placeholders.weight')}
          />
        </Field>
      </div>

      <div className={s.formGrid}>
        <RoastDateField value={roastedAt} onChange={setRoastedAt} />

        <Field label={t('beans.fields.status')}>
          <select
            className="input-underline"
            value={status}
            onChange={e => setStatus(e.target.value as 'active' | 'finished' | 'wishlist')}
          >
            {(['active', 'finished', 'wishlist'] as const).map(k => (
              <option key={k} value={k}>
                {t(`beans.tabs.${k}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={t('beans.fields.notes')}>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={t('beans.placeholders.notes')}
        />
      </Field>

      <Button full size="lg" onClick={handleSave} disabled={!name || !roaster || roastFuture}>
        {t('common.save')}
      </Button>
    </div>
  );
}
