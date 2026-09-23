import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SegToggle } from '../../components/UI';
import { driverMethods, driverStrength, ratingDrivers, MIN_DRIVER_SAMPLES } from '../../utils/analytics';
import type { Extraction } from '../../db/types';
import s from './styles.module.css';

export interface RatingDriversProps {
  extractions: readonly Extraction[];
}

// Correlations are computed, so the bars and figures print in graphite, not ink.
export function RatingDrivers({ extractions }: RatingDriversProps) {
  const { t, i18n } = useTranslation();
  const methods = driverMethods(extractions);
  const [picked, setPicked] = useState<string | null>(null);
  const method = picked !== null && methods.includes(picked) ? picked : methods[0];

  if (!method) return <p className={s.emptyCell}>{t('analytics.drivers.empty', { min: MIN_DRIVER_SAMPLES })}</p>;

  const drivers = ratingDrivers(extractions, method);
  const top = drivers[0];
  const topStrength = top ? driverStrength(top.r) : 'weak';
  const fmtR = new Intl.NumberFormat(i18n.language || 'en', {
    minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero',
  });

  // A real minus sign, as in the sheet's deltas.
  const fmtSigned = (r: number): string => fmtR.format(r).replace('-', '\u2212');

  return (
    <div>
      {methods.length > 1 && (
        <div className={s.driverToggle}>
          <SegToggle value={method} onChange={setPicked}
            options={methods.map(m => [m, t(`methods.${m}`, { defaultValue: m })])} />
        </div>
      )}
      <p className={`${s.summaryLine} ${s.driverSummary} ${topStrength === 'weak' ? s.driverWeakSummary : ''}`}>
        {top && topStrength !== 'weak'
          ? t(`analytics.drivers.${topStrength}`, { param: t(`analytics.drivers.params.${top.key}`).toLowerCase() })
          : t('analytics.drivers.weak')}
      </p>
      {drivers.length > 0 && (
        <>
          <div className={s.driverScale} aria-hidden="true">
            <span className={s.driverScaleEnds}>
              <span>{t('analytics.drivers.lowerBetter')}</span>
              <span>{t('analytics.drivers.higherBetter')}</span>
            </span>
          </div>
          <div className={s.driverList}>
            {drivers.map(d => {
              const strong = driverStrength(d.r) !== 'weak';
              return (
                <div key={d.key} className={s.driverRow}>
                  <span className={`${s.driverLabel} ${strong ? '' : s.driverMuted}`}>{t(`analytics.drivers.params.${d.key}`)}</span>
                  <div className={s.driverTrack}>
                    {/* runtime values: the bar starts at the centre rule and grows left or right with r */}
                    <div
                      className={`${s.driverFill} ${strong ? '' : s.driverFillWeak}`}
                      style={{ left: `${d.r < 0 ? 50 + d.r * 50 : 50}%`, width: `${Math.abs(d.r) * 50}%` }}
                    />
                  </div>
                  <span className={`${s.driverValue} ${strong ? '' : s.driverMuted}`}>{fmtSigned(d.r)}</span>
                </div>
              );
            })}
          </div>
          <p className={s.plotNote}>{t('analytics.drivers.sample', { n: drivers[0].n })}</p>
        </>
      )}
    </div>
  );
}
