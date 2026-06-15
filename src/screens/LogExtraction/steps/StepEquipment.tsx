import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../../hooks/useDb';
import { Button, Field, Input } from '../../../components/UI';
import { Icon } from '../../../components/Icons';
import type { WizardDraft } from '../index';
import type { Equipment } from '../../../db/types';
import css from './styles.module.css';

interface Props { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void; onNext: () => void; }

export function StepEquipment({ draft, update, onNext }: Props) {
  const db = useDb();
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  useEffect(() => { db.getAllEquipment().then(setEquipment); }, []);

  const groups: Record<string, Equipment[]> = {};
  equipment.forEach(e => { (groups[e.type] = groups[e.type] || []).push(e); });

  const toggle = (id: number) => {
    const next = draft.equipmentIds.includes(id)
      ? draft.equipmentIds.filter(x => x !== id)
      : [...draft.equipmentIds, id];
    update({ equipmentIds: next });
  };

  const hasGrinder = draft.equipmentIds.some(id => equipment.find(e => e.id === id)?.type === 'Grinder');

  return (
    <div>
      <div className={`step-meta ${css.stepMeta}`}>
        <div className="col col-gap-4">
          <h2 className={`h-display ${css.stepTitle}`}>{t('extraction.steps.equipment.title')}</h2>
          <span className={`t-sec ${css.stepSub}`}>{t('extraction.steps.equipment.subtitle')}</span>
        </div>
      </div>
      <div className={`col col-gap-24 ${css.eqListMb}`}>
        {Object.entries(groups).map(([type, items]) => (
          <div key={type}>
            <div className={`t-upper ${css.eqGroupHead}`}>{t(`equipment.types.${type}`, { defaultValue: type })}</div>
            <div className="col col-gap-8">
              {items.map(item => {
                const sel = draft.equipmentIds.includes(item.id!);
                return (
                  <button key={item.id} type="button" onClick={() => toggle(item.id!)}
                    className={`card card-tight ${css.eqItem} ${sel ? css.eqItemSel : ''}`}>
                    <div className="col col-gap-4">
                      <span className={css.eqItemName}>{item.name}</span>
                      {item.model && <span className={`t-sec ${css.eqItemModel}`}>{item.model}</span>}
                    </div>
                    {sel && <span className="t-acc"><Icon name="check" size={16} /></span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {hasGrinder && (
        <div className={css.eqSkipWrap}>
          <Field label={t('extraction.steps.equipment.grindSetting')} hint={t('extraction.steps.equipment.grindSettingHint')}>
            <Input value={draft.grindSetting} onChange={e => update({ grindSetting: e.target.value })} placeholder={t('extraction.steps.equipment.grindPlaceholder')} />
          </Field>
        </div>
      )}
      <Button full size="lg" onClick={onNext} rightIcon="arrowRight">{t('common.continue')}</Button>
    </div>
  );
}
