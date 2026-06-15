import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '../Icons';
import s from './styles.module.css';

export interface ActiveFilter {
  id: string;
  label: string;
  onRemove: () => void;
}

export interface FilterCategoryOption {
  value: string | number;
  label: string;
}

export interface FilterCategory {
  id: string;
  label: string;
  options: FilterCategoryOption[];
  onSelect: (value: string | number) => void;
}

interface FilterBarProps {
  activeFilters: ActiveFilter[];
  categories: FilterCategory[];
}

export function FilterBar({ activeFilters, categories }: FilterBarProps) {
  const { t } = useTranslation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuState, setMenuState] = useState<'root' | string>('root');

  const handleCategoryClick = (categoryId: string) => {
    setMenuState(categoryId);
  };

  const handleOptionClick = (category: FilterCategory, optionValue: string | number) => {
    category.onSelect(optionValue);
    setShowDropdown(false);
    setMenuState('root');
  };

  const currentCategory = categories.find(c => c.id === menuState);

  return (
    <div className={s.filterBarRow}>
      {activeFilters.map(filter => (
        <span key={filter.id} className={s.activeTag}>
          {filter.label}
          <button type="button" onClick={filter.onRemove} className={s.removeBtn} aria-label="Remove filter">
            <Icon name="x" size={12} />
          </button>
        </span>
      ))}

      <div className={s.dropdownContainer}>
        <button
          type="button"
          className="tag active"
          onClick={() => {
            setShowDropdown(!showDropdown);
            setMenuState('root');
          }}
        >
          <Icon name="plus" size={12} />
          {t('common.addFilter', { defaultValue: 'Filter' })}
        </button>

        {showDropdown && (
          <>
            <div className={s.scrim} onClick={() => { setShowDropdown(false); setMenuState('root'); }} />
            <div className={s.dropdownMenu}>
              {menuState === 'root' ? (
                <>
                  <div className={s.menuHeader}>
                    {t('common.filterBy', { defaultValue: 'Filter by' })}
                  </div>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      className={s.menuItem}
                      onClick={() => handleCategoryClick(category.id)}
                    >
                      <span>{category.label}</span>
                      <Icon name="chevronRight" size={12} className="t-ter" />
                    </button>
                  ))}
                </>
              ) : (
                currentCategory && (
                  <>
                    <div className={s.menuHeader}>
                      <button
                        type="button"
                        className={s.backBtn}
                        onClick={() => setMenuState('root')}
                      >
                        <Icon name="arrowLeft" size={12} style={{ marginRight: 4 }} />
                        {currentCategory.label}
                      </button>
                    </div>
                    <div className={s.optionList}>
                      {currentCategory.options.map(option => (
                        <button
                          key={option.label}
                          type="button"
                          className={s.menuItem}
                          onClick={() => handleOptionClick(currentCategory, option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
