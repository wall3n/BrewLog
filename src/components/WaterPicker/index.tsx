import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { Input } from '../Input';
import { Tag } from '../Tag';
import { Icon } from '../Icons';
import type { Water } from '../../db/types';
import s from './styles.module.css';

const MAX_WATER_BRAND_LENGTH = 60;
const WATER_TDS_RANGE: readonly [number, number] = [0, 1000];

export interface NewWater { brand: string; tdsPpm?: number; }

export interface WaterPickerProps {
  waters: readonly Water[];
  value: number | null;
  onChange: (id: number | null) => void;
  /** Saves the new water. Rejects when the save fails. */
  onAdd: (water: NewWater) => Promise<void>;
}

/** Chips to pick the water of a recipe, and a short inline form to add a new brand. */
export function WaterPicker({ waters, value, onChange, onAdd }: WaterPickerProps) {
  const { t } = useTranslation();
  const idBase = useId();
  const [adding, setAdding] = useState(false);
  const [brand, setBrand] = useState('');
  const [tds, setTds] = useState('');
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const trimmed = brand.trim();
  const tdsNum = tds.trim() === '' ? undefined : Number(tds);
  const tdsInvalid = tdsNum !== undefined && (!Number.isFinite(tdsNum) || tdsNum < WATER_TDS_RANGE[0] || tdsNum > WATER_TDS_RANGE[1]);
  const duplicate = waters.some(w => w.brand.toLowerCase() === trimmed.toLowerCase());
  const canAdd = trimmed.length > 0 && !tdsInvalid && !duplicate && !saving;

  function close() {
    setAdding(false); setBrand(''); setTds(''); setFailed(false);
  }

  async function add() {
    if (!canAdd) return;
    setSaving(true); setFailed(false);
    try {
      await onAdd({ brand: trimmed, ...(tdsNum !== undefined ? { tdsPpm: tdsNum } : {}) });
      close();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="col col-gap-8">
      <div className="row row-wrap row-gap-8" role="group" aria-label={t('water.label')}>
        <Tag subtle active={value === null} onClick={() => onChange(null)}>{t('water.none')}</Tag>
        {waters.map(w => (
          <Tag key={w.id} active={w.id === value} onClick={() => onChange(w.id ?? null)}>
            {w.brand}
            {w.tdsPpm != null && <span className={s.ppm}>{t('water.ppm', { value: w.tdsPpm })}</span>}
          </Tag>
        ))}
      </div>

      {adding ? (
        <div className={s.addForm}>
          <label className={s.cell}>
            <span className="field-label">{t('water.brand')}</span>
            <Input
              value={brand}
              maxLength={MAX_WATER_BRAND_LENGTH}
              onChange={e => setBrand(e.target.value)}
              placeholder={t('water.brandPlaceholder')}
              aria-invalid={duplicate || undefined}
              aria-describedby={duplicate ? `${idBase}-dup` : undefined}
              autoFocus
            />
          </label>
          <label className={s.cell}>
            <span className="field-label">{t('water.tds')}</span>
            <Input
              type="number"
              inputMode="numeric"
              min={WATER_TDS_RANGE[0]}
              max={WATER_TDS_RANGE[1]}
              value={tds}
              onChange={e => setTds(e.target.value)}
              placeholder={t('water.tdsPlaceholder')}
              aria-invalid={tdsInvalid || undefined}
              aria-describedby={tdsInvalid ? `${idBase}-tds` : undefined}
            />
          </label>
          {duplicate && <p id={`${idBase}-dup`} className={s.error}>{t('water.errors.duplicate')}</p>}
          {tdsInvalid && <p id={`${idBase}-tds`} className={s.error}>{t('water.errors.tds', { min: WATER_TDS_RANGE[0], max: WATER_TDS_RANGE[1] })}</p>}
          {failed && <p className={s.error} role="alert">{t('water.errors.save')}</p>}
          <div className={s.actions}>
            <Button variant="ghost" onClick={close}>{t('common.cancel')}</Button>
            <Button onClick={add} disabled={!canAdd}>{t('water.save')}</Button>
          </div>
        </div>
      ) : (
        <div>
          <button type="button" className="btn-link" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} /> {t('water.add')}
          </button>
        </div>
      )}
    </div>
  );
}
