import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, BackBar, MethodBadge, Empty } from '../../components/UI';
import { fmtTime } from '../../utils/formatters';
import { decodeRecipe, readPayloadFromText } from '../../utils/shareCodec';
import s from './styles.module.css';

export function RecipeImport() {
  const location = useLocation();
  const navigate = useNavigate();
  const db = useDb();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const recipe = useMemo(() => {
    const payload = readPayloadFromText(location.hash);
    return payload ? decodeRecipe(payload) : null;
  }, [location.hash]);

  const back = <BackBar onClick={() => navigate('/recipes')} label={t('recipes.backToRecipes')} />;

  if (!recipe) {
    return <div>{back}<Empty icon="recipe" title={t('share.import.invalid')} body={t('share.import.invalidBody')} /></div>;
  }

  const save = async (): Promise<void> => {
    setSaving(true);
    setFailed(false);
    try {
      await db.addRecipe(recipe);
      navigate('/recipes');
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  return (
    <div>
      {back}
      <div className={`page-head ${s.detailHead}`}>
        <div className={`row row-gap-12 ${s.headRow}`}>
          <MethodBadge method={recipe.method} />
          <span className="t-upper">{t('share.import.from')}</span>
        </div>
        <h1>{recipe.name}</h1>
      </div>

      <div className={`card ${s.detailCard}`}>
        <div className="grid grid-3">
          {[
            { v: `${recipe.dose}g`, l: t('recipes.fields.dose') },
            { v: `${recipe.yield}g`, l: t('recipes.fields.yield') },
            { v: `1:${recipe.ratio.toFixed(1)}`, l: t('recipes.fields.ratio') },
            { v: fmtTime(recipe.time), l: t('recipes.fields.time') },
            { v: `${recipe.temp}°C`, l: t('recipes.fields.temp') },
          ].map(item => (
            <div key={item.l} className="stat">
              <div className="v t-mono">{item.v}</div>
              <div className="l">{item.l}</div>
            </div>
          ))}
        </div>
      </div>

      {recipe.stages.length > 0 && (
        <div className={`card ${s.detailCard}`}>
          <div className={`t-upper ${s.pourLabel}`}>{t('recipes.pourSchedule')}</div>
          <div className="col col-gap-8">
            {recipe.stages.map((stage, i) => (
              <div key={stage.id} className="pour-stage">
                <span className="pn">{i + 1}</span>
                <span className="pl">{stage.label}</span>
                <span className="pt">@ {fmtTime(stage.timeS)} → {stage.weightG}g</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button full size="lg" leftIcon="download" disabled={saving} onClick={() => void save()}>
        {t('share.import.save')}
      </Button>
      {failed && <p className={s.importError} role="alert">{t('share.import.failed')}</p>}
    </div>
  );
}
