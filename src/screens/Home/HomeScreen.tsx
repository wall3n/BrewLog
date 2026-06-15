import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { fmtRelDate, fmtTime } from '../../utils/formatters';
import { Stars, MethodBadge, StagList, Empty, DaysOffRoast, RoastDot } from '../../components/UI';
import { Icon } from '../../components/Icons';
import type { Extraction, Bean } from '../../db/types';

function ExtractionRow({ extraction, beans, onClick }: { extraction: Extraction; beans: readonly Bean[]; onClick: () => void }) {
  const { t } = useTranslation();
  const bean = beans.find(b => b.id === extraction.beanId);
  return (
    <div className="card card-tight card-hover" onClick={onClick} style={{ padding: '16px 20px' }}>
      <div className="row row-between" style={{ alignItems: 'flex-start', gap: 12 }}>
        <div className="col col-gap-8" style={{ flex: 1, minWidth: 0 }}>
          <div className="row row-gap-8" style={{ flexWrap: 'wrap', gap: 8 }}>
            <span className="t-upper">{fmtRelDate(extraction.createdAt)}</span>
            <MethodBadge method={extraction.method} />
          </div>
          <div style={{ fontSize: 15, fontFamily: 'var(--serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {bean ? bean.name : t('extraction.unknownBean')}
          </div>
          <div className="row row-gap-12" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <span className="t-mono">{extraction.dose}g → {extraction.yield}g</span>
            <span className="t-ter">·</span>
            <span className="t-mono t-acc">1:{extraction.ratio.toFixed(1)}</span>
            <span className="t-ter">·</span>
            <span className="t-mono">{fmtTime(extraction.timeS)}</span>
          </div>
        </div>
        <div className="col" style={{ alignItems: 'flex-end', gap: 6 }}>
          <Stars value={extraction.rating} size={14} />
          {extraction.flag === 'dialled' && <span style={{ fontSize: 10, color: 'var(--success)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>✓ {t('history.flags.dialled')}</span>}
          {extraction.flag === 'adjust'  && <span style={{ fontSize: 10, color: 'var(--warning)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>! {t('history.flags.adjust')}</span>}
          {extraction.flag === 'fail'    && <span style={{ fontSize: 10, color: 'var(--danger)',  letterSpacing: '0.06em', textTransform: 'uppercase' }}>✗ {t('history.flags.fail')}</span>}
        </div>
      </div>
    </div>
  );
}

function BeanCard({ bean, onClick }: { bean: Bean; onClick: () => void }) {
  return (
    <div className="card card-hover" onClick={onClick} style={{ padding: 20 }}>
      <div className="row row-between" style={{ marginBottom: 12, alignItems: 'flex-start' }}>
        <div className="col col-gap-4" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 17, lineHeight: 1.2 }}>{bean.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>{bean.roaster}</div>
        </div>
        <RoastDot level={bean.roast} />
      </div>
      <div className="row row-between" style={{ alignItems: 'flex-end' }}>
        <div className="col col-gap-4">
          <span className="t-upper">{bean.process}</span>
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>{(bean.origin || '').toUpperCase()}</span>
        </div>
        <DaysOffRoast iso={bean.roastedAt} />
      </div>
    </div>
  );
}

export function HomeScreen() {
  const { state } = useApp();
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [beans, setBeans] = useState<Bean[]>([]);

  useEffect(() => {
    Promise.all([db.getAllExtractions(), db.getAllBeans()])
      .then(([exts, bns]) => { setExtractions(exts); setBeans(bns); });
  }, []);

  const now = new Date();
  const thisMonth = extractions.filter(e => {
    const d = new Date(e.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const avgRating = thisMonth.length
    ? (thisMonth.reduce((a, e) => a + (e.rating || 0), 0) / thisMonth.length).toFixed(1)
    : null;
  const activeBeans = state.activeBeans;
  const recent = extractions.slice(0, 5);

  return (
    <div>
      <div className="page-head">
        <h1>{t('home.title')}</h1>
        <p>{t('home.subtitle')}</p>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="grid grid-3">
          <div className="stat">
            <div className="v">{extractions.length}</div>
            <div className="l">{t('home.stats.totalExtractions')}</div>
          </div>
          <div className="stat">
            <div className="v">
              {avgRating ?? '0'}
              {avgRating && <span style={{ fontSize: 14, color: 'var(--text-tertiary)', marginLeft: 6 }}>/ 5</span>}
            </div>
            <div className="l">{t('home.stats.avgThisMonth')}</div>
          </div>
          <div className="stat">
            <div className="v">{activeBeans.length}</div>
            <div className="l">{t('home.stats.activeBeans')}</div>
          </div>
        </div>
      </div>

      <div className="section-head">
        <h2>{t('home.recent')}</h2>
        <button className="sidebar-link" style={{ width: 'auto', padding: '4px 8px', color: 'var(--accent)' }} onClick={() => navigate('/history')}>
          {t('home.seeAll')} <Icon name="chevronRight" size={14} />
        </button>
      </div>
      <div className="col col-gap-12" style={{ marginBottom: 32 }}>
        {recent.length === 0
          ? <Empty icon="flask" title={t('home.noExtractions')} body={t('home.noExtractionsBody')} />
          : <StagList>{recent.map(e => <ExtractionRow key={e.id} extraction={e} beans={beans} onClick={() => navigate(`/history/${e.id}`)} />)}</StagList>
        }
      </div>

      <div className="section-head">
        <h2>{t('home.activeBeans')}</h2>
        <button className="sidebar-link" style={{ width: 'auto', padding: '4px 8px', color: 'var(--accent)' }} onClick={() => navigate('/beans')}>
          {t('home.allBeans')} <Icon name="chevronRight" size={14} />
        </button>
      </div>
      <div className="grid grid-2" style={{ marginBottom: 24 }}>
        {activeBeans.map(b => <BeanCard key={b.id} bean={b} onClick={() => navigate(`/beans/${b.id}`)} />)}
      </div>
    </div>
  );
}
