import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDb } from '../../hooks/useDb';
import { useDebounce } from '../../hooks/useDebounce';
import { Button, Empty, MethodBadge, Sheet, Pagination, ListToolbar } from '../../components/UI';
import { Icon } from '../../components/Icons';
import { fmtRelDate, fmtTime } from '../../utils/formatters';
import { METHODS } from '../../utils/methodDefaults';
import { RecipeForm } from './RecipeForm';
import type { Recipe } from '../../db/types';
import s from './styles.module.css';

const RECIPE_SORTS = [
  ['recent', 'recipes.sortRecentlyUsed'], ['name', 'recipes.sortName'], ['fastest', 'recipes.sortFastest'],
  ['doseDesc', 'recipes.sortDoseDesc'], ['yieldDesc', 'recipes.sortYieldDesc'], ['createdDesc', 'recipes.sortCreatedDesc'],
] as const;
type RecipeSort = typeof RECIPE_SORTS[number][0];

export function RecipesScreen() {
  const db = useDb();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [creating, setCreating] = useState(false);
  const [method, setMethod] = useState('all');
  const [inputQ, setInputQ] = useState('');
  const q = useDebounce(inputQ, 500);
  const [sort, setSort] = useState<RecipeSort>('recent');
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
    activeFilters.push({
      id: 'method',
      label: `${t('recipes.form.method')}: ${t(`methods.${method}`)}`,
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
          label: t(`methods.${m.id}`)
        }))
      ]
    }
  ];

  return (
    <div>
      <div className="page-title-row">
        <div className="page-head">
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

      <ListToolbar
        query={inputQ}
        onQuery={v => { setInputQ(v); setPage(1); }}
        placeholder={t('recipes.search')}
        activeFilters={activeFilters}
        categories={categories}
        sort={sort}
        onSort={v => { setSort(v); setPage(1); }}
        sortOptions={RECIPE_SORTS.map(([k, key]) => [k, t(key)] as const)}
      />

      <div>
        {recipesTotalCount === 0 ? (
          <Empty icon="recipe" title={t('recipes.noRecipes')} body={t('recipes.noRecipesBody')} />
        ) : totalCount === 0 ? (
          <Empty icon="filter" title={t('recipes.noMethodMatch')} body={t('recipes.noMethodMatchBody')} />
        ) : (
          <>
            <div className="ledger">
              {recipes.map(r => (
                <button type="button" key={r.id} className="ledger-row" onClick={() => navigate(`/recipes/${r.id}`)}>
                  <span className="ledger-main">
                    <span className={s.recipeMeta}>
                      <MethodBadge method={r.method} />
                      <span className={s.recipeUsed}>
                        {r.lastUsedAt ? t('recipes.used', { date: fmtRelDate(r.lastUsedAt) }) : t('recipes.neverUsed')}
                      </span>
                    </span>
                    <span className="ledger-title">{r.name}</span>
                    <span className={s.recipeNums}>
                      <span>{r.dose} → {r.yield} g</span>
                      <span>1:{r.ratio.toFixed(1)}</span>
                      <span>{fmtTime(r.time)}</span>
                      <span>{r.temp}°C</span>
                      {r.stages && r.stages.length > 0 && (
                        <span className={s.recipePours}>{t('recipes.pourCount', { count: r.stages.length })}</span>
                      )}
                    </span>
                  </span>
                  <Icon name="chevronRight" size={18} className="t-ter" />
                </button>
              ))}
            </div>
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
