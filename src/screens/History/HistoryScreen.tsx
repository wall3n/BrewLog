import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Tag, StagList, Empty, Stars, MethodBadge } from '../../components/UI';
import { Icon } from '../../components/Icons';
import { fmtRelDate, fmtTime } from '../../utils/formatters';
import { methodById } from '../../utils/methodDefaults';
import type { Extraction, Bean } from '../../db/types';

export function ExtractionRow({ extraction, beans, onClick }: { extraction: Extraction; beans: readonly Bean[]; onClick: () => void }) {
  const { t } = useTranslation();
  const bean = beans.find(b => b.id === extraction.beanId);
  return (
    <div className="card card-tight card-hover" onClick={onClick} style={{ padding: '16px 20px' }}>
      <div className="row row-between" style={{ alignItems: 'flex-start', gap: 12 }}>
        <div className="col col-gap-8" style={{ flex: 1, minWidth: 0 }}>
          <div className="row row-gap-8" style={{ flexWrap: 'wrap', gap: 8 }}>
            <span className="t-upper">{fmtRelDate(extraction.createdAt)}</span>
            <MethodBadge method={extraction.method} />
          </div>
          <div style={{ fontSize: 15, fontFamily: 'var(--serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {bean?.name ?? t('extraction.unknownBean')}
          </div>
          <div className="row row-gap-12" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            <span className="t-mono">{extraction.dose}g → {extraction.yield}g</span>
            <span className="t-ter">·</span>
            <span className="t-mono t-acc">1:{extraction.ratio.toFixed(1)}</span>
            <span className="t-ter">·</span>
            <span className="t-mono">{fmtTime(extraction.timeS)}</span>
          </div>
        </div>
        <div className="col" style={{ alignItems: 'flex-end', gap: 6 }}>
          <Stars value={extraction.rating} size={14} />
          {extraction.flag === 'dialled' && <span style={{ fontSize: 10, color: 'var(--success)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>✓ {t('history.flags.dialled')}</span>}
          {extraction.flag === 'adjust'  && <span style={{ fontSize: 10, color: 'var(--warning)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>! {t('history.flags.adjust')}</span>}
          {extraction.flag === 'fail'    && <span style={{ fontSize: 10, color: 'var(--danger)',  letterSpacing: '0.06em', textTransform: 'uppercase' }}>✗ {t('history.flags.fail')}</span>}
        </div>
      </div>
    </div>
  );
}

export function HistoryScreen() {
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [beans, setBeans] = useState<Bean[]>([]);
  const [q, setQ] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [flagFilter, setFlagFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState(0);

  useEffect(() => {
    Promise.all([db.getAllExtractions(), db.getAllBeans()])
      .then(([exts, bns]) => { setExtractions(exts); setBeans(bns); });
  }, []);

  const filtered = extractions.filter(e => {
    const bean = beans.find(b => b.id === e.beanId);
    const text = `${bean?.name ?? ''} ${bean?.roaster ?? ''} ${e.notes ?? ''} ${(e.flavours ?? []).join(' ')}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (methodFilter !== 'all' && e.method !== methodFilter) return false;
    if (flagFilter !== 'all' && e.flag !== flagFilter) return false;
    if (ratingFilter > 0 && (e.rating ?? 0) < ratingFilter) return false;
    return true;
  });

  const methods = ['all', ...new Set(extractions.map(e => e.method))];

  return (
    <div>
      <div className="page-head">
        <h1>{t('history.title')}</h1>
        <p>{t('history.subtitle', { count: extractions.length })} · {t('history.shown', { count: filtered.length })}</p>
      </div>
      <div className="search-bar" style={{ marginBottom: 16 }}>
        <Icon name="search" size={16} style={{ color: 'var(--text-tertiary)' }} />
        <input placeholder={t('history.search')} value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="scroll-x" style={{ marginBottom: 24 }}>
        {methods.map(m => (
          <Tag key={m} active={methodFilter === m} onClick={() => setMethodFilter(m)}>
            {m === 'all' ? t('history.filters.allMethods') : t(`methods.${m}`, { defaultValue: methodById(m).name })}
          </Tag>
        ))}
        <span style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
        {(['all','dialled','adjust','fail'] as const).map(f => (
          <Tag key={f} active={flagFilter === f} onClick={() => setFlagFilter(f)}>
            {f === 'all' ? t('history.filters.anyFlag') : t(`history.flags.${f}`)}
          </Tag>
        ))}
        <span style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
        {[0,3,4,5].map(r => (
          <Tag key={r} active={ratingFilter === r} onClick={() => setRatingFilter(r)}>
            {r === 0 ? t('history.filters.anyRating') : `${r}+ ★`}
          </Tag>
        ))}
      </div>
      <div className="col col-gap-12">
        {filtered.length === 0
          ? <Empty icon="history" title={t('history.nothingMatches')} body={t('history.loosenFilters')} />
          : <StagList>{filtered.map(e => <ExtractionRow key={e.id} extraction={e} beans={beans} onClick={() => navigate(`/history/${e.id}`)} />)}</StagList>
        }
      </div>
    </div>
  );
}
