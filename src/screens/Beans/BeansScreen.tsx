import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { useDebounce } from '../../hooks/useDebounce';
import { Button, Sheet, Empty, RoastDot, Field, Input, RoastDateField, Pagination, ListToolbar, StockMeter, FreshnessBadge } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { beanStockView, type BeanUsage } from '../../utils/beanStock';
import { daysOffRoast, fromDateInputValue } from '../../utils/roastDate';
import type { Bean } from '../../db/types';
import s from './styles.module.css';

const BEAN_SORTS = ['nameAsc', 'nameDesc', 'roastedDesc', 'roastedAsc', 'createdDesc'] as const;
type BeanSort = typeof BEAN_SORTS[number];

interface BeanRowProps {
  bean: Bean;
  usage: BeanUsage | undefined;
  fallbackMethod: string;
  onClick: () => void;
}

function BeanRow({ bean, usage, fallbackMethod, onClick }: BeanRowProps) {
  const stock = beanStockView(bean, usage, fallbackMethod, new Date());
  return (
    <button type="button" className="ledger-row" onClick={onClick}>
      <RoastDot level={bean.roast} />
      <span className="ledger-main">
        <span className="ledger-title">{bean.name}</span>
        <span className="ledger-sub">{[bean.roaster, bean.origin, bean.process].filter(Boolean).join(' · ')}</span>
      </span>
      <span className="ledger-aside">
        <FreshnessBadge freshness={stock.freshness} />
        {bean.weightG != null && (
          <StockMeter weightG={bean.weightG} initialWeightG={bean.initialWeightG} servings={stock.servings} isLow={stock.isLow} compact />
        )}
      </span>
    </button>
  );
}

