import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { useDebounce } from '../../hooks/useDebounce';
import { Button, Sheet, Field, Input, Tag, Empty, Pagination, ListToolbar } from '../../components/UI';
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
      <Field label={t('equipment.fields.name')}><Input value={name} onChange={e => setName(e.target.value)} placeholder={t('equipment.placeholders.name')} /></Field>
      <Field label={t('equipment.fields.model')}><Input value={model} onChange={e => setModel(e.target.value)} placeholder={t('equipment.placeholders.model')} /></Field>
      <Button full size="lg" onClick={() => onSave({ type, name: name || t('equipment.unnamed'), model: model || undefined })} disabled={!name}>{t('equipment.save')}</Button>
    </div>
  );
}

const EQUIPMENT_SORTS = ['nameAsc', 'nameDesc', 'usesDesc', 'usesAsc', 'createdDesc'] as const;
type EquipmentSort = typeof EQUIPMENT_SORTS[number];

export function EquipmentScreen() {
  const db = useDb();
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [equipmentTotalCount, setEquipmentTotalCount] = useState(0);

  const [inputQ, setInputQ] = useState('');
  const q = useDebounce(inputQ, 500);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sort, setSort] = useState<EquipmentSort>('nameAsc');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  const loadEquipment = useCallback(() => {
    db.getEquipmentPage({
      typeFilter,
      q,
      sort,
      page,
      limit: itemsPerPage
    }).then(({ items, total }) => {
      setEquipment(items);
      setTotalCount(total);
    });

    db.getEquipmentTotalCount().then(setEquipmentTotalCount);
  }, [db, typeFilter, q, sort, page, itemsPerPage]);

  useEffect(() => {
    loadEquipment();
  }, [loadEquipment]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const activeFilters = [];
  if (typeFilter !== 'all') {
    activeFilters.push({
      id: 'type',
      label: `${t('equipment.fields.type')}: ${t(`equipment.types.${typeFilter}`, { defaultValue: typeFilter })}`,
      onRemove: () => { setTypeFilter('all'); setPage(1); }
    });
  }

  const categories = [
    {
      id: 'type',
      label: t('equipment.fields.type'),
      onSelect: (val: string | number) => { setTypeFilter(String(val)); setPage(1); },
      options: [
        { value: 'all', label: t('equipment.filters.typeAll') },
        ...['Grinder','Machine','Scale','Kettle','WDT','Brewer','Other'].map(type => ({
          value: type,
          label: t(`equipment.types.${type}`, { defaultValue: type })
        }))
      ]
    }
  ];

  return (
    <div>
      <div className="page-title-row">
        <div className="page-head">
          <h1>{t('equipment.title')}</h1>
          <p>
            {t('equipment.items', { count: equipmentTotalCount })}
            {(q || typeFilter !== 'all') && ` · ${t('history.shown', { count: totalCount })}`}
          </p>
        </div>
        <Button leftIcon="plus" onClick={() => setAdding(true)}>{t('equipment.addGear')}</Button>
      </div>

      <ListToolbar
        query={inputQ}
        onQuery={v => { setInputQ(v); setPage(1); }}
        placeholder={t('equipment.search')}
        activeFilters={activeFilters}
        categories={categories}
        sort={sort}
        onSort={v => { setSort(v); setPage(1); }}
        sortOptions={EQUIPMENT_SORTS.map(k => [k, t(`equipment.sorts.${k}`)] as const)}
      />

      {equipmentTotalCount === 0
        ? <Empty icon="equipment" title={t('equipment.noEquipment')} body={t('equipment.noEquipmentBody')} />
        : equipment.length === 0
        ? <Empty icon="filter" title={t('recipes.noMethodMatch')} body={t('history.loosenFilters')} />
        : (
          <div className="ledger">
            {equipment.map(item => (
              <div key={item.id} className={`list-row ${s.itemRow}`}>
                <div className="ledger-main">
                  <span className="t-upper">{t(`equipment.types.${item.type}`, { defaultValue: item.type })}</span>
                  <span className="ledger-title">{item.name}</span>
                  {(item.model || item.notes) && <span className="ledger-sub">{[item.model, item.notes].filter(Boolean).join(' · ')}</span>}
                </div>
                <span className={s.usageCount}>{t('equipment.uses', { count: item.usage ?? 0 })}</span>
                <button type="button" onClick={async () => {
                  if (confirm(t('equipment.confirmDelete', { name: item.name }))) {
                    await db.deleteEquipment(item.id!);
                    await loadEquipment();
                  }
                }} className="icon-btn" aria-label={t('common.delete')}>
                  <Icon name="trash" size={16} />
                </button>
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

      <Sheet open={adding} onClose={() => setAdding(false)} title={t('equipment.addEquipment')}>
        <QuickAddEquipment onSave={async (payload) => { await db.addEquipment({ ...payload, usage: 0 }); await loadEquipment(); setAdding(false); }} />
      </Sheet>
    </div>
  );
}
