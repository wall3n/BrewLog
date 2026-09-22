import { useTranslation } from 'react-i18next';
import type { Freshness, FreshnessState } from '../../utils/beanStock';
import s from './styles.module.css';

export interface FreshnessBadgeProps {
  freshness: Freshness;
}

// Uses the global days-pill classes from global.css.
const PILL: Readonly<Record<Exclude<FreshnessState, 'unknown'>, string>> = {
  resting: 'amber',
  peak: 'green',
  fading: 'amber',
  stale: 'red',
};

export function FreshnessBadge({ freshness }: FreshnessBadgeProps) {
  const { t } = useTranslation();
  const { state } = freshness;
  if (state === 'unknown') return <span className="t-ter t-mono">—</span>;
  const label =
    state === 'resting' ? t('beans.freshness.resting', { count: freshness.daysUntilPeak ?? 0 })
    : state === 'peak' ? t('beans.freshness.peak', { count: freshness.daysLeftInPeak ?? 0 })
    : t(`beans.freshness.${state}`);
  return (
    <span className={`days-pill ${PILL[state]} ${s.pill}`} title={t('beans.daysOffRoast', { count: freshness.days ?? 0 })}>
      {label}
    </span>
  );
}
