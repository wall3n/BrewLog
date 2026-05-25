import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useDb } from '../../hooks/useDb';
import { Button, BackBar, MethodBadge, Empty } from '../../components/UI';
import { fmtRelDate, fmtTime } from '../../utils/formatters';

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const { state } = useApp();
  const db = useDb();
  const navigate = useNavigate();

  const r = state.recipes.find(x => x.id === Number(id));
  if (!r) return <div><BackBar onClick={() => navigate('/recipes')} label="Back to recipes" /><Empty icon="recipe" title="Recipe not found" /></div>;

  return (
    <div>
      <BackBar onClick={() => navigate('/recipes')} label="Back to recipes" />
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div className="row row-gap-12" style={{ marginBottom: 6 }}>
          <MethodBadge method={r.method} />
          <span className="t-upper">{r.lastUsedAt ? `Last used ${fmtRelDate(r.lastUsedAt).toLowerCase()}` : 'Never used'}</span>
        </div>
        <h1>{r.name}</h1>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="grid grid-3">
          {[
            { v: `${r.dose}g`, l: 'Dose' },
            { v: `${r.yield}g`, l: 'Yield' },
            { v: `1:${r.ratio.toFixed(1)}`, l: 'Ratio', accent: true },
            { v: fmtTime(r.time), l: 'Time' },
            { v: `${r.temp}°C`, l: 'Temp' },
          ].map(s => (
            <div key={s.l} className="stat">
              <div className="v t-mono" style={s.accent ? { color: 'var(--accent)' } : {}}>{s.v}</div>
              <div className="l">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {r.stages?.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="t-upper" style={{ marginBottom: 16 }}>Pour schedule</div>
          <div className="col col-gap-8">
            {r.stages.map((s, i) => (
              <div key={s.id} className="pour-stage">
                <span className="pn">{i + 1}</span>
                <span className="pl">{s.label}</span>
                <span className="pt">@ {fmtTime(s.timeS)} → {s.weightG}g</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button full size="lg" leftIcon="play" onClick={() => navigate('/log', { state: { method: r.method, ratio: r.ratio, dose: r.dose, yield: r.yield, timeS: r.time, temp: r.temp } })}>
        Start brew
      </Button>
      <div style={{ height: 12 }} />
      <Button variant="danger" leftIcon="trash" onClick={async () => {
        if (confirm('Delete this recipe?')) { await db.deleteRecipe(r.id!); navigate('/recipes'); }
      }}>Delete recipe</Button>
    </div>
  );
}
