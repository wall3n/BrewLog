import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, StagList, Empty, Stars, MethodBadge, Pagination, FilterBar } from '../../components/UI';
import { Icon } from '../../components/Icons';
import { fmtRelDate, fmtTime } from '../../utils/formatters';
import { methodById } from '../../utils/methodDefaults';
import type { Extraction, Bean } from '../../db/types';
import s from './styles.module.css';

export function ExtractionRow({ extraction, beans, onClick }: { extraction: Extraction; beans: readonly Bean[]; onClick: () => void }) {
  const { t } = useTranslation();
  const bean = beans.find(b => b.id === extraction.beanId);
  return (
    <div className={`card card-tight card-hover ${s.extractionCard}`} onClick={onClick}>
      <div className={`row row-between ${s.cardContent}`}>
        <div className={`col col-gap-8 ${s.cardLeft}`}>
          <div className="row row-gap-8">
            <span className="t-upper">{fmtRelDate(extraction.createdAt)}</span>
            <MethodBadge method={extraction.method} />
          </div>
          <div className={s.beanName}>
            {bean?.name ?? t('extraction.unknownBean')}
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

export function HistoryScreen() {
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [q, setQ] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [flagFilter, setFlagFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState(0);

  const [sort, setSort] = useState<'dateDesc'|'dateAsc'|'ratingDesc'|'ratingAsc'|'timeDesc'|'timeAsc'|'ratioDesc'|'ratioAsc'>('dateDesc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    Promise.all([db.getAllExtractions(), db.getAllBeans()])
      .then(([exts, bns]) => { setExtractions(exts); setBeans(bns); });
  }, [db]);

  const filtered = extractions.filter(e => {
    const bean = beans.find(b => b.id === e.beanId);
    const text = `${bean?.name ?? ''} ${bean?.roaster ?? ''} ${e.notes ?? ''} ${(e.flavours ?? []).join(' ')}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (methodFilter !== 'all' && e.method !== methodFilter) return false;
    if (flagFilter !== 'all' && e.flag !== flagFilter) return false;
    if (ratingFilter > 0 && (e.rating ?? 0) < ratingFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'dateDesc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === 'dateAsc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sort === 'ratingDesc') {
      return (b.rating ?? 0) - (a.rating ?? 0);
    }
    if (sort === 'ratingAsc') {
      return (a.rating ?? 0) - (b.rating ?? 0);
    }
    if (sort === 'timeDesc') {
      return (b.timeS ?? 0) - (a.timeS ?? 0);
    }
    if (sort === 'timeAsc') {
      return (a.timeS ?? 0) - (b.timeS ?? 0);
    }
    if (sort === 'ratioDesc') {
      return (b.ratio ?? 0) - (a.ratio ?? 0);
    }
    if (sort === 'ratioAsc') {
      return (a.ratio ?? 0) - (b.ratio ?? 0);
    }
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedExtractions = sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const methods = ['all', ...new Set(extractions.map(e => e.method))];

  const handleQChange = (val: string) => { setQ(val); setPage(1); };
  const handleMethodChange = (val: string) => { setMethodFilter(val); setPage(1); };
  const handleFlagChange = (val: string) => { setFlagFilter(val); setPage(1); };
  const handleRatingChange = (val: number) => { setRatingFilter(val); setPage(1); };

  const activeFilters = [];
  if (methodFilter !== 'all') {
    activeFilters.push({
      id: 'method',
      label: `${t('recipes.form.method')}: ${t(`methods.${methodFilter}`, { defaultValue: methodById(methodFilter)?.name })}`,
      onRemove: () => handleMethodChange('all')
    });
  }
  if (flagFilter !== 'all') {
    activeFilters.push({
      id: 'flag',
      label: `${t('extraction.steps.tasting.outcome')}: ${t(`history.flags.${flagFilter}`)}`,
      onRemove: () => handleFlagChange('all')
    });
  }
  if (ratingFilter > 0) {
    activeFilters.push({
      id: 'rating',
      label: `${t('extraction.fields.rating')}: ${ratingFilter}+ ★`,
      onRemove: () => handleRatingChange(0)
    });
  }

  const categories = [
    {
      id: 'method',
      label: t('recipes.form.method'),
      onSelect: (val: string | number) => handleMethodChange(String(val)),
      options: [
        { value: 'all', label: t('history.filters.allMethods') },
        ...methods.filter(m => m !== 'all').map(m => ({
          value: m,
          label: t(`methods.${m}`, { defaultValue: methodById(m)?.name || m })
        }))
      ]
    },
    {
      id: 'flag',
      label: t('extraction.steps.tasting.outcome'),
      onSelect: (val: string | number) => handleFlagChange(String(val)),
      options: [
        { value: 'all', label: t('history.filters.anyFlag') },
        ...['dialled','adjust','fail'].map(f => ({
          value: f,
          label: t(`history.flags.${f}`)
        }))
      ]
    },
    {
      id: 'rating',
      label: t('extraction.fields.rating'),
      onSelect: (val: string | number) => handleRatingChange(Number(val)),
      options: [
        { value: 0, label: t('history.filters.anyRating') },
        ...[3, 4, 5].map(r => ({
          value: r,
          label: `${r}+ ★`
        }))
      ]
    }
  ];

  const activeFiltersCount = activeFilters.length;

  return (
    <div>
      <div className="page-head">
        <h1>{t('history.title')}</h1>
        <p>{t('history.subtitle', { count: extractions.length })} · {t('history.shown', { count: filtered.length })}</p>
      </div>
      <div className="row row-gap-8 mb-4">
        <div className="search-bar flex-1">
          <Icon name="search" size={16} className="t-ter" />
          <input placeholder={t('history.search')} value={q} onChange={e => handleQChange(e.target.value)} />
        </div>
        <Button
          variant="ghost"
          leftIcon="filter"
          onClick={() => setShowFilters(!showFilters)}
        >
          {t('common.filters')}
          {activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
        </Button>
      </div>

      <div className="row row-between mb-4">
        {showFilters ? (
          <FilterBar activeFilters={activeFilters} categories={categories} />
        ) : (
          <div />
        )}
        <select
          className="input-underline"
          value={sort}
          onChange={e => { setSort(e.target.value as 'dateDesc'|'dateAsc'|'ratingDesc'|'ratingAsc'|'timeDesc'|'timeAsc'|'ratioDesc'|'ratioAsc'); setPage(1); }}
          style={{ width: 'auto', padding: '6px 4px', fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}
        >
          <option value="dateDesc">{t('history.sorts.dateDesc')}</option>
          <option value="dateAsc">{t('history.sorts.dateAsc')}</option>
          <option value="ratingDesc">{t('history.sorts.ratingDesc')}</option>
          <option value="ratingAsc">{t('history.sorts.ratingAsc')}</option>
          <option value="timeDesc">{t('history.sorts.timeDesc')}</option>
          <option value="timeAsc">{t('history.sorts.timeAsc')}</option>
          <option value="ratioDesc">{t('history.sorts.ratioDesc')}</option>
          <option value="ratioAsc">{t('history.sorts.ratioAsc')}</option>
        </select>
      </div>

      <div className="col col-gap-12">
        {paginatedExtractions.length === 0
          ? <Empty icon="history" title={t('history.nothingMatches')} body={t('history.loosenFilters')} />
          : <StagList>{paginatedExtractions.map(e => <ExtractionRow key={e.id} extraction={e} beans={beans} onClick={() => navigate(`/history/${e.id}`)} />)}</StagList>
        }
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

