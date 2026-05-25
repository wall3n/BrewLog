import { useEffect, useState } from 'react';
import { Button, Field, Input, Slider } from '../../../components/UI';
import { Icon } from '../../../components/Icons';
import { methodById, getTargets, extractionZone } from '../../../utils/methodDefaults';
import { fmtTime } from '../../../utils/formatters';
import type { WizardDraft } from '../index';

interface Props { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void; onNext: () => void; }

function AlgorithmAssist({ draft }: { draft: WizardDraft }) {
  const [open, setOpen] = useState(true);
  const targets = getTargets(draft.method);
  const ey = draft.tds && draft.dose && draft.yield
    ? ((draft.tds / 100) * draft.yield / draft.dose * 100)
    : null;
  const zone = ey !== null ? extractionZone(ey) : null;

  return (
    <div className="card" style={{ padding: 0 }}>
      <button type="button" onClick={() => setOpen(!open)} className="row row-between" style={{ background: 'transparent', border: 'none', width: '100%', padding: '20px 24px', cursor: 'pointer', textAlign: 'left' }}>
        <div className="row row-gap-12">
          <Icon name="sparkles" size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--serif)', fontSize: 16 }}>Algorithm assist</span>
        </div>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={16} style={{ color: 'var(--text-secondary)' }} />
      </button>
      {open && (
        <div style={{ padding: '0 24px 20px', borderTop: '1px solid var(--border)' }}>
          <div className="col col-gap-12" style={{ paddingTop: 16 }}>
            {Object.entries(targets).map(([k, v]) => (
              <div key={k} className="row row-between">
                <span className="t-upper">{k === 'ey' ? 'Extraction Yield' : k}</span>
                <span className="t-mono t-sec" style={{ fontSize: 12 }}>{v}</span>
              </div>
            ))}
            {ey !== null && zone && (
              <div>
                <div className="row row-between" style={{ marginBottom: 8 }}>
                  <span className="t-upper">Your EY</span>
                  <span className="t-mono" style={{ color: zone.color, fontSize: 13, fontWeight: 600 }}>{ey.toFixed(1)}% · {zone.label}</span>
                </div>
                <div className="zone-bar"><div className="marker" style={{ left: `${zone.position}%` }} /></div>
                <div className="zone-labels"><span>12</span><span>16</span><span>18</span><span>22</span><span>24</span><span>28</span></div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function StepParameters({ draft, update, onNext }: Props) {
  const method = draft.method;
  const isEspresso = method === 'espresso' || method === 'moka-pot';

  useEffect(() => {
    update({ yield: Math.round(draft.dose * draft.ratio * 10) / 10 });
  }, [draft.dose, draft.ratio]);

  const handleTimeChange = (val: string) => {
    const m = val.match(/^(\d{1,2}):(\d{1,2})$/);
    if (m) update({ timeS: parseInt(m[1]) * 60 + parseInt(m[2]) });
  };

  return (
    <div>
      <div className="step-meta" style={{ marginBottom: 20 }}>
        <div className="col col-gap-4">
          <h2 className="h-display" style={{ fontSize: 28, margin: 0 }}>Brew parameters</h2>
          <span className="t-sec" style={{ fontSize: 12 }}>{methodById(method).name.toUpperCase()}</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="col col-gap-24">
          <div className="grid grid-2">
            <Field label="Dose" right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>g</span>}>
              <Input large type="number" value={draft.dose} onChange={e => update({ dose: parseFloat(e.target.value) || 0 })} />
            </Field>
            <Field label="Yield" right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>g</span>}>
              <Input large type="number" value={draft.yield} onChange={e => update({ yield: parseFloat(e.target.value) || 0 })} />
            </Field>
          </div>
          <Field label={`Ratio  1 : ${draft.ratio.toFixed(1)}`}>
            <Slider value={draft.ratio} min={isEspresso ? 1.0 : 5} max={isEspresso ? 3.0 : 20} step={0.1}
              onChange={v => update({ ratio: v })} displayValue={`1:${draft.ratio.toFixed(1)}`} />
          </Field>
          <div className="grid grid-2">
            <Field label="Extraction time" right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>m:ss</span>}>
              <Input value={fmtTime(draft.timeS)} onChange={e => handleTimeChange(e.target.value)} />
            </Field>
            <Field label="Temperature" right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>°C</span>}>
              <Input type="number" value={draft.temp} onChange={e => update({ temp: parseFloat(e.target.value) || 0 })} />
            </Field>
          </div>
          {isEspresso && (
            <Field label="Pressure" right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>bar</span>}>
              <Input type="number" step="0.1" value={draft.pressure} onChange={e => update({ pressure: parseFloat(e.target.value) || 0 })} />
            </Field>
          )}
          <div>
            <label className="row row-gap-8" style={{ cursor: 'pointer', userSelect: 'none' }}>
              <input type="checkbox" checked={draft.showTds}
                onChange={e => update({ showTds: e.target.checked, tds: e.target.checked ? (draft.tds ?? 1.4) : null })}
                style={{ accentColor: 'var(--accent)' }} />
              <span className="t-sec" style={{ fontSize: 12 }}>I have a refractometer reading</span>
            </label>
            {draft.showTds && (
              <div style={{ marginTop: 12 }}>
                <Field label="TDS" right={<span className="t-ter t-mono" style={{ fontSize: 11 }}>%</span>}>
                  <Input type="number" step="0.01" value={draft.tds ?? ''} onChange={e => update({ tds: parseFloat(e.target.value) || null })} />
                </Field>
              </div>
            )}
          </div>
        </div>
      </div>

      <AlgorithmAssist draft={draft} />
      <div style={{ height: 24 }} />
      <Button full size="lg" onClick={onNext} rightIcon="arrowRight">Continue</Button>
    </div>
  );
}
