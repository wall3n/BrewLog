import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, BackBar, Stars, Tag, MethodBadge, Empty } from '../../components/UI';
import { fmtRelDate, fmtTime } from '../../utils/formatters';
import type { Extraction, Bean, Equipment } from '../../db/types';
import s from './styles.module.css';

function TastingRadar({ values }: { values: Pick<Extraction, 'acidity'|'sweetness'|'bitterness'|'body'|'balance'> }) {
  const { t } = useTranslation();
  const axes = ['acidity', 'sweetness', 'bitterness', 'body', 'balance'] as const;
  const labels = {
    acidity:    t('extraction.fields.acidity'),
    sweetness:  t('extraction.fields.sweetness'),
    bitterness: t('extraction.fields.bitterness'),
    body:       t('extraction.fields.body'),
    balance:    t('extraction.fields.balance'),
  };
  const size = 220, cx = 110, cy = 110, maxR = 70;
  const pts = axes.map((k, i) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const r = (values[k] / 5) * maxR;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r] as [number, number];
  });
  const lblPts = axes.map((k, i) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const r = maxR + 18;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, labels[k]] as [number, number, string];
  });
  return (
    <div className={s.radarCenter}>
      <svg width={size} height={size}>
        {[1,2,3,4,5].map(level => {
          const r = (level / 5) * maxR;
          const ringPts = axes.map((_, i) => { const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2; return `${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`; }).join(' ');
          return <polygon key={level} points={ringPts} fill="none" stroke="var(--border)" strokeWidth="1" opacity={level === 5 ? 0.9 : 0.4} />;
        })}
        {axes.map((_, i) => { const a = (Math.PI * 2 * i) / axes.length - Math.PI / 2; return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * maxR} y2={cy + Math.sin(a) * maxR} stroke="var(--border)" strokeWidth="1" opacity="0.4" />; })}
        <polygon points={pts.map(p => p.join(',')).join(' ')} fill="var(--accent)" fillOpacity="0.15" stroke="var(--accent)" strokeWidth="1.5" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="var(--accent)" />)}
        {lblPts.map(([x, y, label], i) => <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill="var(--text-tertiary)" fontSize="9" fontFamily="var(--mono)" letterSpacing="0.06em">{label.toUpperCase()}</text>)}
      </svg>
    </div>
  );
}

export function ExtractionDetail() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [ext, setExt] = useState<Extraction | null>(null);
  const [bean, setBean] = useState<Bean | undefined>(undefined);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const extraction = await db.getExtraction(Number(id));
      if (!extraction) { setNotFound(true); return; }
      setExt(extraction);
      const [b, allEq] = await Promise.all([
        extraction.beanId ? db.getBean(extraction.beanId) : Promise.resolve(undefined),
        db.getAllEquipment(),
      ]);
      setBean(b);
      setEquipment(allEq.filter(e => (extraction.equipmentIds ?? []).includes(e.id!)));
    }
    load();
  }, [id]);

  if (notFound) return <div><BackBar onClick={() => navigate('/history')} label={t('extraction.backToHistory')} /><Empty icon="flask" title={t('extraction.notFound')} /></div>;
  if (!ext) return null;

  return (
    <div>
      <BackBar onClick={() => navigate('/history')} label={t('extraction.backToHistory')} />
      <div className={`page-head ${s.pageHeadMb}`}>
        <div className="row row-gap-12 mb-2">
          <span className="t-upper">{fmtRelDate(ext.createdAt)}</span>
          <MethodBadge method={ext.method} />
          {ext.flag === 'dialled' && <span className={`${s.flagSpan} ${s.flagDialled}`}>✓ {t('extraction.flags.dialled')}</span>}
          {ext.flag === 'adjust'  && <span className={`${s.flagSpan} ${s.flagAdjust}`}>! {t('extraction.flags.adjust')}</span>}
          {ext.flag === 'fail'    && <span className={`${s.flagSpan} ${s.flagFail}`}>✗ {t('extraction.flags.fail')}</span>}
        </div>
        <h1>{bean?.name ?? t('extraction.unknownBean')}</h1>
        {bean && <p>{bean.roaster} · {bean.process}</p>}
      </div>

      <div className={`card ${s.cardMb}`}>
        <div className="grid grid-3">
          {[
            { v: `${ext.dose}g`,              l: t('extraction.fields.dose') },
            { v: `${ext.yield}g`,             l: t('extraction.fields.yield') },
            { v: `1:${ext.ratio.toFixed(1)}`, l: t('extraction.fields.ratio'), accent: true },
            { v: fmtTime(ext.timeS),           l: t('extraction.fields.time') },
            { v: `${ext.temp}°C`,              l: t('extraction.fields.temp') },
            ...(ext.tds ? [{ v: `${ext.tds}%`, l: t('extraction.fields.tds') }] : []),
            ...(ext.grindSetting ? [{ v: ext.grindSetting, l: t('extraction.fields.grind') }] : []),
            ...((ext.pressure && (ext.method === 'espresso' || ext.method === 'moka-pot')) ? [{ v: `${ext.pressure}bar`, l: t('extraction.fields.pressure') }] : []),
          ].map(stat => (
            <div key={stat.l} className="stat">
              <div className={`v t-mono${stat.accent ? ` ${s.statAccent}` : ''}`}>{stat.v}</div>
              <div className="l">{stat.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`card ${s.cardMb}`}>
        <div className={`row row-between ${s.tastingHeader}`}>
          <span className="t-upper">{t('extraction.fields.tasting')}</span>
          <Stars value={ext.rating} size={16} />
        </div>
        <TastingRadar values={{ acidity: ext.acidity, sweetness: ext.sweetness, bitterness: ext.bitterness, body: ext.body, balance: ext.balance }} />
        {ext.flavours?.length > 0 && (
          <>
            <div className={s.spacer} />
            <div className={`t-upper ${s.flavourMb}`}>{t('extraction.fields.notes')}</div>
            <div className="row row-wrap row-gap-8">{ext.flavours.map(f => <Tag key={f}>{f}</Tag>)}</div>
          </>
        )}
        {ext.notes && (
          <>
            <div className="divider" />
            <div className={s.noteText}>"{ext.notes}"</div>
          </>
        )}
      </div>

      {equipment.length > 0 && (
        <div className={`card ${s.cardMb}`}>
          <div className="t-upper mb-3">{t('extraction.equipmentSection')}</div>
          <div className="col col-gap-8">
            {equipment.map(e => (
              <div key={e.id} className="row row-between">
                <span className={s.eqItemName}>{e.name}</span>
                <span className={`t-mono t-sec ${s.eqItemType}`}>{e.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`row row-gap-12 ${s.actionRow}`}>
        <Button variant="ghost" full leftIcon="edit" onClick={() => navigate('/log', { state: { ...ext, isEditing: true } })}>{t('common.edit')}</Button>
        <Button variant="ghost" full leftIcon="copy" onClick={() => navigate('/log', { state: ext })}>{t('extraction.duplicate')}</Button>
        <Button variant="danger" leftIcon="trash" onClick={async () => {
          if (confirm(t('extraction.confirmDelete'))) {
            await db.deleteExtraction(ext.id!);
            navigate('/history');
          }
        }}>{t('extraction.delete')}</Button>
      </div>
    </div>
  );
}
