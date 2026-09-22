import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../../context/AppContext';
import { useTimer } from '../../../hooks/useTimer';
import { useWakeLock } from '../../../hooks/useWakeLock';
import { Button, ProgressBar } from '../../../components/UI';
import { Icon } from '../../../components/Icons';
import { sortStages, getStageProgress, cueBetween, WARNING_LEAD_S } from '../../../utils/brewStages';
import { createCuePlayer, type CuePlayer } from '../../../utils/cuePlayer';
import { fmtTime } from '../../../utils/formatters';
import type { Recipe } from '../../../db/types';
import s from './styles.module.css';

export interface GuidedBrewProps {
  recipe: Recipe;
  onDone: (timeS: number) => void;
  onClose: () => void;
}

export function GuidedBrew({ recipe, onDone, onClose }: GuidedBrewProps) {
  const { t } = useTranslation();
  const { dispatch } = useApp();
  const { seconds, isRunning, start, pause, reset } = useTimer();
  const player = useRef<CuePlayer | null>(null);
  const prevSeconds = useRef(0);
  const primaryRef = useRef<HTMLDivElement>(null);
  const activeRowRef = useRef<HTMLLIElement>(null);
  const stages = useMemo(() => sortStages(recipe.stages), [recipe.stages]);
  const progress = getStageProgress(stages, seconds);

  useWakeLock(isRunning);

  useEffect(() => {
    dispatch({ type: 'OPEN_MODAL' });
    const p = createCuePlayer();
    player.current = p;
    // Move focus into the dialog, onto the Start button.
    primaryRef.current?.querySelector('button')?.focus();
    return () => {
      dispatch({ type: 'CLOSE_MODAL' });
      p.close();
    };
  }, [dispatch]);

  useEffect(() => {
    const cue = cueBetween(stages, prevSeconds.current, seconds);
    prevSeconds.current = seconds;
    if (cue) player.current?.play(cue);
  }, [seconds, stages]);

  // Keep the active stage visible when the list scrolls on short screens.
  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [progress.activeIndex]);

  const handleStart = (): void => { player.current?.prime(); start(); };
  const handleReset = (): void => { reset(); prevSeconds.current = 0; };
  const handleDone = (): void => { pause(); onDone(seconds); };

  const active = progress.activeIndex >= 0 ? stages[progress.activeIndex] : null;
  const next = progress.nextIndex !== null ? stages[progress.nextIndex] : null;
  const started = isRunning || seconds > 0;
  const imminent = isRunning && progress.secondsToNext !== null && progress.secondsToNext <= WARNING_LEAD_S;
  const stageLabel = active ? active.label : started ? t('guidedBrew.getReady') : t('guidedBrew.ready');

  return createPortal(
    <div className={s.overlay} role="dialog" aria-modal="true" aria-label={t('guidedBrew.title')}>
      <div className={s.head}>
        <span className={`t-upper ${s.recipeName}`}>{recipe.name}</span>
        <button type="button" className={s.close} onClick={onClose} aria-label={t('guidedBrew.close')}>
          <Icon name="x" size={24} />
        </button>
      </div>

      <div className={s.hero}>
        <div className={`t-mono ${s.clock} ${isRunning ? '' : s.clockPaused}`}>{fmtTime(seconds)}</div>

        <div className={s.now} aria-live="polite" aria-atomic="true">
          <span className={`h-display ${s.stageLabel}`}>{stageLabel}</span>
          {progress.targetWeightG !== null && (
            <span className={`t-mono ${s.target}`}>{t('guidedBrew.pourTo', { weight: progress.targetWeightG })}</span>
          )}
        </div>

        <div className={`t-mono ${s.next} ${imminent ? s.imminent : ''}`}>
          {next && progress.secondsToNext !== null
            ? t('guidedBrew.nextIn', { label: next.label, time: fmtTime(progress.secondsToNext) })
            : progress.isLastStage ? t('guidedBrew.finalStage') : null}
        </div>

        <div className={s.progress}>
          <ProgressBar value={Math.min(seconds, recipe.time)} max={recipe.time > 0 ? recipe.time : 1} />
          <div className={`t-mono ${s.progressMeta}`}>
            <span>{fmtTime(Math.min(seconds, recipe.time))}</span>
            <span>{fmtTime(recipe.time)}</span>
          </div>
        </div>
      </div>

      <ol className={s.stages} aria-label={t('guidedBrew.stages')}>
        {stages.map((stage, i) => {
          const isActive = i === progress.activeIndex;
          const isDone = i < progress.activeIndex;
          return (
            <li
              key={stage.id}
              ref={isActive ? activeRowRef : undefined}
              className={`${s.stage} ${isActive ? s.stageActive : ''} ${isDone ? s.stageDone : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span className={s.stageNum}>{isDone ? <Icon name="check" size={16} /> : i + 1}</span>
              <span className={s.stageName}>
                {stage.label}
                {isActive && <span className={`t-upper ${s.nowBadge}`}>{t('guidedBrew.now')}</span>}
              </span>
              <span className={`t-mono ${s.stageTime}`}>{fmtTime(stage.timeS)}</span>
              <span className={`t-mono ${s.stageWeight}`}>{stage.weightG} g</span>
            </li>
          );
        })}
      </ol>

      <div className={s.controls}>
        <Button size="lg" variant="ghost" className={s.ctrl} onClick={handleReset} leftIcon="reset" disabled={!started}>
          {t('extraction.steps.timer.reset')}
        </Button>
        <div ref={primaryRef} className={s.primary}>
          {!isRunning
            ? <Button size="lg" full className={s.ctrl} onClick={handleStart} leftIcon="play">{t('extraction.steps.timer.start')}</Button>
            : <Button size="lg" full variant="ghost" className={`${s.ctrl} ${s.pause}`} onClick={pause} leftIcon="pause">{t('extraction.steps.timer.pause')}</Button>}
        </div>
        <Button size="lg" full variant={started && !isRunning ? 'primary' : 'ghost'} className={`${s.ctrl} ${s.done}`} onClick={handleDone} disabled={!started} leftIcon="check">
          {t('guidedBrew.done', { time: fmtTime(seconds) })}
        </Button>
      </div>
    </div>,
    document.body,
  );
}
