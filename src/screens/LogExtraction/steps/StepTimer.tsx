import { useApp } from '../../../context/AppContext';
import { useTimer } from '../../../hooks/useTimer';
import { Button } from '../../../components/UI';
import { fmtTime } from '../../../utils/formatters';
import type { WizardDraft } from '../index';

interface Props { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void; onNext: () => void; onSkip: () => void; }

export function StepTimer({ draft, update, onNext, onSkip }: Props) {
  const { state } = useApp();
  const { seconds, display, isRunning, start, pause, reset } = useTimer();

  const recipe = state.recipes.find(r => r.method === draft.method);
  const stages = recipe?.stages ?? [];
  const activeStageIdx = stages.findIndex((s, i) => {
    const next = stages[i + 1];
    return seconds >= s.timeS && (!next || seconds < next.timeS);
  });

  return (
    <div>
      <div className="step-meta" style={{ marginBottom: 20 }}>
        <div className="col col-gap-4">
          <h2 className="h-display" style={{ fontSize: 28, margin: 0 }}>Brew timer</h2>
          <span className="t-sec" style={{ fontSize: 12 }}>OPTIONAL</span>
        </div>
        <button type="button" className="skip" onClick={onSkip}>Skip →</button>
      </div>

      <div className="card" style={{ padding: 32, marginBottom: 24, textAlign: 'center' }}>
        <div className="timer">{display}</div>
        <div className="row row-gap-12" style={{ justifyContent: 'center', marginTop: 24 }}>
          {!isRunning
            ? <Button onClick={start} leftIcon="play">Start</Button>
            : <Button variant="ghost" onClick={pause} leftIcon="pause">Pause</Button>
          }
          <Button variant="ghost" onClick={reset} leftIcon="reset">Reset</Button>
          <Button variant="ghost" onClick={() => { pause(); update({ timeS: seconds }); onNext(); }}>
            Use {fmtTime(seconds)}
          </Button>
        </div>
      </div>

      {stages.length > 0 && (
        <div className="col col-gap-8" style={{ marginBottom: 24 }}>
          <div className="t-upper" style={{ marginBottom: 4 }}>{recipe!.name}</div>
          {stages.map((s, i) => (
            <div key={s.id} className={`pour-stage ${i === activeStageIdx ? 'active' : ''}`}>
              <span className="pn">{i + 1}</span>
              <span className="pl">{s.label}</span>
              <span className="pt">@ {fmtTime(s.timeS)} → {s.weightG}g</span>
            </div>
          ))}
        </div>
      )}

      <Button full size="lg" variant="ghost" onClick={onNext}>Continue without timing</Button>
    </div>
  );
}
