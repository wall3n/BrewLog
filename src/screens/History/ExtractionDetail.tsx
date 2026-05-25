import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { Button, BackBar, Stars, Tag, MethodBadge, Empty } from '../../components/UI';
import { fmtRelDate, fmtTime } from '../../utils/formatters';
import type { Extraction } from '../../db/types';

function TastingRadar({ values }: { values: Pick<Extraction, 'acidity'|'sweetness'|'bitterness'|'body'|'balance'> }) {
  const axes = ['acidity', 'sweetness', 'bitterness', 'body', 'balance'] as const;
  const labels = { acidity: 'Acidity', sweetness: 'Sweetness', bitterness: 'Bitterness', body: 'Body', balance: 'Balance' };
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
    <div style={{ display: 'flex', justifyContent: 'center' }}>
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
  const { state } = useApp();
  const db = useDb();
  const navigate = useNavigate();

  const ext = state.extractions.find(e => e.id === Number(id));
  if (!ext) return <div><BackBar onClick={() => navigate('/history')} label="Back to history" /><Empty icon="flask" title="Extraction not found" /></div>;

  const bean = state.beans.find(b => b.id === ext.beanId);
  const eq = state.equipment.filter(x => (ext.equipmentIds ?? []).includes(x.id!));

  return (
    <div>
      <BackBar onClick={() => navigate('/history')} label="Back to history" />
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div className="row row-gap-12" style={{ marginBottom: 8 }}>
          <span className="t-upper">{fmtRelDate(ext.createdAt)}</span>
          <MethodBadge method={ext.method} />
          {ext.flag === 'dialled' && <span style={{ fontSize: 10, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>✓ Dialled in</span>}
          {ext.flag === 'adjust'  && <span style={{ fontSize: 10, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>! Adjust</span>}
          {ext.flag === 'fail'    && <span style={{ fontSize: 10, color: 'var(--danger)',  textTransform: 'uppercase', letterSpacing: '0.06em' }}>✗ Failure</span>}
        </div>
        <h1>{bean?.name ?? 'Unknown bean'}</h1>
        {bean && <p>{bean.roaster} · {bean.process}</p>}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid grid-3">
          {[
            { v: `${ext.dose}g`, l: 'Dose' },
            { v: `${ext.yield}g`, l: 'Yield' },
            { v: `1:${ext.ratio.toFixed(1)}`, l: 'Ratio', accent: true },
            { v: fmtTime(ext.timeS), l: 'Time' },
            { v: `${ext.temp}°C`, l: 'Temp' },
            ...(ext.tds ? [{ v: `${ext.tds}%`, l: 'TDS' }] : []),
            ...(ext.grindSetting ? [{ v: ext.grindSetting, l: 'Grind' }] : []),
            ...((ext.pressure && (ext.method === 'espresso' || ext.method === 'moka-pot')) ? [{ v: `${ext.pressure}bar`, l: 'Pressure' }] : []),
          ].map(s => (
            <div key={s.l} className="stat">
              <div className="v t-mono" style={s.accent ? { color: 'var(--accent)' } : {}}>{s.v}</div>
              <div className="l">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row row-between" style={{ marginBottom: 16 }}>
          <span className="t-upper">Tasting</span>
          <Stars value={ext.rating} size={16} />
        </div>
        <TastingRadar values={{ acidity: ext.acidity, sweetness: ext.sweetness, bitterness: ext.bitterness, body: ext.body, balance: ext.balance }} />
        {ext.flavours?.length > 0 && (
          <>
            <div style={{ height: 16 }} />
            <div className="t-upper" style={{ marginBottom: 8 }}>Notes</div>
            <div className="row row-wrap row-gap-8">{ext.flavours.map(f => <Tag key={f}>{f}</Tag>)}</div>
          </>
        )}
        {ext.notes && (
          <>
            <div className="divider" />
            <div style={{ fontSize: 13, lineHeight: 1.6, fontStyle: 'italic' }}>"{ext.notes}"</div>
          </>
        )}
      </div>

      {eq.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="t-upper" style={{ marginBottom: 12 }}>Equipment</div>
          <div className="col col-gap-8">
            {eq.map(e => (
              <div key={e.id} className="row row-between">
                <span style={{ fontSize: 13 }}>{e.name}</span>
                <span className="t-mono t-sec" style={{ fontSize: 11 }}>{e.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="row row-gap-12" style={{ marginTop: 24 }}>
        <Button variant="ghost" full leftIcon="copy" onClick={() => navigate('/log', { state: ext })}>Duplicate</Button>
        <Button variant="danger" leftIcon="trash" onClick={async () => {
          if (confirm('Delete this extraction?')) {
            await db.deleteExtraction(ext.id!);
            navigate('/history');
          }
        }}>Delete</Button>
      </div>
    </div>
  );
}
