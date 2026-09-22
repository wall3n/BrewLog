import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../../hooks/useDb';
import { Sheet, RoastDot, DaysOffRoast, Button } from '../../../components/UI';
import { Icon } from '../../../components/Icons';
import { QuickAddBean } from '../../Beans/BeansScreen';
import type { Bean } from '../../../db/types';
import s from '../styles.module.css';

interface BeanPickerProps {
  open: boolean;
  beans: readonly Bean[];
  selectedId: number | null;
  onClose: () => void;
  onPick: (id: number) => void;
  onAdded: (id: number) => Promise<void>;
}

export function BeanPicker({ open, beans, selectedId, onClose, onPick, onAdded }: BeanPickerProps) {
  const db = useDb();
  const { t } = useTranslation();
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);

  const ql = q.toLowerCase();
  const filtered = beans.filter(b => b.name.toLowerCase().includes(ql) || (b.roaster ?? '').toLowerCase().includes(ql));
  const active = filtered.filter(b => b.status === 'active');
  const finished = filtered.filter(b => b.status === 'finished');

  const close = () => { setAdding(false); setQ(''); onClose(); };

  const row = (b: Bean) => (
    <button
      type="button"
      key={b.id}
      className={`ledger-row ${s.pickRow}`}
      aria-pressed={selectedId === b.id}
      onClick={() => { setQ(''); onPick(b.id!); }}
    >
      <RoastDot level={b.roast} />
      <span className="ledger-main">
        <span className="ledger-title">{b.name}</span>
        <span className="ledger-sub">{[b.roaster, b.process].filter(Boolean).join(' · ')}</span>
      </span>
      <span className="ledger-aside">
        <DaysOffRoast iso={b.roastedAt} />
        {selectedId === b.id && <span className="t-acc"><Icon name="check" size={18} /></span>}
      </span>
    </button>
  );

  return (
    <Sheet open={open} onClose={close} title={adding ? t('beans.add') : t('sheet.chooseBean')}>
      {adding ? (
        <QuickAddBean onSave={async payload => {
          const created = await db.addBean(payload);
          setAdding(false);
          if (created.id) await onAdded(created.id);
        }} />
      ) : (
        <div className="col col-gap-16">
          <div className="search-bar">
            <Icon name="search" size={18} className="t-ter" />
            <input placeholder={t('extraction.steps.bean.search')} value={q} onChange={e => setQ(e.target.value)} aria-label={t('extraction.steps.bean.search')} />
          </div>
          {active.length > 0 && (
            <div>
              <div className="t-upper">{t('beans.tabs.active')}</div>
              <div className={s.pickList}>{active.map(row)}</div>
            </div>
          )}
          {finished.length > 0 && (
            <div>
              <div className="t-upper">{t('beans.tabs.finished')}</div>
              <div className={s.pickList}>{finished.map(row)}</div>
            </div>
          )}
          {filtered.length === 0 && <p className={s.pickEmpty}>{t('sheet.noBeansMatch')}</p>}
          <Button variant="ghost" full leftIcon="plus" onClick={() => setAdding(true)}>{t('extraction.steps.bean.quickAdd')}</Button>
        </div>
      )}
    </Sheet>
  );
}
