import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, BackBar, RoastDot, Empty, Sheet, Stars, FlagMark, StockMeter, FreshnessBadge } from '../../components/UI';
import { useApp } from '../../context/AppContext';
import { beanStockView, summariseUsage } from '../../utils/beanStock';
import { daysSince, fmtDate, fmtRelDate, fmtTime } from '../../utils/formatters';
import type { Bean, Extraction } from '../../db/types';
import { BeanForm } from './BeanForm';
import s from './styles.module.css';


function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="spec-row">
      <span className="t-upper">{label}</span>
      <span className="v">{value}</span>
    </div>
  );
}

export function BeanDetail() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state } = useApp();

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

  const days = daysSince(bean.roastedAt);
  const stock = beanStockView(bean, summariseUsage(extractions).get(bean.id!), state.settings.defaultMethod, new Date());
  const markFinished = async (): Promise<void> => {
    await db.updateBean({ ...bean, status: 'finished' });
    setBean({ ...bean, status: 'finished' });
  };

  return (
    <div>
      <BackBar onClick={() => navigate('/beans')} label={t('beans.backToBeans')} />
      <header className={s.detailHead}>
        <h1 className={s.detailTitle}>{bean.name}</h1>
        <p className={s.detailSub}>{bean.roaster}</p>
        <dl className={`field-row ${s.fieldRow}`}>
          <div><dt>{t('beans.fields.roastLevel')}</dt><dd className={s.roastValue}><RoastDot level={bean.roast} />{t(`beans.roasts.${bean.roast}`, { defaultValue: bean.roast })}</dd></div>
          {stock.freshness.state !== 'unknown' && (
            <div><dt>{t('beans.freshness.label')}</dt><dd><FreshnessBadge freshness={stock.freshness} /></dd></div>
          )}
        </dl>
      </header>

      {stock.isEmpty && bean.status === 'active' && (
        <div className={s.emptyBanner} role="status">
          <span className={s.emptyText}>{t('beans.stock.empty')}</span>
          <Button variant="ghost" onClick={markFinished}>{t('beans.stock.markFinished')}</Button>
        </div>
      )}

      <div className={`readout-grid grid-paper ${s.readout}`}>
        <div className="stat"><div className="v">{days ?? '—'}{days != null && <span className="u">{t('beans.daysUnit')}</span>}</div><div className="l">{t('beans.stats.offRoast')}</div></div>
        <div className={`stat ${s.computed}`}><div className="v">{extractions.length}</div><div className="l">{t('beans.stats.extractions')}</div></div>
        <div className={`stat ${s.computed}`}><div className="v">{avgRating ?? '—'}{avgRating && <span className="u">/5</span>}</div><div className="l">{t('beans.stats.avgRating')}</div></div>
      </div>

      {bean.weightG != null && (
        <section className={s.block}>
          <div className="section-label"><span className="t-upper">{t('beans.stock.label')}</span></div>
          <StockMeter weightG={bean.weightG} initialWeightG={bean.initialWeightG} servings={stock.servings} isLow={stock.isLow && !stock.isEmpty} />
        </section>
      )}

      <section className={s.block}>
        <div className="section-label"><span className="t-upper">{t('beans.specSheet')}</span></div>
        <DetailRow label={t('beans.fields.origin')} value={bean.origin ?? '—'} />
        <DetailRow label={t('beans.fields.process')} value={bean.process ?? '—'} />
        <DetailRow label={t('beans.fields.roastedAt')} value={bean.roastedAt ? fmtDate(bean.roastedAt) : '—'} />
        {/* With a weight, the stock block above already shows it. */}
        {bean.weightG == null && <DetailRow label={t('beans.fields.weight')} value="—" />}
        <DetailRow label={t('beans.fields.status')} value={t(`beans.tabs.${bean.status ?? 'active'}`)} />
        {bean.notes && <p className={s.noteText}>{bean.notes}</p>}
      </section>

      {extractions.length > 0 && (
        <section className={s.block}>
          <div className="section-label">
            <span className="t-upper">{t('beans.diallingTable')}</span>
            <span className={s.blockNote}>{t('history.groups.count', { count: extractions.length })}</span>
          </div>
          <div className={s.tableWrap}>
            <table className={s.dialTable}>
              <thead>
                <tr>
                  <th scope="col">{t('beans.diallingHeaders.date')}</th>
                  <th scope="col">{t('beans.diallingHeaders.grind')}</th>
                  <th scope="col" className={s.num}>{t('beans.diallingHeaders.ratio')}</th>
                  <th scope="col" className={s.num}>{t('beans.diallingHeaders.time')}</th>
                  <th scope="col" className={s.num}>{t('beans.diallingHeaders.rating')}</th>
                </tr>
              </thead>
              <tbody>
                {extractions.map(e => (
                  <tr key={e.id} tabIndex={0} onClick={() => navigate(`/history/${e.id}`)}
                    onKeyDown={ev => { if (ev.key === 'Enter') navigate(`/history/${e.id}`); }}>
                    <td className={s.dateCell}><FlagMark flag={e.flag} iconOnly size={14} /> {fmtRelDate(e.createdAt)}</td>
                    <td className="t-ink">{e.grindSetting || '—'}</td>
                    <td className={`t-ink ${s.num}`}>1:{e.ratio.toFixed(1)}</td>
                    <td className={`t-ink ${s.num}`}>{fmtTime(e.timeS)}</td>
                    <td className={s.num}><Stars value={e.rating} size={8} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className={s.actionRow}>
        <Button variant="ghost" full leftIcon="edit" onClick={() => setEditing(true)}>{t('common.edit')}</Button>
        <Button variant="danger" full leftIcon="trash" onClick={async () => {
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
