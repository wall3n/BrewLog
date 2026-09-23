import { useTranslation } from 'react-i18next';
import s from './styles.module.css';

export interface StockMeterProps {
  weightG: number;
  initialWeightG?: number;
  servings: number | null;
  isLow: boolean;
  /** One line and a short gauge, for the aside of a ledger row. */
  compact?: boolean;
}

// Remaining coffee is computed from logged brews, so it prints in graphite (The Ballpoint Rule).
export function StockMeter({ weightG, initialWeightG, servings, isLow, compact = false }: StockMeterProps) {
  const { t, i18n } = useTranslation();
  const bag = initialWeightG && initialWeightG > 0 ? initialWeightG : Math.max(weightG, 1);
  const fmt = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 });
  const pct = Math.max(0, Math.min(100, (weightG / bag) * 100));
  const gauge = (
    // The text carries the value; the gauge is visual only.
    <div className={s.track} aria-hidden="true">
      {/* dynamic fill level — allowed inline style exception */}
      <div className={s.fill} style={{ transform: `scaleX(${pct / 100})` }} />
    </div>
  );

  if (compact) {
    return (
      <span className={`${s.compact} ${isLow ? s.isLow : ''}`}>
        <span className={s.compactText}>{t('beans.stock.remaining', { weight: fmt.format(weightG) })}</span>
        {gauge}
      </span>
    );
  }

  return (
    <div className={`${s.meter} ${isLow ? s.isLow : ''}`}>
      <div className={s.head}>
        <span className={s.value}>
          {fmt.format(weightG)}<span className={s.unit}>g</span>
        </span>
        {initialWeightG != null && initialWeightG > 0 && (
          <span className={s.bag}>{t('beans.stock.ofBag', { weight: fmt.format(initialWeightG) })}</span>
        )}
        {isLow && <span className={`t-upper ${s.lowMark}`}>{t('beans.stock.low')}</span>}
      </div>
      {gauge}
      {servings !== null && (
        <span className={s.servings}>{t('beans.stock.servingsLeft', { count: servings })}</span>
      )}
    </div>
  );
}
