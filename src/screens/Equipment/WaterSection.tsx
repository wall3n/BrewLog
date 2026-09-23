import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, Sheet } from '../../components/UI';
import { Icon } from '../../components/Icons';
import type { Water } from '../../db/types';
import { WaterForm, type WaterPayload } from './WaterForm';
import s from './styles.module.css';

// null = sheet closed, 'new' = add, a Water = edit that water.
type Editing = null | 'new' | Water;

export function WaterSection() {
  const db = useDb();
  const { t } = useTranslation();
  const [waters, setWaters] = useState<Water[]>([]);
  const [usage, setUsage] = useState<Map<number, number>>(new Map());
  const [editing, setEditing] = useState<Editing>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(() => {
    Promise.all([db.getAllWaters(), db.getWaterUsage()])
      .then(([list, used]) => { setWaters(list); setUsage(used); setFailed(false); })
      .catch(() => setFailed(true));
  }, [db]);

  useEffect(() => { load(); }, [load]);

  async function save(payload: WaterPayload): Promise<void> {
    if (editing === 'new') await db.addWater(payload);
    else if (editing?.id != null) await db.updateWater({ ...editing, ...payload, id: editing.id });
    setEditing(null);
    load();
  }

  async function remove(water: Water): Promise<void> {
    if (water.id == null) return;
    const count = usage.get(water.id) ?? 0;
    const message = count > 0
      ? t('water.confirmDeleteUsed', { name: water.brand, count })
      : t('water.confirmDelete', { name: water.brand });
    if (!confirm(message)) return;
    try {
      await db.deleteWater(water.id);
      load();
    } catch {
      setFailed(true);
    }
  }

  return (
    <section className={s.waterSection} aria-labelledby="water-section-title">
      <div className="page-title-row">
        <div className="page-head">
          <h2 id="water-section-title" className={s.sectionTitle}>{t('water.title')}</h2>
          <p>{t('water.count', { count: waters.length })}</p>
        </div>
        <Button variant="ghost" leftIcon="plus" onClick={() => setEditing('new')}>{t('water.add')}</Button>
      </div>

      {failed && <p className={s.fieldError} role="alert">{t('water.errors.load')}</p>}

      {waters.length === 0
        ? <p className={s.emptyNote}>{t('water.empty')}</p>
        : (
          <div className="ledger">
            {waters.map(w => (
              <div key={w.id} className={`list-row ${s.itemRow}`}>
                <div className="ledger-main">
                  <span className="ledger-title">{w.brand}</span>
                  {(w.tdsPpm != null || w.notes) && (
                    <span className="ledger-sub">
                      {[w.tdsPpm != null ? t('water.ppm', { value: w.tdsPpm }) : null, w.notes].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </div>
                <span className={s.usageCount}>{t('water.recipeCount', { count: usage.get(w.id ?? -1) ?? 0 })}</span>
                <button type="button" className="icon-btn" onClick={() => setEditing(w)} aria-label={t('water.editNamed', { name: w.brand })}>
                  <Icon name="edit" size={16} />
                </button>
                <button type="button" className="icon-btn" onClick={() => remove(w)} aria-label={t('water.deleteNamed', { name: w.brand })}>
                  <Icon name="trash" size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? t('water.add') : t('water.edit')}>
        {editing !== null && (
          <WaterForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? undefined : editing}
            waters={waters}
            onSave={save}
          />
        )}
      </Sheet>
    </section>
  );
}
