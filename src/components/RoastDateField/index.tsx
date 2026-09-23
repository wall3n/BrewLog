import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Field } from '../Input';
import { daysOffRoast, todayInputValue } from '../../utils/roastDate';
import s from './styles.module.css';

export interface RoastDateFieldProps {
  /** "YYYY-MM-DD", or "" for no date. */
  value: string;
  onChange: (value: string) => void;
}

// The roast date is printed on the bag, so the user copies the date, not a day count.
// The day count under the field is computed, so it prints in graphite (The Ballpoint Rule).
export function RoastDateField({ value, onChange }: RoastDateFieldProps) {
  const { t } = useTranslation();
  const noteId = useId();
  const now = new Date();
  const days = daysOffRoast(value, now);
  const future = days !== null && days < 0;

  let note = <span className="field-hint">{t('beans.roastDate.empty')}</span>;
  if (future) note = <span className={s.error} role="alert">{t('beans.roastDate.future')}</span>;
  else if (days !== null) note = <span className={s.days}>{days === 0 ? t('beans.roastDate.today') : t('beans.roastDate.days', { count: days })}</span>;

  return (
    <Field label={t('beans.fields.roastedAt')}>
      <input
        type="date"
        className={`input-underline ${s.date} ${value ? '' : s.unset} ${future ? s.invalid : ''}`}
        value={value}
        max={todayInputValue(now)}
        onChange={e => onChange(e.target.value)}
        aria-label={t('beans.fields.roastedAt')}
        aria-invalid={future}
        aria-describedby={noteId}
      />
      <span id={noteId} className={s.note}>{note}</span>
    </Field>
  );
}
