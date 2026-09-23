import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTimer } from '../../../hooks/useTimer';
import { Button, Stepper, Tag } from '../../../components/UI';
import { Icon } from '../../../components/Icons';
import { fmtTime } from '../../../utils/formatters';
import { sortStages, getStageProgress } from '../../../utils/brewStages';
import type { Recipe } from '../../../db/types';
import { GuidedBrew } from '../GuidedBrew';
import s from '../styles.module.css';

interface TimerBlockProps {
  timeS: number;
  previous?: number | null;
  onTime: (s: number) => void;
  /** Saved recipes for the current method. */
  recipes: readonly Recipe[];
  /** The recipe whose chip is selected, if any. */
  recipe?: Recipe;
  onChooseRecipe: (id: number | null) => void;
  onGuidedDone: (timeS: number, recipeId: number) => void;
}

/** Inline brew timer with the saved-recipe picker and the guided brew entry. Stopping the timer writes the time to the sheet. */
export function TimerBlock({ timeS, previous, onTime, recipes, recipe, onChooseRecipe, onGuidedDone }: TimerBlockProps) {
  const { t } = useTranslation();
  const { elapsed, seconds, display, isRunning, start, pause, reset } = useTimer();
  const [guided, setGuided] = useState(false);
  const pickLabelId = useId();
  const live = isRunning || elapsed > 0;

  const stop = (): void => { pause(); onTime(seconds); };

  const stages = useMemo(() => sortStages(recipe?.stages ?? []), [recipe]);
  const activeStage = live ? getStageProgress(stages, seconds).activeIndex : -1;
  const lastStage = stages.length > 0 ? stages[stages.length - 1] : null;

  const openGuided = (): void => {
    // The inline timer and the guided clock must not run at the same time.
    if (isRunning) pause();
    setGuided(true);
  };

  const finishGuided = (guidedTimeS: number): void => {
    setGuided(false);
    if (recipe?.id != null) onGuidedDone(guidedTimeS, recipe.id);
    else onTime(guidedTimeS);
    reset();
  };

  return (
    <div className={s.timerWrap}>
      {recipes.length > 0 && (
        <div className={s.recipePick}>
          <span className="t-upper" id={pickLabelId}>{t('guidedBrew.savedRecipe')}</span>
          <div className={`scroll-x bleed-x ${s.recipeChips}`} role="group" aria-labelledby={pickLabelId}>
            {recipes.map(r => (
              <Tag key={r.id} active={r.id === recipe?.id} onClick={() => onChooseRecipe(r.id ?? null)}>
                {r.id === recipe?.id && <Icon name="check" size={14} />}
                {r.name}
              </Tag>
            ))}
            <Tag subtle active={!recipe} onClick={() => onChooseRecipe(null)}>{t('guidedBrew.noRecipe')}</Tag>
          </div>
          {recipe && stages.length > 0 && (
            <button type="button" className={s.guidedBtn} onClick={openGuided}>
              <Icon name="play" size={18} />
              <span className={s.guidedLabel}>{t('guidedBrew.open')}</span>
              <span className={s.guidedMeta}>
                {t('guidedBrew.summary', { count: stages.length, time: fmtTime(recipe.time > 0 ? recipe.time : lastStage?.timeS ?? 0) })}
              </span>
            </button>
          )}
        </div>
      )}

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
      {recipe && stages.length > 0 && (
        <div className={s.stages}>
          <div className={s.stagesHead}>
            <span className="t-upper">{t('guidedBrew.stages')}</span>
            <span className={s.stagesRecipe}>{recipe.name}</span>
          </div>
          <ol className={s.stageList}>
            {stages.map((st, i) => (
              <li key={st.id} className={`pour-stage ${i === activeStage ? 'active' : ''}`} aria-current={i === activeStage ? 'step' : undefined}>
                <span className="pn">{i + 1}</span>
                <span className="pl">{st.label}</span>
                <span className="pt">{fmtTime(st.timeS)} → {st.weightG} g</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {guided && recipe && (
        <GuidedBrew recipe={recipe} onDone={finishGuided} onClose={() => setGuided(false)} />
      )}
    </div>
  );
}
