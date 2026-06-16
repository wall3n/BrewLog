import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { useDebounce } from '../../hooks/useDebounce';
import { StagList, Empty, Stars, MethodBadge, Pagination, FilterBar } from '../../components/UI';
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
        {extractions.length === 0
          ? <Empty icon="history" title={t('history.nothingMatches')} body={t('history.loosenFilters')} />
          : <StagList>{extractions.map(e => <ExtractionRow key={e.id} extraction={e} beans={beans} onClick={() => navigate(`/history/${e.id}`)} />)}</StagList>
        }
      </div>

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

