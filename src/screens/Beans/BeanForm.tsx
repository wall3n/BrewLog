import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input, Textarea } from '../../components/UI';
import type { Bean } from '../../db/types';
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
  
  // Format initial.roastedAt (ISO string) to YYYY-MM-DD for input type="date"
  const initialDate = initial.roastedAt ? initial.roastedAt.split('T')[0] : '';
  const [roastedAt, setRoastedAt] = useState(initialDate);
  
  const [weightG, setWeightG] = useState<string>(initial.weightG != null ? String(initial.weightG) : '');
  const [status, setStatus] = useState<'active' | 'finished' | 'wishlist'>(initial.status ?? 'active');
  const [notes, setNotes] = useState(initial.notes ?? '');

  function handleSave() {
    onSave({
      name: name.trim() || t('beans.saveName'),
      roaster: roaster.trim(),
      origin: origin.trim() || undefined,
      process: process.trim() || undefined,
      roast,
      roastedAt: roastedAt ? new Date(roastedAt).toISOString() : undefined,
      weightG: weightG !== '' ? parseFloat(weightG) : undefined,
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

      <div className="grid grid-2">
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

      <div className="grid grid-2">
        <Field label={t('beans.fields.roastLevel')}>
          <div className="row row-gap-8" style={{ gap: 8 }}>
            {(['light', 'medium', 'dark'] as const).map(r => (
              <button
                key={r}
                type="button"
                className={`tag ${roast === r ? 'active' : ''} ${s.roastBtn}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setRoast(r)}
              >
                {t(`beans.roasts.${r}`)}
              </button>
            ))}
          </div>
        </Field>
        
        <Field label={t('beans.fields.weight')} right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>g</span>}>
          <Input
            type="number"
            value={weightG}
            onChange={e => setWeightG(e.target.value)}
            placeholder={t('beans.placeholders.weight')}
          />
        </Field>
      </div>

      <div className="grid grid-2">
        <Field label={t('beans.fields.roastedAt')}>
          <Input
            type="date"
            value={roastedAt}
            onChange={e => setRoastedAt(e.target.value)}
          />
        </Field>

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

      <Button full size="lg" onClick={handleSave} disabled={!name || !roaster}>
        {t('common.save')}
      </Button>
    </div>
  );
}
