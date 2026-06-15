import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Stars } from '../../components/UI';
import type { Extraction, Bean } from '../../db/types';
import s from './styles.module.css';

function LineChart({ data }: { data: { rating: number }[] }) {
  const { t } = useTranslation();
  const w = 700, h = 140, pad = { l: 24, r: 12, t: 12, b: 24 };
  const innerW = w - pad.l - pad.r, innerH = h - pad.t - pad.b;
  if (data.length === 0) return <div className={`t-sec ${s.noData}`}>{t('analytics.logFirst')}</div>;
  const x = (i: number) => pad.l + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.t + (1 - v / 5) * innerH;
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.rating)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} className={s.chartSvg}>
      {[1,2,3,4,5].map(level => (
        <g key={level}>
          <line x1={pad.l} y1={y(level)} x2={w - pad.r} y2={y(level)} className="chart-grid" />
          <text x={pad.l - 6} y={y(level)} textAnchor="end" dominantBaseline="middle" className="chart-label">{level}</text>
        </g>
      ))}
      <path d={linePath} className="chart-line" />
      {data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.rating)} r="2.5" className="chart-dot" />)}
    </svg>
  );
}

export function AnalyticsScreen() {
  const db = useDb();
  const { t } = useTranslation();

  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [beans, setBeans] = useState<Bean[]>([]);

  useEffect(() => {
    Promise.all([db.getAllExtractions(), db.getAllBeans()])
      .then(([exts, bns]) => { setExtractions(exts); setBeans(bns); });
  }, []);

  const ratingsOverTime = [...extractions].reverse().slice(-30).map(e => ({ rating: e.rating ?? 0 }));

  const methodCounts: Record<string, number> = {};
  extractions.forEach(e => { methodCounts[e.method] = (methodCounts[e.method] ?? 0) + 1; });
  const methodList = Object.entries(methodCounts).sort((a, b) => b[1] - a[1]);
  const maxMethodCount = methodList[0]?.[1] ?? 1;

  const beanStats: Record<number, { sum: number; count: number }> = {};
  extractions.forEach(e => {
    if (!e.rating || !e.beanId) return;
    beanStats[e.beanId] = beanStats[e.beanId] ?? { sum: 0, count: 0 };
    beanStats[e.beanId].sum += e.rating;
    beanStats[e.beanId].count += 1;
  });
  const topBeans = Object.entries(beanStats)
    .map(([id, s]) => ({ id: Number(id), avg: s.sum / s.count, count: s.count }))
    .sort((a, b) => b.avg - a.avg).slice(0, 5);

  return (
    <div>
      <div className="page-head">
        <h1>{t('analytics.title')}</h1>
        <p>{t('analytics.subtitle')}</p>
      </div>

      <div className={`card ${s.cardMb}`}>
        <div className={`t-upper ${s.cardHeaderMb}`}>{t('analytics.totalExtractions')}</div>
        <div className={s.bigNum}>{extractions.length}</div>
      </div>

      <div className={`card ${s.cardMb}`}>
        <div className={`row row-between ${s.chartHeader}`}>
          <span className="t-upper">{t('analytics.ratingOverTime')}</span>
          <span className={`t-mono t-sec ${s.chartCount}`}>{t('analytics.last', { count: ratingsOverTime.length })}</span>
        </div>
        <LineChart data={ratingsOverTime} />
      </div>

      <div className={`card ${s.cardMb}`}>
        <div className={`t-upper ${s.chartHeader}`}>{t('analytics.methodDistribution')}</div>
        <div className="col col-gap-12">
          {methodList.map(([m, c]) => (
            <div key={m}>
              <div className={`row row-between ${s.barRow}`}>
                <span className={s.methodName}>{t(`methods.${m}`, { defaultValue: m })}</span>
                <span className={`t-mono t-sec ${s.methodCount}`}>{c}</span>
              </div>
              <div className={s.barTrack}>
                {/* dynamic width — allowed inline style exception */}
                <div className={s.barFill} style={{ width: `${(c / maxMethodCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className={`t-upper ${s.chartHeader}`}>{t('analytics.topBeans')}</div>
        <div className="col col-gap-12">
          {topBeans.length === 0
            ? <span className={`t-sec ${s.noData}`}>{t('analytics.noRatings')}</span>
            : topBeans.map((b, i) => {
                const beanObj = beans.find(x => x.id === b.id);
                return (
                  <div key={b.id} className="row row-between">
                    <div className="row row-gap-12">
                      <span className={`t-mono ${s.beanRank}`}>{(i + 1).toString().padStart(2, '0')}</span>
                      <span className={s.beanName}>{beanObj?.name ?? t('common.unknown')}</span>
                    </div>
                    <div className="row row-gap-8">
                      <Stars value={Math.round(b.avg)} size={12} />
                      <span className={`t-mono t-sec ${s.beanRating}`}>{b.avg.toFixed(1)} · {b.count}×</span>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}
