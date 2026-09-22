import { useTranslation } from 'react-i18next';
import { Icon } from '../Icons';
import { FilterBar, type ActiveFilter, type FilterCategory } from '../FilterBar';
import s from './styles.module.css';

interface ListToolbarProps<S extends string> {
  query: string;
  onQuery: (q: string) => void;
  placeholder: string;
  activeFilters: ActiveFilter[];
  categories: FilterCategory[];
  sort: S;
  sortOptions: readonly (readonly [S, string])[];
  onSort: (sort: S) => void;
}

export function ListToolbar<S extends string>({
  query, onQuery, placeholder, activeFilters, categories, sort, sortOptions, onSort,
}: ListToolbarProps<S>) {
  const { t } = useTranslation();
  return (
    <div className="list-toolbar">
      <div className="search-bar">
        <Icon name="search" size={18} className="t-ter" />
        <input placeholder={placeholder} value={query} onChange={e => onQuery(e.target.value)} aria-label={placeholder} />
        {query && (
          <button type="button" className={s.clear} onClick={() => onQuery('')} aria-label={t('common.clearSearch')}>
            <Icon name="x" size={16} />
          </button>
        )}
      </div>
      <div className="list-toolbar-row">
        <FilterBar activeFilters={activeFilters} categories={categories} />
        <select
          className="input-underline sort-select"
          value={sort}
          onChange={e => onSort(e.target.value as S)}
          aria-label={t('common.sortBy')}
        >
          {sortOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
    </div>
  );
}
