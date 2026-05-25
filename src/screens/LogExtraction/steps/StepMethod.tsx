import { METHODS } from '../../../utils/methodDefaults';
import { Button } from '../../../components/UI';
import { Icon } from '../../../components/Icons';
import type { WizardDraft } from '../index';

interface Props { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void; onNext: () => void; }

export function StepMethod({ draft, update, onNext }: Props) {
  return (
    <div>
      <div className="step-meta" style={{ marginBottom: 20 }}>
        <div className="col col-gap-4">
          <h2 className="h-display" style={{ fontSize: 28, margin: 0 }}>What are you brewing?</h2>
          <span className="t-sec" style={{ fontSize: 12, letterSpacing: '0.03em' }}>PICK A METHOD</span>
        </div>
      </div>
      <div className="grid grid-3" style={{ marginBottom: 32 }}>
        {METHODS.map(m => (
          <div key={m.id} className={`method-card ${draft.method === m.id ? 'selected' : ''}`}
            onClick={() => update({ method: m.id, ratio: m.defaultRatio })}>
            <div className="m-icon"><Icon name={m.icon} size={28} /></div>
            <div className="m-name">{m.name}</div>
          </div>
        ))}
      </div>
      <Button full size="lg" onClick={onNext} rightIcon="arrowRight" disabled={!draft.method}>Continue</Button>
    </div>
  );
}
