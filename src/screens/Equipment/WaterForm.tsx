import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Field, Input, Textarea } from '../../components/UI';
import type { Water } from '../../db/types';
import { MAX_WATER_BRAND_LENGTH, WATER_TDS_RANGE, isDuplicateWater, parseTds } from '../../utils/water';
import s from './styles.module.css';

export type WaterPayload = Pick<Water, 'brand' | 'tdsPpm' | 'notes'>;

interface WaterFormProps {
  initial?: Water;
  waters: readonly Water[];
  onSave: (payload: WaterPayload) => Promise<void>;
}

export function WaterForm({ initial, waters, onSave }: WaterFormProps) {
  const { t } = useTranslation();
  const idBase = useId();
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [tds, setTds] = useState(initial?.tdsPpm != null ? String(initial.tdsPpm) : '');
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const trimmed = brand.trim();
  const tdsPpm = parseTds(tds);
  const duplicate = trimmed !== '' && isDuplicateWater(waters, trimmed, initial?.id);
  const canSave = trimmed !== '' && tdsPpm !== null && !duplicate && !saving;

  async function save() {
    if (!canSave) return;
    setSaving(true); setFailed(false);
    try {
      await onSave({ brand: trimmed, tdsPpm: tdsPpm ?? undefined, notes: notes.trim() || undefined });
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`col col-gap-16 ${s.waterForm}`}>
      <Field label={t('water.brand')}>
        <Input
          value={brand}
          maxLength={MAX_WATER_BRAND_LENGTH}
          onChange={e => setBrand(e.target.value)}
          placeholder={t('water.brandPlaceholder')}
          aria-invalid={duplicate || undefined}
          aria-describedby={duplicate ? `${idBase}-dup` : undefined}
        />
        {duplicate && <p id={`${idBase}-dup`} className={s.fieldError}>{t('water.errors.duplicate')}</p>}
      </Field>
      <Field label={t('water.tds')}>
        <Input
          type="number"
          inputMode="numeric"
          min={WATER_TDS_RANGE[0]}
          max={WATER_TDS_RANGE[1]}
          value={tds}
          onChange={e => setTds(e.target.value)}
          placeholder={t('water.tdsPlaceholder')}
          aria-invalid={tdsPpm === null || undefined}
          aria-describedby={tdsPpm === null ? `${idBase}-tds` : undefined}
        />
        {tdsPpm === null && (
          <p id={`${idBase}-tds`} className={s.fieldError}>{t('water.errors.tds', { min: WATER_TDS_RANGE[0], max: WATER_TDS_RANGE[1] })}</p>
        )}
      </Field>
      <Field label={t('water.notes')}>
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder={t('water.notesPlaceholder')} />
      </Field>
      {failed && <p className={s.fieldError} role="alert">{t('water.errors.save')}</p>}
      <Button full size="lg" onClick={save} disabled={!canSave}>{t('common.save')}</Button>
    </div>
  );
}
