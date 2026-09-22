import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SegToggle } from '../../components/UI';
import { driverMethods, driverStrength, ratingDrivers, MIN_DRIVER_SAMPLES } from '../../utils/analytics';
import type { Extraction } from '../../db/types';
import s from './styles.module.css';

export interface RatingDriversProps {
  extractions: readonly Extraction[];
}

export function RatingDrivers({ extractions }: RatingDriversProps) {
  const { t, i18n } = useTranslation();
  const methods = driverMethods(extractions);
  const [picked, setPicked] = useState<string | null>(null);
  const method = picked !== null && methods.includes(picked) ? picked : methods[0];

  if (!method) return <div className={`t-sec ${s.noData}`}>{t('analytics.drivers.empty', { min: MIN_DRIVER_SAMPLES })}</div>;

  const drivers = ratingDrivers(extractions, method);
  const top = drivers[0];
  const topStrength = top ? driverStrength(top.r) : 'weak';
  const fmtR = new Intl.NumberFormat(i18n.language || 'en', {
    minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: 'exceptZero',
  });

  return (
    <div className="col col-gap-16">
      {methods.length > 1 && (
        <SegToggle value={method} onChange={setPicked}
          options={methods.map(m => [m, t(`methods.${m}`, { defaultValue: m })])} />
      )}
      <p className={s.driverSummary}>
        {top && topStrength !== 'weak'
          ? t(`analytics.drivers.${topStrength}`, { param: t(`analytics.drivers.params.${top.key}`).toLowerCase() })
          : t('analytics.drivers.weak')}
      </p>
      {drivers.length > 0 && (
        <div className="col col-gap-12">
          <div className={`${s.driverRow} ${s.driverScale}`} aria-hidden="true">
            <span />
            <div className={`row row-between ${s.driverScaleLabels}`}>
              <span>{t('analytics.drivers.lowerBetter')}</span>
              <span>{t('analytics.drivers.higherBetter')}</span>
            </div>
            <span />
          </div>
          {drivers.map(d => {
            const strong = driverStrength(d.r) !== 'weak';
            return (
              <div key={d.key} className={s.driverRow}>
                <span className={`${s.driverLabel} ${strong ? '' : 't-sec'}`}>{t(`analytics.drivers.params.${d.key}`)}</span>
                <div className={s.driverTrack}>
                  {/* runtime values: the bar starts at the centre line and grows left or right with r */}
                  <div
                    className={`${s.driverFill} ${strong ? '' : s.driverWeak}`}
                    style={{ left: `${d.r < 0 ? 50 + d.r * 50 : 50}%`, width: `${Math.abs(d.r) * 50}%` }}
                  />
                </div>
                <span className={`t-mono ${strong ? '' : 't-sec'} ${s.driverValue}`}>{fmtR.format(d.r)}</span>
              </div>
            );
          })}
        </div>
      )}
      {drivers.length > 0 && <span className={`t-ter t-mono ${s.chartNote}`}>{t('analytics.drivers.sample', { n: drivers[0].n })}</span>}
    </div>
  );
}
