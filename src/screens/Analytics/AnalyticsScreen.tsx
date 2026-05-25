import { useApp } from '../../context/AppContext';
import { Stars } from '../../components/UI';

function LineChart({ data }: { data: { rating: number }[] }) {
  const w = 700, h = 140, pad = { l: 24, r: 12, t: 12, b: 24 };
  const innerW = w - pad.l - pad.r, innerH = h - pad.t - pad.b;
  if (data.length === 0) return <div className="t-sec" style={{ fontSize: 12, padding: 12 }}>Log some extractions first.</div>;
  const x = (i: number) => pad.l + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => pad.t + (1 - v / 5) * innerH;
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.rating)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display: 'block' }}>
      {[1,2,3,4,5].map(level => (
        <g key={level}>
          <line x1={pad.l} y1={y(level)} x2={w - pad.r} y2={y(level)} className="chart-grid" />
          <text x={pad.l - 6} y={y(level)} textAnchor="end" dominantBaseline="middle" className="chart-label">{level}</text>
        </g>
      ))}
      <path d={linePath} className="chart-line" />
      {data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.rating)} r="2.5" className="chart-dot" />)}
    </svg>
  );
}

export function AnalyticsScreen() {
  const { state } = useApp();
  const ext = state.extractions;

  const ratingsOverTime = [...ext].reverse().slice(-30).map(e => ({ rating: e.rating ?? 0 }));

  const methodCounts: Record<string, number> = {};
  ext.forEach(e => { methodCounts[e.method] = (methodCounts[e.method] ?? 0) + 1; });
  const methodList = Object.entries(methodCounts).sort((a, b) => b[1] - a[1]);
  const maxMethodCount = methodList[0]?.[1] ?? 1;

  const beanStats: Record<number, { sum: number; count: number }> = {};
  ext.forEach(e => {
    if (!e.rating || !e.beanId) return;
    beanStats[e.beanId] = beanStats[e.beanId] ?? { sum: 0, count: 0 };
    beanStats[e.beanId].sum += e.rating;
    beanStats[e.beanId].count += 1;
  });
  const topBeans = Object.entries(beanStats)
    .map(([id, s]) => ({ id: Number(id), avg: s.sum / s.count, count: s.count }))
    .sort((a, b) => b.avg - a.avg).slice(0, 5);

  const methodName = (id: string) => {
    const names: Record<string, string> = { espresso: 'Espresso', 'french-press': 'French Press', 'pour-over': 'Pour Over', aeropress: 'AeroPress', 'moka-pot': 'Moka Pot', 'cold-brew': 'Cold Brew', drip: 'Drip', siphon: 'Siphon', custom: 'Custom' };
    return names[id] ?? id;
  };

  return (
    <div>
      <div className="page-head">
        <h1>Analytics</h1>
        <p>OBSERVATIONS FROM THE LOGBOOK</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="t-upper" style={{ marginBottom: 8 }}>Total extractions</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 64, fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1 }}>{ext.length}</div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row row-between" style={{ marginBottom: 16 }}>
          <span className="t-upper">Rating over time</span>
          <span className="t-mono t-sec" style={{ fontSize: 11 }}>LAST {ratingsOverTime.length}</span>
        </div>
        <LineChart data={ratingsOverTime} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="t-upper" style={{ marginBottom: 16 }}>Method distribution</div>
        <div className="col col-gap-12">
          {methodList.map(([m, c]) => (
            <div key={m}>
              <div className="row row-between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 12 }}>{methodName(m)}</span>
                <span className="t-mono t-sec" style={{ fontSize: 11 }}>{c}</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3 }}>
                <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 3, width: `${(c / maxMethodCount) * 100}%`, transition: 'width 300ms' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="t-upper" style={{ marginBottom: 16 }}>Top beans by rating</div>
        <div className="col col-gap-12">
          {topBeans.length === 0
            ? <span className="t-sec" style={{ fontSize: 12 }}>Need more rated extractions.</span>
            : topBeans.map((b, i) => {
                const bean = state.beans.find(x => x.id === b.id);
                return (
                  <div key={b.id} className="row row-between">
                    <div className="row row-gap-12">
                      <span className="t-mono" style={{ color: 'var(--text-tertiary)', width: 18 }}>{(i + 1).toString().padStart(2, '0')}</span>
                      <span style={{ fontSize: 13 }}>{bean?.name ?? 'Unknown'}</span>
                    </div>
                    <div className="row row-gap-8">
                      <Stars value={Math.round(b.avg)} size={12} />
                      <span className="t-mono t-sec" style={{ fontSize: 11 }}>{b.avg.toFixed(1)} · {b.count}×</span>
                    </div>
                  </div>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}
