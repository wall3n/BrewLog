import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { Button, BackBar, RoastDot, Empty } from '../../components/UI';
import { daysSince, fmtRelDate, fmtTime } from '../../utils/formatters';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="row row-between">
      <span className="t-upper">{label}</span>
      <span className="t-mono" style={{ fontSize: 13 }}>{value}</span>
    </div>
  );
}

export function BeanDetail() {
  const { id } = useParams<{ id: string }>();
  const { state } = useApp();
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const bean = state.beans.find(b => b.id === Number(id));
  if (!bean) return <div><BackBar onClick={() => navigate('/beans')} label={t('beans.backToBeans')} /><Empty icon="bean" title={t('beans.notFound')} /></div>;

  const ext = state.extractions.filter(e => e.beanId === bean.id);
  const avgRating = ext.length ? (ext.reduce((a, e) => a + (e.rating ?? 0), 0) / ext.length).toFixed(1) : '—';

  return (
    <div>
      <BackBar onClick={() => navigate('/beans')} label={t('beans.backToBeans')} />
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div className="row row-gap-12" style={{ marginBottom: 6 }}>
          <RoastDot level={bean.roast} />
          <span className="t-upper">{bean.process} · {bean.roast}</span>
        </div>
        <h1>{bean.name}</h1>
        <p>{bean.roaster}</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid grid-3">
          <div className="stat"><div className="v t-mono">{ext.length}</div><div className="l">{t('beans.stats.extractions')}</div></div>
          <div className="stat"><div className="v t-mono">{avgRating}{ext.length ? <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 4 }}>/5</span> : null}</div><div className="l">{t('beans.stats.avgRating')}</div></div>
          <div className="stat">
            <div className="v t-mono" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {daysSince(bean.roastedAt) ?? '—'}<span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>d</span>
            </div>
            <div className="l">{t('beans.stats.offRoast')}</div>
          </div>
        </div>
        <div className="divider" />
        <div className="col col-gap-12">
          <DetailRow label={t('beans.fields.origin')} value={bean.origin ?? '—'} />
          <DetailRow label={t('beans.fields.process')} value={bean.process ?? '—'} />
          <DetailRow label={t('beans.fields.weight')} value={bean.weightG != null ? `${bean.weightG} g` : '—'} />
          <DetailRow label={t('beans.fields.status')} value={(bean.status ?? '').toUpperCase()} />
        </div>
        {bean.notes && (
          <>
            <div className="divider" />
            <div style={{ fontSize: 13, lineHeight: 1.6, fontStyle: 'italic' }}>"{bean.notes}"</div>
          </>
        )}
      </div>

      {ext.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="t-upper" style={{ marginBottom: 16 }}>{t('beans.diallingTable')}</div>
          <div className="col">
            <div className="row" style={{ paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
              <div className="t-upper" style={{ flex: 1 }}>{t('beans.diallingHeaders.date')}</div>
              {(['grind','ratio','time','rating'] as const).map(h => (
                <div key={h} className="t-upper" style={{ width: 60, textAlign: 'right' }}>{t(`beans.diallingHeaders.${h}`)}</div>
              ))}
            </div>
            {ext.map(e => (
              <button key={e.id} onClick={() => navigate(`/history/${e.id}`)}
                style={{ background: 'transparent', border: 'none', textAlign: 'left', cursor: 'pointer', padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', width: '100%' }}>
                <div style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }} className="t-mono">{fmtRelDate(e.createdAt)}</div>
                <div style={{ width: 60, textAlign: 'right' }} className="t-mono">{e.grindSetting ?? '—'}</div>
                <div style={{ width: 60, textAlign: 'right' }} className="t-mono t-acc">1:{e.ratio.toFixed(1)}</div>
                <div style={{ width: 60, textAlign: 'right' }} className="t-mono">{fmtTime(e.timeS)}</div>
                <div style={{ width: 60, textAlign: 'right' }} className="t-mono">{'★'.repeat(e.rating)}<span style={{ color: 'var(--text-tertiary)' }}>{'·'.repeat(5 - e.rating)}</span></div>
              </button>
            ))}
          </div>
        </div>
      )}

      <Button variant="danger" leftIcon="trash" onClick={async () => {
        if (confirm(t('beans.confirmDelete'))) { await db.deleteBean(bean.id!); navigate('/beans'); }
      }}>{t('beans.delete')}</Button>
    </div>
  );
}
