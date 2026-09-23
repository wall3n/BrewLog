import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, BackBar, MethodBadge, Empty, Sheet, ShareActions } from '../../components/UI';
import { fmtDate, fmtRelDate, fmtTime } from '../../utils/formatters';
import { recipeCard } from '../../utils/shareCard';
import { buildRecipeShareUrl, shareProblems, toSharedRecipe } from '../../utils/shareCodec';
import { RecipeForm } from './RecipeForm';
import type { Recipe } from '../../db/types';
import s from './styles.module.css';


export function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [r, setR] = useState<Recipe | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    db.getRecipe(Number(id)).then(recipe => {
      if (!recipe) setNotFound(true);
      else setR(recipe);
    });
  }, [id]);

  const shareModel = useMemo(
    () => (r ? recipeCard(toSharedRecipe(r), { t, time: fmtTime, date: fmtDate }) : null),
    [r, t],
  );
  // Old data can hold values the link decoder rejects. Offer the image only, and say why.
  const link = useMemo(() => {
    if (!r) return undefined;
    const shared = toSharedRecipe(r);
    return shareProblems(shared).length === 0 ? buildRecipeShareUrl(window.location.origin, shared) : undefined;
  }, [r]);

  if (notFound) return <div><BackBar onClick={() => navigate('/recipes')} label={t('recipes.backToRecipes')} /><Empty icon="recipe" title={t('recipes.notFound')} /></div>;
  if (!r) return null;

  return (
    <div>
      <BackBar onClick={() => navigate('/recipes')} label={t('recipes.backToRecipes')} />
      <header className={s.detailHead}>
        <h1 className={s.detailTitle}>{r.name}</h1>
        <dl className={`field-row ${s.fieldRow}`}>
          <div><dt>{t('sheet.method')}</dt><dd><MethodBadge method={r.method} /></dd></div>
          <div><dt>{t('recipes.lastUsedLabel')}</dt><dd>{r.lastUsedAt ? fmtRelDate(r.lastUsedAt) : t('recipes.neverUsed')}</dd></div>
        </dl>
      </header>

      <div className={`readout-grid grid-paper ${s.readout}`}>
        {[
          { v: String(r.dose), u: 'g', l: t('recipes.fields.dose') },
          { v: String(r.yield), u: 'g', l: t('recipes.fields.yield') },
          { v: `1:${r.ratio.toFixed(1)}`, l: t('recipes.fields.ratio') },
          { v: fmtTime(r.time), l: t('recipes.fields.time') },
          { v: String(r.temp), u: '°C', l: t('recipes.fields.temp') },
        ].map(item => (
          <div key={item.l} className="stat">
            <div className="v">{item.v}{item.u && <span className="u">{item.u}</span>}</div>
            <div className="l">{item.l}</div>
          </div>
        ))}
      </div>

      {r.stages?.length > 0 && (
        <section className={s.block}>
          <div className="section-label"><span className="t-upper">{t('recipes.pourSchedule')}</span></div>
          {r.stages.map((st, i) => (
            <div key={st.id} className="pour-stage">
              <span className="pn">{i + 1}</span>
              <span className="pl">{st.label}</span>
              <span className="pt">{fmtTime(st.timeS)} → {st.weightG} g</span>
            </div>
          ))}
        </section>
      )}

      <ShareActions
        model={shareModel}
        fileName={`brewlog-recipe-${r.id}.png`}
        link={link}
        note={link ? undefined : t('share.linkBlocked')}
      />
      <div className={s.actionRow}>
        <Button full size="lg" leftIcon="play" onClick={() => navigate('/log', { state: { method: r.method, ratio: r.ratio, dose: r.dose, yield: r.yield, timeS: r.time, temp: r.temp, recipeId: r.id } })}>
          {t('recipes.startBrew')}
        </Button>
        <Button variant="ghost" full leftIcon="edit" onClick={() => setEditing(true)}>{t('common.edit')}</Button>
        <Button variant="danger" full leftIcon="trash" onClick={async () => {
          if (confirm(t('recipes.confirmDelete'))) { await db.deleteRecipe(r.id!); navigate('/recipes'); }
        }}>{t('recipes.deleteRecipe')}</Button>
      </div>

      <Sheet open={editing} onClose={() => setEditing(false)} title={t('common.edit')}>
        <RecipeForm
          initial={r}
          onSave={async (payload) => {
            if (!r) return;
            const updated = { ...r, ...payload, id: r.id! };
            await db.updateRecipe(updated);
            setR(updated);
            setEditing(false);
          }}
        />
      </Sheet>
    </div>
  );
}
