import { useTranslation } from 'react-i18next';
import { useTimer } from '../../../hooks/useTimer';
import { Button, Stepper } from '../../../components/UI';
import { fmtTime } from '../../../utils/formatters';
import type { Recipe } from '../../../db/types';
import s from '../styles.module.css';

interface TimerBlockProps { timeS: number; previous?: number | null; onTime: (s: number) => void; recipe?: Recipe; }

/** Inline brew timer. Stopping it writes the time to the sheet. */
export function TimerBlock({ timeS, previous, onTime, recipe }: TimerBlockProps) {
  const { t } = useTranslation();
  const { elapsed, seconds, display, isRunning, start, pause, reset } = useTimer();
  const live = isRunning || elapsed > 0;

  const stop = () => { pause(); onTime(seconds); };

  const stages = recipe?.stages ?? [];
  const activeStage = live
    ? stages.findIndex((st, i) => seconds >= st.timeS && (!stages[i + 1] || seconds < stages[i + 1].timeS))
    : -1;

  return (
    <div className={s.timerWrap}>
      <div className={`grid-paper ${s.timerFace}`}>
        <span className={`timer ${isRunning ? s.timerRunning : ''}`} aria-live="off">
          {isRunning ? display : `${fmtTime(timeS)}.0`}
        </span>
        <span className={s.timerCaption}>
          {isRunning ? t('sheet.timerRunning') : live ? t('sheet.timerStopped') : t('sheet.timerIdle')}
        </span>
      </div>
      <div className={s.timerControls}>
        {isRunning
          ? <Button size="lg" onClick={stop} leftIcon="stop" className={s.timerMain}>{t('sheet.stop')}</Button>
          : <Button size="lg" variant="ghost" onClick={start} leftIcon="play" className={`${s.timerMain} ${s.timerStart}`}>{elapsed > 0 ? t('sheet.resume') : t('extraction.steps.timer.start')}</Button>}
        <Button size="lg" variant="ghost" onClick={reset} leftIcon="reset" disabled={!live} aria-label={t('extraction.steps.timer.reset')} />
      </div>
      <Stepper
        label={t('sheet.adjustTime')}
        value={timeS}
        onChange={onTime}
        step={1}
        decimals={0}
        unit="s"
        max={86400}
        previous={previous}
        hint={fmtTime(timeS)}
        size="md"
      />
      {stages.length > 0 && (
        <div className={s.stages}>
          <div className="t-upper">{recipe!.name}</div>
          {stages.map((st, i) => (
            <div key={st.id} className={`pour-stage ${i === activeStage ? 'active' : ''}`}>
              <span className="pn">{i + 1}</span>
              <span className="pl">{st.label}</span>
              <span className="pt">{fmtTime(st.timeS)} → {st.weightG} g</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
