import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, Sheet, Field, Input, Tag, Empty } from '../../components/UI';
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

  const loadEquipment = () => db.getAllEquipment().then(setEquipment);
  useEffect(() => { loadEquipment(); }, []);

  const groups: Record<string, Equipment[]> = {};
  equipment.forEach(e => { (groups[e.type] = groups[e.type] || []).push(e); });

  return (
    <div>
      <div className={`row row-between ${s.pageRow}`}>
        <div className={`page-head ${s.pageHead}`}>
          <h1>{t('equipment.title')}</h1>
          <p>{t('equipment.items', { count: equipment.length })}</p>
        </div>
        <Button variant="ghost" leftIcon="plus" onClick={() => setAdding(true)}>{t('equipment.addGear')}</Button>
      </div>

      {equipment.length === 0
        ? <Empty icon="equipment" title={t('equipment.noEquipment')} body={t('equipment.noEquipmentBody')} />
        : (
          <div className="col col-gap-32">
            {Object.entries(groups).map(([type, items]) => (
              <div key={type}>
                <div className={`t-upper ${s.groupHeader}`}>{t(`equipment.types.${type}`, { defaultValue: type })}</div>
                <div className="col col-gap-8">
                  {items.map(item => (
                    <div key={item.id} className={`card card-tight ${s.itemCard}`}>
                      <div className="col col-gap-4">
                        <span className={s.itemName}>{item.name}</span>
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
              </div>
            ))}
          </div>
        )
      }

      <Sheet open={adding} onClose={() => setAdding(false)} title={t('equipment.addEquipment')}>
        <QuickAddEquipment onSave={async (payload) => { await db.addEquipment({ ...payload, usage: 0 }); await loadEquipment(); setAdding(false); }} />
      </Sheet>
    </div>
  );
}
