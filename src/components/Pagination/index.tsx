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
  const showPerPage = itemsPerPage !== undefined && onItemsPerPageChange !== undefined && totalPages >= 1;

  if (!showNavigation && !showPerPage) return null;

  return (
    <div className={s.paginationWrapper}>
      {showNavigation ? (
        <div className={s.paginationContainer}>
          <Button
            variant="ghost"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            leftIcon="arrowLeft"
            className={s.pageBtn}
            aria-label={t('common.prev')}
          />
          <span className={s.pageIndicator}>
            {t('common.pageOf', { current: currentPage, total: totalPages })}
          </span>
          <Button
            variant="ghost"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            rightIcon="arrowRight"
            className={s.pageBtn}
            aria-label={t('common.next')}
          />
        </div>
      ) : <span />}
      {showPerPage && (
        <label className={s.perPageContainer}>
          <span className={s.perPageLabel}>{t('common.perPage')}</span>
          <select
            className={`input-underline ${s.perPageSelect}`}
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          >
            {[5, 10, 20].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
