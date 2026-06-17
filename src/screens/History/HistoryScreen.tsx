import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { useDebounce } from '../../hooks/useDebounce';
import { Empty, Stars, Pagination, FilterBar } from '../../components/UI';
import { Icon } from '../../components/Icons';
import { fmtRelDate, fmtTime, daysSince } from '../../utils/formatters';
import { methodById } from '../../utils/methodDefaults';
import type { Extraction, Bean } from '../../db/types';
import s from './styles.module.css';

interface DateBucket {
  key: string;
  label: string;
  items: Extraction[];
}

function HistoryRow({ extraction, beans, onClick }: { extraction: Extraction; beans: readonly Bean[]; onClick: () => void }) {
  const { t } = useTranslation();
  const bean = beans.find(b => b.id === extraction.beanId);
  const method = methodById(extraction.method);
  const flagClass = extraction.flag === 'dialled' ? s.flagDialled
    : extraction.flag === 'adjust' ? s.flagAdjust
    : extraction.flag === 'fail' ? s.flagFail
    : '';

  return (
    <div
      className={`${s.histRow} ${flagClass}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onClick(); } }}
    >
      <div className={s.histDate}>
        <span className={s.dateRel}>{fmtRelDate(extraction.createdAt)}</span>
        <span className={s.dateMethod}>{method?.name ?? extraction.method}</span>
      </div>
      <div className={s.histMain}>
        <div className={s.histBean}>{bean?.name ?? t('extraction.unknownBean')}</div>
        <div className={s.histMetrics}>
          <span>{extraction.dose}g → {extraction.yield}g</span>
          <span className={s.metricSep}>·</span>
          <span style={{ color: 'var(--accent)' }}>1:{extraction.ratio.toFixed(1)}</span>
          <span className={s.metricSep}>·</span>
          <span>{fmtTime(extraction.timeS)}</span>
        </div>
      </div>
      <div className={s.histAside}>
        <Stars value={extraction.rating} size={14} />
        {extraction.flag === 'dialled' && <span className={`${s.histFlagTag} ${s.histFlagDialled}`}>✓ {t('history.flags.dialled')}</span>}
        {extraction.flag === 'adjust'  && <span className={`${s.histFlagTag} ${s.histFlagAdjust}`}>! {t('history.flags.adjust')}</span>}
        {extraction.flag === 'fail'    && <span className={`${s.histFlagTag} ${s.histFlagFail}`}>✗ {t('history.flags.fail')}</span>}
      </div>
    </div>
  );
}

function groupByDate(extractions: Extraction[], t: (key: string) => string): DateBucket[] {
  const buckets: DateBucket[] = [
    { key: 'week', label: t('history.groups.thisWeek'), items: [] },
    { key: 'last', label: t('history.groups.lastWeek'), items: [] },
    { key: 'older', label: t('history.groups.earlier'), items: [] },
  ];
  for (const e of extractions) {
    const d = daysSince(e.createdAt);
    if (d !== null && d < 7) buckets[0].items.push(e);
    else if (d !== null && d < 14) buckets[1].items.push(e);
    else buckets[2].items.push(e);
  }
  return buckets.filter(b => b.items.length > 0);
}

export function HistoryScreen() {
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [inputQ, setInputQ] = useState('');
  const q = useDebounce(inputQ, 500);
  const [methodFilter, setMethodFilter] = useState('all');
  const [flagFilter, setFlagFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState(0);

  const [sort, setSort] = useState<'dateDesc'|'dateAsc'|'ratingDesc'|'ratingAsc'|'timeDesc'|'timeAsc'|'ratioDesc'|'ratioAsc'>('dateDesc');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [totalCount, setTotalCount] = useState(0);
  const [extractionsTotalCount, setExtractionsTotalCount] = useState(0);
  const [methods, setMethods] = useState<string[]>([]);

  useEffect(() => {
    db.getAllBeans().then(setBeans);
  }, [db]);

  const loadExtractions = useCallback(() => {
    db.getExtractionsPage({
      q,
      methodFilter,
      flagFilter,
      ratingFilter,
      sort,
      page,
      limit: itemsPerPage
    }).then(({ items, total }) => {
      setExtractions(items);
      setTotalCount(total);
    });

    db.getExtractionsTotalCount().then(setExtractionsTotalCount);
    db.getExtractionMethods().then(setMethods);
  }, [db, q, methodFilter, flagFilter, ratingFilter, sort, page, itemsPerPage]);

  useEffect(() => {
    loadExtractions();
  }, [loadExtractions]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleQChange = (val: string) => { setInputQ(val); setPage(1); };
  const handleMethodChange = (val: string) => { setMethodFilter(val); setPage(1); };
  const handleFlagChange = (val: string) => { setFlagFilter(val); setPage(1); };
  const handleRatingChange = (val: number) => { setRatingFilter(val); setPage(1); };

  const groups = useMemo(() => groupByDate(extractions, t), [extractions, t]);

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

  return (
    <div>
      <div className="page-head">
        <h1>{t('history.title')}</h1>
        <p>{t('history.subtitle', { count: extractionsTotalCount })} · {t('history.shown', { count: totalCount })}</p>
      </div>

      <div className="row row-gap-8 mb-4">
        <div className="search-bar flex-1">
          <Icon name="search" size={16} className="t-ter" />
          <input placeholder={t('history.search')} value={inputQ} onChange={e => handleQChange(e.target.value)} />
        </div>
      </div>

      <div className="row row-gap-8 mb-4" style={{ alignItems: 'center' }}>
        <FilterBar activeFilters={activeFilters} categories={categories} />
        <select
          className="input-underline"
          value={sort}
          onChange={e => { setSort(e.target.value as typeof sort); setPage(1); }}
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

      {extractions.length === 0
        ? <Empty icon="history" title={t('history.nothingMatches')} body={t('history.loosenFilters')} />
        : (
          <div className={s.histGroups}>
            {groups.map(g => (
              <div key={g.key} className={s.histGroup}>
                <div className={s.histGroupHead}>
                  <span className={s.groupLabel}>{g.label}</span>
                  <span className={s.groupCount}>
                    {t('history.groups.count', { count: g.items.length })}
                  </span>
                </div>
                {g.items.map(e => (
                  <HistoryRow key={e.id} extraction={e} beans={beans} onClick={() => navigate(`/history/${e.id}`)} />
                ))}
              </div>
            ))}
          </div>
        )
      }

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(limit) => {
          setItemsPerPage(limit);
          setPage(1);
        }}
      />
    </div>
  );
}
