import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, BackBar, MethodBadge, Empty } from '../../components/UI';
import { fmtRelDate, fmtTime } from '../../utils/formatters';
import type { Recipe } from '../../db/types';
import s from './styles.module.css';

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [r, setR] = useState<Recipe | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    db.getRecipe(Number(id)).then(recipe => {
      if (!recipe) setNotFound(true);
      else setR(recipe);
    });
  }, [id]);

  if (notFound) return <div><BackBar onClick={() => navigate('/recipes')} label={t('recipes.backToRecipes')} /><Empty icon="recipe" title={t('recipes.notFound')} /></div>;
  if (!r) return null;

  return (
    <div>
      <BackBar onClick={() => navigate('/recipes')} label={t('recipes.backToRecipes')} />
      <div className={`page-head ${s.detailHead}`}>
        <div className={`row row-gap-12 ${s.headRow}`}>
          <MethodBadge method={r.method} />
          <span className="t-upper">{r.lastUsedAt ? t('recipes.lastUsed', { date: fmtRelDate(r.lastUsedAt).toLowerCase() }) : t('recipes.neverUsed')}</span>
        </div>
        <h1>{r.name}</h1>
      </div>

      <div className={`card ${s.detailCard}`}>
        <div className="grid grid-3">
          {[
            { v: `${r.dose}g`, l: t('recipes.fields.dose') },
            { v: `${r.yield}g`, l: t('recipes.fields.yield') },
            { v: `1:${r.ratio.toFixed(1)}`, l: t('recipes.fields.ratio'), accent: true },
            { v: fmtTime(r.time), l: t('recipes.fields.time') },
            { v: `${r.temp}°C`, l: t('recipes.fields.temp') },
          ].map(item => (
            <div key={item.l} className="stat">
              <div className={`v t-mono${item.accent ? ` ${s.statAccent}` : ''}`}>{item.v}</div>
              <div className="l">{item.l}</div>
            </div>
          ))}
        </div>
      </div>

      {r.stages?.length > 0 && (
        <div className={`card ${s.detailCard}`}>
          <div className={`t-upper ${s.pourLabel}`}>{t('recipes.pourSchedule')}</div>
          <div className="col col-gap-8">
            {r.stages.map((s, i) => (
              <div key={s.id} className="pour-stage">
                <span className="pn">{i + 1}</span>
                <span className="pl">{s.label}</span>
                <span className="pt">@ {fmtTime(s.timeS)} → {s.weightG}g</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button full size="lg" leftIcon="play" onClick={() => navigate('/log', { state: { method: r.method, ratio: r.ratio, dose: r.dose, yield: r.yield, timeS: r.time, temp: r.temp } })}>
        {t('recipes.startBrew')}
      </Button>
      <div className={s.spacer12} />
      <Button variant="danger" leftIcon="trash" onClick={async () => {
        if (confirm(t('recipes.confirmDelete'))) { await db.deleteRecipe(r.id!); navigate('/recipes'); }
      }}>{t('recipes.deleteRecipe')}</Button>
    </div>
  );
}
