import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, StagList, Empty, MethodBadge } from '../../components/UI';
import { Icon } from '../../components/Icons';
import { fmtRelDate, fmtTime } from '../../utils/formatters';
import type { Recipe } from '../../db/types';
import s from './styles.module.css';

export function RecipesScreen() {
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => { db.getAllRecipes().then(setRecipes); }, []);

  return (
    <div>
      <div className={`row row-between ${s.pageRow}`}>
        <div className={`page-head ${s.pageHead}`}>
          <h1>{t('recipes.title')}</h1>
          <p>{t('recipes.saved', { count: recipes.length })}</p>
        </div>
        <Button variant="ghost" leftIcon="plus" onClick={() => alert('Recipe editor: save from Log flow Step 4.')}>{t('recipes.new')}</Button>
      </div>
      <div className="col col-gap-12">
        {recipes.length === 0
          ? <Empty icon="recipe" title={t('recipes.noRecipes')} body={t('recipes.noRecipesBody')} />
          : (
            <StagList>
              {recipes.map(r => (
                <div key={r.id} className="card card-hover" onClick={() => navigate(`/recipes/${r.id}`)}>
                  <div className={`row row-between ${s.recipeCard}`}>
                    <div className={`col col-gap-8 ${s.recipeLeft}`}>
                      <div className="row row-gap-12">
                        <MethodBadge method={r.method} />
                        <span className="t-upper">{t('recipes.used', { date: r.lastUsedAt ? fmtRelDate(r.lastUsedAt) : '—' })}</span>
                      </div>
                      <div className={s.recipeName}>{r.name}</div>
                      <div className={`row row-gap-16 t-sec ${s.recipeMeta}`}>
                        <span className="t-mono">{r.dose}g → {r.yield}g</span>
                        <span className="t-mono t-acc">1:{r.ratio.toFixed(1)}</span>
                        <span className="t-mono">{fmtTime(r.time)}</span>
                        <span className="t-mono">{r.temp}°C</span>
                      </div>
                    </div>
                    <Icon name="chevronRight" size={16} className="t-ter" />
                  </div>
                </div>
              ))}
            </StagList>
          )
        }
      </div>
    </div>
  );
}
