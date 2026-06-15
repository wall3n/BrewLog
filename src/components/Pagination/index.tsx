import { Button } from '../Button';
import { useTranslation } from 'react-i18next';
import s from './styles.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation();

  if (totalPages <= 1) return null;

  return (
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
  );
}
