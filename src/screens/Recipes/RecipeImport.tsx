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
      <header className={s.detailHead}>
        <h1 className={s.detailTitle}>{recipe.name}</h1>
        <dl className={`field-row ${s.fieldRow}`}>
          <div><dt>{t('sheet.method')}</dt><dd><MethodBadge method={recipe.method} /></dd></div>
          <div><dt>{t('share.import.sourceLabel')}</dt><dd>{t('share.import.from')}</dd></div>
        </dl>
      </header>

      <div className={`readout-grid grid-paper ${s.readout}`}>
        {[
          { v: String(recipe.dose), u: 'g', l: t('recipes.fields.dose') },
          { v: String(recipe.yield), u: 'g', l: t('recipes.fields.yield') },
          { v: `1:${recipe.ratio.toFixed(1)}`, l: t('recipes.fields.ratio') },
          { v: fmtTime(recipe.time), l: t('recipes.fields.time') },
          { v: String(recipe.temp), u: '°C', l: t('recipes.fields.temp') },
        ].map(item => (
          <div key={item.l} className="stat">
            <div className="v">{item.v}{item.u && <span className="u">{item.u}</span>}</div>
            <div className="l">{item.l}</div>
          </div>
        ))}
      </div>

      {recipe.stages.length > 0 && (
        <section className={s.block}>
          <div className="section-label"><span className="t-upper">{t('recipes.pourSchedule')}</span></div>
          {recipe.stages.map((stage, i) => (
            <div key={stage.id} className="pour-stage">
              <span className="pn">{i + 1}</span>
              <span className="pl">{stage.label}</span>
              <span className="pt">{fmtTime(stage.timeS)} → {stage.weightG} g</span>
            </div>
          ))}
        </section>
      )}

      <div className={s.importSave}>
        <Button full size="lg" leftIcon="download" disabled={saving} onClick={() => void save()}>
          {t('share.import.save')}
        </Button>
        {failed && <p className={s.importError} role="alert">{t('share.import.failed')}</p>}
      </div>
    </div>
  );
}
