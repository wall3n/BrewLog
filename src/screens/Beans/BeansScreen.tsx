import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
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

  const [q, setQ] = useState('');
  const [roastFilter, setRoastFilter] = useState<'all'|'light'|'medium'|'dark'>('all');
  const [sort, setSort] = useState<'nameAsc'|'nameDesc'|'roastedDesc'|'roastedAsc'|'createdDesc'>('nameAsc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [showFilters, setShowFilters] = useState(false);

  const loadBeans = useCallback(() => db.getAllBeans().then(setBeans), [db]);
  useEffect(() => {
    loadBeans();
  }, [loadBeans]);

  const filtered = beans.filter(b => {
    if (b.status !== tab) return false;
    
    if (roastFilter !== 'all' && b.roast !== roastFilter) return false;
    
    if (q) {
      const query = q.toLowerCase();
      const matchName = b.name.toLowerCase().includes(query);
      const matchRoaster = b.roaster.toLowerCase().includes(query);
      const matchOrigin = (b.origin ?? '').toLowerCase().includes(query);
      const matchProcess = (b.process ?? '').toLowerCase().includes(query);
      const matchNotes = (b.notes ?? '').toLowerCase().includes(query);
      if (!matchName && !matchRoaster && !matchOrigin && !matchProcess && !matchNotes) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'nameAsc') return a.name.localeCompare(b.name);
    if (sort === 'nameDesc') return b.name.localeCompare(a.name);
    if (sort === 'roastedDesc') {
      const da = a.roastedAt ? new Date(a.roastedAt).getTime() : 0;
      const db = b.roastedAt ? new Date(b.roastedAt).getTime() : 0;
      return db - da;
    }
    if (sort === 'roastedAsc') {
      const da = a.roastedAt ? new Date(a.roastedAt).getTime() : 0;
      const db = b.roastedAt ? new Date(b.roastedAt).getTime() : 0;
      return da - db;
    }
    // createdDesc
    const ca = new Date(a.createdAt).getTime();
    const cb = new Date(b.createdAt).getTime();
    return cb - ca;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedBeans = sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);

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

  const activeFiltersCount = activeFilters.length;

  return (
    <div>
      <div className={`row row-between ${s.pageRow}`}>
        <div className="page-head">
          <h1>{t('beans.title')}</h1>
          <p>
            {t('beans.total', { count: beans.length })}
            {(q || roastFilter !== 'all') && ` · ${t('history.shown', { count: sorted.length })}`}
          </p>
        </div>
        <Button variant="ghost" leftIcon="plus" onClick={() => setAdding(true)}>{t('beans.add')}</Button>
      </div>
      <div className="tabs">
        {(['active', 'finished', 'wishlist'] as const).map(k => (
          <button key={k} className={tab === k ? 'active' : ''} onClick={() => handleTabChange(k)}>
            {t(`beans.tabs.${k}`)} <span className={`t-ter ${s.tabCount}`}>{beans.filter(b => b.status === k).length}</span>
          </button>
        ))}
      </div>

      <div className="row row-gap-8 mb-4">
        <div className="search-bar flex-1">
          <Icon name="search" size={16} className="t-ter" />
          <input 
            placeholder={t('beans.search')} 
            value={q} 
            onChange={e => { setQ(e.target.value); setPage(1); }} 
          />
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
        {paginatedBeans.length === 0
          ? <div className={s.gridEmpty}><Empty icon="bean" title={noBeansTitle} body={noBeansBody} /></div>
          : paginatedBeans.map(b => <BeanCard key={b.id} bean={b} onClick={() => navigate(`/beans/${b.id}`)} />)
        }
      </div>

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Sheet open={adding} onClose={() => setAdding(false)} title={t('beans.add')}>
        <QuickAddBean onSave={async (payload) => { await db.addBean(payload); await loadBeans(); setAdding(false); }} />
      </Sheet>
    </div>
  );
}

