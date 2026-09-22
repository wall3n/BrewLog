import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../../hooks/useDb';
import { useTimer } from '../../../hooks/useTimer';
import { Button, Tag } from '../../../components/UI';
import { fmtTime } from '../../../utils/formatters';
import {
  sortStages, getStageProgress, initialRecipeChoice, recipePatchOnChoose, recipePatchOnGuidedDone, recipeIdToSave,
} from '../../../utils/brewStages';
import { GuidedBrew } from '../GuidedBrew';
import type { WizardDraft } from '../index';
import type { Recipe } from '../../../db/types';
import css from './styles.module.css';

interface Props { draft: WizardDraft; update: (p: Partial<WizardDraft>) => void; onNext: () => void; onSkip: () => void; }

export function StepTimer({ draft, update, onNext, onSkip }: Props) {
  const db = useDb();
  const { t } = useTranslation();
  const { seconds, display, isRunning, start, pause, reset } = useTimer();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [guided, setGuided] = useState(false);
  // The selected chip. Opening the step does not link a recipe to the brew.
  const [choice, setChoice] = useState<number | null>(null);

  useEffect(() => {
    db.getAllRecipes().then(all => {
      const forMethod = all.filter(r => r.method === draft.method);
      setRecipes(forMethod);
      setChoice(initialRecipeChoice(forMethod, draft));
      // A Start brew recipe of another method (the method changed at step 1) is not linked.
      if (draft.recipeId !== null && recipeIdToSave(draft, forMethod) === null) update({ recipeId: null });
    });
    // Load once per method. `update` and `db` change on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.method]);

  const recipe = recipes.find(r => r.id === choice);
  const stages = useMemo(() => sortStages(recipe?.stages ?? []), [recipe]);
  const activeStageIdx = getStageProgress(stages, seconds).activeIndex;

  const choose = (id: number | null): void => {
    setChoice(id);
    update(recipePatchOnChoose(id));
  };

  const finishGuided = (timeS: number): void => {
    setGuided(false);
    update({ timeS, ...(recipe?.id != null ? recipePatchOnGuidedDone(recipe.id) : {}) });
    onNext();
  };

  return (
    <div>
      <div className={`step-meta ${css.stepMeta}`}>
        <div className="col col-gap-4">
          <h2 className={`h-display ${css.stepTitle}`}>{t('extraction.steps.timer.title')}</h2>
          <span className={`t-sec ${css.stepSub}`}>{t('extraction.steps.timer.subtitle')}</span>
        </div>
        <button type="button" className="skip" onClick={onSkip}>{t('extraction.steps.timer.skip')}</button>
      </div>

      {recipes.length > 0 && (
        <div className={css.recipePicker}>
          <div className="t-upper" aria-hidden="true">{t('guidedBrew.recipe')}</div>
          <div className={`scroll-x ${css.recipeChips}`} role="group" aria-label={t('guidedBrew.recipe')}>
            {recipes.map(r => (
              <Tag key={r.id} active={r.id === choice} onClick={() => choose(r.id ?? null)}>{r.name}</Tag>
            ))}
            <Tag subtle active={choice === null} onClick={() => choose(null)}>{t('guidedBrew.noRecipe')}</Tag>
          </div>
        </div>
      )}

      {recipe && stages.length > 0 && (
        <div className={css.guidedBtn}>
          <Button full size="lg" leftIcon="play" onClick={() => setGuided(true)}>{t('guidedBrew.open')}</Button>
        </div>
      )}

      <div className={`card ${css.timerCard}`}>
        <div className="timer">{display}</div>
        <div className={`row row-gap-12 ${css.timerControls}`}>
          {!isRunning
            ? <Button onClick={start} leftIcon="play">{t('extraction.steps.timer.start')}</Button>
            : <Button variant="ghost" onClick={pause} leftIcon="pause">{t('extraction.steps.timer.pause')}</Button>
          }
          <Button variant="ghost" onClick={reset} leftIcon="reset">{t('extraction.steps.timer.reset')}</Button>
          <Button variant="ghost" onClick={() => { pause(); update({ timeS: seconds }); onNext(); }}>
            {t('extraction.steps.timer.useTime', { time: fmtTime(seconds) })}
          </Button>
        </div>
      </div>

      {recipe && stages.length > 0 && (
        <div className={`col col-gap-8 ${css.recipeMb}`}>
          <div className={`t-upper ${css.recipeTitle}`}>{recipe.name}</div>
          {stages.map((s, i) => (
            <div key={s.id} className={`pour-stage ${i === activeStageIdx ? 'active' : ''}`}>
              <span className="pn">{i + 1}</span>
              <span className="pl">{s.label}</span>
              <span className="pt">@ {fmtTime(s.timeS)} → {s.weightG}g</span>
            </div>
          ))}
        </div>
      )}

      <Button full size="lg" variant="ghost" onClick={onNext}>{t('extraction.steps.timer.continueWithout')}</Button>

      {guided && recipe && (
        <GuidedBrew recipe={recipe} onDone={finishGuided} onClose={() => setGuided(false)} />
      )}
    </div>
  );
}
