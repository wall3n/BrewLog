import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { fmtRelDate, fmtTime } from '../../utils/formatters';
import { Stars, MethodBadge, StagList, Empty, DaysOffRoast, RoastDot } from '../../components/UI';
import { Icon } from '../../components/Icons';
import type { Extraction, Bean } from '../../db/types';
import s from './styles.module.css';

function ExtractionRow({ extraction, beans, onClick }: { extraction: Extraction; beans: readonly Bean[]; onClick: () => void }) {
  const { t } = useTranslation();
  const bean = beans.find(b => b.id === extraction.beanId);
  return (
    <div className={`card card-tight card-hover ${s.extractionCard}`} onClick={onClick}>
      <div className={`row row-between ${s.cardContent}`}>
        <div className={`col col-gap-8 ${s.cardLeft}`}>
          <div className="row row-gap-8 flex-wrap gap-2">
            <span className="t-upper">{fmtRelDate(extraction.createdAt)}</span>
            <MethodBadge method={extraction.method} />
          </div>
          <div className={s.beanName}>
            {bean ? bean.name : t('extraction.unknownBean')}
          </div>
          <div className={`row row-gap-12 t-sec ${s.metaRow}`}>
            <span className="t-mono">{extraction.dose}g → {extraction.yield}g</span>
            <span className="t-ter">·</span>
            <span className="t-mono t-acc">1:{extraction.ratio.toFixed(1)}</span>
            <span className="t-ter">·</span>
            <span className="t-mono">{fmtTime(extraction.timeS)}</span>
          </div>
        </div>
        <div className={`col ${s.cardRight}`}>
          <Stars value={extraction.rating} size={14} />
          {extraction.flag === 'dialled' && <span className={`${s.flagLabel} ${s.flagDialled}`}>✓ {t('history.flags.dialled')}</span>}
          {extraction.flag === 'adjust'  && <span className={`${s.flagLabel} ${s.flagAdjust}`}>! {t('history.flags.adjust')}</span>}
          {extraction.flag === 'fail'    && <span className={`${s.flagLabel} ${s.flagFail}`}>✗ {t('history.flags.fail')}</span>}
        </div>
      </div>
    </div>
  );
}

function BeanCard({ bean, onClick }: { bean: Bean; onClick: () => void }) {
  return (
    <div className="card card-hover" onClick={onClick}>
      <div className={`row row-between ${s.beanCardContent}`}>
        <div className={`col col-gap-4 ${s.beanCardLeft}`}>
          <div className={s.beanCardName}>{bean.name}</div>
          <div className={`t-sec ${s.beanCardRoaster}`}>{bean.roaster}</div>
        </div>
        <RoastDot level={bean.roast} />
      </div>
      <div className={`row row-between ${s.beanCardBottom}`}>
        <div className="col col-gap-4">
          <span className="t-upper">{bean.process}</span>
          <span className={`t-ter ${s.beanCardOrigin}`}>{(bean.origin || '').toUpperCase()}</span>
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

      <div className="card mb-6">
        <div className="grid grid-3">
          <div className="stat">
            <div className="v">{extractions.length}</div>
            <div className="l">{t('home.stats.totalExtractions')}</div>
          </div>
          <div className="stat">
            <div className="v">
              {avgRating ?? '0'}
              {avgRating && <span className={`t-ter ${s.statSuffix}`}>/ 5</span>}
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
        <button className={`sidebar-link t-acc ${s.seeAllBtn}`} onClick={() => navigate('/history')}>
          {t('home.seeAll')} <Icon name="chevronRight" size={14} />
        </button>
      </div>
      <div className="col col-gap-12 mb-8">
        {recent.length === 0
          ? <Empty icon="flask" title={t('home.noExtractions')} body={t('home.noExtractionsBody')} />
          : <StagList>{recent.map(e => <ExtractionRow key={e.id} extraction={e} beans={beans} onClick={() => navigate(`/history/${e.id}`)} />)}</StagList>
        }
      </div>

      <div className="section-head">
        <h2>{t('home.activeBeans')}</h2>
        <button className={`sidebar-link t-acc ${s.seeAllBtn}`} onClick={() => navigate('/beans')}>
          {t('home.allBeans')} <Icon name="chevronRight" size={14} />
        </button>
      </div>
      <div className="grid grid-2 mb-6">
        {activeBeans.map(b => <BeanCard key={b.id} bean={b} onClick={() => navigate(`/beans/${b.id}`)} />)}
      </div>
    </div>
  );
}
