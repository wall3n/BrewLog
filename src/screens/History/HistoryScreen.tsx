import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { useDebounce } from '../../hooks/useDebounce';
import { Empty, Stars, Pagination, ListToolbar, MethodBadge, FlagMark } from '../../components/UI';
import { fmtRelDate, fmtTime, daysSince } from '../../utils/formatters';
import { methodById } from '../../utils/methodDefaults';
import { sampleNo } from '../../utils/shots';
import type { Extraction, Bean } from '../../db/types';
import s from './styles.module.css';

const SORTS = ['dateDesc', 'dateAsc', 'ratingDesc', 'ratingAsc', 'timeDesc', 'timeAsc', 'ratioDesc', 'ratioAsc'] as const;
type HistorySort = typeof SORTS[number];

interface DateBucket {
  key: string;
  label: string;
  items: Extraction[];
}

function HistoryRow({ extraction, beans, onClick }: { extraction: Extraction; beans: readonly Bean[]; onClick: () => void }) {
  const { t } = useTranslation();
  const bean = beans.find(b => b.id === extraction.beanId);

  return (
    <button type="button" className={`ledger-row ${s.histRow}`} onClick={onClick}>
      <span className={s.histNo}>{sampleNo(extraction.id)}</span>
      <span className="ledger-main">
        <span className={s.histMeta}>
          <MethodBadge method={extraction.method} />
          <span className={s.histDate}>{fmtRelDate(extraction.createdAt)}</span>
        </span>
        <span className="ledger-title">{bean?.name ?? t('extraction.unknownBean')}</span>
        <span className={s.histMetrics}>
          <span>{extraction.dose.toFixed(1)} → {extraction.yield.toFixed(1)} g</span>
          <span>1:{extraction.ratio.toFixed(1)}</span>
          <span>{fmtTime(extraction.timeS)}</span>
        </span>
      </span>
      <span className="ledger-aside">
        <FlagMark flag={extraction.flag} iconOnly size={16} />
        <Stars value={extraction.rating} size={9} />
      </span>
    </button>
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

  const [sort, setSort] = useState<HistorySort>('dateDesc');
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
      label: t('common.minScore', { n: ratingFilter }),
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
          label: t('common.minScore', { n: r })
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

      <ListToolbar
        query={inputQ}
        onQuery={handleQChange}
        placeholder={t('history.search')}
        activeFilters={activeFilters}
        categories={categories}
        sort={sort}
        onSort={v => { setSort(v); setPage(1); }}
        sortOptions={SORTS.map(k => [k, t(`history.sorts.${k}`)] as const)}
      />

      {extractions.length === 0
        ? (extractionsTotalCount === 0
          ? <Empty icon="history" title={t('home.noExtractions')} body={t('home.noExtractionsBody')} />
          : <Empty icon="filter" title={t('history.nothingMatches')} body={t('history.loosenFilters')} />)
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
