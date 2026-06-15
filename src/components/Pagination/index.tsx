import { Button } from '../Button';
import { useTranslation } from 'react-i18next';
import s from './styles.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (limit: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
}: PaginationProps) {
  const { t } = useTranslation();

  const showNavigation = totalPages > 1;
  const showPerPage = itemsPerPage !== undefined && onItemsPerPageChange !== undefined;

  if (!showNavigation && !showPerPage) return null;

  return (
    <div className={s.paginationWrapper}>
      {showNavigation && (
        <div className={`row row-between ${s.paginationContainer}`}>
          <Button
            variant="ghost"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            leftIcon="arrowLeft"
            className={s.pageBtn}
          >
            {t('common.prev')}
          </Button>
          <span className={`t-mono t-sec ${s.pageIndicator}`}>
            {t('common.pageOf', { current: currentPage, total: totalPages })}
          </span>
          <Button
            variant="ghost"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            rightIcon="arrowRight"
            className={s.pageBtn}
          >
            {t('common.next')}
          </Button>
        </div>
      )}
      {showPerPage && (
        <div className={`row row-center ${s.perPageContainer}`}>
          <span className={`t-mono t-sec ${s.perPageLabel}`}>{t('common.perPage')}</span>
          <select
            className="input-underline"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            style={{ width: 'auto', padding: '4px 8px', fontSize: 12, color: 'var(--text-secondary)', marginLeft: '8px' }}
          >
            {[5, 10, 20].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
