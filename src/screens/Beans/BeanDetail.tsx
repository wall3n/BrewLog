import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, BackBar, RoastDot, Empty, Sheet } from '../../components/UI';
import { daysSince, fmtRelDate, fmtTime } from '../../utils/formatters';
import type { Bean, Extraction } from '../../db/types';
import { BeanForm } from './BeanForm';
import s from './styles.module.css';


function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="row row-between">
      <span className="t-upper">{label}</span>
      <span className={`t-mono ${s.detailValue}`}>{value}</span>
    </div>
  );
}

export function BeanDetail() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [bean, setBean] = useState<Bean | null>(null);
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    async function load() {
      const b = await db.getBean(Number(id));
      if (!b) { setNotFound(true); return; }
      setBean(b);
      const allExts = await db.getAllExtractions();
      setExtractions(allExts.filter(e => e.beanId === b.id));
    }
    load();
  }, [id]);

  if (notFound) return <div><BackBar onClick={() => navigate('/beans')} label={t('beans.backToBeans')} /><Empty icon="bean" title={t('beans.notFound')} /></div>;
  if (!bean) return null;

  const avgRating = extractions.length
    ? (extractions.reduce((a, e) => a + (e.rating ?? 0), 0) / extractions.length).toFixed(1)
    : null;

  return (
    <div>
      <BackBar onClick={() => navigate('/beans')} label={t('beans.backToBeans')} />
      <div className="page-head mb-5">
        <div className="row row-gap-12 mb-[6px]">
          <RoastDot level={bean.roast} />
          <span className="t-upper">{bean.process} · {t(`beans.roasts.${bean.roast}`, { defaultValue: bean.roast })}</span>
        </div>
        <h1>{bean.name}</h1>
        <p>{bean.roaster}</p>
      </div>

      <div className={`card ${s.cardMb}`}>
        <div className="grid grid-3">
          <div className="stat"><div className="v t-mono">{extractions.length}</div><div className="l">{t('beans.stats.extractions')}</div></div>
          <div className="stat">
            <div className="v t-mono">
              {avgRating ?? '0'}
              {avgRating && <span className={`t-ter ${s.statSuffix}`}>/5</span>}
            </div>
            <div className="l">{t('beans.stats.avgRating')}</div>
          </div>
          <div className="stat">
            <div className={`v t-mono ${s.statFlex}`}>
              {daysSince(bean.roastedAt) ?? '—'}<span className={`t-ter ${s.statSuffix}`}>d</span>
            </div>
            <div className="l">{t('beans.stats.offRoast')}</div>
          </div>
        </div>
        <div className="divider" />
        <div className="col col-gap-12">
          <DetailRow label={t('beans.fields.origin')} value={bean.origin ?? '—'} />
          <DetailRow label={t('beans.fields.process')} value={bean.process ?? '—'} />
          <DetailRow label={t('beans.fields.weight')} value={bean.weightG != null ? `${bean.weightG} g` : '—'} />
          <DetailRow label={t('beans.fields.status')} value={t(`beans.tabs.${bean.status ?? 'active'}`).toUpperCase()} />
        </div>
        {bean.notes && (
          <>
            <div className="divider" />
            <div className={s.noteText}>"{bean.notes}"</div>
          </>
        )}
      </div>

      {extractions.length > 0 && (
        <div className={`card ${s.cardMb}`}>
          <div className="t-upper mb-4">{t('beans.diallingTable')}</div>
          <div className={s.diallingTable}>
            <div className={`row ${s.diallingHead}`}>
              <div className={`t-upper ${s.diallingHeadCell}`}>{t('beans.diallingHeaders.date')}</div>
              {(['grind','ratio','time','rating'] as const).map(h => (
                <div key={h} className={`t-upper ${s.diallingCell}`}>{t(`beans.diallingHeaders.${h}`)}</div>
              ))}
            </div>
            {extractions.map(e => (
              <button key={e.id} onClick={() => navigate(`/history/${e.id}`)} className={s.diallingRow}>
                <div className={`t-mono t-sec ${s.diallingDate}`}>{fmtRelDate(e.createdAt)}</div>
                <div className={`t-mono ${s.diallingCell}`}>{e.grindSetting ?? '—'}</div>
                <div className={`t-mono t-acc ${s.diallingCell}`}>1:{e.ratio.toFixed(1)}</div>
                <div className={`t-mono ${s.diallingCell}`}>{fmtTime(e.timeS)}</div>
                <div className={`t-mono ${s.diallingCell}`}><span className={s.starFilled}>{'★'.repeat(e.rating)}</span><span className={s.starEmpty}>{'·'.repeat(5 - e.rating)}</span></div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={s.actionRow}>
        <Button variant="ghost" full leftIcon="edit" onClick={() => setEditing(true)}>{t('common.edit')}</Button>
        <Button variant="danger" leftIcon="trash" onClick={async () => {
          if (confirm(t('beans.confirmDelete'))) { await db.deleteBean(bean.id!); navigate('/beans'); }
        }}>{t('beans.delete')}</Button>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title={t('common.edit')}>
        <BeanForm
          initial={bean}
          onSave={async (payload) => {
            await db.updateBean({ ...bean, ...payload });
            setBean({ ...bean, ...payload });
            setEditing(false);
          }}
        />
      </Sheet>
    </div>
  );
}
