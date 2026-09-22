import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../Icons';
import s from './styles.module.css';

interface StepperProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
  unit?: string;
  prefix?: string;
  min?: number;
  max?: number;
  decimals?: number;
  /** Value of the previous shot, shown as a delta under the reading */
  previous?: number | null;
  hint?: string;
  size?: 'lg' | 'md';
  /** Message printed under the cell when the value cannot be saved */
  error?: string | null;
}

function round(v: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

/** A fill-in cell on the sheet: printed label, ink value, − and + for one-hand use. */
export function Stepper({
  label, value, onChange, step, unit, prefix, min = 0, max = 9999, decimals = 1, previous, hint, size = 'lg', error,
}: StepperProps) {
  const { t } = useTranslation();
  const errorId = useId();
  // Draft text only while the user types; otherwise the cell shows the value.
  const [text, setText] = useState<string | null>(null);

  const clamp = (v: number): number => Math.min(max, Math.max(min, round(v, decimals)));
  const commit = (raw: string) => {
    const n = parseFloat(raw.replace(',', '.'));
    if (Number.isFinite(n)) onChange(clamp(n));
    setText(null);
  };

  const delta = previous != null ? round(value - previous, decimals) : null;

  return (
    <div className={`${s.root} ${size === 'md' ? s.md : ''} ${error ? s.invalid : ''}`}>
      <div className={s.head}>
        <span className="field-label">{label}</span>
        {hint && <span className={s.hint}>{hint}</span>}
      </div>
      <div className={s.body}>
        <button type="button" className={s.btn} onClick={() => onChange(clamp(value - step))} aria-label={t('common.decrease', { label })}>
          <Icon name="minus" size={18} />
        </button>
        <label className={s.valueWrap}>
          {prefix && <span className={s.prefix}>{prefix}</span>}
          <input
            className={s.input}
            inputMode="decimal"
            value={text ?? value.toFixed(decimals)}
            size={Math.max(2, (text ?? value.toFixed(decimals)).length)}
            onFocus={e => { setText(e.target.value); e.target.select(); }}
            onChange={e => setText(e.target.value)}
            onBlur={e => commit(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            aria-label={label}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
          {unit && <span className={s.unit}>{unit}</span>}
        </label>
        <button type="button" className={s.btn} onClick={() => onChange(clamp(value + step))} aria-label={t('common.increase', { label })}>
          <Icon name="plus" size={18} />
        </button>
      </div>
      {error && <p id={errorId} className={s.error}>{error}</p>}
      {delta != null && (
        <div className={s.delta}>
          {delta === 0
            ? t('sheet.sameAsLast')
            : t('sheet.vsLast', { delta: `${delta > 0 ? '+' : '−'}${Math.abs(delta).toFixed(decimals)}` })}
        </div>
      )}
    </div>
  );
}
