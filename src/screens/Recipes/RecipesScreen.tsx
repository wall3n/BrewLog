import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { Button, StagList, Empty, MethodBadge, Tag, Sheet } from '../../components/UI';
import { Icon } from '../../components/Icons';
import { fmtRelDate, fmtTime } from '../../utils/formatters';
import { METHODS } from '../../utils/methodDefaults';
import { RecipeForm } from './RecipeForm';
import type { Recipe } from '../../db/types';
import s from './styles.module.css';

export function RecipesScreen() {
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [creating, setCreating] = useState(false);
  const [method, setMethod] = useState('all');
  const [sort, setSort] = useState<'recent' | 'name' | 'fastest'>('recent');

  useEffect(() => { db.getAllRecipes().then(setRecipes); }, []);

  const usedMethods = METHODS.filter(m => recipes.some(r => r.method === m.id));

  let list = recipes.filter(r => method === 'all' || r.method === method);
  list = [...list].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'fastest') return (a.time || 0) - (b.time || 0);
    const ax = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
    const bx = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
    return bx - ax;
  });

  async function handleSave(payload: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) {
    await db.addRecipe(payload);
    const updated = await db.getAllRecipes();
    setRecipes(updated);
    setCreating(false);
  }

  return (
    <div>
      <div className={`row row-between ${s.pageRow}`}>
        <div className={`page-head ${s.pageHead}`}>
          <h1>{t('recipes.title')}</h1>
          <p>
            {t('recipes.saved', { count: recipes.length })}
            {method !== 'all' && ` · ${t('recipes.shown', { count: list.length })}`}
          </p>
        </div>
        <Button variant="primary" leftIcon="plus" onClick={() => setCreating(true)}>
          {t('recipes.new')}
        </Button>
      </div>

      <div className="filter-bar">
        <Tag active={method === 'all'} onClick={() => setMethod('all')}>
          {t('recipes.filterAll')}
        </Tag>
        {usedMethods.map(m => (
          <Tag key={m.id} active={method === m.id} onClick={() => setMethod(m.id)}>
            {m.name}
          </Tag>
        ))}
        <div style={{ flex: 1 }} />
        <select
          className="input-underline"
          value={sort}
          onChange={e => setSort(e.target.value as 'recent' | 'name' | 'fastest')}
          style={{ width: 'auto', padding: '6px 4px', fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}
        >
          <option value="recent">{t('recipes.sortRecentlyUsed')}</option>
          <option value="name">{t('recipes.sortName')}</option>
          <option value="fastest">{t('recipes.sortFastest')}</option>
        </select>
      </div>

      <div className="col col-gap-12">
        {recipes.length === 0 ? (
          <Empty icon="recipe" title={t('recipes.noRecipes')} body={t('recipes.noRecipesBody')} />
        ) : list.length === 0 ? (
          <Empty icon="filter" title={t('recipes.noMethodMatch')} body={t('recipes.noMethodMatchBody')} />
        ) : (
          <StagList>
            {list.map(r => (
              <div key={r.id} className="card card-hover" onClick={() => navigate(`/recipes/${r.id}`)}>
                <div className={`row row-between ${s.recipeCard}`}>
                  <div className={`col col-gap-8 ${s.recipeLeft}`}>
                    <div className="row row-gap-12">
                      <MethodBadge method={r.method} />
                      <span className="t-upper">
                        {r.lastUsedAt ? t('recipes.used', { date: fmtRelDate(r.lastUsedAt) }) : t('recipes.neverUsed')}
                      </span>
                    </div>
                    <div className={s.recipeName}>{r.name}</div>
                    <div className={`recipe-meta-row t-sec ${s.recipeMeta}`}>
                      <span className="t-mono">{r.dose}g → {r.yield}g</span>
                      <span className="t-mono t-acc">1:{r.ratio.toFixed(1)}</span>
                      <span className="t-mono">{fmtTime(r.time)}</span>
                      <span className="t-mono">{r.temp}°C</span>
                      {r.stages && r.stages.length > 0 && (
                        <span className="t-mono t-ter">{r.stages.length} pours</span>
                      )}
                    </div>
                  </div>
                  <Icon name="chevronRight" size={16} className="t-ter" />
                </div>
              </div>
            ))}
          </StagList>
        )}
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title={t('recipes.new')}>
        <RecipeForm onSave={handleSave} />
      </Sheet>
    </div>
  );
}
