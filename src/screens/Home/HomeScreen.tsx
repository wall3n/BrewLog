import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Stars, MethodBadge, Empty, RoastDot } from '../../components/UI';
import { Icon } from '../../components/Icons';
import { fmtRelDate } from '../../utils/formatters';
import i18n from '../../i18n';
import type { Extraction, Bean } from '../../db/types';

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 5) return 'home.greetings.lateBrew';
  if (h < 12) return 'home.greetings.morning';
  if (h < 17) return 'home.greetings.afternoon';
  return 'home.greetings.evening';
}

function weekRange(): string {
  const locale = i18n.language || 'en';
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
  const now = new Date();
  const start = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
  return `${fmt.format(start)} – ${fmt.format(now)}`;
}

function WeekStat({ value, unit, label }: { value: string | number; unit: string; label: string }) {
  return (
    <div className="wstat">
      <div className="wv">
        {value}
        {unit && <span className="wu">{unit}</span>}
      </div>
      <div className="wl">{label}</div>
    </div>
  );
}

function RankExtraction({
  rank, extraction, beans, onClick,
}: { rank: number; extraction: Extraction; beans: Bean[]; onClick: () => void }) {
  const { t } = useTranslation();
  const bean = beans.find(b => b.id === extraction.beanId);
  return (
    <div className="rank-row" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <span className="rank-n">{rank}</span>
      <div className="rank-main">
        <div className="rank-title">{bean ? bean.name : t('extraction.unknownBean')}</div>
        <div className="rank-sub">
          <MethodBadge method={extraction.method} />
          <span className="t-mono t-acc">1:{extraction.ratio.toFixed(1)}</span>
          <span className="t-ter">·</span>
          <span className="t-mono t-sec">{fmtRelDate(extraction.createdAt)}</span>
        </div>
      </div>
      <Stars value={extraction.rating} size={14} />
    </div>
  );
}

function RankBean({
  rank, bean, count, onClick,
}: { rank: number; bean: Bean; count: number; onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="rank-row" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <span className="rank-n">{rank}</span>
      <div className="rank-main">
        <div className="rank-title">{bean.name}</div>
        <div className="rank-sub">
          <RoastDot level={bean.roast} />
          <span className="t-sec" style={{ fontSize: 11, letterSpacing: '0.04em' }}>{bean.roaster}</span>
        </div>
      </div>
      <div className="rank-metric">
        <span className="rm-v">{count}</span>
        <span className="rm-l">{t('home.brewCount', { count })}</span>
      </div>
    </div>
  );
}

export function HomeScreen() {
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [beans, setBeans] = useState<Bean[]>([]);

  useEffect(() => {
    Promise.all([db.getAllExtractions(), db.getAllBeans()])
      .then(([exts, bns]) => { setExtractions(exts); setBeans(bns); });
  }, []);

  const weekStart = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const week = extractions.filter(e => new Date(e.createdAt).getTime() >= weekStart);

  const brews = week.length;
  const rated = week.filter(e => e.rating > 0);
  const avgRating = rated.length
    ? (rated.reduce((a, e) => a + e.rating, 0) / rated.length).toFixed(1)
    : '—';
  const dialled = week.filter(e => e.flag === 'dialled').length;
  const dialledPct = brews ? Math.round((dialled / brews) * 100) : 0;
  const gramsUsed = week.reduce((a, e) => a + (e.dose || 0), 0);

  const topExt = [...week]
    .sort((a, b) => (b.rating - a.rating) || (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    .slice(0, 3);

  const beanAgg: Record<number, { count: number; ratingSum: number; ratingN: number }> = {};
  week.forEach(e => {
    const g = beanAgg[e.beanId] ?? (beanAgg[e.beanId] = { count: 0, ratingSum: 0, ratingN: 0 });
    g.count += 1;
    if (e.rating > 0) { g.ratingSum += e.rating; g.ratingN += 1; }
  });
  const topBeans = Object.entries(beanAgg)
    .map(([beanId, g]) => ({
      bean: beans.find(b => b.id === Number(beanId)),
      count: g.count,
      avg: g.ratingN ? g.ratingSum / g.ratingN : 0,
    }))
    .filter((x): x is { bean: Bean; count: number; avg: number } => x.bean != null)
    .sort((a, b) => (b.count - a.count) || (b.avg - a.avg))
    .slice(0, 3);

  return (
    <div className="home-min">
      <header className="home-hero">
        <span className="t-upper">{weekRange()}</span>
        <h1 className="h-display">{t(greetingKey())}.</h1>
      </header>

      <section className="home-block">
        <div className="block-label">
          <span className="t-upper">{t('home.thisWeek')}</span>
        </div>
        <div className="week-stats">
          <WeekStat value={brews} unit="" label={t('home.stats.brews')} />
          <WeekStat value={avgRating} unit={rated.length ? '/5' : ''} label={t('home.stats.avgRating')} />
          <WeekStat value={dialledPct} unit="%" label={t('home.stats.dialledIn')} />
          <WeekStat value={gramsUsed} unit="g" label={t('home.stats.coffeeUsed')} />
        </div>
      </section>

      <section className="home-block">
        <div className="block-label">
          <span className="t-upper">{t('home.topExtractions')}</span>
          <button className="block-link" onClick={() => navigate('/history')}>
            {t('home.seeAll')} <Icon name="chevronRight" size={13} />
          </button>
        </div>
        {topExt.length === 0
          ? <Empty icon="flask" title={t('home.noBrewsWeek')} body={t('home.noBrewsWeekBody')} />
          : (
            <div className="rank-list">
              {topExt.map((e, i) => (
                <RankExtraction
                  key={e.id}
                  rank={i + 1}
                  extraction={e}
                  beans={beans}
                  onClick={() => navigate(`/history/${e.id}`)}
                />
              ))}
            </div>
          )}
      </section>

      <section className="home-block">
        <div className="block-label">
          <span className="t-upper">{t('home.topBeans')}</span>
          <button className="block-link" onClick={() => navigate('/beans')}>
            {t('home.seeAll')} <Icon name="chevronRight" size={13} />
          </button>
        </div>
        {topBeans.length === 0
          ? <Empty icon="bean" title={t('home.noBeansWeek')} />
          : (
            <div className="rank-list">
              {topBeans.map((x, i) => (
                <RankBean
                  key={x.bean.id}
                  rank={i + 1}
                  bean={x.bean}
                  count={x.count}
                  onClick={() => navigate(`/beans/${x.bean.id}`)}
                />
              ))}
            </div>
          )}
      </section>
    </div>
  );
}
