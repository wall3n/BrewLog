import { useTranslation } from 'react-i18next';
import { ProgressBar } from '../ProgressBar';
import s from './styles.module.css';

export interface StockMeterProps {
  weightG: number;
  initialWeightG?: number;
  servings: number | null;
  isLow: boolean;
}

export function StockMeter({ weightG, initialWeightG, servings, isLow }: StockMeterProps) {
  const { t, i18n } = useTranslation();
  const bag = initialWeightG && initialWeightG > 0 ? initialWeightG : Math.max(weightG, 1);
  const weight = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(weightG);
  return (
    <div className={`${s.meter} ${isLow ? s.isLow : ''}`}>
      <div className={s.labels}>
        <span className={`t-mono ${s.weight}`}>{t('beans.stock.remaining', { weight })}</span>
        {servings !== null && (
          <span className={`t-mono ${s.servings}`}>
            {t('beans.stock.servingsLeft', { count: servings })}
          </span>
        )}
      </div>
      {/* The text above carries the value; the bar is visual only. */}
      <div aria-hidden="true">
        <ProgressBar value={weightG} max={bag} />
      </div>
    </div>
  );
}
