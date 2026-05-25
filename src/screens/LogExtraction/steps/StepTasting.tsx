import { Button, Field, Slider, Stars, Tag, Textarea } from '../../../components/UI';
import { FLAVOUR_PRESETS } from '../../../utils/methodDefaults';
import type { WizardDraft } from '../index';

interface Props { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void; onSave: () => void; }

const ATTRIBUTES = [
  ['acidity', 'Acidity'], ['sweetness', 'Sweetness'], ['bitterness', 'Bitterness'],
  ['body', 'Body'], ['balance', 'Balance'],
] as const;

export function StepTasting({ draft, update, onSave }: Props) {
  const toggleFlavour = (f: string) => {
    const next = draft.flavours.includes(f)
      ? draft.flavours.filter(x => x !== f)
      : [...draft.flavours, f];
    update({ flavours: next });
  };

  return (
    <div>
      <div className="step-meta" style={{ marginBottom: 20 }}>
        <div className="col col-gap-4">
          <h2 className="h-display" style={{ fontSize: 28, margin: 0 }}>How did it taste?</h2>
          <span className="t-sec" style={{ fontSize: 12 }}>THE FUN PART</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="t-upper" style={{ marginBottom: 12 }}>Outcome</div>
        <div className="row row-gap-8">
          {[
            { key: 'dialled', label: 'Dialled in', sym: '✓', cls: 'dialled' },
            { key: 'adjust',  label: 'Adjust',     sym: '!', cls: 'adjust' },
            { key: 'fail',    label: 'Failure',    sym: '✗', cls: 'fail' },
          ].map(f => (
            <button key={f.key} type="button"
              className={`flag-toggle ${f.cls} ${draft.flag === f.key ? 'selected' : ''}`}
              onClick={() => update({ flag: f.key as WizardDraft['flag'] })}>
              <span className="e">{f.sym}</span>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="row row-between" style={{ marginBottom: 12 }}>
          <span className="t-upper">Overall rating</span>
          <span className="t-mono t-sec" style={{ fontSize: 12 }}>{draft.rating || '—'} / 5</span>
        </div>
        <Stars value={draft.rating} onChange={v => update({ rating: v })} size={28} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="t-upper" style={{ marginBottom: 16 }}>Flavour profile</div>
        <div className="col col-gap-12">
          {ATTRIBUTES.map(([k, label]) => (
            <Slider key={k} label={label} value={draft[k]} min={1} max={5} step={1}
              onChange={v => update({ [k]: v })} />
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="t-upper" style={{ marginBottom: 12 }}>Flavour notes</div>
        <div className="scroll-x">
          {FLAVOUR_PRESETS.map(f => (
            <Tag key={f} active={draft.flavours.includes(f)} onClick={() => toggleFlavour(f)}>{f}</Tag>
          ))}
          <Tag subtle onClick={() => {
            const c = window.prompt('Custom flavour note:');
            if (c) toggleFlavour(c.toLowerCase().trim());
          }}>+ custom</Tag>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <Field label="Notes">
          <Textarea value={draft.notes} onChange={e => update({ notes: e.target.value })}
            placeholder="What will you change next time?" rows={4} />
        </Field>
      </div>

      <Button full size="lg" onClick={onSave}>Save extraction</Button>
    </div>
  );
}
