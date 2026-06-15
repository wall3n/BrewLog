import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, Sheet, Field, Input, Tag, Empty, Pagination } from '../../components/UI';
import { Icon } from '../../components/Icons';
import type { Equipment } from '../../db/types';
import s from './styles.module.css';

function QuickAddEquipment({ onSave }: { onSave: (p: { type: string; name: string; model?: string }) => void }) {
  const { t } = useTranslation();
  const TYPE_KEYS = ['Grinder','Machine','Scale','Kettle','WDT','Brewer','Other'] as const;
  const [type, setType] = useState('Grinder');
  const [name, setName] = useState('');
  const [model, setModel] = useState('');

  return (
    <div className="col col-gap-16">
      <Field label={t('equipment.fields.type')}>
        <div className="row row-wrap row-gap-8">
          {TYPE_KEYS.map(tk => (
            <Tag key={tk} active={type === tk} onClick={() => setType(tk)}>
              {t(`equipment.types.${tk}`, { defaultValue: tk })}
            </Tag>
          ))}
        </div>
      </Field>
      <Field label={t('equipment.fields.name')}><Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. DF64 Gen 2" /></Field>
      <Field label={t('equipment.fields.model')}><Input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. SSP MP burrs" /></Field>
      <Button full onClick={() => onSave({ type, name: name || 'Unnamed', model: model || undefined })} disabled={!name}>{t('equipment.save')}</Button>
    </div>
  );
}

export function EquipmentScreen() {
  const db = useDb();
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sort, setSort] = useState<'nameAsc'|'nameDesc'|'usesDesc'|'usesAsc'|'createdDesc'>('nameAsc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const loadEquipment = useCallback(() => db.getAllEquipment().then(setEquipment), [db]);
  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const filtered = equipment.filter(e => {
    if (typeFilter !== 'all' && e.type !== typeFilter) return false;
    
    if (q) {
      const query = q.toLowerCase();
      const matchName = e.name.toLowerCase().includes(query);
      const matchModel = (e.model ?? '').toLowerCase().includes(query);
      const matchNotes = (e.notes ?? '').toLowerCase().includes(query);
      if (!matchName && !matchModel && !matchNotes) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'nameAsc') return a.name.localeCompare(b.name);
    if (sort === 'nameDesc') return b.name.localeCompare(a.name);
    if (sort === 'usesDesc') return (b.usage ?? 0) - (a.usage ?? 0);
    if (sort === 'usesAsc') return (a.usage ?? 0) - (b.usage ?? 0);
    // default createdDesc
    const ca = new Date(a.createdAt).getTime();
    const cb = new Date(b.createdAt).getTime();
    return cb - ca;
  });

  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const paginatedEquipment = sorted.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div>
      <div className={`row row-between ${s.pageRow}`}>
        <div className={`page-head ${s.pageHead}`}>
          <h1>{t('equipment.title')}</h1>
          <p>
            {t('equipment.items', { count: equipment.length })}
            {(q || typeFilter !== 'all') && ` · ${t('history.shown', { count: sorted.length })}`}
          </p>
        </div>
        <Button variant="ghost" leftIcon="plus" onClick={() => setAdding(true)}>{t('equipment.addGear')}</Button>
      </div>

      <div className="search-bar mb-4">
        <Icon name="search" size={16} className="t-ter" />
        <input 
          placeholder={t('equipment.search')} 
          value={q} 
          onChange={e => { setQ(e.target.value); setPage(1); }} 
        />
      </div>

      <div className="filter-bar">
        <Tag active={typeFilter === 'all'} onClick={() => { setTypeFilter('all'); setPage(1); }}>
          {t('equipment.filters.typeAll')}
        </Tag>
        {['Grinder','Machine','Scale','Kettle','WDT','Brewer','Other'].map(type => (
          <Tag key={type} active={typeFilter === type} onClick={() => { setTypeFilter(type); setPage(1); }}>
            {t(`equipment.types.${type}`, { defaultValue: type })}
          </Tag>
        ))}
        <div style={{ flex: 1 }} />
        <select
          className="input-underline"
          value={sort}
          onChange={e => { setSort(e.target.value as 'nameAsc'|'nameDesc'|'usesDesc'|'usesAsc'|'createdDesc'); setPage(1); }}
          style={{ width: 'auto', padding: '6px 4px', fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}
        >
          <option value="nameAsc">{t('equipment.sorts.nameAsc')}</option>
          <option value="nameDesc">{t('equipment.sorts.nameDesc')}</option>
          <option value="usesDesc">{t('equipment.sorts.usesDesc')}</option>
          <option value="usesAsc">{t('equipment.sorts.usesAsc')}</option>
          <option value="createdDesc">{t('equipment.sorts.createdDesc')}</option>
        </select>
      </div>

      {equipment.length === 0
        ? <Empty icon="equipment" title={t('equipment.noEquipment')} body={t('equipment.noEquipmentBody')} />
        : paginatedEquipment.length === 0
        ? <Empty icon="filter" title={t('recipes.noMethodMatch')} body={t('history.loosenFilters')} />
        : (
          <div className="col col-gap-8">
            {paginatedEquipment.map(item => (
              <div key={item.id} className={`card card-tight ${s.itemCard}`}>
                <div className="col col-gap-4">
                  <div className="row row-gap-8">
                    <span className={s.itemName}>{item.name}</span>
                    <span className="method-badge">{t(`equipment.types.${item.type}`, { defaultValue: item.type })}</span>
                  </div>
                  {item.model && <span className={`t-sec ${s.itemModel}`}>{item.model}</span>}
                  {item.notes && <span className={`t-ter ${s.itemNotes}`}>{item.notes}</span>}
                </div>
                <div className="row row-gap-12">
                  <span className={`t-mono t-ter ${s.usageCount}`}>{t('equipment.uses', { count: item.usage ?? 0 })}</span>
                  <button type="button" onClick={async () => {
                    if (confirm(t('equipment.confirmDelete', { name: item.name }))) {
                      await db.deleteEquipment(item.id!);
                      await loadEquipment();
                    }
                  }} className={s.deleteBtn}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      }

      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

      <Sheet open={adding} onClose={() => setAdding(false)} title={t('equipment.addEquipment')}>
        <QuickAddEquipment onSave={async (payload) => { await db.addEquipment({ ...payload, usage: 0 }); await loadEquipment(); setAdding(false); }} />
      </Sheet>
    </div>
  );
}
