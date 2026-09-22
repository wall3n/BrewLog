import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Stars, Empty, FlagMark } from '../../components/UI';
import type { Extraction, Bean } from '../../db/types';
import s from './styles.module.css';

const FLAGS = ['dialled', 'adjust', 'fail'] as const;
const FLAG_COLOR: Record<Extraction['flag'], string> = {
  dialled: 'var(--success)',
  adjust: 'var(--warning)',
  fail: 'var(--danger)',
};

function ScoreChart({ data }: { data: readonly Extraction[] }) {
  const w = 700, h = 180, pad = { l: 0, r: 8, t: 14, b: 14 };
  const innerW = w - pad.l - pad.r, innerH = h - pad.t - pad.b;
  const x = (i: number) => pad.l + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.t + (1 - v / 5) * innerH;
  const rated = data.map((d, i) => ({ d, i })).filter(p => p.d.rating > 0);
  const linePath = rated.map((p, k) => `${k === 0 ? 'M' : 'L'} ${x(p.i)} ${y(p.d.rating)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" className={s.chartSvg} role="img" aria-hidden="true" preserveAspectRatio="none">
      {[1, 2, 3, 4, 5].map(level => (
        <g key={level}>
          <line x1={pad.l} y1={y(level)} x2={w - pad.r} y2={y(level)} className="chart-grid" />
        </g>
      ))}
      <line x1={pad.l} y1={h - pad.b} x2={w - pad.r} y2={h - pad.b} className="chart-axis" />
      <path d={linePath} className="chart-line" vectorEffect="non-scaling-stroke" />
      {rated.map(p => (
        <line key={p.d.id} x1={x(p.i)} y1={y(p.d.rating)} x2={x(p.i)} y2={y(p.d.rating)} stroke={FLAG_COLOR[p.d.flag]} strokeWidth="9" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      ))}
    </svg>
  );
}

function SummaryStat({ value, unit, label }: { value: string | number; unit?: string; label: string }) {
  return (
    <div className="spec-row">
      <span>{label}</span>
      <span className={`v ${s.sumValue}`}>{value}{unit && <span className={s.sumUnit}>{unit}</span>}</span>
    </div>
  );
}

export function AnalyticsScreen() {
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([db.getAllExtractions(), db.getAllBeans()])
      .then(([exts, bns]) => { setExtractions(exts); setBeans(bns); setLoaded(true); });
  }, []);

  if (!loaded) return null;

  const total = extractions.length;
  const series = [...extractions].reverse().slice(-30);
  const rated = extractions.filter(e => e.rating > 0);
  const avg = rated.length ? (rated.reduce((a, e) => a + e.rating, 0) / rated.length).toFixed(1) : '—';
  const flagCounts = FLAGS.map(f => ({ f, n: extractions.filter(e => e.flag === f).length }));
  const dialledPct = total ? Math.round((flagCounts[0].n / total) * 100) : 0;
  const beansUsed = new Set(extractions.map(e => e.beanId)).size;

  const methodCounts: Record<string, number> = {};
  extractions.forEach(e => { methodCounts[e.method] = (methodCounts[e.method] ?? 0) + 1; });
  const methodList = Object.entries(methodCounts).sort((a, b) => b[1] - a[1]);
  const maxMethodCount = methodList[0]?.[1] ?? 1;

  const beanStats: Record<number, { sum: number; count: number }> = {};
  rated.forEach(e => {
    if (!e.beanId) return;
    beanStats[e.beanId] = beanStats[e.beanId] ?? { sum: 0, count: 0 };
    beanStats[e.beanId].sum += e.rating;
    beanStats[e.beanId].count += 1;
  });
  const topBeans = Object.entries(beanStats)
    .map(([id, st]) => ({ id: Number(id), avg: st.sum / st.count, count: st.count }))
    .sort((a, b) => b.avg - a.avg).slice(0, 5);

  return (
    <div>
      <div className="page-head">
        <h1>{t('analytics.title')}</h1>
        <p>{t('analytics.subtitle')}</p>
      </div>

      {total === 0 ? (
        <Empty icon="chart" title={t('analytics.logFirst')} />
      ) : (
        <>
          <div className={s.summary}>
            <SummaryStat value={total} label={t('analytics.totalExtractions')} />
            <SummaryStat value={dialledPct} unit="%" label={t('home.stats.dialledIn')} />
            <SummaryStat value={avg} unit={rated.length ? '/5' : ''} label={t('home.stats.avgRating')} />
            <SummaryStat value={beansUsed} label={t('analytics.beansUsed')} />
          </div>

          <section className={s.block}>
            <div className="section-label">
              <span className="t-upper">{t('analytics.ratingOverTime')}</span>
              <span className={s.blockNote}>{t('analytics.last', { count: series.length })}</span>
            </div>
            <div className={`grid-paper ${s.chartBox}`}>
              <div className={s.axis} aria-hidden="true">{[5, 4, 3, 2, 1].map(n => <span key={n}>{n}</span>)}</div>
              <ScoreChart data={series} />
            </div>
            <div className={s.legend}>
              {FLAGS.map(f => <FlagMark key={f} flag={f} />)}
            </div>
          </section>

          <section className={s.block}>
            <div className="section-label"><span className="t-upper">{t('extraction.steps.tasting.outcome')}</span></div>
            <div className={s.flagBar} aria-hidden="true">
              {flagCounts.filter(c => c.n > 0).map(c => (
                // segment width is runtime-computed — allowed inline style exception
                <span key={c.f} className={`${s.flagSeg} ${s[`seg_${c.f}`]}`} style={{ width: `${(c.n / total) * 100}%` }} />
              ))}
            </div>
            <div className={s.flagRows}>
              {flagCounts.map(c => (
                <div key={c.f} className="spec-row">
                  <FlagMark flag={c.f} />
                  <span className="v">{c.n} <span className="t-sec">· {Math.round((c.n / total) * 100)}%</span></span>
                </div>
              ))}
            </div>
          </section>

          <section className={s.block}>
            <div className="section-label"><span className="t-upper">{t('analytics.methodDistribution')}</span></div>
            <div className="col col-gap-12">
              {methodList.map(([m, c]) => (
                <div key={m}>
                  <div className={s.barRow}>
                    <span className={s.methodName}>{t(`methods.${m}`, { defaultValue: m })}</span>
                    <span className={s.methodCount}>{c}</span>
                  </div>
                  <div className={s.barTrack}>
                    {/* dynamic width — allowed inline style exception */}
                    <div className={s.barFill} style={{ width: `${(c / maxMethodCount) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className={s.block}>
            <div className="section-label"><span className="t-upper">{t('analytics.topBeans')}</span></div>
            {topBeans.length === 0
              ? <p className={s.noData}>{t('analytics.noRatings')}</p>
              : topBeans.map(b => {
                  const beanObj = beans.find(x => x.id === b.id);
                  return (
                    <button type="button" key={b.id} className="ledger-row" onClick={() => navigate(`/beans/${b.id}`)}>
                      <span className="ledger-main">
                        <span className="ledger-title">{beanObj?.name ?? t('common.unknown')}</span>
                        <span className="ledger-sub">{t('home.brewCount', { count: b.count })}</span>
                      </span>
                      <span className="ledger-aside">
                        <span className={s.beanAvg}>{b.avg.toFixed(1)}</span>
                        <Stars value={Math.round(b.avg)} size={9} />
                      </span>
                    </button>
                  );
                })}
          </section>
        </>
      )}
    </div>
  );
}