export function QuickAddBean({ onSave }: { onSave: (p: Omit<Bean, 'id'|'createdAt'|'updatedAt'>) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [roaster, setRoaster] = useState('');
  const [process, setProcess] = useState('Washed');
  const [roast, setRoast] = useState<'light'|'medium'|'dark'>('light');
  const [roastedAt, setRoastedAt] = useState('');
  const roastFuture = (daysOffRoast(roastedAt, new Date()) ?? 0) < 0;

  return (
    <div className="col col-gap-16">
      <Field label={t('beans.fields.name')}><Input value={name} onChange={e => setName(e.target.value)} placeholder={t('beans.placeholders.name')} /></Field>
      <Field label={t('beans.fields.roaster')}><Input value={roaster} onChange={e => setRoaster(e.target.value)} placeholder={t('beans.placeholders.roaster')} /></Field>
      <div className={s.formGrid}>
        <Field label={t('beans.fields.process')}>
          <select className="input-underline" value={process} onChange={e => setProcess(e.target.value)}>
            {[
              { value: 'Washed', key: 'washed' },
              { value: 'Natural', key: 'natural' },
              { value: 'Honey', key: 'honey' },
              { value: 'Anaerobic Natural', key: 'anaerobic' },
              { value: 'Other', key: 'other' },
            ].map(p => <option key={p.value} value={p.value}>{t(`beans.processes.${p.key}`)}</option>)}
          </select>
        </Field>
        <Field label={t('beans.fields.roastLevel')}>
          <div className={s.roastRow} role="radiogroup" aria-label={t('beans.fields.roastLevel')}>
            {(['light','medium','dark'] as const).map(r => (
              <button key={r} type="button" role="radio" aria-checked={roast === r} className={`tag ${roast === r ? 'active' : ''} ${s.roastBtn}`} onClick={() => setRoast(r)}>
                <RoastDot level={r} />{t(`beans.roasts.${r}`)}
              </button>
            ))}
          </div>
        </Field>
      </div>
      <RoastDateField value={roastedAt} onChange={setRoastedAt} />
      <Button full size="lg" onClick={() => {
        onSave({ name: name || t('beans.saveName'), roaster, process, roast, roastedAt: fromDateInputValue(roastedAt), status: 'active' });
      }} disabled={!name || roastFuture}>{t('beans.saveBeanBtn')}</Button>
    </div>
  );
}

export function BeansScreen() {
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [tab, setTab] = useState<'active'|'finished'|'wishlist'>('active');
  const [adding, setAdding] = useState(false);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [beansTotalCount, setBeansTotalCount] = useState(0);
  const [tabCounts, setTabCounts] = useState<{ active: number; finished: number; wishlist: number }>({ active: 0, finished: 0, wishlist: 0 });

  const [inputQ, setInputQ] = useState('');
  const q = useDebounce(inputQ, 500);
  const [roastFilter, setRoastFilter] = useState<'all'|'light'|'medium'|'dark'>('all');
  const [sort, setSort] = useState<BeanSort>('nameAsc');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { state } = useApp();
  const [usage, setUsage] = useState<Map<number, BeanUsage>>(new Map());


  const loadBeans = useCallback(() => {
    db.getBeansPage({
      status: tab,
      q,
      roastFilter,
      sort,
      page,
      limit: itemsPerPage
    }).then(async ({ items, total }) => {
      // Load usage first so the rows never render with the fallback dose.
      const pageUsage = await db.getBeanUsage(items.map(b => b.id!));
      setBeans(items);
      setTotalCount(total);
      setUsage(pageUsage);
    });

    Promise.all([
      db.getBeansCountByStatus('active'),
      db.getBeansCountByStatus('finished'),
      db.getBeansCountByStatus('wishlist'),
      db.getBeansTotalCount()
    ]).then(([active, finished, wishlist, totalAll]) => {
      setTabCounts({ active, finished, wishlist });
      setBeansTotalCount(totalAll);
    });
  }, [db, tab, q, roastFilter, sort, page, itemsPerPage]);

  useEffect(() => {
    loadBeans();
  }, [loadBeans]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const noBeansTitle = tab === 'active' ? t('beans.noActive') : tab === 'finished' ? t('beans.noFinished') : t('beans.noWishlist');
  const noBeansBody = tab === 'wishlist' ? t('beans.noWishlistBody') : t('beans.noBeansBody');

  const handleTabChange = (newTab: 'active'|'finished'|'wishlist') => {
    setTab(newTab);
    setPage(1);
  };

  const activeFilters = [];
  if (roastFilter !== 'all') {
    activeFilters.push({
      id: 'roast',
      label: `${t('beans.fields.roastLevel')}: ${t(`beans.roasts.${roastFilter}`)}`,
      onRemove: () => { setRoastFilter('all'); setPage(1); }
    });
  }

  const categories = [
    {
      id: 'roast',
      label: t('beans.fields.roastLevel'),
      onSelect: (val: string | number) => { setRoastFilter(val as 'all'|'light'|'medium'|'dark'); setPage(1); },
      options: [
        { value: 'all', label: t('beans.filters.roastAll') },
        { value: 'light', label: t('beans.roasts.light') },
        { value: 'medium', label: t('beans.roasts.medium') },
        { value: 'dark', label: t('beans.roasts.dark') }
      ]
    }
  ];


  return (
    <div>
      <div className="page-title-row">
        <div className="page-head">
          <h1>{t('beans.title')}</h1>
          <p>
            {t('beans.total', { count: beansTotalCount })}
            {(q || roastFilter !== 'all') && ` · ${t('history.shown', { count: totalCount })}`}
          </p>
        </div>
        <Button leftIcon="plus" onClick={() => setAdding(true)}>{t('beans.add')}</Button>
      </div>
      <div className="tabs">
        {(['active', 'finished', 'wishlist'] as const).map(k => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => handleTabChange(k)}>
            {t(`beans.tabs.${k}`)} <span className={s.tabCount}>{tabCounts[k]}</span>
          </button>
        ))}
      </div>

      <ListToolbar
        query={inputQ}
        onQuery={v => { setInputQ(v); setPage(1); }}
        placeholder={t('beans.search')}
        activeFilters={activeFilters}
        categories={categories}
        sort={sort}
        onSort={v => { setSort(v); setPage(1); }}
        sortOptions={BEAN_SORTS.map(k => [k, t(`beans.sorts.${k}`)] as const)}
      />

      {beans.length === 0
        ? <Empty icon="bean" title={noBeansTitle} body={noBeansBody} />
        : (
          <div className="ledger">
            {beans.map(b => <BeanRow key={b.id} bean={b} usage={usage.get(b.id!)} fallbackMethod={state.settings.defaultMethod} onClick={() => navigate(`/beans/${b.id}`)} />)}
          </div>
        )}

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

      <Sheet open={adding} onClose={() => setAdding(false)} title={t('beans.add')}>
        <QuickAddBean onSave={async (payload) => { await db.addBean(payload); await loadBeans(); setAdding(false); }} />
      </Sheet>
    </div>
  );
}

