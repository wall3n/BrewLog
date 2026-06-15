import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, StagList, Empty, MethodBadge } from '../../components/UI';
import { Icon } from '../../components/Icons';
import { fmtRelDate, fmtTime } from '../../utils/formatters';
import type { Recipe } from '../../db/types';

export function RecipesScreen() {
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => { db.getAllRecipes().then(setRecipes); }, []);

  return (
    <div>
      <div className="row row-between" style={{ alignItems: 'flex-end', marginBottom: 24 }}>
        <div className="page-head" style={{ marginBottom: 0 }}>
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
                  <div className="row row-between" style={{ alignItems: 'flex-start' }}>
                    <div className="col col-gap-8" style={{ flex: 1 }}>
                      <div className="row row-gap-12">
                        <MethodBadge method={r.method} />
                        <span className="t-upper">{t('recipes.used', { date: r.lastUsedAt ? fmtRelDate(r.lastUsedAt) : '—' })}</span>
                      </div>
                      <div style={{ fontFamily: 'var(--serif)', fontSize: 22 }}>{r.name}</div>
                      <div className="row row-gap-16" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        <span className="t-mono">{r.dose}g → {r.yield}g</span>
                        <span className="t-mono t-acc">1:{r.ratio.toFixed(1)}</span>
                        <span className="t-mono">{fmtTime(r.time)}</span>
                        <span className="t-mono">{r.temp}°C</span>
                      </div>
                    </div>
                    <Icon name="chevronRight" size={16} style={{ color: 'var(--text-tertiary)' }} />
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
