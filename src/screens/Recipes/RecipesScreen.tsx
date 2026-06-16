import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { useDebounce } from '../../hooks/useDebounce';
import { Button, StagList, Empty, MethodBadge, Sheet, Pagination, FilterBar } from '../../components/UI';
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
  const [inputQ, setInputQ] = useState('');
  const q = useDebounce(inputQ, 500);
  const [sort, setSort] = useState<'recent' | 'name' | 'fastest' | 'doseDesc' | 'yieldDesc' | 'createdDesc'>('recent');
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);


  const [totalCount, setTotalCount] = useState(0);
  const [recipesTotalCount, setRecipesTotalCount] = useState(0);
  const [recipeMethods, setRecipeMethods] = useState<string[]>([]);

  const loadRecipes = useCallback(() => {
    db.getRecipesPage({
      method,
      q,
      sort,
      page,
      limit: itemsPerPage
    }).then(({ items, total }) => {
      setRecipes(items);
      setTotalCount(total);
    });

    db.getRecipesTotalCount().then(setRecipesTotalCount);
    db.getRecipeMethods().then(setRecipeMethods);
  }, [db, method, q, sort, page, itemsPerPage]);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  const usedMethods = METHODS.filter(m => recipeMethods.includes(m.id));
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  async function handleSave(payload: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) {
    await db.addRecipe(payload);
    await loadRecipes();
    setCreating(false);
  }

  const handleMethodChange = (m: string) => {
    setMethod(m);
    setPage(1);
  };

  const activeFilters = [];
  if (method !== 'all') {
    const mName = usedMethods.find(m => m.id === method)?.name || method;
    activeFilters.push({
      id: 'method',
      label: `${t('recipes.form.method')}: ${mName}`,
      onRemove: () => handleMethodChange('all')
    });
  }

  const categories = [
    {
      id: 'method',
      label: t('recipes.form.method'),
      onSelect: (val: string | number) => handleMethodChange(String(val)),
      options: [
        { value: 'all', label: t('recipes.filterAll') },
        ...usedMethods.map(m => ({
          value: m.id,
          label: m.name
        }))
      ]
    }
  ];

  return (
    <div>
      <div className={`row row-between ${s.pageRow}`}>
        <div className={`page-head ${s.pageHead}`}>
          <h1>{t('recipes.title')}</h1>
          <p>
            {t('recipes.saved', { count: recipesTotalCount })}
            {(method !== 'all' || q) && ` · ${t('recipes.shown', { count: totalCount })}`}
          </p>
        </div>
        <Button variant="primary" leftIcon="plus" onClick={() => setCreating(true)}>
          {t('recipes.new')}
        </Button>
      </div>

      <div className="row row-gap-8 mb-4">
        <div className="search-bar flex-1">
          <Icon name="search" size={16} className="t-ter" />
          <input
            placeholder={t('recipes.search')}
            value={inputQ}
            onChange={e => { setInputQ(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      <div className="row row-gap-8 mb-4" style={{ alignItems: 'center' }}>
        <FilterBar activeFilters={activeFilters} categories={categories} />
        <select
          className="input-underline"
          value={sort}
          onChange={e => { setSort(e.target.value as 'recent' | 'name' | 'fastest' | 'doseDesc' | 'yieldDesc' | 'createdDesc'); setPage(1); }}
          style={{ width: 'auto', padding: '6px 4px', fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0 }}
        >
          <option value="recent">{t('recipes.sortRecentlyUsed')}</option>
          <option value="name">{t('recipes.sortName')}</option>
          <option value="fastest">{t('recipes.sortFastest')}</option>
          <option value="doseDesc">{t('recipes.sortDoseDesc')}</option>
          <option value="yieldDesc">{t('recipes.sortYieldDesc')}</option>
          <option value="createdDesc">{t('recipes.sortCreatedDesc')}</option>
        </select>
      </div>

      <div className="col col-gap-12">
        {recipesTotalCount === 0 ? (
          <Empty icon="recipe" title={t('recipes.noRecipes')} body={t('recipes.noRecipesBody')} />
        ) : totalCount === 0 ? (
          <Empty icon="filter" title={t('recipes.noMethodMatch')} body={t('recipes.noMethodMatchBody')} />
        ) : (
          <>
            <StagList>
              {recipes.map(r => (
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
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={(limit) => {
                setItemsPerPage(limit);
                setPage(1);
              }}
            />
          </>
        )}
      </div>

      <Sheet open={creating} onClose={() => setCreating(false)} title={t('recipes.new')}>
        <RecipeForm onSave={handleSave} />
      </Sheet>
    </div>
  );
}
