import { useTranslation } from 'react-i18next';
import { Icon } from '../../../components/Icons';
import { grindStep } from '../../../utils/shots';
import stepper from '../../../components/Stepper/styles.module.css';

interface GrindFieldProps { value: string; previous?: string | null; onChange: (v: string) => void; }

/** Grind is free text (clicks, dial numbers, rotations). −/+ work when the value is numeric. */
export function GrindField({ value, previous, onChange }: GrindFieldProps) {
  const { t } = useTranslation();
  const label = t('extraction.fields.grind');
  const num = parseFloat(value.replace(',', '.'));
  const numeric = value.trim() === '' || Number.isFinite(num);
  const step = grindStep(value);
  const decimals = step < 1 ? 1 : 0;
  const bump = (dir: 1 | -1) => {
    const base = Number.isFinite(num) ? num : 0;
    onChange((Math.round((base + dir * step) * 10) / 10).toFixed(decimals));
  };

  return (
    <div className={`${stepper.root} ${stepper.md}`}>
      <div className={stepper.head}>
        <span className="field-label">{label}</span>
      </div>
      <div className={stepper.body}>
        <button type="button" className={stepper.btn} disabled={!numeric} onClick={() => bump(-1)} aria-label={t('common.decrease', { label })}>
          <Icon name="minus" size={18} />
        </button>
        <label className={stepper.valueWrap}>
          <input
            className={stepper.input}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="—"
            size={Math.max(3, value.length)}
            aria-label={label}
          />
        </label>
        <button type="button" className={stepper.btn} disabled={!numeric} onClick={() => bump(1)} aria-label={t('common.increase', { label })}>
          <Icon name="plus" size={18} />
        </button>
      </div>
      <div className={stepper.delta}>
        {previous && previous !== value ? t('sheet.wasValue', { value: previous }) : previous ? t('sheet.sameAsLast') : ' '}
      </div>
    </div>
  );
}
