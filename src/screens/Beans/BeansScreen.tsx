import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { useDebounce } from '../../hooks/useDebounce';
import { Button, Sheet, Empty, RoastDot, DaysOffRoast, Field, Input, Slider, Pagination, FilterBar } from '../../components/UI';
import { Icon } from '../../components/Icons';
import type { Bean } from '../../db/types';
import s from './styles.module.css';

function BeanCard({ bean, onClick }: { bean: Bean; onClick: () => void }) {
  return (
    <div className={`card card-hover ${s.beanCardPad}`} onClick={onClick}>
      <div className={`row row-between ${s.beanCardHeader}`}>
        <div className={`col col-gap-4 ${s.beanCardLeft}`}>
          <div className={s.beanName}>{bean.name}</div>
          <div className={`t-sec ${s.beanRoaster}`}>{bean.roaster}</div>
        </div>
        <RoastDot level={bean.roast} />
      </div>
      <div className={`row row-between ${s.beanCardBottom}`}>
        <div className="col col-gap-4">
          <span className="t-upper">{bean.process}</span>
          <span className={`t-ter ${s.beanOrigin}`}>{(bean.origin ?? '').toUpperCase()}</span>
        </div>
        <DaysOffRoast iso={bean.roastedAt} />
      </div>
    </div>
  );
}

export function QuickAddBean({ onSave }: { onSave: (p: Omit<Bean, 'id'|'createdAt'|'updatedAt'>) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [roaster, setRoaster] = useState('');
  const [process, setProcess] = useState('Washed');
  const [roast, setRoast] = useState<'light'|'medium'|'dark'>('light');
  const [days, setDays] = useState(7);

  return (
    <div className="col col-gap-16">
      <Field label={t('beans.fields.name')}><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Yirgacheffe Konga" /></Field>
      <Field label={t('beans.fields.roaster')}><Input value={roaster} onChange={e => setRoaster(e.target.value)} placeholder="e.g. Sample Roasters" /></Field>
      <div className="grid grid-2">
        <Field label={t('beans.fields.process')}>
          <select className="input-underline" value={process} onChange={e => setProcess(e.target.value)}>
            {['Washed','Natural','Honey','Anaerobic Natural','Other'].map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label={t('beans.fields.roastLevel')}>
          <div className="row row-gap-8">
            {(['light','medium','dark'] as const).map(r => (
              <button key={r} type="button" className={`tag ${roast === r ? 'active' : ''} ${s.roastBtn}`} onClick={() => setRoast(r)}>{t(`beans.roasts.${r}`)}</button>
            ))}
          </div>
        </Field>
      </div>
      <Field label={t('beans.fields.daysSinceRoast')}>
        <Slider value={days} min={0} max={60} step={1} onChange={setDays} displayValue={`${days}d`} />
      </Field>
      <Button full onClick={() => {
        const d = new Date(); d.setDate(d.getDate() - days);
        onSave({ name: name || t('beans.saveName'), roaster, process, roast, roastedAt: d.toISOString(), status: 'active' });
      }} disabled={!name}>{t('beans.saveBeanBtn')}</Button>
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
  const [sort, setSort] = useState<'nameAsc'|'nameDesc'|'roastedDesc'|'roastedAsc'|'createdDesc'>('nameAsc');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  const loadBeans = useCallback(() => {
    db.getBeansPage({
      status: tab,
      q,
      roastFilter,
      sort,
      page,
      limit: itemsPerPage
    }).then(({ items, total }) => {
      setBeans(items);
      setTotalCount(total);
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
      <div className={`row row-between ${s.pageRow}`}>
        <div className="page-head">
          <h1>{t('beans.title')}</h1>
          <p>
            {t('beans.total', { count: beansTotalCount })}
            {(q || roastFilter !== 'all') && ` · ${t('history.shown', { count: totalCount })}`}
          </p>
        </div>
        <Button variant="ghost" leftIcon="plus" onClick={() => setAdding(true)}>{t('beans.add')}</Button>
      </div>
      <div className="tabs">
        {(['active', 'finished', 'wishlist'] as const).map(k => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => handleTabChange(k)}>
            {t(`beans.tabs.${k}`)} <span className={`t-ter ${s.tabCount}`}>{tabCounts[k]}</span>
          </button>
        ))}
      </div>

      <div className="row row-gap-8 mb-4">
        <div className="search-bar flex-1">
          <Icon name="search" size={16} className="t-ter" />
          <input
            placeholder={t('beans.search')}
            value={inputQ}
            onChange={e => { setInputQ(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="row row-gap-8 mb-4" style={{ alignItems: 'center' }}>
        <FilterBar activeFilters={activeFilters} categories={categories} />
        <select
          className="input-underline"
          value={sort}
          onChange={e => { setSort(e.target.value as 'nameAsc'|'nameDesc'|'roastedDesc'|'roastedAsc'|'createdDesc'); setPage(1); }}
          style={{ width: 'auto', padding: '6px 4px', fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}
        >
          <option value="nameAsc">{t('beans.sorts.nameAsc')}</option>
          <option value="nameDesc">{t('beans.sorts.nameDesc')}</option>
          <option value="roastedDesc">{t('beans.sorts.roastedDesc')}</option>
          <option value="roastedAsc">{t('beans.sorts.roastedAsc')}</option>
          <option value="createdDesc">{t('beans.sorts.createdDesc')}</option>
        </select>
      </div>


      <div className="grid grid-2">
        {beans.length === 0
          ? <div className={s.gridEmpty}><Empty icon="bean" title={noBeansTitle} body={noBeansBody} /></div>
          : beans.map(b => <BeanCard key={b.id} bean={b} onClick={() => navigate(`/beans/${b.id}`)} />)
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

      <Sheet open={adding} onClose={() => setAdding(false)} title={t('beans.add')}>
        <QuickAddBean onSave={async (payload) => { await db.addBean(payload); await loadBeans(); setAdding(false); }} />
      </Sheet>
    </div>
  );
}

