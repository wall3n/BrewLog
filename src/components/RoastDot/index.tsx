import { useTranslation } from 'react-i18next';
import { daysSince, roastBucket } from '../../utils/formatters';

export function RoastDot({ level }: { level: string }) {
  const { t } = useTranslation();
  return <span className={`roast-dot ${level}`} title={t(`beans.roasts.${level}`, { defaultValue: level })} />;
}

export function DaysOffRoast({ iso }: { iso?: string }) {
  const d = daysSince(iso);
  const { t } = useTranslation();
  if (d == null) return <span className="t-ter t-mono">—</span>;
  const bucket = roastBucket(d);
  return <span className={`days-pill ${bucket}`}>{t('beans.daysOffRoast', { count: d })}</span>;
}
